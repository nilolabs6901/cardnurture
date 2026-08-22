# Plan: CardNurture release hardening and mobile app

Depth: tree 4   Mode: orchestrated
Budget note: This is a multi-surface product hardening pass. Work is split into disjoint leaves and integrated with fresh tests/build verification.

## Contract

Decided before fan-out:

- **Database contract:** PostgreSQL remains the system of record. `.env.example`, README, and validation commands must use `postgresql://` URLs. Do not rewrite the schema to SQLite.
- **Nurture contract:** nurture UI and API operate on `EmailDraft.type = "nurture"`; draft edits use `/api/drafts/:id`; due status is based on nurture drafts and explicit schedule fields.
- **Activity contract:** introduce a durable `Activity` model linked to `Contact`, with `type`, `channel`, `outcome`, `notes`, `occurredAt`, and optional `nextActionAt`. Activity API routes must scope through the authenticated user's contact ownership.
- **Mobile scan contract:** the active upload page uses one shared upload component with camera capture, consistent size/type validation, HEIC/HEIF conversion, and resumable local scan state. Existing route/API shapes remain compatible.
- **PWA contract:** keep the app server-rendered and same-origin. Add valid icons, manifest metadata, service-worker shell caching only, and no caching of authenticated API responses.
- **Capacitor contract:** add a hosted-web Capacitor shell and configuration without moving Prisma/OCR into the client bundle. Native platform generation is attempted only when the installed SDK supports it; missing SDKs are recorded as blockers rather than fabricated as complete.
- **Ownership:**
  - `gates/leaf-1.1-nurture.md`: `src/app/contacts/nurture/page.tsx`, `src/app/api/contacts/nurture-status/route.ts`, nurture-specific tests.
  - `gates/leaf-1.2-deployment.md`: `.env.example`, `README.md`, deployment/config docs only.
  - `gates/leaf-1.3-activity.md`: Prisma Activity model/migration, activity API, activity components, contact detail integration, activity tests.
  - `gates/leaf-1.4-mobile-scan.md`: shared upload component, active upload page integration, scan persistence utilities, scan tests.
  - `gates/leaf-1.5-pwa.md`: manifest, service worker, PWA registration, icons/assets, mobile metadata/styles, PWA verification script.
  - `gates/leaf-1.6-capacitor.md`: Capacitor dependencies/config, `capacitor-web/`, native platform projects if toolchains permit, Capacitor verification.
  - No leaf edits `package.json`/`package-lock.json` except leaf 1.6. No leaf edits `prisma/schema.prisma` except leaf 1.3.
- **Testing contract:** every behavior change gets a failing test or focused regression test first. Leaf agents run targeted tests; the driver reruns all leaf checks and the full suite/build after integration.
- **No security regression:** never log secrets or raw OCR/PII; all new mutating routes require authenticated ownership checks.

## Tree

- 1 CardNurture release hardening and mobile app
  - 1.1 Nurture workflow repair .......... `gates/leaf-1.1-nurture.md`
  - 1.2 PostgreSQL deployment alignment .. `gates/leaf-1.2-deployment.md`
  - 1.3 Activity and next-action timeline  `gates/leaf-1.3-activity.md`
  - 1.4 Mobile capture and scan recovery .. `gates/leaf-1.4-mobile-scan.md`
  - 1.5 PWA packaging .................... `gates/leaf-1.5-pwa.md`
  - 1.6 Capacitor hosted shell ........... `gates/leaf-1.6-capacitor.md`
  - 1.7 Integration and release gates .... `gates/node-1.7-integration.md`

## Status log

- 2026-08-22: plan written, contract and file ownership fixed before fan-out
