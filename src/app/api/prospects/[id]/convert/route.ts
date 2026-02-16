import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    if (prospect.status === 'converted') {
      return NextResponse.json(
        { error: 'Prospect has already been converted.' },
        { status: 400 }
      );
    }

    // Create a new Contact from the prospect data
    const newContact = await prisma.contact.create({
      data: {
        userId,
        name: prospect.companyName,
        company: prospect.companyName,
        address: prospect.location || null,
        industryVertical: prospect.industry || null,
        personalityType: 'Balanced',
        personalityConfidence: 'none',
      },
    });

    // Update the prospect: mark as converted and link to the new contact
    await prisma.prospect.update({
      where: { id },
      data: {
        status: 'converted',
        convertedToContactId: newContact.id,
      },
    });

    console.log(
      `Prospect id=${id} converted to contact id=${newContact.id}`
    );

    return NextResponse.json(
      { contactId: newContact.id },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'Prospect convert error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to convert prospect to contact.' },
      { status: 500 }
    );
  }
}
