# Gates: nurture workflow repair

Scope: repair nurture generation/editing/status semantics and add regression coverage.

- [ ] G1: nurture UI generates and loads only nurture drafts
  CHECK: grep -nE "templateType.*nurture|type.*nurture|drafts.*nurture" src/app/contacts/nurture/page.tsx
  EXPECT: nurture
  EVIDENCE: pending

- [ ] G2: nurture editor saves through the draft endpoint
  CHECK: grep -n '/api/drafts/' src/app/contacts/nurture/page.tsx
  EXPECT: /api/drafts/
  EVIDENCE: pending

- [ ] G3: nurture status excludes non-nurture drafts and handles first window correctly
  CHECK: npm test -- --reporter=dot src/lib/__tests__/nurture.test.ts && printf 'nurture-tests-pass'
  EXPECT: nurture-tests-pass
  EVIDENCE: pending

- [ ] G4: nurture-specific regression tests pass
  CHECK: npm test -- --reporter=dot src/lib/__tests__/nurture-workflow.test.ts && printf 'nurture-workflow-tests-pass'
  EXPECT: nurture-workflow-tests-pass
  EVIDENCE: pending
