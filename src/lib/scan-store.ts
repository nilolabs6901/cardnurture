import type { BatchOcrItem, ParseResult } from '@/types';

export const ACTIVE_SCAN_ID = 'active';
export const MAX_SCAN_FILE_SIZE = 5 * 1024 * 1024;

const SCAN_DATABASE_NAME = 'cardnurture-scan-store';
const SCAN_DATABASE_VERSION = 1;
const SCAN_OBJECT_STORE = 'scans';
const FALLBACK_KEY_PREFIX = 'cardnurture:scan:';
const fallbackMemory = new Map<string, ScanRecord>();

const ACCEPTED_SCAN_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export type ScanKind = 'single' | 'batch';
export type ScanStatus = 'processing' | 'ready' | 'failed';

export interface ScanRecord {
  id: string;
  kind: ScanKind;
  status: ScanStatus;
  fileName?: string;
  result?: ParseResult;
  items?: BatchOcrItem[];
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export type ScanFileLike = {
  name: string;
  type: string;
  size: number;
};

/** Returns true for both HEIC and HEIF files, including browsers that omit MIME type. */
export function isHeifScanFile(file: Pick<ScanFileLike, 'name' | 'type'>): boolean {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();
  return (
    mimeType === 'image/heic' ||
    mimeType === 'image/heif' ||
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif')
  );
}

export function validateScanFile(file: ScanFileLike): string | null {
  const accepted = ACCEPTED_SCAN_MIME_TYPES.has(file.type.toLowerCase()) || isHeifScanFile(file);
  if (!accepted) {
    return `${file.name}: Unsupported file type. Use JPEG, PNG, WebP, HEIC, or HEIF.`;
  }

  if (file.size > MAX_SCAN_FILE_SIZE) {
    return `${file.name}: File too large. Maximum size is 5MB.`;
  }

  return null;
}

function cloneRecord(record: ScanRecord): ScanRecord {
  return JSON.parse(JSON.stringify(record)) as ScanRecord;
}

function isScanRecord(value: unknown): value is ScanRecord {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ScanRecord>;
  return (
    typeof candidate.id === 'string' &&
    (candidate.kind === 'single' || candidate.kind === 'batch') &&
    (candidate.status === 'processing' || candidate.status === 'ready' || candidate.status === 'failed') &&
    typeof candidate.createdAt === 'number' &&
    typeof candidate.updatedAt === 'number'
  );
}

/** Parses untrusted browser persistence without allowing malformed state into the UI. */
export function deserializeScanRecord(value: unknown): ScanRecord | null {
  if (typeof value === 'string') {
    try {
      return deserializeScanRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }

  return isScanRecord(value) ? cloneRecord(value) : null;
}

function getIndexedDb(): IDBFactory | null {
  try {
    return typeof indexedDB === 'undefined' ? null : indexedDB;
  } catch {
    return null;
  }
}

function getLocalStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function fallbackKey(id: string): string {
  return `${FALLBACK_KEY_PREFIX}${id}`;
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = factory.open(SCAN_DATABASE_NAME, SCAN_DATABASE_VERSION);
    } catch (error) {
      reject(error);
      return;
    }

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(SCAN_OBJECT_STORE)) {
        request.result.createObjectStore(SCAN_OBJECT_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open scan store'));
    request.onblocked = () => reject(new Error('Scan store is blocked'));
  });
}

async function putIndexedDb(record: ScanRecord, factory: IDBFactory): Promise<void> {
  const database = await openDatabase(factory);
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(SCAN_OBJECT_STORE, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Unable to save scan'));
      transaction.onabort = () => reject(transaction.error || new Error('Unable to save scan'));
      transaction.objectStore(SCAN_OBJECT_STORE).put(cloneRecord(record));
    });
  } finally {
    database.close();
  }
}

async function getIndexedDbRecord(id: string, factory: IDBFactory): Promise<ScanRecord | null> {
  const database = await openDatabase(factory);
  try {
    return await new Promise<ScanRecord | null>((resolve, reject) => {
      const transaction = database.transaction(SCAN_OBJECT_STORE, 'readonly');
      const request = transaction.objectStore(SCAN_OBJECT_STORE).get(id);
      request.onsuccess = () => resolve(deserializeScanRecord(request.result));
      request.onerror = () => reject(request.error || new Error('Unable to load scan'));
    });
  } finally {
    database.close();
  }
}

async function deleteIndexedDbRecord(id: string, factory: IDBFactory): Promise<void> {
  const database = await openDatabase(factory);
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(SCAN_OBJECT_STORE, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Unable to remove scan'));
      transaction.onabort = () => reject(transaction.error || new Error('Unable to remove scan'));
      transaction.objectStore(SCAN_OBJECT_STORE).delete(id);
    });
  } finally {
    database.close();
  }
}

function saveFallback(record: ScanRecord): void {
  const copy = cloneRecord(record);
  const storage = getLocalStorage();
  if (storage) {
    try {
      storage.setItem(fallbackKey(record.id), JSON.stringify(copy));
      return;
    } catch {
      // Private browsing and storage quotas can reject localStorage. Memory is the final fallback.
    }
  }
  fallbackMemory.set(record.id, copy);
}

function loadFallback(id: string): ScanRecord | null {
  const storage = getLocalStorage();
  if (storage) {
    try {
      const stored = storage.getItem(fallbackKey(id));
      if (stored !== null) {
        const parsed = deserializeScanRecord(stored);
        if (parsed) return parsed;
        storage.removeItem(fallbackKey(id));
      }
    } catch {
      // Continue to the in-memory fallback.
    }
  }

  const memoryRecord = fallbackMemory.get(id);
  return memoryRecord ? cloneRecord(memoryRecord) : null;
}

export async function saveScan(record: ScanRecord): Promise<void> {
  const copy = cloneRecord(record);
  const factory = getIndexedDb();
  if (factory) {
    try {
      await putIndexedDb(copy, factory);
      return;
    } catch {
      // IndexedDB can be disabled or unavailable even when the global exists.
    }
  }

  saveFallback(copy);
}

export async function loadScan(id: string = ACTIVE_SCAN_ID): Promise<ScanRecord | null> {
  const factory = getIndexedDb();
  if (factory) {
    try {
      const record = await getIndexedDbRecord(id, factory);
      if (record) return record;
    } catch {
      // Fall through to localStorage or memory.
    }
  }

  return loadFallback(id);
}

export async function removeScan(id: string = ACTIVE_SCAN_ID): Promise<void> {
  const factory = getIndexedDb();
  if (factory) {
    try {
      await deleteIndexedDbRecord(id, factory);
    } catch {
      // Still remove fallback state when IndexedDB is unavailable.
    }
  }

  const storage = getLocalStorage();
  if (storage) {
    try {
      storage.removeItem(fallbackKey(id));
    } catch {
      // Ignore storage cleanup failures.
    }
  }
  fallbackMemory.delete(id);
}
