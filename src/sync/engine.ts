// Sync orchestrator. Local-first: local state is the source of truth,
// the active target (file or cloud) is the exchange medium. The engine
// owns the loop — pull, merge, apply remote wins, push — and is agnostic
// to transport and encryption, which each target handles.
//
// - last-write-wins per day-key with tombstones (see merge.ts)
// - offline-first: edits queue in daybook.syncPending and push when the
//   target is reachable; remote changes are picked up by polling
// - concurrent same-day edits surface as conflicts in Settings
// - a push that races another device (version conflict) re-pulls and
//   re-merges, so no write is silently lost

import { getStore } from '../data/store';
import { mergeSync, type SyncSide, type SyncSettings } from './merge';
import { type SyncTarget, VersionConflictError } from './target';
import { FileSyncTarget, fileSyncSupported } from './fileTarget';
import { CloudSyncTarget, DEFAULT_ENDPOINT } from './cloudTarget';

export interface SyncStatus {
  fileSupported: boolean; // File System Access available (Chromium)
  kind: 'file' | 'cloud' | null;
  label: string; // file name or cloud host
  connected: boolean;
  needsPermission: boolean; // file handle needs a re-grant
  syncing: boolean;
  error: string | null;
}

const POLL_MS = 30_000;
const PUSH_DEBOUNCE_MS = 2_500;
const MAX_CONFLICT_RETRIES = 3;

const emptySettings = (local: SyncSide): SyncSettings => ({
  goal: local.settings.goal,
  name: local.settings.name,
  updatedAt: 0,
});

export class SyncEngine {
  private target: SyncTarget | null = null;
  private status: SyncStatus = {
    fileSupported: fileSyncSupported(),
    kind: null,
    label: '',
    connected: false,
    needsPermission: false,
    syncing: false,
    error: null,
  };
  private listeners = new Set<() => void>();
  private lastSeenToken: string | number = 0;
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

  cloudEndpointDefault(): string {
    return DEFAULT_ENDPOINT;
  }

  private setStatus(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  async start() {
    if (this.started) return;
    this.started = true;
    // Restore whichever backend was connected (cloud takes precedence).
    try {
      const restored = (await CloudSyncTarget.restore()) || (await FileSyncTarget.restore());
      if (restored) await this.adopt(restored, false);
    } catch {
      // Nothing restorable — stay disconnected.
    }

    const store = getStore();
    store.subscribe(() => {
      if (!this.target || this.status.needsPermission) return;
      if (Object.keys(store.getSnapshot().pendingSync).length === 0) return;
      clearTimeout(this.pushTimer);
      this.pushTimer = setTimeout(() => this.syncNow(), PUSH_DEBOUNCE_MS);
    });

    this.pollTimer = setInterval(() => this.pollRemote(), POLL_MS);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.pollRemote();
      });
    }
  }

  stop() {
    clearInterval(this.pollTimer);
    clearTimeout(this.pushTimer);
  }

  // ── Connect / disconnect ────────────────────────────────────

  async connectFileNew() {
    const t = await FileSyncTarget.createNew();
    if (t) await this.adopt(t, true);
  }
  async connectFileExisting() {
    const t = await FileSyncTarget.openExisting();
    if (t) await this.adopt(t, true);
  }
  async connectCloudNew(endpoint: string) {
    await this.adopt(await CloudSyncTarget.createNew(endpoint), true);
  }
  async connectCloudWithKey(syncKey: string, endpoint: string) {
    await this.adopt(await CloudSyncTarget.connectWithKey(syncKey, endpoint), true);
  }

  // The copyable sync key, when a cloud target is active.
  cloudSyncKey(): string | null {
    return this.target instanceof CloudSyncTarget ? this.target.syncKey() : null;
  }

  private async adopt(target: SyncTarget, resetCursor: boolean) {
    this.target = target;
    this.lastSeenToken = 0;
    if (resetCursor) getStore().setSyncMeta({ lastSyncAt: 0 });
    this.setStatus({
      kind: target.kind,
      label: target.label(),
      connected: true,
      needsPermission: false,
      error: null,
    });
    await this.syncNow();
  }

  async disconnect() {
    if (this.target) await this.target.teardown();
    this.target = null;
    getStore().setSyncMeta({ lastSyncAt: 0, fileName: null });
    this.setStatus({ kind: null, label: '', connected: false, needsPermission: false, error: null });
  }

  // Re-grant file permission after a reload (needs a user gesture).
  async reconnect() {
    if (!this.target) return;
    const access = await this.target.ensureAccess();
    this.setStatus({ needsPermission: access === 'needs-permission' });
    if (access === 'granted') await this.syncNow();
  }

  private async pollRemote() {
    if (!this.target || this.status.syncing || this.status.needsPermission) return;
    // A hidden tab has nobody to show remote changes to, and polling it
    // burns quota and battery for nothing. Becoming visible polls again
    // immediately (see the visibilitychange listener in start()).
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    try {
      const token = await this.target.remoteToken();
      const pending = Object.keys(getStore().getSnapshot().pendingSync).length > 0;
      if (token !== this.lastSeenToken || pending) await this.syncNow();
    } catch {
      // Offline / transient — the queue keeps everything for next time.
    }
  }

  // ── The sync loop ───────────────────────────────────────────

  async syncNow() {
    const store = getStore();
    if (!this.target || this.status.syncing || store.getSnapshot().locked) return;

    const access = await this.target.ensureAccess();
    if (access !== 'granted') {
      this.setStatus({ needsPermission: access === 'needs-permission', error: access === 'error' ? 'Sync unavailable.' : null });
      return;
    }

    this.setStatus({ syncing: true, error: null });
    try {
      let attempt = 0;
      // Retry loop: a version conflict means another device wrote between
      // our pull and push — re-pull and re-merge.
      for (;;) {
        const snapshotAt = Date.now();
        const local = store.syncSnapshot();
        const pulled = await this.target.pull();
        const remote = pulled.side ?? { days: {}, hours: {}, settings: emptySettings(local) };

        const merged = mergeSync(local, remote, store.getSnapshot().syncMeta.lastSyncAt, snapshotAt);

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

        const mergedSide: SyncSide = { days: merged.days, hours: merged.hours, settings: merged.settings };
        let token = pulled.version;
        const changed = JSON.stringify(mergedSide) !== JSON.stringify(remote);
        if (changed) {
          try {
            token = await this.target.push(mergedSide, pulled.version);
          } catch (err) {
            if (err instanceof VersionConflictError && attempt < MAX_CONFLICT_RETRIES) {
              attempt++;
              continue; // remote moved; re-pull and re-merge
            }
            throw err;
          }
        }

        this.lastSeenToken = token;
        store.clearPending(snapshotAt);
        store.setSyncMeta({ lastSyncAt: snapshotAt });
        this.setStatus({ syncing: false });
        return;
      }
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
