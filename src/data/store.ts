// Oscar's storage: a typed store over localStorage with schema
// versioning, cross-tab sync, quota-safe saves, soft-delete trash and
// an optional passcode gate (entries encrypted at rest).

import { type DayKey } from './dates';
import { words, type Entries, type Times, type Hours } from './selectors';
import {
  type LockMeta,
  isEncryptedBlob,
  makeLockMeta,
  verifyPasscode,
  encryptJson,
  decryptJson,
} from './crypto';

export const SCHEMA_VERSION = 1;

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

  private persistEntries() {
    const entries = this.state.entries;
    if (this.lockKey) {
      encryptJson(entries, this.lockKey)
        .then((blob) => {
          this.encryptedAtRest = blob;
          this.persist(KEYS.entries, blob);
        })
        .catch((error) => this.saveFailureListeners.forEach((fn) => fn({ key: KEYS.entries, error })));
    } else {
      this.persist(KEYS.entries, entries);
    }
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

  setEntry(key: DayKey, text: string) {
    this.setState({ ...this.state, entries: { ...this.state.entries, [key]: text } });
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
    this.setState({ ...this.state, goal });
    this.persist(KEYS.goal, String(goal));
  }

  setTheme(theme: Theme) {
    this.setState({ ...this.state, theme });
    this.persist(KEYS.theme, theme);
  }

  setName(name: string) {
    this.setState({ ...this.state, name });
    this.persist(KEYS.name, name);
  }

  addSession(rec: SessionRecord) {
    const sessions = [...this.state.sessions, rec];
    this.setState({ ...this.state, sessions });
    this.persist(KEYS.sessions, sessions);
  }

  // Soft delete: the entry moves to the trash and can be restored.
  softDeleteDay(key: DayKey) {
    const text = this.state.entries[key];
    if (!text) return;
    const entries = { ...this.state.entries };
    delete entries[key];
    const trash = { ...this.state.trash, [key]: { text, deletedAt: Date.now() } };
    this.setState({ ...this.state, entries, trash });
    this.persistEntries();
    this.persist(KEYS.trash, trash);
  }

  restoreDay(key: DayKey) {
    const item = this.state.trash[key];
    if (!item) return;
    const trash = { ...this.state.trash };
    delete trash[key];
    // Don't clobber text written since the delete.
    const existing = this.state.entries[key];
    const entries = { ...this.state.entries, [key]: existing || item.text };
    this.setState({ ...this.state, entries, trash });
    this.persistEntries();
    this.persist(KEYS.trash, trash);
  }

  replaceData(patch: Partial<Pick<StoreState, 'entries' | 'times' | 'hours' | 'sessions'>>) {
    this.setState({ ...this.state, ...patch });
    if (patch.entries) this.persistEntries();
    if (patch.times) this.persist(KEYS.times, patch.times);
    if (patch.hours) this.persist(KEYS.hours, patch.hours);
    if (patch.sessions) this.persist(KEYS.sessions, patch.sessions);
  }

  // ── Passcode gate ───────────────────────────────────────────

  async enablePasscode(passcode: string) {
    const { meta, key } = await makeLockMeta(passcode);
    this.lockMeta = meta;
    this.lockKey = key;
    this.persist(KEYS.lock, meta);
    this.setState({ ...this.state, lockEnabled: true, locked: false });
    this.persistEntries();
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
}

let singleton: Store | null = null;
export function getStore(): Store {
  if (!singleton) singleton = new Store();
  return singleton;
}
