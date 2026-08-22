# Gates: Capacitor hosted shell

Scope: Capacitor configuration/dependencies and a hosted-web mobile shell without moving the Next.js server into the client.

- [x] G1: Capacitor configuration and hosted shell exist
  CHECK: test -s capacitor.config.ts && test -s capacitor-web/index.html && grep -n '@capacitor' package.json
  EXPECT: @capacitor
  EVIDENCE: 2026-08-22: PASS; shell/config files are non-empty and package.json lists @capacitor/core, @capacitor/cli, @capacitor/ios, and @capacitor/android.

- [x] G2: Capacitor config uses HTTPS-compatible Android settings and an explicit hosted URL strategy
  CHECK: grep -nE 'androidScheme|CAPACITOR_SERVER_URL|server.url' capacitor.config.ts
  EXPECT: androidScheme
  EVIDENCE: 2026-08-22: PASS; CAPACITOR_SERVER_URL is validated as HTTPS, server.url is set only when configured, androidScheme is https, and cleartext is false.

- [x] G3: Capacitor CLI can inspect the project
  CHECK: npx cap doctor
  EXPECT: Capacitor
  EVIDENCE: 2026-08-22: PASS; `npx cap doctor` reported Capacitor CLI/core/iOS/Android 8.5.0.

- [ ] G4: native platform generation is completed or honestly documented as blocked by missing SDKs
  EVIDENCE: ABANDON (2026-08-22): Native generation was not run because the required SDKs are unavailable. iOS blocker: `xcodebuild -version` reports that Xcode is required while the active developer directory is `/Library/Developer/CommandLineTools`, and `xcrun --sdk iphoneos --show-sdk-path` reports that the iphoneos SDK cannot be located. Android blocker: `java -version` reports that no Java Runtime is installed, and `adb`, `sdkmanager`, and `gradle` are not available on PATH. The hosted Capacitor foundation remains usable; run `npx cap add ios` or `npx cap add android` after installing the corresponding SDK/toolchain.
