import nodemailer from 'nodemailer';

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  if (!isSmtpConfigured()) {
    console.warn(
      'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM environment variables.'
    );
    return false;
  }

  try {
    const transporter = createTransport();

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    });

    return true;
  } catch (error) {
    console.error(
      'Failed to send email:',
      error instanceof Error ? error.message : error
    );
    return false;
  }
}
