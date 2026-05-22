import { NextRequest, NextResponse } from 'next/server';
import { generateNurtureDrafts } from '@/lib/nurture';

export async function GET(request: NextRequest) {
  try {
    // Require CRON_SECRET to be configured. Fail closed: a missing secret
    // refuses the request rather than leaving this endpoint public.
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Cron is not configured.' },
        { status: 503 }
      );
    }

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

    // Generate nurture drafts for all eligible contacts
    const result = await generateNurtureDrafts();

    console.log(
      `Nurture cron completed: generated=${result.generated}, skipped=${result.skipped}, errors=${result.errors}`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      'Nurture cron error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to generate nurture drafts.' },
      { status: 500 }
    );
  }
}
