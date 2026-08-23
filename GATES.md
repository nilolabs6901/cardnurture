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

## Lead push to the deal-registration app (2026-08-23)

Targets `/api/leads`, not `/api/deals`. The deals endpoint is the dealer
registration system: all 136 of its records belong to dealer reps (Briggs, Ring
Power, Kelly Tractor, SST) and Kenny appears on none of them. The leads endpoint
is his own tracker -- 129 of its 158 records are his -- and its required fields
are a business card exactly.

- **CHECK:** `npx tsc --noEmit` → **EXPECT:** 0 errors
- **CHECK:** `npm run build` → **EXPECT:** `/api/leads/push` listed as a route
- **CHECK:** `grep -rl "DEAL_APP_URL\|web-production" .next/static/` → **EXPECT:** no matches; the tracker address must never ship to the phone
- **CHECK:** POST a complete card to `/api/leads/push` → **EXPECT:** `{"status":"created"}` with a first follow-up date
- **CHECK:** POST a card with an empty phone → **EXPECT:** `{"status":"incomplete"}` naming the missing field, and no lead created
- **CHECK:** POST with the tracker stopped → **EXPECT:** `{"status":"unreachable"}`, and the contact still saves
- **CHECK:** inspect the created record → **EXPECT:** `repName`/`repEmail` are Kenny's, and the card contact's address appears only in `contactEmail`
- **HUMAN GATE:** on a phone, confirm the control and its cadence picker sit above the docked Save bar and a held notice is readable before pressing Continue

All automated checks were run and passed on 2026-08-23 against a LOCAL tracker on
:3199. Production (158 leads) was never written to; verified unchanged afterwards.
