import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { prospectUpdateSchema } from '@/lib/validators';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const { id } = await context.params;

    // Find the prospect and verify its sourceContact belongs to the user
    const prospect = await prisma.prospect.findUnique({
      where: { id },
      include: {
        sourceContact: {
          select: { userId: true },
        },
      },
    });

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect not found.' },
        { status: 404 }
      );
    }

    if (prospect.sourceContact.userId !== userId) {
      return NextResponse.json(
        { error: 'Prospect not found.' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate the status field
    const parsed = prospectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json(
        { error: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }

    const updated = await prisma.prospect.update({
      where: { id },
      data: {
        status: parsed.data.status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      'Prospect PATCH error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to update prospect.' },
      { status: 500 }
    );
  }
}
