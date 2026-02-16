import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (contactId) {
      // Verify the contact belongs to this user
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });

      if (!contact || contact.userId !== userId) {
        return NextResponse.json(
          { error: 'Contact not found.' },
          { status: 404 }
        );
      }

      const prospects = await prisma.prospect.findMany({
        where: { contactId },
        include: {
          sourceContact: {
            select: { name: true, company: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(prospects);
    }

    // Return all prospects for all of the user's contacts
    const prospects = await prisma.prospect.findMany({
      where: {
        sourceContact: {
          userId,
        },
      },
      include: {
        sourceContact: {
          select: { name: true, company: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(prospects);
  } catch (error) {
    console.error(
      'Prospects GET error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to fetch prospects.' },
      { status: 500 }
    );
  }
}
