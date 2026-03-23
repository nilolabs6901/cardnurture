import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { prospectCreateSchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');
    const stage = searchParams.get('stage');
    const company = searchParams.get('company');

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

    // Build filters for all-prospects query
    const where: Record<string, unknown> = {
      sourceContact: { userId },
    };

    if (stage) {
      where.status = stage;
    }

    if (company) {
      where.companyName = { contains: company, mode: 'insensitive' };
    }

    // Return all prospects for all of the user's contacts
    const prospects = await prisma.prospect.findMany({
      where,
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await request.json();

    const parsed = prospectCreateSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json(
        { error: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }

    // Verify the contact belongs to this user
    const contact = await prisma.contact.findUnique({
      where: { id: parsed.data.contactId },
    });

    if (!contact || contact.userId !== userId) {
      return NextResponse.json(
        { error: 'Contact not found.' },
        { status: 404 }
      );
    }

    const prospect = await prisma.prospect.create({
      data: {
        contactId: parsed.data.contactId,
        companyName: parsed.data.companyName,
        relationship: parsed.data.relationship,
        relationshipDesc: parsed.data.relationshipDesc || null,
        location: parsed.data.location || null,
        industry: parsed.data.industry || null,
        website: parsed.data.website || null,
        confidence: parsed.data.confidence || 'medium',
        status: 'new',
      },
      include: {
        sourceContact: {
          select: { name: true, company: true },
        },
      },
    });

    return NextResponse.json(prospect, { status: 201 });
  } catch (error) {
    console.error(
      'Prospects POST error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to create prospect.' },
      { status: 500 }
    );
  }
}
