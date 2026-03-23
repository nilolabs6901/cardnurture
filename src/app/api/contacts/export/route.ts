import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function escapeCsvValue(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  // If the value contains commas, quotes, or newlines, wrap in quotes and escape inner quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    // Support filtering by specific IDs
    const idsParam = request.nextUrl.searchParams.get('ids');
    const where: Record<string, unknown> = { userId };
    if (idsParam) {
      const idFilter = idsParam.split(',').filter(Boolean);
      if (idFilter.length > 0) {
        where.id = { in: idFilter };
      }
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        emailDrafts: {
          orderBy: { createdAt: 'desc' },
        },
        prospects: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // CSV header row
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Company',
      'Address',
      'Industry Vertical',
      'Personality Type',
      'Personality Summary',
      'Nurture Enabled',
      'Nurture Topic',
      'Date Added',
      'Last Draft Date',
      'Number of Prospects',
      'Prospect Companies',
    ];

    const rows: string[] = [headers.map(escapeCsvValue).join(',')];

    for (const contact of contacts) {
      const lastDraft =
        contact.emailDrafts.length > 0 ? contact.emailDrafts[0] : null;
      const lastDraftDate = lastDraft
        ? lastDraft.createdAt.toISOString().split('T')[0]
        : '';

      const prospectCompanies = contact.prospects
        .map((p) => p.companyName)
        .join('; ');

      const row = [
        escapeCsvValue(contact.name),
        escapeCsvValue(contact.email),
        escapeCsvValue(contact.phone),
        escapeCsvValue(contact.company),
        escapeCsvValue(contact.address),
        escapeCsvValue(contact.industryVertical),
        escapeCsvValue(contact.personalityType),
        escapeCsvValue(contact.personalitySummary),
        escapeCsvValue(contact.nurtureEnabled ? 'Yes' : 'No'),
        escapeCsvValue(contact.nurtureTopic),
        escapeCsvValue(contact.createdAt.toISOString().split('T')[0]),
        escapeCsvValue(lastDraftDate),
        escapeCsvValue(String(contact.prospects.length)),
        escapeCsvValue(prospectCompanies),
      ];

      rows.push(row.join(','));
    }

    const csvContent = rows.join('\n');
    const today = new Date().toISOString().split('T')[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="cardnurture-contacts-${today}.csv"`,
      },
    });
  } catch (error) {
    console.error(
      'Contacts export error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to export contacts.' },
      { status: 500 }
    );
  }
}
