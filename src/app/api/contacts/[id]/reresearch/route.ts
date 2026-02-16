import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { researchContact } from '@/lib/research';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const { id } = await context.params;

    // Verify the contact belongs to this user
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found.' },
        { status: 404 }
      );
    }

    if (contact.userId !== userId) {
      return NextResponse.json(
        { error: 'Contact not found.' },
        { status: 404 }
      );
    }

    // Perform research — pass rawOcrText for job title context
    const result = await researchContact(
      contact.name,
      contact.company || '',
      contact.rawOcrText || ''
    );

    // Update the contact with new personality data
    const updated = await prisma.contact.update({
      where: { id },
      data: {
        personalityType: result.personalityType,
        personalityConfidence: result.confidence,
        personalitySummary: result.summary,
        researchSnippets: result.researchSnippets,
        researchedAt: new Date(),
      },
    });

    return NextResponse.json({
      personalityType: updated.personalityType,
      personalityConfidence: updated.personalityConfidence,
      personalitySummary: updated.personalitySummary,
      researchSnippets: updated.researchSnippets,
      researchedAt: updated.researchedAt,
    });
  } catch (error) {
    console.error(
      'Reresearch error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to re-research contact.' },
      { status: 500 }
    );
  }
}
