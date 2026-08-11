import { describe, it, expect, afterEach } from 'vitest';
import { SyncEngine } from './engine';
import { storePort, type StorePort } from './port';
import { Store } from '../data/store';
import type { SyncSide } from './document';
import { VersionConflictError, type SyncTarget, type SyncPull } from './target';

// ── Adapters ────────────────────────────────────────────────────
// The engine's two seams each get a second adapter here: an in-memory
// journal store (via the real Store over fake storage) and an
// in-memory SyncTarget standing in for the cloud/file backends.

function memStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

function memStore(): Store {
  return new Store(memStorage());
}

class MemTarget implements SyncTarget {
  readonly kind = 'cloud' as const;
  doc: SyncSide | null = null;
  version = 0;
  pulls = 0;
  pushes = 0;
  // Hooks for orchestrating mid-sync races.
  onPull: (() => void) | null = null;
  failPushesWith: Error[] = [];

  label() {
    return 'mem';
  }
  async ensureAccess() {
    return 'granted' as const;
  }
  async pull(): Promise<SyncPull> {
    this.pulls++;
    this.onPull?.();
    return { side: this.doc ? (JSON.parse(JSON.stringify(this.doc)) as SyncSide) : null, version: this.version };
  }
  async push(side: SyncSide, expectedVersion: string | number): Promise<number> {
    this.pushes++;
    const planned = this.failPushesWith.shift();
    if (planned) throw planned;
    if (expectedVersion !== this.version) throw new VersionConflictError(this.version);
    this.doc = JSON.parse(JSON.stringify(side)) as SyncSide;
    this.version++;
    return this.version;
  }
  async remoteToken() {
    return this.version;
  }
  async teardown() {}
}

// The engine adopts its target through the constructor, so tests never
// need a connect path of their own. stop() afterwards drops the poll
// timer and the store subscription so engines can't sync across tests.
const live: SyncEngine[] = [];
afterEach(() => {
  live.splice(0).forEach((e) => e.stop());
});

async function startedEngine(port: StorePort, target: SyncTarget) {
  const engine = new SyncEngine(port, target);
  live.push(engine);
  await engine.start();
  return engine;
}

