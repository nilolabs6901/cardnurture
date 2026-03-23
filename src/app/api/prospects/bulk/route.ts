import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  prospectBulkUpdateSchema,
  prospectBulkDeleteSchema,
} from '@/lib/validators';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await request.json();

    const parsed = prospectBulkUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json(
        { error: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.status) {
      data.status = parsed.data.status;
    }

    const result = await prisma.prospect.updateMany({
      where: {
        id: { in: parsed.data.ids },
        sourceContact: { userId },
      },
      data,
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error(
      'Prospects bulk PATCH error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to bulk update prospects.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await request.json();

    const parsed = prospectBulkDeleteSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json(
        { error: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }

    const result = await prisma.prospect.deleteMany({
      where: {
        id: { in: parsed.data.ids },
        sourceContact: { userId },
      },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error(
      'Prospects bulk DELETE error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to bulk delete prospects.' },
      { status: 500 }
    );
  }
}
