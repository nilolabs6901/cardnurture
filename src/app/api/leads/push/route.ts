/**
 * Server-side proxy for the lead push.
 *
 * The browser never talks to the lead tracker directly: its URL and the rep
 * identity stay server-side, and a cross-origin POST from a Capacitor shell to a
 * Railway service is a CORS problem nobody needs on a show floor.
 */
import { NextRequest, NextResponse } from 'next/server';
import { pushLead } from '@/lib/leadPush';

/**
 * Lets the confirm screen hide the control when no tracker is configured. A
 * checkbox that cannot work is worse than no checkbox: it reads as "this lead is
 * captured" right up until you find out it never was.
 */
export async function GET() {
  return NextResponse.json({
    configured: Boolean(
      process.env.DEAL_APP_URL && process.env.DEAL_REP_NAME && process.env.DEAL_REP_EMAIL,
    ),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, status: 'error', message: 'Invalid request.' }, { status: 400 });
  }

  const interval = Number(body.followUpIntervalDays);
  const result = await pushLead({
    companyName: String(body.companyName ?? ''),
    contactName: String(body.contactName ?? ''),
    contactPhone: String(body.contactPhone ?? ''),
    contactEmail: String(body.contactEmail ?? ''),
    followUpIntervalDays: Number.isFinite(interval) && interval >= 1 ? Math.floor(interval) : 3,
  });

  // Always 200. The caller has already saved the contact and needs to render the
  // outcome, not handle a second failure. The status field carries the meaning.
  return NextResponse.json(result);
}
