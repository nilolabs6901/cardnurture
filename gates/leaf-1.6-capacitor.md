# Gates: Capacitor hosted shell

Scope: Capacitor configuration/dependencies and a hosted-web mobile shell without moving the Next.js server into the client.

- [x] G1: Capacitor configuration and hosted shell exist
  CHECK: test -s capacitor.config.ts && test -s capacitor-web/index.html && grep -n '@capacitor' package.json
  EXPECT: @capacitor
  EVIDENCE: Capacitor shell/config files are present and package.json lists the Capacitor packages.

- [x] G2: Capacitor config uses HTTPS-compatible Android settings and an explicit hosted URL strategy
  CHECK: grep -nE 'androidScheme|CAPACITOR_SERVER_URL|server.url' capacitor.config.ts
  EXPECT: androidScheme
  EVIDENCE: CAPACITOR_SERVER_URL is validated as HTTPS; androidScheme is https; cleartext is false.

- [x] G3: Capacitor CLI can inspect the project
  CHECK: npx cap doctor
  EXPECT: Capacitor
  EVIDENCE: Capacitor doctor reports CLI/core/iOS/Android 8.5.0.

- [ ] G4: native platform generation is completed or honestly documented as blocked by missing SDKs
  EVIDENCE: pending

ABANDON: G4 Native platform generation is blocked on this Mac: full Xcode/iPhoneOS SDK and Android Java/SDK tooling are unavailable. The hosted Capacitor foundation is complete; run `npx cap add ios` or `npx cap add android` after installing the corresponding SDK.
