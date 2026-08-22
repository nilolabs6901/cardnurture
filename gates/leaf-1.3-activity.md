# Gates: activity and next-action timeline

Scope: durable contact activity, next-action scheduling, authenticated API, and contact detail UI.

- [x] G1: Activity model and migration exist with contact ownership relation
  CHECK: grep -nE 'model Activity|nextActionAt|occurredAt' prisma/schema.prisma
  EXPECT: model Activity
  EVIDENCE: 72:  @@index([contactId, occurredAt]) | 73:  @@index([contactId, nextActionAt])

- [x] G2: activity API routes enforce session and contact ownership
  CHECK: grep -R -nE 'getServerSession|userId' 'src/app/api/contacts/[id]/activities' && printf 'activity-auth-pass'
  EXPECT: activity-auth-pass
  EVIDENCE: src/app/api/contacts/[id]/activities/route.ts:64:    const ownedContactId = await getOwnedContactId(contactId, userId); | activity-auth-pass

- [x] G3: contact detail exposes activity/next-action controls
  CHECK: grep -nE 'Log call|Log meeting|Add note|next action|Activity' src/app/contacts/\[id\]/page.tsx
  EXPECT: Activity
  EVIDENCE: 798:          title="Activity" | 802:          <ActivityTimeline contactId={contactId} />

- [x] G4: activity tests pass
  CHECK: npm test -- --reporter=dot src/lib/__tests__/activity.test.ts && printf 'activity-tests-pass'
  EXPECT: activity-tests-pass
  EVIDENCE: [2m   Duration [22m 120ms[2m (transform 31ms, setup 0ms, import 63ms, tests 7ms, environment 0ms)[22m | activity-tests-pass
