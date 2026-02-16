import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { researchSupplyChain } from '@/lib/supply-chain';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await request.json();
    const { contactId } = body;

    if (!contactId || typeof contactId !== 'string') {
      return NextResponse.json(
        { error: 'contactId is required.' },
        { status: 400 }
      );
    }

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

    // Research supply chain prospects
    const results = await researchSupplyChain(
      contact.company || '',
      contact.industryVertical || '',
      contact.name || '',
      contact.rawOcrText || ''
    );

    // Save each prospect result as a Prospect record
    const createdProspects = [];
    for (const result of results) {
      const prospect = await prisma.prospect.create({
        data: {
          contactId: contact.id,
          companyName: result.companyName,
          relationship: result.relationship,
          relationshipDesc: result.relationshipDesc || null,
          location: result.location || null,
          industry: result.industry || null,
          combiliftFit: result.combiliftFit || null,
          website: result.website || null,
          confidence: result.confidence || 'medium',
          status: 'new',
        },
      });
      createdProspects.push(prospect);
    }

    // Update the contact's supply chain research timestamp
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        supplyChainResearchedAt: new Date(),
      },
    });

    console.log(
      `Supply chain research for contact id=${contact.id}: ${createdProspects.length} prospects created`
    );

    return NextResponse.json(createdProspects, { status: 201 });
  } catch (error) {
    console.error(
      'Prospects research error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to research supply chain prospects.' },
      { status: 500 }
    );
  }
}
