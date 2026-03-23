import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function escapeCsvValue(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
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
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const contactId = searchParams.get('contactId');

    const where: Record<string, unknown> = {
      sourceContact: { userId },
    };

    if (stage) {
      where.status = stage;
    }

    if (contactId) {
      where.contactId = contactId;
    }

    const prospects = await prisma.prospect.findMany({
      where,
      include: {
        sourceContact: {
          select: { name: true, company: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Company',
      'Parent Contact',
      'Contact Company',
      'Relationship',
      'Status',
      'Industry',
      'Location',
      'Confidence',
      'Date Added',
    ];

    const rows: string[] = [headers.map(escapeCsvValue).join(',')];

    for (const prospect of prospects) {
      const row = [
        escapeCsvValue(prospect.companyName),
        escapeCsvValue(prospect.sourceContact.name),
        escapeCsvValue(prospect.sourceContact.company),
        escapeCsvValue(prospect.relationship),
        escapeCsvValue(prospect.status),
        escapeCsvValue(prospect.industry),
        escapeCsvValue(prospect.location),
        escapeCsvValue(prospect.confidence),
        escapeCsvValue(prospect.createdAt.toISOString().split('T')[0]),
      ];
      rows.push(row.join(','));
    }

    const csvContent = rows.join('\n');
    const today = new Date().toISOString().split('T')[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="cardnurture-prospects-${today}.csv"`,
      },
    });
  } catch (error) {
    console.error(
      'Prospects export error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to export prospects.' },
      { status: 500 }
    );
  }
}
