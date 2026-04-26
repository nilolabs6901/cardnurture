import { NextRequest, NextResponse } from 'next/server';
import { sendScheduledDrafts } from '@/lib/sender';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const { searchParams } = new URL(request.url);
      const querySecret = searchParams.get('secret');
      const authHeader = request.headers.get('authorization');
      const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

      const providedSecret = querySecret || bearerToken;

      if (providedSecret !== cronSecret) {
        return NextResponse.json(
          { error: 'Invalid or missing cron secret.' },
          { status: 401 }
        );
      }
    }

    const result = await sendScheduledDrafts();

    console.log(
      `Send-scheduled cron completed: sent=${result.sent}, failed=${result.failed}, skipped=${result.skipped}`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      'Send-scheduled cron error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to send scheduled drafts.' },
      { status: 500 }
    );
  }
}
