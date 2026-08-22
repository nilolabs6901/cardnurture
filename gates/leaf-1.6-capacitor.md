# Gates: Capacitor hosted shell

Scope: Capacitor configuration/dependencies and a hosted-web mobile shell without moving the Next.js server into the client.

- [ ] G1: Capacitor configuration and hosted shell exist
  CHECK: test -s capacitor.config.ts && test -s capacitor-web/index.html && grep -n '@capacitor' package.json
  EXPECT: @capacitor
  EVIDENCE: pending

- [ ] G2: Capacitor config uses HTTPS-compatible Android settings and an explicit hosted URL strategy
  CHECK: grep -nE 'androidScheme|CAPACITOR_SERVER_URL|server.url' capacitor.config.ts
  EXPECT: androidScheme
  EVIDENCE: pending

- [ ] G3: Capacitor CLI can inspect the project
  CHECK: npx cap doctor
  EXPECT: Capacitor
  EVIDENCE: pending

- [ ] G4: native platform generation is completed or honestly documented as blocked by missing SDKs
  EVIDENCE: pending