async function connectedEngine(store: Store, target: SyncTarget) {
  return startedEngine(storePort(store), target);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── The sync transaction ────────────────────────────────────────

describe('SyncEngine — pull → merge → apply → push', () => {
  it('pushes local edits and clears the pending queue', async () => {
    const store = memStore();
    store.setEntry('2026-06-01', 'first entry');
    expect(store.hasPendingSync()).toBe(true);
    await sleep(2); // the edit predates the sync snapshot

    const target = new MemTarget();
    await connectedEngine(store, target);

    expect(target.doc?.days['2026-06-01'].text).toBe('first entry');
    expect(store.hasPendingSync()).toBe(false);
    expect(store.getSnapshot().syncMeta.lastSyncAt).toBeGreaterThan(0);
  });

  it('round-trips between two devices through one target', async () => {
    const target = new MemTarget();
    const a = memStore();
    a.setEntry('2026-06-01', 'written on A');
    await connectedEngine(a, target);

    const b = memStore();
    const engineB = await connectedEngine(b, target);
    expect(b.getSnapshot().entries['2026-06-01']).toBe('written on A');

    b.setEntry('2026-06-02', 'written on B');
    await engineB.syncNow();
    await connectedEngine(a, target);
    expect(a.getSnapshot().entries['2026-06-02']).toBe('written on B');
  });

  it('propagates a cleared day as a tombstone, not a resurrection', async () => {
    const target = new MemTarget();
    const a = memStore();
    a.setEntry('2026-06-01', 'to be cleared');
    const engineA = await connectedEngine(a, target);

    const b = memStore();
    const engineB = await connectedEngine(b, target);
    expect(b.getSnapshot().entries['2026-06-01']).toBe('to be cleared');

    await sleep(5); // the delete clearly postdates the original write
    a.softDeleteDay('2026-06-01');
    await engineA.syncNow();
    await engineB.syncNow();
    expect(b.getSnapshot().entries['2026-06-01']).toBeUndefined();
    // The overwritten text is preserved in B's trash, never silently dropped.
    expect(b.getSnapshot().trash['2026-06-01']?.text).toBe('to be cleared');
  });

  it('surfaces concurrent same-day edits as a conflict with the loser preserved', async () => {
    const target = new MemTarget();
    const a = memStore();
    const b = memStore();
    a.setEntry('2026-06-01', 'base');
    const engineA = await connectedEngine(a, target);
    const engineB = await connectedEngine(b, target);
    await sleep(5); // both edits below clearly postdate the last sync

    // Both edit the same day after their last sync; A's edit is older.
    a.setEntry('2026-06-01', 'A version');
    await sleep(5);
    b.setEntry('2026-06-01', 'B version');
    await engineA.syncNow();
    await engineB.syncNow(); // B pulls A's edit; B's newer edit wins
    await engineA.syncNow(); // A learns it lost

    expect(a.getSnapshot().entries['2026-06-01']).toBe('B version');
    const conflict = b.getSnapshot().syncConflicts[0] ?? a.getSnapshot().syncConflicts[0];
    expect(conflict).toBeDefined();
    expect(conflict.loserText).toBe('A version');
  });
});

describe('SyncEngine — ordering and retries', () => {
  it('keeps edits made during the sync queued (clearPending honours the snapshot time)', async () => {
    const store = memStore();
    store.setEntry('2026-06-01', 'before sync');
    await sleep(2); // the edit predates the sync snapshot
    const target = new MemTarget();
    // Race: a new edit lands after the snapshot was taken but before
    // the push completes.
    target.onPull = () => {
      target.onPull = null;
      store.setEntry('2026-06-02', 'landed mid-sync');
    };
    await connectedEngine(store, target);

    expect(target.doc?.days['2026-06-01']).toBeDefined();
    // The mid-sync edit must still be queued for the next push.
    expect(store.getSnapshot().pendingSync['2026-06-02']).toBeDefined();
    expect(store.getSnapshot().pendingSync['2026-06-01']).toBeUndefined();
  });

  it('re-pulls and re-merges on a version conflict, losing neither side', async () => {
    const target = new MemTarget();
    const a = memStore();
    a.setEntry('2026-06-01', 'from A');

    // Simulate another device writing between A's pull and push: the
    // first push fails with a version conflict AND the remote doc moves.
    const b = memStore();
    b.setEntry('2026-06-02', 'from B');
    const portB = storePort(b);
    target.failPushesWith = [new VersionConflictError(1)];
    target.onPull = () => {
      // On A's re-pull the remote now holds B's push.
      target.onPull = null;
      target.doc = portB.syncSnapshot();
      target.version = 1;
    };

    await connectedEngine(a, target);
    expect(target.pushes).toBeGreaterThanOrEqual(2);
    expect(target.doc?.days['2026-06-01']?.text).toBe('from A');
    expect(target.doc?.days['2026-06-02']?.text).toBe('from B');
  });

  it('gives up after the retry budget and reports the error', async () => {
    const store = memStore();
    store.setEntry('2026-06-01', 'stuck');
    const target = new MemTarget();
    target.failPushesWith = Array.from({ length: 5 }, () => new VersionConflictError(9));
    const engine = await connectedEngine(store, target);
    expect(engine.getStatus().error).toBeTruthy();
    expect(engine.getStatus().syncing).toBe(false);
  });
});

describe('SyncEngine — gates', () => {
  it('refuses to sync while the journal is locked', async () => {
    const target = new MemTarget();
    const lockedPort: StorePort = {
      subscribe: () => () => {},
      isLocked: () => true,
      hasPending: () => true,
      lastSyncAt: () => 0,
      setLastSyncAt: () => {},
      syncSnapshot: () => ({ days: {}, hours: {}, settings: { goal: 300, name: '', updatedAt: 0 } }),
      applyRemote: () => {},
      addSyncConflicts: () => {},
      setDevices: () => {},
      clearPending: () => {},
      sealForSync: async (v) => v,
      openFromSync: async <T,>(p: unknown) => p as T,
      deviceId: () => 'test',
    };
    await startedEngine(lockedPort, target);
    expect(target.pulls).toBe(0);
    expect(target.pushes).toBe(0);
  });

  it('pushes settings-only changes (the goal/name enqueue gap)', async () => {
    const target = new MemTarget();
    const store = memStore();
    store.setEntry('2026-06-01', 'seed');
    const engine = await connectedEngine(store, target);
    const pushesBefore = target.pushes;

    store.setGoal(500);
    expect(store.hasPendingSync()).toBe(true); // would have been false before the fix
    await sleep(2); // the change predates the sync snapshot
    await engine.syncNow();
    expect(target.pushes).toBe(pushesBefore + 1);
    expect(target.doc?.settings.goal).toBe(500);
    expect(store.hasPendingSync()).toBe(false);
  });
});
