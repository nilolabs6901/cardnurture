import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { contactBulkDeleteSchema, contactBulkUpdateSchema } from '@/lib/validators';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await request.json();

    const parsed = contactBulkDeleteSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json(
        { error: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }

    const { ids } = parsed.data;

    const result = await prisma.contact.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error(
      'Contacts bulk DELETE error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to delete contacts.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await request.json();

    const parsed = contactBulkUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json(
        { error: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }

    const { ids, ...updateData } = parsed.data;

    // Build update payload with only provided fields
    const data: Record<string, unknown> = {};
    if (updateData.nurtureEnabled !== undefined) data.nurtureEnabled = updateData.nurtureEnabled;
    if (updateData.nurtureInterval !== undefined) data.nurtureInterval = updateData.nurtureInterval;
    if (updateData.nurtureTopic !== undefined) data.nurtureTopic = updateData.nurtureTopic;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No update fields provided.' },
        { status: 400 }
      );
    }

    const result = await prisma.contact.updateMany({
      where: {
        id: { in: ids },
        userId,
      },
      data,
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error(
      'Contacts bulk PATCH error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to update contacts.' },
      { status: 500 }
    );
  }
}
