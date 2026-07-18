// Oscar's storage: a typed store over localStorage with schema
// versioning, cross-tab sync, quota-safe saves, soft-delete trash and
// an optional passcode gate (entries encrypted at rest).

import { type DayKey, dateOf } from './dates';
import { words, type Entries, type Times, type Hours } from './selectors';
import {
  type LockMeta,
  type EncryptedBlob,
  isEncryptedBlob,
  makeLockMeta,
  verifyPasscode,
  encryptJson,
  decryptJson,
} from './crypto';
import type { SyncConflict, SyncDayRecord, SyncSettings } from '../sync/merge';

export const SCHEMA_VERSION = 2;

export type Theme = 'dark' | 'light';

export interface SessionRecord {
  dayKey: DayKey;
  start: number; // epoch ms
  end: number; // epoch ms
  words: number; // words added during the session
}

export interface TrashItem {
  text: string;
  deletedAt: number;
}

// Per-day edit metadata driving sync: when a day was last changed, and
// whether it's a tombstone (cleared day).
export interface DayMeta {
  updatedAt: number;
  deletedAt?: number;
}

export interface SyncFileMeta {
  deviceId: string;
  lastSyncAt: number;
  fileName: string | null;
}

export interface StoreState {
  entries: Entries;
  times: Times;
  hours: Hours;
  sessions: SessionRecord[];
  trash: Record<DayKey, TrashItem>;
  goal: number;
  theme: Theme;
  name: string;
  lockEnabled: boolean;
  locked: boolean; // lock enabled and not yet unlocked this session
  dayMeta: Record<DayKey, DayMeta>;
  pendingSync: Record<DayKey, number>; // dayKey → updatedAt awaiting sync
  settingsMeta: { updatedAt: number };
  syncConflicts: SyncConflict[];
  syncMeta: SyncFileMeta;
}

export interface SaveFailure {
  key: string;
  error: unknown;
}

export const KEYS = {
  entries: 'daybook.entries',
  times: 'daybook.times',
  hours: 'daybook.hours',
  goal: 'daybook.goal',
  theme: 'daybook.theme',
  name: 'daybook.name',
  sessions: 'daybook.sessions',
  trash: 'daybook.trash',
  lock: 'daybook.lock',
  schema: 'daybook.schemaVersion',
  dayMeta: 'daybook.dayMeta',
  pendingSync: 'daybook.syncPending',
  settingsMeta: 'daybook.settingsMeta',
  syncConflicts: 'daybook.syncConflicts',
  syncMeta: 'daybook.syncMeta',
} as const;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & {
  key?: Storage['key'];
  length?: number;
};

