# Gates: CardNurture release hardening and mobile app

Scope: all requested items 2–7 are implemented, integrated, and verified without leaving the repository in a broken state.

- [ ] G1: every leaf gate is fully checked with evidence
  CHECK: node /Users/niloagency/.hermes/skills/unlazy/scripts/gate-check.mjs --status gates/leaf-1.1-nurture.md gates/leaf-1.2-deployment.md gates/leaf-1.3-activity.md gates/leaf-1.4-mobile-scan.md gates/leaf-1.5-pwa.md gates/leaf-1.6-capacitor.md
  EXPECT: ALL MET
  EVIDENCE: pending

- [ ] G2: full unit test suite passes
  CHECK: npm test -- --reporter=dot && printf 'test-suite-pass'
  EXPECT: test-suite-pass
  EVIDENCE: pending

- [ ] G3: clean production build passes
  CHECK: rm -rf .next && npm run build && printf 'build-pass'
  EXPECT: build-pass
  EVIDENCE: pending

- [ ] G4: Prisma validates against PostgreSQL configuration
  CHECK: DATABASE_URL='postgresql://cardnurture:***@localhost:5432/cardnurture?schema=public' npx prisma validate && printf 'prisma-validate-pass'
  EXPECT: prisma-validate-pass
  EVIDENCE: pending

- [ ] G5: repository diff is whitespace-clean and contains no tracked secrets
  CHECK: git diff --check && ! git grep -nE '^(TRIPO|LLM|SMTP|SEARCH|CRON|NEXTAUTH_SECRET).*=' -- ':!*.example' ':!*.md' && printf 'diff-secret-scan-pass'
  EXPECT: diff-secret-scan-pass
  EVIDENCE: pending

- [ ] G6: final release status is measured from the working tree
  EVIDENCE: pending
