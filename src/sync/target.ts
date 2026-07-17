// A sync backend behind one interface, so the merge engine is agnostic
// to where the exchange document actually lives (a user-owned file, or
// the cloud Worker). Each target owns its own transport AND encryption;
// pull() returns a decrypted SyncSide, push() takes a plain one.

import type { SyncSide } from './merge';

export interface SyncPull {
  side: SyncSide | null; // null when the remote is empty / brand-new
  version: string | number; // opaque token for optimistic concurrency
}

export interface SyncTarget {
  readonly kind: 'file' | 'cloud';
  label(): string;
  // Confirm we can read/write. The file target may need a user gesture
  // to re-grant permission after a reload.
  ensureAccess(): Promise<'granted' | 'needs-permission' | 'error'>;
  pull(): Promise<SyncPull>;
  // Write the merged document. `expectedVersion` is what the matching
  // pull() returned; a target that supports it rejects a stale write.
  push(side: SyncSide, expectedVersion: string | number): Promise<string | number>;
  // Cheap "did the remote change" probe for polling.
  remoteToken(): Promise<string | number>;
  teardown(): Promise<void>;
}

// Thrown by push() when the remote moved on since pull() — the engine
// re-pulls and re-merges.
export class VersionConflictError extends Error {
  constructor(public latestVersion: string | number) {
    super('version conflict');
    this.name = 'VersionConflictError';
  }
}

// ── IndexedDB — persists the file handle and the cloud config, which
//    can't live in localStorage. ────────────────────────────────────

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('oscar-sync', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const req = db.transaction('handles').objectStore('handles').get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite');
    if (value === undefined) tx.objectStore('handles').delete(key);
    else tx.objectStore('handles').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
