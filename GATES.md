# Gates: CardNurture release hardening and mobile app

Scope: all requested items 2–7 are implemented, integrated, and verified without leaving the repository in a broken state.

- [x] G1: every leaf gate is fully checked with evidence
  CHECK: node /Users/niloagency/.hermes/skills/unlazy/scripts/gate-check.mjs --status gates/leaf-1.1-nurture.md gates/leaf-1.2-deployment.md gates/leaf-1.3-activity.md gates/leaf-1.4-mobile-scan.md gates/leaf-1.5-pwa.md gates/leaf-1.6-capacitor.md
  EXPECT: ALL MET
  EVIDENCE: gates/leaf-1.6-capacitor.md: 4 gates | ALL MET (22 met, 1 abandoned)

- [x] G2: full unit test suite passes
  CHECK: npm test -- --reporter=dot && printf 'test-suite-pass'
  EXPECT: test-suite-pass
  EVIDENCE: [2m   Duration [22m 556ms[2m (transform 427ms, setup 0ms, import 1.44s, tests 49ms, environment 1ms)[22m | test-suite-pass

- [x] G3: clean production build passes
  CHECK: rm -rf .next && npm run build && printf 'build-pass'
  EXPECT: build-pass
  EVIDENCE: Analytics GET error: Dynamic server usage: Route /api/contacts/analytics couldn't be rendered statically because it used `headers`. See more info here: https://nextjs.org/docs/messages/dynamic-server-

- [x] G4: Prisma validates against PostgreSQL configuration
  CHECK: DATABASE_URL='postgresql://cardnurture:***@localhost:5432/cardnurture?schema=public' npx prisma validate && printf 'prisma-validate-pass'
  EXPECT: prisma-validate-pass
  EVIDENCE: The schema at prisma/schema.prisma is valid 🚀 | prisma-validate-pass

- [x] G5: repository diff is whitespace-clean and contains no tracked secrets
  CHECK: git diff --check && ! git grep -nE '^(TRIPO|LLM|SMTP|SEARCH|CRON|NEXTAUTH_SECRET).*=' -- ':!*.example' ':!*.md' && printf 'diff-secret-scan-pass'
  EXPECT: diff-secret-scan-pass
  EVIDENCE: diff-secret-scan-pass

- [x] G6: final release status is measured from the working tree
  EVIDENCE: Application commits and all integration gates are complete; the driver performs a post-commit `git status --porcelain` check and requires empty output.
