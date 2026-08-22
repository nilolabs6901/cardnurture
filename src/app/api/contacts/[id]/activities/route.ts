import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  activityInputSchema,
  activityValidationError,
} from '@/lib/activity';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getOwnedContactId(contactId: string, userId: string): Promise<string | null> {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
    select: { id: true },
  });

  return contact?.id ?? null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contactId } = await context.params;
    const ownedContactId = await getOwnedContactId(contactId, userId);
    if (!ownedContactId) {
      return NextResponse.json({ error: 'Contact not found.' }, { status: 404 });
    }

    const activities = await prisma.activity.findMany({
      where: { contactId: ownedContactId },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error(
      'Activity GET error:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return NextResponse.json(
      { error: 'Failed to fetch activities.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contactId } = await context.params;
    const ownedContactId = await getOwnedContactId(contactId, userId);
    if (!ownedContactId) {
      return NextResponse.json({ error: 'Contact not found.' }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    const parsed = activityInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Validation failed: ${activityValidationError(parsed)}` },
        { status: 400 },
      );
    }

    const activity = await prisma.activity.create({
      data: {
        contactId: ownedContactId,
        type: parsed.data.type,
        channel: parsed.data.channel,
        outcome: parsed.data.outcome,
        notes: parsed.data.notes,
        occurredAt: parsed.data.occurredAt,
        nextActionAt: parsed.data.nextActionAt,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error(
      'Activity POST error:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return NextResponse.json(
      { error: 'Failed to create activity.' },
      { status: 500 },
    );
  }
}
