# Gates: mobile capture and scan recovery

Scope: one active upload component with camera/HEIC handling and resumable scan state.

- [ ] G1: active upload uses camera capture and shared validation
  CHECK: grep -nE 'capture="environment"|FileUpload' src/app/upload/page.tsx src/components/FileUpload.tsx
  EXPECT: capture="environment"
  EVIDENCE: pending

- [ ] G2: HEIC and HEIF are consistently accepted or converted before OCR
  CHECK: grep -R -nE 'image/heif|heif|heic2any' src/app/upload src/components/FileUpload.tsx src/app/api/ocr/route.ts
  EXPECT: heif
  EVIDENCE: pending

- [ ] G3: scan state has durable local persistence and recovery behavior
  CHECK: grep -R -nE 'indexedDB|scan.*store|resume|recover' src/lib src/app/upload src/app/confirm && printf 'scan-recovery-pass'
  EXPECT: scan-recovery-pass
  EVIDENCE: pending

- [ ] G4: scan persistence tests pass
  CHECK: npm test -- --reporter=dot src/lib/__tests__/scan-store.test.ts && printf 'scan-store-tests-pass'
  EXPECT: scan-store-tests-pass
  EVIDENCE: pending
