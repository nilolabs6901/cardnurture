import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    contact: {
      findFirst: vi.fn(),
    },
    activity: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import { GET, POST } from '@/app/api/contacts/[id]/activities/route';
import { prisma } from '@/lib/prisma';
import { activityInputSchema } from '../activity';

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedContactFindFirst = vi.mocked(prisma.contact.findFirst);
const mockedActivityFindMany = vi.mocked(prisma.activity.findMany);
const mockedActivityCreate = vi.mocked(prisma.activity.create);

const routeContext = (id: string) => ({ params: Promise.resolve({ id }) });

function request(method: 'GET' | 'POST', body?: unknown) {
  return new Request('http://localhost/api/contacts/contact-1/activities', {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetServerSession.mockResolvedValue({
    user: { id: 'user-1' },
  } as any);
  mockedContactFindFirst.mockResolvedValue({ id: 'contact-1' } as any);
  mockedActivityFindMany.mockResolvedValue([]);
  mockedActivityCreate.mockResolvedValue({
    id: 'activity-1',
    contactId: 'contact-1',
    type: 'call',
    channel: 'phone',
    outcome: 'connected',
    notes: 'Discussed the warehouse project.',
    occurredAt: new Date('2026-08-22T10:00:00.000Z'),
    nextActionAt: new Date('2026-08-29T10:00:00.000Z'),
    createdAt: new Date('2026-08-22T10:00:00.000Z'),
  } as any);
});

describe('activity input', () => {
  it('accepts an interaction and coerces ISO timestamps to Dates', () => {
    const parsed = activityInputSchema.parse({
      type: 'call',
      channel: 'phone',
      outcome: 'connected',
      notes: 'Discussed the warehouse project.',
      occurredAt: '2026-08-22T10:00:00.000Z',
      nextActionAt: '2026-08-29T10:00:00.000Z',
    });

    expect(parsed.occurredAt).toEqual(new Date('2026-08-22T10:00:00.000Z'));
    expect(parsed.nextActionAt).toEqual(new Date('2026-08-29T10:00:00.000Z'));
  });

  it('rejects unknown activity types', () => {
    expect(() =>
      activityInputSchema.parse({
        type: 'unknown',
        channel: 'phone',
        outcome: 'connected',
        notes: '',
      }),
    ).toThrow();
  });
});

describe('activity API', () => {
  it('requires an authenticated session for reads', async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const response = await GET(request('GET') as any, routeContext('contact-1'));

    expect(response.status).toBe(401);
    expect(mockedContactFindFirst).not.toHaveBeenCalled();
  });

  it('scopes reads through the authenticated contact owner', async () => {
    mockedContactFindFirst.mockResolvedValue(null);

    const response = await GET(request('GET') as any, routeContext('contact-1'));

    expect(response.status).toBe(404);
    expect(mockedContactFindFirst).toHaveBeenCalledWith({
      where: { id: 'contact-1', userId: 'user-1' },
      select: { id: true },
    });
    expect(mockedActivityFindMany).not.toHaveBeenCalled();
  });

  it('returns the owned contact timeline in occurred-at order', async () => {
    const timeline = [{ id: 'activity-1', type: 'call' }];
    mockedActivityFindMany.mockResolvedValue(timeline as any);

    const response = await GET(request('GET') as any, routeContext('contact-1'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(timeline);
    expect(mockedActivityFindMany).toHaveBeenCalledWith({
      where: { contactId: 'contact-1' },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('creates an owned activity and preserves its next action', async () => {
    const response = await POST(
      request('POST', {
        type: 'call',
        channel: 'phone',
        outcome: 'connected',
        notes: 'Discussed the warehouse project.',
        occurredAt: '2026-08-22T10:00:00.000Z',
        nextActionAt: '2026-08-29T10:00:00.000Z',
      }) as any,
      routeContext('contact-1'),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ id: 'activity-1' });
    expect(mockedActivityCreate).toHaveBeenCalledWith({
      data: {
        contactId: 'contact-1',
        type: 'call',
        channel: 'phone',
        outcome: 'connected',
        notes: 'Discussed the warehouse project.',
        occurredAt: new Date('2026-08-22T10:00:00.000Z'),
        nextActionAt: new Date('2026-08-29T10:00:00.000Z'),
      },
    });
  });

  it('does not create an activity for a contact owned by another user', async () => {
    mockedContactFindFirst.mockResolvedValue(null);

    const response = await POST(
      request('POST', {
        type: 'note',
        channel: 'note',
        outcome: 'recorded',
        notes: 'Private note.',
      }) as any,
      routeContext('contact-1'),
    );

    expect(response.status).toBe(404);
    expect(mockedActivityCreate).not.toHaveBeenCalled();
  });

  it('rejects malformed activity payloads', async () => {
    const response = await POST(
      request('POST', {
        type: 'call',
        channel: 'phone',
        outcome: '',
        notes: '',
        occurredAt: 'not-a-date',
      }) as any,
      routeContext('contact-1'),
    );

    expect(response.status).toBe(400);
    expect(mockedActivityCreate).not.toHaveBeenCalled();
  });
});
