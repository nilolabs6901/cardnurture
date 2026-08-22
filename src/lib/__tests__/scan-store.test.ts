import { afterEach, describe, expect, it } from 'vitest';
import {
  ACTIVE_SCAN_ID,
  loadScan,
  removeScan,
  saveScan,
  deserializeScanRecord,
  validateScanFile,
  type ScanRecord,
} from '../scan-store';

const originalIndexedDb = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');

const record: ScanRecord = {
  id: ACTIVE_SCAN_ID,
  kind: 'single',
  status: 'ready',
  result: {
    rawText: 'Ada Lovelace ada@example.com',
    fields: {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '',
      company: '',
      address: '',
    },
    confidence: {
      name: 'high',
      email: 'high',
      phone: 'none',
      company: 'none',
      address: 'none',
    },
  },
  createdAt: 1,
  updatedAt: 2,
};

afterEach(async () => {
  await removeScan(record.id);
  if (originalIndexedDb) {
    Object.defineProperty(globalThis, 'indexedDB', originalIndexedDb);
  } else {
    Reflect.deleteProperty(globalThis, 'indexedDB');
  }
});

describe('scan-store', () => {
  it('round-trips a scan when IndexedDB is unavailable using a browser-safe fallback', async () => {
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      value: undefined,
    });

    await saveScan(record);

    await expect(loadScan(record.id)).resolves.toEqual(record);
  });

  it('returns null for missing or malformed persisted state', async () => {
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      value: undefined,
    });

    expect(await loadScan('missing-scan')).toBeNull();
    expect(deserializeScanRecord('{"id":"bad"}')).toBeNull();
  });

  it('accepts HEIC and HEIF by MIME type or extension and enforces the 5MB limit', () => {
    expect(validateScanFile({ name: 'card.HEIC', type: '', size: 1024 })).toBeNull();
    expect(validateScanFile({ name: 'card.heif', type: 'image/heif', size: 1024 })).toBeNull();
    expect(validateScanFile({ name: 'card.jpg', type: 'image/jpeg', size: 5 * 1024 * 1024 })).toBeNull();
    expect(validateScanFile({ name: 'card.jpg', type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 })).toContain(
      'Maximum size is 5MB'
    );
    expect(validateScanFile({ name: 'card.pdf', type: 'application/pdf', size: 1024 })).toContain(
      'Unsupported file type'
    );
  });
});
