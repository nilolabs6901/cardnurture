# Gates: activity and next-action timeline

Scope: durable contact activity, next-action scheduling, authenticated API, and contact detail UI.

- [ ] G1: Activity model and migration exist with contact ownership relation
  CHECK: grep -nE 'model Activity|nextActionAt|occurredAt' prisma/schema.prisma
  EXPECT: model Activity
  EVIDENCE: pending

- [ ] G2: activity API routes enforce session and contact ownership
  CHECK: grep -R -nE 'getServerSession|userId' 'src/app/api/contacts/[id]/activities' && printf 'activity-auth-pass'
  EXPECT: activity-auth-pass
  EVIDENCE: pending

- [ ] G3: contact detail exposes activity/next-action controls
  CHECK: grep -nE 'Log call|Log meeting|Add note|next action|Activity' src/app/contacts/\[id\]/page.tsx
  EXPECT: Activity
  EVIDENCE: pending

- [ ] G4: activity tests pass
  CHECK: npm test -- --reporter=dot src/lib/__tests__/activity.test.ts
  EXPECT: passed
  EVIDENCE: pending
