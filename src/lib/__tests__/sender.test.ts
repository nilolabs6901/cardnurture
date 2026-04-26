import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../prisma', () => ({
  prisma: {
    emailDraft: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../mailer', () => ({
  isSmtpConfigured: vi.fn(),
  sendEmail: vi.fn(),
}));

import { sendScheduledDrafts } from '../sender';
import { prisma } from '../prisma';
import { isSmtpConfigured, sendEmail } from '../mailer';

const mockedFindMany = vi.mocked(prisma.emailDraft.findMany);
const mockedUpdate = vi.mocked(prisma.emailDraft.update);
const mockedIsSmtpConfigured = vi.mocked(isSmtpConfigured);
const mockedSendEmail = vi.mocked(sendEmail);

beforeEach(() => {
  vi.clearAllMocks();
  mockedIsSmtpConfigured.mockReturnValue(true);
  mockedUpdate.mockResolvedValue({} as any);
});

describe('sendScheduledDrafts', () => {
  it('aborts when SMTP is not configured', async () => {
    mockedIsSmtpConfigured.mockReturnValue(false);

    const result = await sendScheduledDrafts();

    expect(result).toEqual({ sent: 0, failed: 0, skipped: 0 });
    expect(mockedFindMany).not.toHaveBeenCalled();
  });

  it('sends due drafts and marks them sent', async () => {
    mockedFindMany.mockResolvedValue([
      {
        id: 'draft-001',
        subject: 'Hi',
        body: 'body',
        contact: { id: 'c1', email: 'jane@example.com' },
      },
    ] as any);
    mockedSendEmail.mockResolvedValue(true);

    const result = await sendScheduledDrafts();

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(mockedSendEmail).toHaveBeenCalledWith('jane@example.com', 'Hi', 'body');
    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'draft-001' },
        data: expect.objectContaining({ status: 'sent' }),
      }),
    );
  });

  it('skips drafts whose contact has no email', async () => {
    mockedFindMany.mockResolvedValue([
      {
        id: 'draft-002',
        subject: 's',
        body: 'b',
        contact: { id: 'c2', email: null },
      },
    ] as any);

    const result = await sendScheduledDrafts();

    expect(result.skipped).toBe(1);
    expect(mockedSendEmail).not.toHaveBeenCalled();
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('marks status send_failed when SMTP returns false', async () => {
    mockedFindMany.mockResolvedValue([
      {
        id: 'draft-003',
        subject: 's',
        body: 'b',
        contact: { id: 'c3', email: 'a@b.com' },
      },
    ] as any);
    mockedSendEmail.mockResolvedValue(false);

    const result = await sendScheduledDrafts();

    expect(result.failed).toBe(1);
    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'draft-003' },
        data: { status: 'send_failed' },
      }),
    );
  });

  it('marks status send_failed when sendEmail throws', async () => {
    mockedFindMany.mockResolvedValue([
      {
        id: 'draft-004',
        subject: 's',
        body: 'b',
        contact: { id: 'c4', email: 'a@b.com' },
      },
    ] as any);
    mockedSendEmail.mockRejectedValue(new Error('smtp down'));

    const result = await sendScheduledDrafts();

    expect(result.failed).toBe(1);
    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'draft-004' },
        data: { status: 'send_failed' },
      }),
    );
  });
});
