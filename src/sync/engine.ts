// File sync engine: syncs the journal to a user-owned JSON file via
// the File System Access API (no server — put the file in an iCloud/
// Dropbox/Drive folder for multi-device sync). Local-first: local
// state is the source of truth, the file is the exchange medium.
//
// - last-write-wins per day-key with tombstones (see merge.ts)
// - offline-first: edits queue in daybook.syncPending and push when
//   the file is reachable again; remote changes are picked up by
//   polling the file's lastModified
// - concurrent edits to the same day surface as conflicts in Settings

import { getStore } from '../data/store';
import { mergeSync, type SyncSide, type SyncSettings } from './merge';

// Minimal typings — the File System Access API is Chromium-only and
// not fully covered by TS's dom lib.
interface FSFileHandle {
  readonly name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
  queryPermission(opts: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission(opts: { mode: 'readwrite' }): Promise<PermissionState>;
}
declare global {
  interface Window {
    showSaveFilePicker?: (opts?: unknown) => Promise<FSFileHandle>;
    showOpenFilePicker?: (opts?: unknown) => Promise<FSFileHandle[]>;
  }
}

interface SyncDocOnDisk {
  app: 'oscar-sync';
  version: 1;
  updatedAt: number;
  deviceId: string;
  payload: unknown; // SyncSide, possibly AES-GCM-sealed when a passcode is set
}

export interface SyncStatus {
  supported: boolean;
  connected: boolean;
  needsPermission: boolean;
  syncing: boolean;
  error: string | null;
}

// ── IndexedDB persistence for the file handle ─────────────────
// (handles are structured-cloneable but can't live in localStorage)

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('oscar-sync', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<unknown> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const req = db.transaction('handles').objectStore('handles').get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Engine ────────────────────────────────────────────────────

const POLL_MS = 30_000;
const PUSH_DEBOUNCE_MS = 2_500;

export class SyncEngine {
  private handle: FSFileHandle | null = null;
  private status: SyncStatus = {
    supported: typeof window !== 'undefined' && !!window.showSaveFilePicker,
    connected: false,
    needsPermission: false,
    syncing: false,
    error: null,
  };
  private listeners = new Set<() => void>();
  private lastSeenModified = 0;
  private pushTimer: ReturnType<typeof setTimeout> | undefined;
  private pollTimer: ReturnType<typeof setInterval> | undefined;
  private started = false;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getStatus = (): SyncStatus => this.status;

  private setStatus(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  async start() {
    if (this.started || !this.status.supported) return;
    this.started = true;
    try {
      const stored = (await idbGet('file')) as FSFileHandle | undefined;
      if (stored) {
        this.handle = stored;
        const perm = await stored.queryPermission({ mode: 'readwrite' });
        this.setStatus({ connected: true, needsPermission: perm !== 'granted' });
        if (perm === 'granted') this.syncNow();
      }
    } catch {
      // No stored handle — stay disconnected.
    }
    // Push soon after local edits.
    const store = getStore();
    store.subscribe(() => {
      if (!this.handle || this.status.needsPermission) return;
      if (Object.keys(store.getSnapshot().pendingSync).length === 0) return;
      clearTimeout(this.pushTimer);
      this.pushTimer = setTimeout(() => this.syncNow(), PUSH_DEBOUNCE_MS);
    });
    // Poll for remote changes; also sync when the tab regains focus.
    this.pollTimer = setInterval(() => this.pollRemote(), POLL_MS);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.pollRemote();
    });
  }

  stop() {
    clearInterval(this.pollTimer);
    clearTimeout(this.pushTimer);
  }

  // Pick where the sync file lives (creates it if needed).
  async connectNew() {
    if (!window.showSaveFilePicker) return;
    const handle = await window.showSaveFilePicker({
      suggestedName: 'oscar-sync.json',
      types: [{ description: 'Oscar sync file', accept: { 'application/json': ['.json'] } }],
    });
    await this.adopt(handle);
  }

  async connectExisting() {
    if (!window.showOpenFilePicker) return;
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'Oscar sync file', accept: { 'application/json': ['.json'] } }],
    });
    await this.adopt(handle);
  }

  private async adopt(handle: FSFileHandle) {
    this.handle = handle;
    await idbSet('file', handle);
    getStore().setSyncMeta({ fileName: handle.name, lastSyncAt: 0 });
    this.setStatus({ connected: true, needsPermission: false, error: null });
    await this.syncNow();
  }

  async disconnect() {
    this.handle = null;
    await idbSet('file', undefined);
    getStore().setSyncMeta({ fileName: null, lastSyncAt: 0 });
    this.setStatus({ connected: false, needsPermission: false, error: null });
  }

  // Re-grant permission after a reload (must run in a user gesture).
  async reconnect() {
    if (!this.handle) return;
    const perm = await this.handle.requestPermission({ mode: 'readwrite' });
    this.setStatus({ needsPermission: perm !== 'granted' });
    if (perm === 'granted') await this.syncNow();
  }

  private async pollRemote() {
    if (!this.handle || this.status.syncing || this.status.needsPermission) return;
    try {
      const file = await this.handle.getFile();
      const store = getStore();
      const pending = Object.keys(store.getSnapshot().pendingSync).length > 0;
      if (file.lastModified !== this.lastSeenModified || pending) await this.syncNow();
    } catch {
      // Offline volume / transient error — the queue keeps everything.
    }
  }

  async syncNow() {
    const store = getStore();
    if (!this.handle || this.status.syncing || store.getSnapshot().locked) return;
    const perm = await this.handle.queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted') {
      this.setStatus({ needsPermission: true });
      return;
    }
    this.setStatus({ syncing: true, error: null });
    try {
      const snapshotAt = Date.now();
      const local: SyncSide = store.syncSnapshot();

      // Read the remote side (an empty/new file is an empty side).
      let remote: SyncSide = { days: {}, hours: {}, settings: { goal: local.settings.goal, name: local.settings.name, updatedAt: 0 } };
      const file = await this.handle.getFile();
      const text = await file.text();
      if (text.trim()) {
        const doc = JSON.parse(text) as SyncDocOnDisk;
        if (doc.app !== 'oscar-sync') throw new Error('Chosen file is not an Oscar sync file.');
        remote = await store.openFromSync<SyncSide>(doc.payload);
      }

      const lastSyncAt = store.getSnapshot().syncMeta.lastSyncAt;
      const merged = mergeSync(local, remote, lastSyncAt, snapshotAt);

      // Apply remote wins locally (loser text is preserved in trash).
      if (merged.changedLocally.length || merged.hoursChangedLocally || merged.settingsChangedLocally) {
        const subset: typeof merged.days = {};
        merged.changedLocally.forEach((k) => (subset[k] = merged.days[k]));
        store.applyRemote(
          subset,
          merged.hoursChangedLocally ? merged.hours : null,
          merged.settingsChangedLocally ? (merged.settings as SyncSettings) : null,
        );
      }
      store.addSyncConflicts(merged.conflicts);

      // Write the merged doc back (skip when the file already matches).
      const payloadJson = JSON.stringify({ days: merged.days, hours: merged.hours, settings: merged.settings });
      const remoteJson = JSON.stringify(remote);
      if (payloadJson !== remoteJson) {
        const doc: SyncDocOnDisk = {
          app: 'oscar-sync',
          version: 1,
          updatedAt: snapshotAt,
          deviceId: store.deviceId(),
          payload: await store.sealForSync(JSON.parse(payloadJson)),
        };
        const writable = await this.handle.createWritable();
        await writable.write(JSON.stringify(doc, null, 2));
        await writable.close();
      }
      this.lastSeenModified = (await this.handle.getFile()).lastModified;

      store.clearPending(snapshotAt);
      store.setSyncMeta({ lastSyncAt: snapshotAt });
      this.setStatus({ syncing: false });
    } catch (err) {
      this.setStatus({
        syncing: false,
        error: err instanceof Error ? err.message : 'Sync failed — will retry.',
      });
    }
  }
}

let engine: SyncEngine | null = null;
export function getSyncEngine(): SyncEngine {
  if (!engine) engine = new SyncEngine();
  return engine;
}
