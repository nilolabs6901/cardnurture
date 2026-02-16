/**
 * Nurture cron logic.
 *
 * Finds contacts eligible for nurture email drafts and generates one draft
 * per qualifying contact using the email template library. Designed to be
 * called on a schedule (e.g., daily cron) and is idempotent -- it checks
 * windowStart dates to avoid duplicate drafts.
 *
 * Eligibility rules:
 *   - Contact must have nurtureEnabled = true
 *   - Either: no nurture-type draft exists AND contact was created >= 90 days ago
 *   - Or: the most recent nurture draft windowStart is >= 90 days ago
 *
 * Windows are calculated from contact.createdAt + N * 90 days.
 */

import { addDays, differenceInDays, isAfter, isBefore } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { generateNurtureDraft } from '@/lib/email-templates';
import { NURTURE_TOPICS } from '@/types';
import type { NurtureCronResult, NurtureTopic } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default interval between nurture windows in days. */
const DEFAULT_INTERVAL_DAYS = 90;

/** Topics available for auto-selection (excludes "Auto"). */
const SELECTABLE_TOPICS = NURTURE_TOPICS.filter(
  (t): t is Exclude<NurtureTopic, 'Auto'> => t !== 'Auto',
);

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Generate nurture drafts for all qualifying contacts.
 *
 * This function is idempotent: it calculates the expected windowStart for
 * each contact and skips any contact that already has a draft for that window.
 *
 * @returns Summary of how many drafts were generated, skipped, or errored.
 */
