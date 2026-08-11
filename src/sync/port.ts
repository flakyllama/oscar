// The engine's store-facing seam. Everything the sync layer needs from
// the journal store, and nothing else — so the sync transaction can run
// against the real store in the app and an in-memory adapter in tests,
// and neither the engine nor the targets import the store singleton.

import type { DayKey } from '../data/dates';
import type { SyncSide, SyncConflict, SyncDayRecord, SyncSettings, SyncDeviceRecord } from './document';
import { getStore, type Store } from '../data/store';

export interface StorePort {
  subscribe(fn: () => void): () => void;
  isLocked(): boolean;
  // Anything queued for the next push (day edits or a settings change).
  hasPending(): boolean;
  lastSyncAt(): number;
  setLastSyncAt(at: number): void;
  // Local state in the sync document's shape.
  syncSnapshot(): SyncSide;
  // Apply merged remote-winning records; never re-enqueues them.
  applyRemote(
    days: Record<DayKey, SyncDayRecord>,
    hours: Record<string, number> | null,
    settings: SyncSettings | null,
  ): void;
  addSyncConflicts(conflicts: SyncConflict[]): void;
  setDevices(devices: Record<string, SyncDeviceRecord>): void;
  // Dequeue everything captured by the snapshot taken at `snapshotAt`;
  // edits stamped later stay queued.
  clearPending(snapshotAt: number): void;
  // The file target's needs: passcode sealing and the stable device id.
  sealForSync(value: unknown): Promise<unknown>;
  openFromSync<T>(payload: unknown): Promise<T>;
  deviceId(): string;
}

// The production adapter over a concrete store.
export function storePort(store: Store): StorePort {
  return {
    subscribe: (fn) => store.subscribe(fn),
    isLocked: () => store.getSnapshot().locked,
    hasPending: () => store.hasPendingSync(),
    lastSyncAt: () => store.getSnapshot().syncMeta.lastSyncAt,
    setLastSyncAt: (at) => store.setSyncMeta({ lastSyncAt: at }),
    syncSnapshot: () => store.syncSnapshot(),
    applyRemote: (days, hours, settings) => store.applyRemote(days, hours, settings),
    addSyncConflicts: (conflicts) => store.addSyncConflicts(conflicts),
    setDevices: (devices) => store.setDevices(devices),
    clearPending: (snapshotAt) => store.clearPending(snapshotAt),
    sealForSync: (value) => store.sealForSync(value),
    openFromSync: (payload) => store.openFromSync(payload),
    deviceId: () => store.deviceId(),
  };
}

export function defaultStorePort(): StorePort {
  return storePort(getStore());
}
