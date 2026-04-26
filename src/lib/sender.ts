import { prisma } from '@/lib/prisma';
import { isSmtpConfigured, sendEmail } from '@/lib/mailer';
import type { SendScheduledResult } from '@/types';

/**
 * Picks up email drafts whose scheduled send window has elapsed and sends
 * them via SMTP. Designed to be called on a schedule (e.g. every 15 minutes).
 *
 * A draft is sent when:
 *   - status = 'scheduled'
 *   - scheduledSendAt <= now
 *   - parent contact still has an email address
 *
 * On success, status flips to 'sent' and sentAt is recorded. On failure,
 * status flips to 'send_failed' so a human can investigate (no automatic
 * retry yet -- intentional, to avoid spamming a recipient if SMTP is broken).
 */
export async function sendScheduledDrafts(): Promise<SendScheduledResult> {
  const result: SendScheduledResult = { sent: 0, failed: 0, skipped: 0 };
  const now = new Date();

  console.log(`[sender] Starting scheduled send sweep at ${now.toISOString()}`);

  if (!isSmtpConfigured()) {
    console.warn('[sender] SMTP is not configured; aborting scheduled send sweep.');
    return result;
  }

  let drafts;
  try {
    drafts = await prisma.emailDraft.findMany({
      where: {
        status: 'scheduled',
        scheduledSendAt: { lte: now },
      },
      include: {
        contact: {
          select: { id: true, email: true },
        },
      },
    });
  } catch (err) {
    console.error('[sender] Failed to query scheduled drafts:', err);
    return result;
  }

  console.log(`[sender] Found ${drafts.length} due draft(s)`);

  for (const draft of drafts) {
    const draftLabel = maskIdentifier(draft.id);

    if (!draft.contact.email) {
      console.log(`[sender] Draft ${draftLabel}: contact has no email, skipping`);
      result.skipped += 1;
      continue;
    }

    try {
      const ok = await sendEmail(draft.contact.email, draft.subject, draft.body);

      if (ok) {
        await prisma.emailDraft.update({
          where: { id: draft.id },
          data: { status: 'sent', sentAt: new Date() },
        });
        console.log(
          `[sender] Draft ${draftLabel}: sent to ${maskEmail(draft.contact.email)}`,
        );
        result.sent += 1;
      } else {
        await prisma.emailDraft.update({
          where: { id: draft.id },
          data: { status: 'send_failed' },
        });
        console.warn(`[sender] Draft ${draftLabel}: send returned false`);
        result.failed += 1;
      }
    } catch (err) {
      console.error(`[sender] Draft ${draftLabel}: error sending:`, err);
      try {
        await prisma.emailDraft.update({
          where: { id: draft.id },
          data: { status: 'send_failed' },
        });
      } catch {
        // ignore -- already logged the original error
      }
      result.failed += 1;
    }
  }

  console.log(
    `[sender] Completed. Sent: ${result.sent}, Failed: ${result.failed}, Skipped: ${result.skipped}`,
  );

  return result;
}

function maskIdentifier(id: string): string {
  if (id.length <= 6) return '***';
  return `${id.slice(0, 4)}...${id.slice(-2)}`;
}

function maskEmail(email: string): string {
  return email.replace(/(.{2}).*(@.*)/, '$1***$2');
}
