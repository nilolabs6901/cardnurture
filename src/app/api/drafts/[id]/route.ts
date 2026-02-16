import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { draftUpdateSchema } from '@/lib/validators';

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

    // Find the draft and verify its contact belongs to the user
    const draft = await prisma.emailDraft.findUnique({
      where: { id },
      include: {
        contact: {
          select: {
            id: true,
            userId: true,
            name: true,
            email: true,
            company: true,
            personalityType: true,
          },
        },
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found.' },
        { status: 404 }
      );
    }

    if (draft.contact.userId !== userId) {
      return NextResponse.json(
        { error: 'Draft not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(draft);
  } catch (error) {
    console.error(
      'Draft GET error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to fetch draft.' },
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

    // Find the draft and verify its contact belongs to the user
    const existing = await prisma.emailDraft.findUnique({
      where: { id },
      include: {
        contact: {
          select: { userId: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Draft not found.' },
        { status: 404 }
      );
    }

    if (existing.contact.userId !== userId) {
      return NextResponse.json(
        { error: 'Draft not found.' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate the update fields
    const parsed = draftUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json(
        { error: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.topic !== undefined) updateData.topic = data.topic || null;

    const updated = await prisma.emailDraft.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      'Draft PATCH error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to update draft.' },
      { status: 500 }
    );
  }
}
