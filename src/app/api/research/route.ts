import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { researchContact } from '@/lib/research';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, company, rawText } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required.' },
        { status: 400 }
      );
    }

    // Company is optional — we can still classify using rawText (job title, etc.)
    const companyStr = typeof company === 'string' ? company.trim() : '';
    const rawTextStr = typeof rawText === 'string' ? rawText.trim() : '';

    const result = await researchContact(name.trim(), companyStr, rawTextStr);

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      'Research API error:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    // Always return a default result on failure
    return NextResponse.json({
      personalityType: 'Balanced',
      confidence: 'none',
      summary:
        'Research could not be completed. Defaulting to Balanced personality profile.',
      researchSnippets: '',
    });
  }
}
