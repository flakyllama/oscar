// The sync document vocabulary — the shapes both sides of the sync seam
// speak. A leaf module on purpose: the store can describe itself in
// these terms and the merge/engine can consume them without either
// layer importing the other's machinery.

import type { DayKey } from '../data/dates';

export interface SyncDayRecord {
  text: string;
  time: number; // accumulated seconds for the day
  updatedAt: number; // epoch ms of the last edit
  deletedAt?: number; // tombstone: the day was cleared at this time
}

export interface SyncSettings {
  goal: number;
  name: string;
  updatedAt: number;
}

// A device in the synced "connected devices" registry. Keyed by a stable
// per-device id; the freshest record (highest lastSyncAt) wins on merge.
export interface SyncDeviceRecord {
  id: string;
  platform: string; // e.g. "Mac", "iPhone" (from the UA)
  browser: string; // e.g. "Safari"
  addedAt: number; // first time this device synced
  lastSyncAt: number; // last time it synced (bucketed, so merges stay quiet)
}

export interface SyncSide {
  days: Record<DayKey, SyncDayRecord>;
  hours: Record<string, number>;
  settings: SyncSettings;
  devices?: Record<string, SyncDeviceRecord>;
}

export interface SyncConflict {
  dayKey: DayKey;
  kept: 'local' | 'remote';
  loserText: string;
  at: number; // when the conflict was detected
}
