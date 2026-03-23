import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { differenceInDays } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    const contacts = await prisma.contact.findMany({
      where: { userId },
      include: {
        emailDrafts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true, status: true },
        },
        _count: {
          select: {
            emailDrafts: true,
            prospects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    const enrichedContacts = contacts.map((contact) => {
      const lastDraft = contact.emailDrafts[0] ?? null;
      const lastDraftDate = lastDraft ? lastDraft.createdAt : null;
      const daysSinceLastDraft = lastDraftDate
        ? differenceInDays(now, new Date(lastDraftDate))
        : null;
      const dueInDays =
        daysSinceLastDraft !== null
          ? contact.nurtureInterval - daysSinceLastDraft
          : 0;
      const isOverdue = contact.nurtureEnabled && dueInDays < 0;
      const isDueSoon =
        contact.nurtureEnabled && dueInDays >= 0 && dueInDays <= 7;

      return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        company: contact.company,
        personalityType: contact.personalityType,
        nurtureEnabled: contact.nurtureEnabled,
        nurtureInterval: contact.nurtureInterval,
        nurtureTopic: contact.nurtureTopic,
        lastDraftDate: lastDraftDate ? lastDraftDate.toISOString() : null,
        daysSinceLastDraft,
        dueInDays,
        isOverdue,
        isDueSoon,
        draftCount: contact._count.emailDrafts,
        researchSnippets: contact.researchSnippets,
      };
    });

    const activeNurture = enrichedContacts.filter(
      (c) => c.nurtureEnabled
    ).length;
    const dueSoon = enrichedContacts.filter((c) => c.isDueSoon).length;
    const overdue = enrichedContacts.filter((c) => c.isOverdue).length;
    const totalProspects = enrichedContacts.reduce(
      (sum, c) => sum + (contacts.find((ct) => ct.id === c.id)?._count.prospects ?? 0),
      0
    );

    return NextResponse.json({
      contacts: enrichedContacts,
      summary: {
        totalContacts: enrichedContacts.length,
        activeNurture,
        dueSoon,
        overdue,
        totalProspects,
      },
    });
  } catch (error) {
    console.error(
      'Nurture status GET error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to fetch nurture status.' },
      { status: 500 }
    );
  }
}
