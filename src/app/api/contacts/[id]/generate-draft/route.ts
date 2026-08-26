import { NextRequest, NextResponse } from 'next/server';
import { getOwnerUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  generateIntroMeetingDraft,
  generateCombiliftModelDraft,
  generateFollowUpDraft,
} from '@/lib/email-templates';
import type { TemplateContact } from '@/lib/email-templates';
import { writeDraft } from '@/lib/draft-writer';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = await getOwnerUserId();
    const contactId = params.id;

    // Get the contact and verify ownership
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: { emailDrafts: { select: { id: true } } },
    });

    if (!contact || contact.userId !== userId) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const body = await request.json();
    const { templateType, combiliftModel } = body as {
      templateType: string;
      combiliftModel?: string;
    };

    if (!templateType) {
      return NextResponse.json(
        { error: 'templateType is required' },
        { status: 400 },
      );
    }

    // Build the template contact shape
    const templateContact: TemplateContact = {
      name: contact.name,
      company: contact.company,
      personalityType: contact.personalityType,
      personalitySummary: contact.personalitySummary,
      researchSnippets: contact.researchSnippets,
      industryVertical: contact.industryVertical,
      emailDrafts: contact.emailDrafts,
    };

    let draftContent: { subject: string; body: string };

    switch (templateType) {
      case 'intro-meeting': {
        // Try a written draft first. It fills the blanks the template cannot —
        // where you met, what you discussed — from what was typed at the booth,
        // and is told in no uncertain terms not to invent either.
        //
        // Falls back to the template when there is no model key, when the model
        // errors, or when it returns something with a placeholder still in it.
        // A slower path that degrades to the old behaviour beats a fast one that
        // degrades to nothing.
        const written = await writeDraft({
          name: contact.name,
          company: contact.company,
          metAt: contact.metAt,
          metNote: contact.metNote,
          personalityType: contact.personalityType,
          personalitySummary: contact.personalitySummary,
          companyDescription: contact.companyDescription,
          industryVertical: contact.industryVertical,
        });
        draftContent = written ?? generateIntroMeetingDraft(templateContact);
        break;
      }

      case 'combilift-model':
        if (!combiliftModel) {
          return NextResponse.json(
            { error: 'combiliftModel is required for this template type' },
            { status: 400 },
          );
        }
        draftContent = generateCombiliftModelDraft(templateContact, combiliftModel);
        break;

      case 'follow-up':
        draftContent = generateFollowUpDraft(templateContact);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown template type: ${templateType}` },
          { status: 400 },
        );
    }

    // Create the draft
    const draft = await prisma.emailDraft.create({
      data: {
        contactId: contact.id,
        type: templateType,
        subject: draftContent.subject,
        body: draftContent.body,
        status: 'draft',
      },
    });

    console.log(
      `[Generate Draft] Created ${templateType} draft id=${draft.id} for contact id=${contact.id}`,
    );

    return NextResponse.json(
      { draftId: draft.id, subject: draft.subject },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      'Generate draft error:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return NextResponse.json(
      { error: 'Failed to generate draft.' },
      { status: 500 },
    );
  }
}
