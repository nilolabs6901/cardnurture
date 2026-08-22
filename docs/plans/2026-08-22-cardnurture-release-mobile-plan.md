# CardNurture release hardening and mobile app implementation plan

> **For Hermes:** Use the unlazy gate ledgers and the TDD cycle while implementing each leaf. The driver must rerun every leaf check after integration.

**Goal:** Repair nurture correctness, align PostgreSQL deployment, add activity/next-action tracking, make mobile scanning resumable, finish the PWA, and add a Capacitor hosted shell.

**Architecture:** Keep the existing Next.js App Router and PostgreSQL/Prisma backend as the system of record. Add durable activity and scan state behind small interfaces, keep the browser/PWA same-origin, and make Capacitor a hosted-web shell rather than bundling Node/Prisma/OCR into the native client.

**Tech Stack:** Next.js 14, React 18, TypeScript, Prisma 5/PostgreSQL, Vitest, IndexedDB, service worker, Capacitor.

---

## Execution order

1. Nurture workflow repair — `gates/leaf-1.1-nurture.md`
2. PostgreSQL deployment alignment — `gates/leaf-1.2-deployment.md`
3. Activity and next-action timeline — `gates/leaf-1.3-activity.md`
4. Mobile capture and scan recovery — `gates/leaf-1.4-mobile-scan.md`
5. PWA packaging — `gates/leaf-1.5-pwa.md`
6. Capacitor hosted shell — `gates/leaf-1.6-capacitor.md`
7. Integration/release verification — `gates/node-1.7-integration.md` and root `GATES.md`

Each leaf owns only the files declared in `PLAN.md`, writes tests before production behavior, runs its own gates, and records evidence. The driver re-runs the checks and resolves cross-leaf integration issues.