function readJson<T>(storage: StorageLike, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    if (raw == null) return fallback;
    return (JSON.parse(raw) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

export class Store {
  private storage: StorageLike;
  private state: StoreState;
  private listeners = new Set<() => void>();
  private saveFailureListeners = new Set<(f: SaveFailure) => void>();
  private lockKey: CryptoKey | null = null;
  private lockMeta: LockMeta | null = null;
  private encryptedAtRest: unknown = null; // raw blob while locked

  constructor(storage: StorageLike = window.localStorage) {
    this.storage = storage;
    this.state = this.loadAll();
    this.migrate();
    this.pruneTrash();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.onStorageEvent);
    }
  }

  // ── Loading & migration ─────────────────────────────────────

  private loadAll(): StoreState {
    const rawEntries = readJson<unknown>(this.storage, KEYS.entries, {});
    this.lockMeta = readJson<LockMeta | null>(this.storage, KEYS.lock, null);
    let entries: Entries = {};
    let locked = false;
    if (isEncryptedBlob(rawEntries)) {
      this.encryptedAtRest = rawEntries;
      locked = true;
    } else {
      entries = (rawEntries as Entries) || {};
    }
    return {
      entries,
      times: readJson<Times>(this.storage, KEYS.times, {}),
      hours: readJson<Hours>(this.storage, KEYS.hours, {}),
      sessions: readJson<SessionRecord[]>(this.storage, KEYS.sessions, []),
      trash: readJson<Record<DayKey, TrashItem>>(this.storage, KEYS.trash, {}),
      goal: parseInt(this.storage.getItem(KEYS.goal) || '300', 10) || 300,
      theme: (this.storage.getItem(KEYS.theme) as Theme) || 'dark',
      name: this.storage.getItem(KEYS.name) || '',
      lockEnabled: !!this.lockMeta,
      locked,
      dayMeta: readJson<Record<DayKey, DayMeta>>(this.storage, KEYS.dayMeta, {}),
      pendingSync: readJson<Record<DayKey, number>>(this.storage, KEYS.pendingSync, {}),
      settingsMeta: readJson<{ updatedAt: number }>(this.storage, KEYS.settingsMeta, { updatedAt: 0 }),
      syncConflicts: readJson<SyncConflict[]>(this.storage, KEYS.syncConflicts, []),
      syncMeta: readJson<SyncFileMeta>(this.storage, KEYS.syncMeta, {
        deviceId: '',
        lastSyncAt: 0,
        fileName: null,
      }),
    };
  }

  private migrate() {
    const hasData = this.storage.getItem(KEYS.entries) != null;
    let version = parseInt(this.storage.getItem(KEYS.schema) || '', 10);
    if (Number.isNaN(version)) version = hasData ? 0 : SCHEMA_VERSION;
    const migrations: Array<() => void> = [
      // 0 → 1: backfill times for entries written before time tracking
      // (~15 words/minute, matching the prototype's backfill).
      () => {
        const times = { ...this.state.times };
        let changed = false;
        Object.keys(this.state.entries).forEach((k) => {
          const w = words(this.state.entries[k]);
          if (w > 0 && !times[k]) {
            times[k] = Math.round((w / 15) * 60);
            changed = true;
          }
        });
        if (changed) {
          this.state = { ...this.state, times };
          this.persist(KEYS.times, times);
        }
      },
      // 1 → 2: backfill per-day edit metadata for sync. Legacy entries
      // get their calendar day (noon local) as the best-guess edit
      // time, so a fresher copy elsewhere wins silently on first sync.
      () => {
        const dayMeta = { ...this.state.dayMeta };
        let changed = false;
        Object.keys(this.state.entries).forEach((k) => {
          if (!dayMeta[k]) {
            dayMeta[k] = { updatedAt: dateOf(k).getTime() + 12 * 3600 * 1000 };
            changed = true;
          }
        });
        if (changed) {
          this.state = { ...this.state, dayMeta };
          this.persist(KEYS.dayMeta, dayMeta);
        }
      },
    ];
    for (let v = version; v < SCHEMA_VERSION; v++) migrations[v]?.();
    if (version !== SCHEMA_VERSION) this.safeSet(KEYS.schema, String(SCHEMA_VERSION));
  }

  // ── Cross-tab sync ──────────────────────────────────────────

  private onStorageEvent = (e: StorageEvent) => {
    if (!e.key || !e.key.startsWith('daybook.')) return;
    const fresh = this.loadAll();
    // Keep the unlocked entries if this tab already has the key and the
    // other tab wrote an encrypted blob.
    if (fresh.locked && this.lockKey && isEncryptedBlob(this.encryptedAtRest)) {
      decryptJson<Entries>(this.encryptedAtRest as never, this.lockKey)
        .then((entries) => this.setState({ ...fresh, entries, locked: false }))
        .catch(() => this.setState(fresh));
    } else {
      this.setState(fresh);
    }
  };

  // ── Persistence ─────────────────────────────────────────────

  private safeSet(key: string, value: string): boolean {
    try {
      this.storage.setItem(key, value);
      return true;
    } catch (error) {
      this.saveFailureListeners.forEach((fn) => fn({ key, error }));
      return false;
    }
  }

  private persist(key: string, value: unknown): boolean {
    return this.safeSet(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  private persistEntries(): Promise<void> {
    const entries = this.state.entries;
    if (this.lockKey) {
      return encryptJson(entries, this.lockKey)
        .then((blob) => {
          this.encryptedAtRest = blob;
          this.persist(KEYS.entries, blob);
        })
        .catch((error) => this.saveFailureListeners.forEach((fn) => fn({ key: KEYS.entries, error })));
    }
    this.persist(KEYS.entries, entries);
    return Promise.resolve();
  }

  // ── Subscription (React binding via useSyncExternalStore) ───

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  onSaveFailure = (fn: (f: SaveFailure) => void) => {
    this.saveFailureListeners.add(fn);
    return () => {
      this.saveFailureListeners.delete(fn);
    };
  };

  getSnapshot = (): StoreState => this.state;

  private setState(next: StoreState) {
    this.state = next;
    this.listeners.forEach((fn) => fn());
  }

  // ── Mutations ───────────────────────────────────────────────

  // Stamp a day's edit metadata and enqueue it for sync.
  private touchDay(key: DayKey, deletedAt?: number): Pick<StoreState, 'dayMeta' | 'pendingSync'> {
    const now = Date.now();
    const dayMeta = { ...this.state.dayMeta, [key]: deletedAt ? { updatedAt: now, deletedAt } : { updatedAt: now } };
    const pendingSync = { ...this.state.pendingSync, [key]: now };
    this.persist(KEYS.dayMeta, dayMeta);
    this.persist(KEYS.pendingSync, pendingSync);
    return { dayMeta, pendingSync };
  }

  private touchSettings(): { updatedAt: number } {
    const settingsMeta = { updatedAt: Date.now() };
    this.persist(KEYS.settingsMeta, settingsMeta);
    return settingsMeta;
  }

  setEntry(key: DayKey, text: string) {
    this.setState({ ...this.state, entries: { ...this.state.entries, [key]: text }, ...this.touchDay(key) });
    this.persistEntries();
  }

  addSeconds(key: DayKey, seconds: number) {
    const times = { ...this.state.times, [key]: (this.state.times[key] || 0) + seconds };
    this.setState({ ...this.state, times });
    this.persist(KEYS.times, times);
  }

  addHourWords(hour: number, delta: number) {
    const hours = { ...this.state.hours, [hour]: (this.state.hours[hour] || 0) + delta };
    this.setState({ ...this.state, hours });
    this.persist(KEYS.hours, hours);
  }

  setGoal(goal: number) {
    this.setState({ ...this.state, goal, settingsMeta: this.touchSettings() });
    this.persist(KEYS.goal, String(goal));
  }

  // Theme is a per-device preference and intentionally not synced.
  setTheme(theme: Theme) {
    this.setState({ ...this.state, theme });
    this.persist(KEYS.theme, theme);
  }

  setName(name: string) {
    this.setState({ ...this.state, name, settingsMeta: this.touchSettings() });
    this.persist(KEYS.name, name);
  }

  addSession(rec: SessionRecord) {
    const sessions = [...this.state.sessions, rec];
    this.setState({ ...this.state, sessions });
    this.persist(KEYS.sessions, sessions);
  }

  // Soft delete: the entry moves to the trash (restorable) and leaves
  // a tombstone so the deletion propagates through sync.
  softDeleteDay(key: DayKey) {
    const text = this.state.entries[key];
    if (!text) return;
    const entries = { ...this.state.entries };
    delete entries[key];
    const trash = { ...this.state.trash, [key]: { text, deletedAt: Date.now() } };
    this.setState({ ...this.state, entries, trash, ...this.touchDay(key, Date.now()) });
    this.persistEntries();
    this.persist(KEYS.trash, trash);
  }

  // Permanently drop one day from the trash. The sync tombstone lives in
  // dayMeta, not here, so purging never resurrects the day on another device.
  purgeDay(key: DayKey) {
    if (!this.state.trash[key]) return;
    const trash = { ...this.state.trash };
    delete trash[key];
    this.setState({ ...this.state, trash });
    this.persist(KEYS.trash, trash);
  }

  emptyTrash() {
    if (Object.keys(this.state.trash).length === 0) return;
    this.setState({ ...this.state, trash: {} });
    this.persist(KEYS.trash, {});
  }

  // Trash is a recovery buffer, not an archive: entries older than
  // TRASH_TTL_DAYS are dropped on load so it can't grow without bound.
  private pruneTrash() {
    const cutoff = Date.now() - Store.TRASH_TTL_DAYS * 86400000;
    const kept: Record<DayKey, TrashItem> = {};
    let dropped = 0;
    for (const [k, item] of Object.entries(this.state.trash)) {
      if (item.deletedAt >= cutoff) kept[k] = item;
      else dropped++;
    }
    if (dropped > 0) {
      this.state = { ...this.state, trash: kept };
      this.persist(KEYS.trash, kept);
    }
  }

  restoreDay(key: DayKey) {
    const item = this.state.trash[key];
    if (!item) return;
    const trash = { ...this.state.trash };
    delete trash[key];
    // Don't clobber text written since the delete.
    const existing = this.state.entries[key];
    const entries = { ...this.state.entries, [key]: existing || item.text };
    this.setState({ ...this.state, entries, trash, ...this.touchDay(key) });
    this.persistEntries();
    this.persist(KEYS.trash, trash);
  }

  replaceData(patch: Partial<Pick<StoreState, 'entries' | 'times' | 'hours' | 'sessions'>>) {
    let stamps: Partial<StoreState> = {};
    if (patch.entries) {
      // Imported/changed days need fresh edit metadata so sync picks
      // them up.
      const now = Date.now();
      const dayMeta = { ...this.state.dayMeta };
      const pendingSync = { ...this.state.pendingSync };
      Object.keys(patch.entries).forEach((k) => {
        if (patch.entries![k] !== this.state.entries[k]) {
          dayMeta[k] = { updatedAt: now };
          pendingSync[k] = now;
        }
      });
      this.persist(KEYS.dayMeta, dayMeta);
      this.persist(KEYS.pendingSync, pendingSync);
      stamps = { dayMeta, pendingSync };
    }
    this.setState({ ...this.state, ...patch, ...stamps });
    if (patch.entries) this.persistEntries();
    if (patch.times) this.persist(KEYS.times, patch.times);
    if (patch.hours) this.persist(KEYS.hours, patch.hours);
    if (patch.sessions) this.persist(KEYS.sessions, patch.sessions);
  }

  // ── Sync support ────────────────────────────────────────────

  // Local state as the merge module's shape. Tombstones come from
  // dayMeta (cleared days keep no entry text).
  syncSnapshot(): { days: Record<DayKey, SyncDayRecord>; hours: Hours; settings: SyncSettings } {
    const days: Record<DayKey, SyncDayRecord> = {};
    const keys = new Set([...Object.keys(this.state.entries), ...Object.keys(this.state.dayMeta)]);
    keys.forEach((k) => {
      const meta = this.state.dayMeta[k];
      const text = this.state.entries[k] || '';
      if (!meta && !words(text)) return;
      days[k] = {
        text: meta?.deletedAt ? '' : text,
        time: this.state.times[k] || 0,
        updatedAt: meta?.updatedAt ?? 0,
        ...(meta?.deletedAt ? { deletedAt: meta.deletedAt } : {}),
      };
    });
    return {
      days,
      hours: this.state.hours,
      settings: { goal: this.state.goal, name: this.state.name, updatedAt: this.state.settingsMeta.updatedAt },
    };
  }

  // Apply the merged remote-winning records. Never enqueues pending
  // (this data is already in the file), and local text overwritten by
  // a remote win or tombstone is preserved in the trash.
  applyRemote(
    days: Record<DayKey, SyncDayRecord>,
    hours: Hours | null,
    settings: SyncSettings | null,
  ) {
    const entries = { ...this.state.entries };
    const times = { ...this.state.times };
    const dayMeta = { ...this.state.dayMeta };
    let trash = this.state.trash;
    Object.keys(days).forEach((k) => {
      const rec = days[k];
      const localText = entries[k];
      if (rec.deletedAt) {
        if (localText && localText !== rec.text) {
          trash = { ...trash, [k]: { text: localText, deletedAt: rec.deletedAt } };
        }
        delete entries[k];
        dayMeta[k] = { updatedAt: rec.updatedAt, deletedAt: rec.deletedAt };
      } else {
        entries[k] = rec.text;
        dayMeta[k] = { updatedAt: rec.updatedAt };
      }
      times[k] = Math.max(times[k] || 0, rec.time);
    });
    const next: StoreState = {
      ...this.state,
      entries,
      times,
      dayMeta,
      trash,
      ...(hours ? { hours } : {}),
      ...(settings
        ? { goal: settings.goal, name: settings.name, settingsMeta: { updatedAt: settings.updatedAt } }
        : {}),
    };
    this.setState(next);
    this.persistEntries();
    this.persist(KEYS.times, times);
    this.persist(KEYS.dayMeta, dayMeta);
    this.persist(KEYS.trash, trash);
    if (hours) this.persist(KEYS.hours, hours);
    if (settings) {
      this.persist(KEYS.goal, String(settings.goal));
      this.persist(KEYS.name, settings.name);
      this.persist(KEYS.settingsMeta, { updatedAt: settings.updatedAt });
    }
  }

  // Drop pending entries that were captured by a sync snapshot taken
  // at `snapshotAt` — edits made since then stay queued.
  clearPending(snapshotAt: number) {
    const pendingSync: Record<DayKey, number> = {};
    Object.keys(this.state.pendingSync).forEach((k) => {
      if (this.state.pendingSync[k] > snapshotAt) pendingSync[k] = this.state.pendingSync[k];
    });
    this.setState({ ...this.state, pendingSync });
    this.persist(KEYS.pendingSync, pendingSync);
  }

  addSyncConflicts(conflicts: SyncConflict[]) {
    if (!conflicts.length) return;
    const merged = [...this.state.syncConflicts.filter((c) => !conflicts.some((n) => n.dayKey === c.dayKey)), ...conflicts];
    this.setState({ ...this.state, syncConflicts: merged });
    this.persist(KEYS.syncConflicts, merged);
  }

  dismissSyncConflict(dayKey: DayKey) {
    const syncConflicts = this.state.syncConflicts.filter((c) => c.dayKey !== dayKey);
    this.setState({ ...this.state, syncConflicts });
    this.persist(KEYS.syncConflicts, syncConflicts);
  }

  // Swap in the conflict's losing text; the currently-kept text goes
  // to the trash so nothing is lost.
  restoreConflictVersion(dayKey: DayKey) {
    const c = this.state.syncConflicts.find((x) => x.dayKey === dayKey);
    if (!c) return;
    const current = this.state.entries[dayKey];
    if (current && current !== c.loserText) {
      const trash = { ...this.state.trash, [dayKey]: { text: current, deletedAt: Date.now() } };
      this.persist(KEYS.trash, trash);
      this.state = { ...this.state, trash };
    }
    this.dismissSyncConflict(dayKey);
    this.setEntry(dayKey, c.loserText);
  }

  setSyncMeta(patch: Partial<SyncFileMeta>) {
    const syncMeta = { ...this.state.syncMeta, ...patch };
    this.setState({ ...this.state, syncMeta });
    this.persist(KEYS.syncMeta, syncMeta);
  }

  // Stable per-device id (created on first use).
  deviceId(): string {
    if (!this.state.syncMeta.deviceId) {
      this.setSyncMeta({ deviceId: Math.random().toString(36).slice(2, 10) });
    }
    return this.state.syncMeta.deviceId;
  }

  // Seal/open the sync payload with the passcode key when the lock is
  // enabled, so the sync file is as protected as localStorage.
  async sealForSync(value: unknown): Promise<unknown> {
    return this.lockKey ? encryptJson(value, this.lockKey) : value;
  }

  async openFromSync<T>(payload: unknown): Promise<T> {
    if (isEncryptedBlob(payload)) {
      if (!this.lockKey) throw new Error('Sync file is encrypted — unlock with your passcode first.');
      return decryptJson<T>(payload as EncryptedBlob, this.lockKey);
    }
    return payload as T;
  }

  // ── Passcode gate ───────────────────────────────────────────

  async enablePasscode(passcode: string) {
    const { meta, key } = await makeLockMeta(passcode);
    this.lockMeta = meta;
    this.lockKey = key;
    this.persist(KEYS.lock, meta);
    this.setState({ ...this.state, lockEnabled: true, locked: false });
    await this.persistEntries();
  }

  async disablePasscode(passcode: string): Promise<boolean> {
    if (!this.lockMeta) return true;
    const key = await verifyPasscode(passcode, this.lockMeta);
    if (!key) return false;
    this.lockMeta = null;
    this.lockKey = null;
    this.storage.removeItem(KEYS.lock);
    this.setState({ ...this.state, lockEnabled: false, locked: false });
    this.persist(KEYS.entries, this.state.entries);
    return true;
  }

  // Re-key: verify the current passcode, then re-encrypt entries under a
  // fresh key derived from the new one. Returns false if `current` is wrong.
  async changePasscode(current: string, next: string): Promise<boolean> {
    if (!this.lockMeta) return false;
    const ok = await verifyPasscode(current, this.lockMeta);
    if (!ok) return false;
    const { meta, key } = await makeLockMeta(next);
    this.lockMeta = meta;
    this.lockKey = key;
    this.persist(KEYS.lock, meta);
    await this.persistEntries(); // re-encrypts under the new key
    return true;
  }

  async unlock(passcode: string): Promise<boolean> {
    if (!this.lockMeta) return true;
    const key = await verifyPasscode(passcode, this.lockMeta);
    if (!key) return false;
    this.lockKey = key;
    let entries: Entries = {};
    if (isEncryptedBlob(this.encryptedAtRest)) {
      entries = await decryptJson<Entries>(this.encryptedAtRest as never, key);
    }
    this.setState({ ...this.state, entries, locked: false });
    return true;
  }

  // ── Storage usage ───────────────────────────────────────────

  usageBytes(): number {
    let bytes = 0;
    Object.values(KEYS).forEach((k) => {
      const v = this.storage.getItem(k);
      if (v != null) bytes += (k.length + v.length) * 2; // UTF-16
    });
    return bytes;
  }

  // Browsers commonly cap localStorage around 5 MB per origin.
  static QUOTA_BYTES = 5 * 1024 * 1024;

  // How long a cleared day stays recoverable.
  static TRASH_TTL_DAYS = 30;
}

let singleton: Store | null = null;
export function getStore(): Store {
  if (!singleton) singleton = new Store();
  return singleton;
}
