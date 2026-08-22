import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('@/lib/auth', () => ({
  getOwnerUserId: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    contact: {
      findMany: vi.fn(),
    },
  },
}));

import { getOwnerUserId } from '@/lib/auth';
import { GET } from '@/app/api/contacts/nurture-status/route';
import { prisma } from '@/lib/prisma';

const mockedGetOwnerUserId = vi.mocked(getOwnerUserId);
const mockedContactFindMany = vi.mocked(prisma.contact.findMany);

const NOW = new Date('2026-08-22T12:00:00.000Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function contact(overrides: Record<string, unknown> = {}) {
  return {
    id: 'contact-1',
    name: 'Test Person',
    email: 'test@example.com',
    company: 'TestCo',
    personalityType: 'Balanced',
    nurtureEnabled: true,
    nurtureInterval: 30,
    nurtureTopic: 'Auto',
    createdAt: daysAgo(10),
    researchSnippets: null,
    emailDrafts: [],
    _count: { emailDrafts: 0, prospects: 0 },
    ...overrides,
  };
}

async function getStatus() {
  const response = await GET();
  return response.json();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  mockedGetOwnerUserId.mockResolvedValue('user-1');
  mockedContactFindMany.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('nurture status workflow', () => {
  it('queries and counts nurture drafts only', async () => {
    mockedContactFindMany.mockResolvedValue([contact()] as any);

    await getStatus();

    expect(mockedContactFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          emailDrafts: expect.objectContaining({
            where: { type: 'nurture' },
          }),
          _count: expect.objectContaining({
            select: expect.objectContaining({
              emailDrafts: { where: { type: 'nurture' } },
            }),
          }),
        }),
      }),
    );
  });

  it('uses the contact creation date for the first nurture window', async () => {
    mockedContactFindMany.mockResolvedValue([
      contact({ createdAt: daysAgo(10) }),
    ] as any);

    const result = await getStatus();

    expect(result.contacts[0]).toMatchObject({
      lastDraftDate: null,
      daysSinceLastDraft: null,
      dueInDays: 20,
      isOverdue: false,
      isDueSoon: false,
      draftCount: 0,
      latestNurtureDraftId: null,
    });
    expect(result.summary).toMatchObject({ dueSoon: 0, overdue: 0 });
  });

  it('does not let a non-nurture draft affect due status or draft count', async () => {
    mockedContactFindMany.mockResolvedValue([
      contact({
        createdAt: daysAgo(10),
        // This simulates an incorrectly broad relation result. The route must
        // keep its nurture-only contract even if a caller/mock supplies extra rows.
        emailDrafts: [
          {
            id: 'follow-up-1',
            type: 'follow-up',
            createdAt: daysAgo(1),
            windowStart: null,
          },
        ],
        _count: { emailDrafts: 1, prospects: 0 },
      }),
    ] as any);

    const result = await getStatus();

    expect(result.contacts[0]).toMatchObject({
      dueInDays: 20,
      isDueSoon: false,
      isOverdue: false,
      draftCount: 0,
      latestNurtureDraftId: null,
    });
  });

  it('uses a nurture draft windowStart as the next schedule anchor', async () => {
    mockedContactFindMany.mockResolvedValue([
      contact({
        createdAt: daysAgo(100),
        emailDrafts: [
          {
            id: 'nurture-1',
            type: 'nurture',
            createdAt: daysAgo(20),
            windowStart: daysAgo(20),
          },
        ],
        _count: { emailDrafts: 1, prospects: 0 },
      }),
    ] as any);

    const result = await getStatus();

    expect(result.contacts[0]).toMatchObject({
      dueInDays: 10,
      isOverdue: false,
      isDueSoon: false,
      draftCount: 1,
      latestNurtureDraftId: 'nurture-1',
    });
  });

  it('marks a scheduled nurture window overdue only after its interval elapses', async () => {
    mockedContactFindMany.mockResolvedValue([
      contact({
        createdAt: daysAgo(100),
        emailDrafts: [
          {
            id: 'nurture-2',
            type: 'nurture',
            createdAt: daysAgo(35),
            windowStart: daysAgo(35),
          },
        ],
        _count: { emailDrafts: 1, prospects: 0 },
      }),
    ] as any);

    const result = await getStatus();

    expect(result.contacts[0]).toMatchObject({
      dueInDays: -5,
      isOverdue: true,
      isDueSoon: false,
    });
    expect(result.summary).toMatchObject({ dueSoon: 0, overdue: 1 });
  });
});

describe('nurture page API workflow contract', () => {
  const pagePath = resolve(process.cwd(), 'src/app/contacts/nurture/page.tsx');

  it('generates, loads, and saves nurture drafts through the draft endpoint', () => {
    const source = readFileSync(pagePath, 'utf8');

    expect(source).toMatch(/templateType:\s*['"]nurture['"]/);
    expect(source).toMatch(/latestNurtureDraftId/);
    expect(source).toMatch(/\/api\/drafts\/\$\{/);
    expect(source).not.toMatch(/templateType:\s*['"]follow-up['"]/);
    expect(source).not.toMatch(/fetch\(`\/api\/contacts\/\$\{activeContactId\}`/);
  });
});
