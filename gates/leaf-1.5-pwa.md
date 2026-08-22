# Gates: PWA packaging

Scope: valid install metadata, icons, safe service-worker shell caching, and mobile metadata.

- [ ] G1: manifest has valid install metadata and icon set
  CHECK: node scripts/verify-pwa.mjs
  EXPECT: pwa verification: PASS
  EVIDENCE: pending

- [ ] G2: service worker is registered and does not cache authenticated API responses
  CHECK: grep -R -nE 'serviceWorker|navigator\.serviceWorker|/api/' src public/sw.js
  EXPECT: serviceWorker
  EVIDENCE: pending

- [ ] G3: PWA assets include 192px, 512px, maskable, and Apple touch icons
  CHECK: node scripts/verify-pwa.mjs
  EXPECT: icons=PASS
  EVIDENCE: pending

- [ ] G4: PWA verification test passes
  CHECK: npm test -- --reporter=dot src/lib/__tests__/pwa.test.ts
  EXPECT: passed
  EVIDENCE: pending
