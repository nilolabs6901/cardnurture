# Gates: integration and release (integration)

Scope: all leaves are merged into one working CardNurture release.

- [ ] N1: every child leaf gate is fully checked
  CHECK: node /Users/niloagency/.hermes/skills/unlazy/scripts/gate-check.mjs --status gates/leaf-1.1-nurture.md gates/leaf-1.2-deployment.md gates/leaf-1.3-activity.md gates/leaf-1.4-mobile-scan.md gates/leaf-1.5-pwa.md gates/leaf-1.6-capacitor.md
  EXPECT: ALL MET
  EVIDENCE: pending

- [ ] N2: interfaces match and TypeScript/build checks pass
  CHECK: rm -rf .next && npm run build && printf 'build-pass'
  EXPECT: build-pass
  EVIDENCE: pending

- [ ] N3: full test suite passes
  CHECK: npm test -- --reporter=dot && printf 'test-suite-pass'
  EXPECT: test-suite-pass
  EVIDENCE: pending

- [ ] N4: mobile/PWA static verification passes
  CHECK: node scripts/verify-pwa.mjs
  EXPECT: pwa verification: PASS
  EVIDENCE: pending

- [ ] N5: repository diff is whitespace-clean
  CHECK: git diff --check
  EXPECT: 
  EVIDENCE: pending
