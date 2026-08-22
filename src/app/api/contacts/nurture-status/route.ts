import { NextResponse } from 'next/server';
import { getOwnerUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addDays, differenceInCalendarDays } from 'date-fns';

export async function GET() {
  try {
    const userId = await getOwnerUserId();

    const contacts = await prisma.contact.findMany({
      where: { userId },
      include: {
        emailDrafts: {
          where: { type: 'nurture' },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            createdAt: true,
            status: true,
            windowStart: true,
          },
        },
        _count: {
          select: {
            emailDrafts: { where: { type: 'nurture' } },
            prospects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    const enrichedContacts = contacts.map((contact) => {
      // The relation and count are filtered in the Prisma query. Keep a
      // defensive filter here so this response cannot leak other draft types
      // if the query shape is changed or mocked incorrectly.
      const nurtureDrafts = contact.emailDrafts.filter(
        (draft) => draft.type === 'nurture',
      );
      const latestDraft = nurtureDrafts[0] ?? null;
      const lastDraftDate = latestDraft ? latestDraft.createdAt : null;
      const daysSinceLastDraft = lastDraftDate
        ? differenceInCalendarDays(now, new Date(lastDraftDate))
        : null;

      // A contact's first nurture window starts at createdAt. Subsequent
      // windows use the explicit windowStart stored on the latest nurture
      // draft; drafts created manually without a window use createdAt as a
      // conservative schedule anchor.
      const scheduleAnchor = latestDraft?.windowStart ?? lastDraftDate ?? contact.createdAt;
      const nextDueDate = addDays(
        new Date(scheduleAnchor),
        contact.nurtureInterval,
      );
      const dueInDays = differenceInCalendarDays(nextDueDate, now);
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
        draftCount: nurtureDrafts.length,
        latestNurtureDraftId: latestDraft?.id ?? null,
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
