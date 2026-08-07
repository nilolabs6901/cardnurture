import { prisma } from './prisma';

/**
 * Single-user tool: there is no sign-in, so every request acts as one owner
 * account. Routes call getOwnerUserId() where they used to read a session.
 *
 * Resolution order matters, because contacts are scoped by userId and picking
 * the wrong user makes existing data look like it vanished:
 *
 *   1. OWNER_EMAIL, if set. The explicit escape hatch.
 *   2. Otherwise the user holding the most contacts, oldest wins a tie. The
 *      old email-only sign-in created a user for any address typed at the
 *      login screen, so a deployment can carry stray accounts alongside the
 *      real one; the account with the data is the one to keep using.
 *   3. Otherwise create the seed admin. Only reached on an empty database.
 */

const DEFAULT_OWNER_EMAIL = 'admin@cardnurture.app';

let cachedOwnerId: string | null = null;

export async function getOwnerUserId(): Promise<string> {
  if (cachedOwnerId) return cachedOwnerId;

  const configured = process.env.OWNER_EMAIL?.toLowerCase().trim();

  if (configured) {
    const user = await prisma.user.upsert({
      where: { email: configured },
      update: {},
      create: { email: configured, passwordHash: '', name: 'Owner' },
    });
    cachedOwnerId = user.id;
    return user.id;
  }

  const [busiest] = await prisma.user.findMany({
    orderBy: [{ contacts: { _count: 'desc' } }, { createdAt: 'asc' }],
    take: 1,
    select: { id: true, email: true },
  });

  if (busiest) {
    console.log(`[auth] Operating as owner ${busiest.email}`);
    cachedOwnerId = busiest.id;
    return busiest.id;
  }

  const created = await prisma.user.create({
    data: { email: DEFAULT_OWNER_EMAIL, passwordHash: '', name: 'Owner' },
  });
  console.log(`[auth] No users found; created owner ${created.email}`);
  cachedOwnerId = created.id;
  return created.id;
}
