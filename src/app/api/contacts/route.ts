import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { contactCreateSchema } from '@/lib/validators';
import { generateIntroMeetingDraft } from '@/lib/email-templates';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    const contacts = await prisma.contact.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            emailDrafts: true,
            prospects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error(
      'Contacts GET error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to fetch contacts.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await request.json();

    // Validate the request body
    const parsed = contactCreateSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json(
        { error: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Create the contact
    const contact = await prisma.contact.create({
      data: {
        userId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        address: data.address || null,
        rawOcrText: data.rawOcrText || null,
        needsReview: data.needsReview ?? false,
        personalityType: data.personalityType || 'Balanced',
        personalitySummary: data.personalitySummary || null,
        researchSnippets: data.researchSnippets || null,
        personalityConfidence: data.personalityConfidence || 'none',
        researchedAt: data.personalityType && data.personalityType !== 'Balanced' ? new Date() : null,
        industryVertical: data.industryVertical || null,
      },
    });

    // Auto-generate "Nice to meet you" intro email draft
    const draftContent = generateIntroMeetingDraft({
      name: contact.name,
      company: contact.company,
      personalityType: contact.personalityType,
      personalitySummary: contact.personalitySummary,
      researchSnippets: contact.researchSnippets,
      industryVertical: contact.industryVertical,
      emailDrafts: [],
    });

    const draft = await prisma.emailDraft.create({
      data: {
        contactId: contact.id,
        type: 'follow-up',
        subject: draftContent.subject,
        body: draftContent.body,
        status: 'draft',
      },
    });

    console.log(
      `Contact created: id=${contact.id}, draft created: id=${draft.id}`
    );

    return NextResponse.json(
      { contactId: contact.id, draftId: draft.id },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'Contacts POST error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to create contact.' },
      { status: 500 }
    );
  }
}
