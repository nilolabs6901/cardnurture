import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    const contacts = await prisma.contact.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        company: true,
        personalityType: true,
        nurtureEnabled: true,
        createdAt: true,
        _count: {
          select: {
            emailDrafts: true,
            prospects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Total contacts
    const totalContacts = contacts.length;

    // Active nurture count
    const activeNurture = contacts.filter((c) => c.nurtureEnabled).length;

    // Total prospects
    const totalProspects = contacts.reduce((sum, c) => sum + c._count.prospects, 0);

    // Cumulative growth: group contacts by month, compute running total
    const monthMap = new Map<string, number>();
    for (const c of contacts) {
      const date = new Date(c.createdAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(month, (monthMap.get(month) || 0) + 1);
    }
    const sortedMonths = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    let cumulative = 0;
    const cumulativeGrowth = sortedMonths.map(([month, count]) => {
      cumulative += count;
      return { month, count, cumulative };
    });

    // Personality distribution
    const personalityMap = new Map<string, number>();
    for (const c of contacts) {
      const type = c.personalityType || 'Unknown';
      personalityMap.set(type, (personalityMap.get(type) || 0) + 1);
    }
    const personalityDistribution = Array.from(personalityMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    // Company distribution: top 10
    const companyMap = new Map<string, number>();
    for (const c of contacts) {
      const company = c.company || 'Unknown';
      companyMap.set(company, (companyMap.get(company) || 0) + 1);
    }
    const companyDistribution = Array.from(companyMap.entries())
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Nurture status
    const nurtureStatus = {
      enabled: activeNurture,
      disabled: totalContacts - activeNurture,
    };

    // Recent contacts: last 10
    const recentContacts = contacts.slice(0, 10).map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({
      totalContacts,
      activeNurture,
      totalProspects,
      cumulativeGrowth,
      personalityDistribution,
      companyDistribution,
      nurtureStatus,
      recentContacts,
    });
  } catch (error) {
    console.error(
      'Analytics GET error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to fetch analytics.' },
      { status: 500 }
    );
  }
}
