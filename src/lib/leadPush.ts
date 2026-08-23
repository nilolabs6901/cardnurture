/**
 * Push a scanned business card into the deal-registration app as a new LEAD.
 *
 * Why leads and not deals, since the app is called "deal registration":
 *
 * That app tracks two different things. /api/deals is the DEALER registration
 * system -- Briggs, Ring Power, Kelly Tractor and the rest claim an end customer
 * and get a six month exclusive window. Every rep on those 136 records belongs to
 * a dealer; Kenny does not appear among them once. Pushing a booth card there
 * would file it under the wrong system entirely and put Kenny's name on a claim
 * that is a dealer's to make.
 *
 * /api/leads is Kenny's own follow-up tracker: 129 of its 158 records are his. Its
 * required fields are companyName, contactName, contactPhone, contactEmail --
 * which is a business card, exactly.
 *
 * repName / repEmail is the rep who owns the follow-up. On a card Kenny scans at
 * his own booth that is Kenny, and it comes from configuration, never from the
 * card. Map the card onto it and the prospect becomes the owner of their own
 * follow-up and receives Kenny's internal reminders.
 */

import { missingLeadFields } from './leadFields';

export interface LeadPush {
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  followUpIntervalDays: number;
}

export interface LeadResult {
  ok: boolean;
  status: 'created' | 'incomplete' | 'unconfigured' | 'unreachable' | 'error';
  message: string;
  nextFollowUp?: string;
}

/**
 * Runs AFTER the contact is saved, never instead of it.
 *
 * At a trade show the card is the irreplaceable thing: the person has walked away
 * and the paper is in a pile. A lead can be created later from the contact record,
 * so a failure here must never cost the scan. Hence a result rather than a throw.
 */
export async function pushLead(input: LeadPush): Promise<LeadResult> {
  const base = process.env.DEAL_APP_URL;
  const repName = process.env.DEAL_REP_NAME;
  const repEmail = process.env.DEAL_REP_EMAIL;

  if (!base || !repName || !repEmail) {
    return { ok: false, status: 'unconfigured', message: 'Lead push is not configured on the server.' };
  }

  const missing = missingLeadFields(input);
  if (missing.length) {
    return {
      ok: false,
      status: 'incomplete',
      message: `The lead tracker needs a ${missing.join(', ')} as well. Add it above and save again.`,
    };
  }

  let res: Response;
  try {
    res = await fetch(`${base.replace(/\/$/, '')}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: input.companyName.trim(),
        contactName: input.contactName.trim(),
        contactPhone: input.contactPhone.trim(),
        contactEmail: input.contactEmail.trim(),
        repName,
        repEmail,
        followUpIntervalDays: input.followUpIntervalDays,
      }),
      // Conference wifi. Fail fast rather than hanging the save button.
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return {
      ok: false,
      status: 'unreachable',
      message: 'Could not reach the lead tracker. The contact is saved; add it later.',
    };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return {
      ok: false,
      status: 'error',
      message: body?.error || `Lead tracker returned ${res.status}. The contact is saved.`,
    };
  }

  const body = await res.json().catch(() => ({}));
  const lead = body?.lead ?? body;
  return {
    ok: true,
    status: 'created',
    message: `Lead created${lead?.nextFollowUpFormatted ? `, first follow-up ${lead.nextFollowUpFormatted}` : ''}.`,
    nextFollowUp: lead?.nextFollowUpFormatted,
  };
}
