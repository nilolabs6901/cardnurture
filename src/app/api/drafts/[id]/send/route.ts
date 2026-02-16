import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isSmtpConfigured, sendEmail } from '@/lib/mailer';

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

    // Check if SMTP is configured
    if (!isSmtpConfigured()) {
      return NextResponse.json(
        {
          error:
            'SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables.',
        },
        { status: 400 }
      );
    }

    // Check if the contact has an email address
    if (!draft.contact.email) {
      return NextResponse.json(
        {
          error:
            'Cannot send email: this contact does not have an email address.',
        },
        { status: 400 }
      );
    }

    // Send the email
    await sendEmail(draft.contact.email, draft.subject, draft.body);

    // Update draft status to sent
    await prisma.emailDraft.update({
      where: { id },
      data: { status: 'sent' },
    });

    // Mask email for logging
    const maskedEmail = draft.contact.email.replace(
      /(.{2}).*(@.*)/,
      '$1***$2'
    );
    console.log(
      `Email sent for draft id=${id} to ${maskedEmail}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      'Draft send error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to send email.' },
      { status: 500 }
    );
  }
}
