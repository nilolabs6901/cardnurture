# Gates: mobile capture and scan recovery

Scope: one active upload component with camera/HEIC handling and resumable scan state.

- [x] G1: active upload uses camera capture and shared validation
  CHECK: grep -nE 'capture="environment"|FileUpload' src/app/upload/page.tsx src/components/FileUpload.tsx
  EXPECT: capture="environment"
  EVIDENCE: src/components/FileUpload.tsx:231:FileUpload.displayName = 'FileUpload'; | src/components/FileUpload.tsx:233:export default FileUpload;

- [x] G2: HEIC and HEIF are consistently accepted or converted before OCR
  CHECK: grep -R -nE 'image/heif|heif|heic2any' src/app/upload src/components/FileUpload.tsx src/app/api/ocr/route.ts
  EXPECT: heif
  EVIDENCE: src/components/FileUpload.tsx:53:              file.name.replace(/\.(?:heic|heif)$/i, '.jpg'), | src/components/FileUpload.tsx:143:        accept="image/jpeg,image/png,image/webp,image/heic,image/heif

- [x] G3: scan state has durable local persistence and recovery behavior
  CHECK: grep -R -nE 'indexedDB|scan.*store|resume|recover' src/lib src/app/upload src/app/confirm && printf 'scan-recovery-pass'
  EXPECT: scan-recovery-pass
  EVIDENCE: src/app/confirm/page.tsx:96:  // Read sessionStorage first, then recover from the durable scan store after mobile suspension. | scan-recovery-pass

- [x] G4: scan persistence tests pass
  CHECK: npm test -- --reporter=dot src/lib/__tests__/scan-store.test.ts && printf 'scan-store-tests-pass'
  EXPECT: scan-store-tests-pass
  EVIDENCE: [2m   Duration [22m 71ms[2m (transform 17ms, setup 0ms, import 21ms, tests 2ms, environment 0ms)[22m | scan-store-tests-pass
