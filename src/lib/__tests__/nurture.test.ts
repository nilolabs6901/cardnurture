import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../prisma', () => ({
  prisma: {
    contact: { findMany: vi.fn() },
    emailDraft: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

// Import after the mock so the module picks up the mocked prisma
import { generateNurtureDrafts } from '../nurture';
import { prisma } from '../prisma';

const mockedContactFindMany = vi.mocked(prisma.contact.findMany);
const mockedEmailDraftCreate = vi.mocked(prisma.emailDraft.create);

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateNurtureDrafts', () => {
  it('skips contacts with nurtureEnabled = false', async () => {
    // findMany is called with where: { nurtureEnabled: true }, so if the
    // database returns no contacts (because none have nurtureEnabled = true),
    // the result should show 0 generated.
    mockedContactFindMany.mockResolvedValue([]);

    const result = await generateNurtureDrafts();

    expect(result.generated).toBe(0);
  });

  it('skips contacts that are within the 90-day window (too new)', async () => {
    mockedContactFindMany.mockResolvedValue([
      {
        id: 'cltest00000001',
        name: 'New Contact',
        company: 'NewCo',
        personalityType: 'Driver',
        personalitySummary: null,
        researchSnippets: null,
        industryVertical: 'Manufacturing',
        nurtureEnabled: true,
        nurtureInterval: 90,
        nurtureTopic: 'Auto',
        createdAt: daysAgo(30),
        emailDrafts: [],
      },
    ] as any);

    const result = await generateNurtureDrafts();

    // Contact was created only 30 days ago; first window is at 90 days, so
    // the contact should be skipped.
    expect(result.generated).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('generates a draft for an eligible contact (created > 90 days ago, no existing drafts)', async () => {
    mockedContactFindMany.mockResolvedValue([
      {
        id: 'cltest00000002',
        name: 'Eligible Contact',
        company: 'EligibleCo',
        personalityType: 'Analytical',
        personalitySummary: null,
        researchSnippets: null,
        industryVertical: 'Distribution & Warehousing',
        nurtureEnabled: true,
        nurtureInterval: 90,
        nurtureTopic: 'Auto',
        createdAt: daysAgo(100),
        emailDrafts: [],
      },
    ] as any);

    mockedEmailDraftCreate.mockResolvedValue({
      id: 'draft001',
      contactId: 'cltest00000002',
      type: 'nurture',
      subject: 'Test Subject',
      body: 'Test Body',
      status: 'draft',
      topic: 'Warehouse Safety & OSHA Compliance',
      windowStart: daysAgo(10),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await generateNurtureDrafts();

    expect(result.generated).toBe(1);
    expect(mockedEmailDraftCreate).toHaveBeenCalledTimes(1);
  });

  it('is idempotent -- does not duplicate drafts for the same window', async () => {
    const createdAt = daysAgo(100);
    // The first window for a contact created 100 days ago with 90-day interval
    // is at createdAt + 90 days. We simulate that a draft already exists for
    // that window.
    const windowStart = new Date(createdAt);
    windowStart.setDate(windowStart.getDate() + 90);
    // Normalize to midnight UTC to match the nurture module's normalizeDate
    const normalizedWindow = new Date(
      Date.UTC(windowStart.getFullYear(), windowStart.getMonth(), windowStart.getDate()),
    );

    mockedContactFindMany.mockResolvedValue([
      {
        id: 'cltest00000003',
        name: 'Duplicate Contact',
        company: 'DupeCo',
        personalityType: 'Expressive',
        personalitySummary: null,
        researchSnippets: null,
        industryVertical: 'Lumber & Building Materials',
        nurtureEnabled: true,
        nurtureInterval: 90,
        nurtureTopic: 'Auto',
        createdAt,
        emailDrafts: [
          {
            id: 'existing-draft',
            windowStart: normalizedWindow,
            type: 'nurture',
            subject: 'Already sent',
            body: 'Already sent body',
            status: 'draft',
            topic: 'Warehouse Safety & OSHA Compliance',
          },
        ],
      },
    ] as any);

    const result = await generateNurtureDrafts();

    expect(result.generated).toBe(0);
    expect(result.skipped).toBe(1);
    expect(mockedEmailDraftCreate).not.toHaveBeenCalled();
  });
});
