# Gates: PWA packaging

Scope: valid install metadata, icons, safe service-worker shell caching, and mobile metadata.

- [x] G1: manifest has valid install metadata and icon set
  CHECK: node scripts/verify-pwa.mjs
  EXPECT: pwa verification: PASS
  EVIDENCE: icons=PASS | pwa verification: PASS

- [x] G2: service worker is registered and does not cache authenticated API responses
  CHECK: grep -q "navigator.serviceWorker.register" src/components/ServiceWorkerRegistration.tsx && grep -q "startsWith('/api/')" public/sw.js && printf 'service-worker-contract-pass'
  EXPECT: service-worker-contract-pass
  EVIDENCE: service-worker-contract-pass

- [x] G3: PWA assets include 192px, 512px, maskable, and Apple touch icons
  CHECK: node scripts/verify-pwa.mjs
  EXPECT: icons=PASS
  EVIDENCE: icons=PASS | pwa verification: PASS

- [x] G4: PWA verification test passes
  CHECK: npm test -- --reporter=dot src/lib/__tests__/pwa.test.ts && printf 'pwa-tests-pass'
  EXPECT: pwa-tests-pass
  EVIDENCE: [2m   Duration [22m 67ms[2m (transform 12ms, setup 0ms, import 16ms, tests 2ms, environment 0ms)[22m | pwa-tests-pass
