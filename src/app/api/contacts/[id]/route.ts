import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { contactUpdateSchema } from '@/lib/validators';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const { id } = await context.params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        emailDrafts: {
          orderBy: { createdAt: 'desc' },
        },
        prospects: true,
      },
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

    return NextResponse.json(contact);
  } catch (error) {
    console.error(
      'Contact GET error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to fetch contact.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const { id } = await context.params;

    // Verify the contact belongs to this user
    const existing = await prisma.contact.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Contact not found.' },
        { status: 404 }
      );
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: 'Contact not found.' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate the update fields
    const parsed = contactUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json(
        { error: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Build the update object, including nurture settings
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.company !== undefined) updateData.company = data.company || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.needsReview !== undefined) updateData.needsReview = data.needsReview;
    if (data.personalityType !== undefined) updateData.personalityType = data.personalityType;
    if (data.personalitySummary !== undefined) updateData.personalitySummary = data.personalitySummary || null;
    if (data.researchSnippets !== undefined) updateData.researchSnippets = data.researchSnippets || null;
    if (data.personalityConfidence !== undefined) updateData.personalityConfidence = data.personalityConfidence;
    if (data.industryVertical !== undefined) updateData.industryVertical = data.industryVertical || null;
    if (data.salesStage !== undefined) updateData.salesStage = data.salesStage;

    // Nurture settings
    if (data.nurtureEnabled !== undefined) updateData.nurtureEnabled = data.nurtureEnabled;
    if (data.nurtureInterval !== undefined) updateData.nurtureInterval = data.nurtureInterval;
    if (data.nurtureTopic !== undefined) updateData.nurtureTopic = data.nurtureTopic;

    const updated = await prisma.contact.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      'Contact PATCH error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to update contact.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const { id } = await context.params;

    const existing = await prisma.contact.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Contact not found.' },
        { status: 404 }
      );
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: 'Contact not found.' },
        { status: 404 }
      );
    }

    // Cascade deletes are handled by Prisma schema (onDelete: Cascade)
    await prisma.contact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      'Contact DELETE error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to delete contact.' },
      { status: 500 }
    );
  }
}
