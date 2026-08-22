# Gates: integration and release (integration)

Scope: all leaves are merged into one working CardNurture release.

- [x] N1: every child leaf gate is fully checked
  CHECK: node /Users/niloagency/.hermes/skills/unlazy/scripts/gate-check.mjs --status gates/leaf-1.1-nurture.md gates/leaf-1.2-deployment.md gates/leaf-1.3-activity.md gates/leaf-1.4-mobile-scan.md gates/leaf-1.5-pwa.md gates/leaf-1.6-capacitor.md
  EXPECT: ALL MET
  EVIDENCE: gates/leaf-1.6-capacitor.md: 4 gates | ALL MET (22 met, 1 abandoned)

- [x] N2: interfaces match and TypeScript/build checks pass
  CHECK: rm -rf .next && npm run build && printf 'build-pass'
  EXPECT: build-pass
  EVIDENCE: Contacts export error: Dynamic server usage: Route /api/contacts/export couldn't be rendered statically because it used `headers`. See more info here: https://nextjs.org/docs/messages/dynamic-server-e

- [x] N3: full test suite passes
  CHECK: npm test -- --reporter=dot && printf 'test-suite-pass'
  EXPECT: test-suite-pass
  EVIDENCE: [2m   Duration [22m 597ms[2m (transform 440ms, setup 0ms, import 1.59s, tests 53ms, environment 1ms)[22m | test-suite-pass

- [x] N4: mobile/PWA static verification passes
  CHECK: node scripts/verify-pwa.mjs
  EXPECT: pwa verification: PASS
  EVIDENCE: icons=PASS | pwa verification: PASS

- [x] N5: repository diff is whitespace-clean
  CHECK: git diff --check
  EXPECT: 
  EVIDENCE: (no output)