export async function generateNurtureDrafts(): Promise<NurtureCronResult> {
  const result: NurtureCronResult = { generated: 0, skipped: 0, errors: 0 };
  const now = new Date();

  console.log(`[nurture] Starting nurture draft generation at ${now.toISOString()}`);

  // -------------------------------------------------------------------------
  // 1. Fetch all nurture-enabled contacts with their drafts
  // -------------------------------------------------------------------------
  let contacts;
  try {
    contacts = await prisma.contact.findMany({
      where: { nurtureEnabled: true },
      include: {
        emailDrafts: {
          where: { type: 'nurture' },
          orderBy: { windowStart: 'desc' },
        },
      },
    });
  } catch (err) {
    console.error('[nurture] Failed to query contacts:', err);
    result.errors += 1;
    return result;
  }

  console.log(`[nurture] Found ${contacts.length} nurture-enabled contact(s)`);

  // -------------------------------------------------------------------------
  // 2. Evaluate each contact for eligibility
  // -------------------------------------------------------------------------
  for (const contact of contacts) {
    const contactLabel = maskIdentifier(contact.id);

    try {
      const intervalDays = contact.nurtureInterval || DEFAULT_INTERVAL_DAYS;
      const nurtureDrafts = contact.emailDrafts; // already filtered to type=nurture

      // Calculate the next expected window
      const nextWindow = calculateNextWindow(
        contact.createdAt,
        nurtureDrafts,
        intervalDays,
      );

      if (!nextWindow) {
        console.log(`[nurture] Contact ${contactLabel}: no next window calculated, skipping`);
        result.skipped += 1;
        continue;
      }

      // Check if the window is due (windowStart should be in the past or today)
      if (isAfter(nextWindow, now)) {
        const daysUntil = differenceInDays(nextWindow, now);
        console.log(
          `[nurture] Contact ${contactLabel}: next window in ${daysUntil} day(s), skipping`,
        );
        result.skipped += 1;
        continue;
      }

      // Idempotency check: does a draft already exist for this window?
      const existingForWindow = nurtureDrafts.find(
        (d) =>
          d.windowStart &&
          differenceInDays(nextWindow, new Date(d.windowStart)) === 0,
      );

      if (existingForWindow) {
        console.log(
          `[nurture] Contact ${contactLabel}: draft already exists for window ${nextWindow.toISOString()}, skipping`,
        );
        result.skipped += 1;
        continue;
      }

      // -----------------------------------------------------------------
      // 3. Generate the draft
      // -----------------------------------------------------------------
      const topic = resolveTopic(contact.nurtureTopic, nurtureDrafts.length);

      console.log(
        `[nurture] Contact ${contactLabel}: generating draft for topic "${topic}", window ${nextWindow.toISOString()}`,
      );

      const draft = generateNurtureDraft(
        {
          name: contact.name,
          company: contact.company,
          personalityType: contact.personalityType,
          personalitySummary: contact.personalitySummary,
          researchSnippets: contact.researchSnippets,
          industryVertical: contact.industryVertical,
          emailDrafts: contact.emailDrafts,
        },
        topic,
      );

      // -----------------------------------------------------------------
      // 4. Persist the draft
      // -----------------------------------------------------------------
      await prisma.emailDraft.create({
        data: {
          contactId: contact.id,
          type: 'nurture',
          subject: draft.subject,
          body: draft.body,
          status: 'draft',
          topic,
          windowStart: nextWindow,
        },
      });

      console.log(`[nurture] Contact ${contactLabel}: draft created successfully`);
      result.generated += 1;
    } catch (err) {
      console.error(`[nurture] Contact ${contactLabel}: error generating draft:`, err);
      result.errors += 1;
    }
  }

  console.log(
    `[nurture] Completed. Generated: ${result.generated}, Skipped: ${result.skipped}, Errors: ${result.errors}`,
  );

  return result;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Calculates the next nurture window start date for a contact.
 *
 * Windows are spaced at `intervalDays` intervals starting from createdAt:
 *   Window 0: createdAt + 1 * intervalDays
 *   Window 1: createdAt + 2 * intervalDays
 *   ...
 *
 * Returns the earliest window that does not yet have a corresponding draft,
 * or null if no window is due yet.
 */
function calculateNextWindow(
  createdAt: Date,
  existingNurtureDrafts: { windowStart: Date | null }[],
  intervalDays: number,
): Date | null {
  const now = new Date();

  // Collect all existing windowStart dates for quick lookup
  const existingWindows = new Set(
    existingNurtureDrafts
      .filter((d) => d.windowStart !== null)
      .map((d) => normalizeDate(new Date(d.windowStart!)).getTime()),
  );

  // Walk through windows starting from the first one
  let windowIndex = 1;
  const maxWindows = 100; // safety limit

  while (windowIndex <= maxWindows) {
    const windowDate = normalizeDate(
      addDays(createdAt, windowIndex * intervalDays),
    );

    // If this window is in the future, no draft is due
    if (isAfter(windowDate, now)) {
      return null;
    }

    // If no draft exists for this window, it is the next one due
    if (!existingWindows.has(windowDate.getTime())) {
      return windowDate;
    }

    windowIndex += 1;
  }

  return null;
}

/**
 * Normalizes a Date to midnight UTC for consistent day-level comparison.
 */
function normalizeDate(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

/**
 * Resolves the nurture topic for a contact.
 *
 * If the contact has "Auto" as their nurtureTopic, the topic is selected by
 * rotating through the available topics based on the number of existing
 * nurture drafts. Otherwise, the contact's explicitly chosen topic is used.
 */
function resolveTopic(
  nurtureTopic: string,
  existingDraftCount: number,
): string {
  if (nurtureTopic === 'Auto' || !nurtureTopic) {
    const index = existingDraftCount % SELECTABLE_TOPICS.length;
    return SELECTABLE_TOPICS[index];
  }

  // Validate that the topic exists in NURTURE_TOPICS
  const validTopic = SELECTABLE_TOPICS.find((t) => t === nurtureTopic);
  return validTopic || SELECTABLE_TOPICS[0];
}

/**
 * Masks a contact identifier for log output to avoid exposing PII.
 * Shows only the first 4 and last 2 characters of a CUID.
 */
function maskIdentifier(id: string): string {
  if (id.length <= 6) return '***';
  return `${id.slice(0, 4)}...${id.slice(-2)}`;
}
