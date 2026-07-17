// Pure merge logic for file sync: last-write-wins per day-key with
// tombstones. A conflict is only recorded when BOTH sides changed the
// same day since the last successful sync — plain catch-up merges
// resolve silently.

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

export interface SyncSide {
  days: Record<DayKey, SyncDayRecord>;
  hours: Record<string, number>;
  settings: SyncSettings;
}

export interface SyncConflict {
  dayKey: DayKey;
  kept: 'local' | 'remote';
  loserText: string;
  at: number; // when the conflict was detected
}

export interface MergeResult {
  // The fully merged state — written to the file AND the target for
  // local application.
  days: Record<DayKey, SyncDayRecord>;
  hours: Record<string, number>;
  settings: SyncSettings;
  // Day-keys whose merged record differs from the local side (local
  // needs updating).
  changedLocally: DayKey[];
  hoursChangedLocally: boolean;
  settingsChangedLocally: boolean;
  conflicts: SyncConflict[];
}

function newer(a: SyncDayRecord, b: SyncDayRecord): boolean {
  return a.updatedAt > b.updatedAt;
}

function sameRecord(a: SyncDayRecord, b: SyncDayRecord): boolean {
  return a.text === b.text && !a.deletedAt === !b.deletedAt;
}

export function mergeSync(
  local: SyncSide,
  remote: SyncSide,
  lastSyncAt: number,
  now: number,
): MergeResult {
  const days: Record<DayKey, SyncDayRecord> = {};
  const changedLocally: DayKey[] = [];
  const conflicts: SyncConflict[] = [];

  const keys = new Set([...Object.keys(local.days), ...Object.keys(remote.days)]);
  keys.forEach((k) => {
    const l = local.days[k];
    const r = remote.days[k];
    if (l && !r) {
      days[k] = l;
      return;
    }
    if (r && !l) {
      days[k] = r;
      changedLocally.push(k);
      return;
    }
    // Both sides have a record.
    const lRec = l!;
    const rRec = r!;
    if (sameRecord(lRec, rRec)) {
      // Same content — keep the newer stamp and the larger time.
      days[k] = {
        ...(newer(lRec, rRec) ? lRec : rRec),
        time: Math.max(lRec.time, rRec.time),
      };
      return;
    }
    const localWins = newer(lRec, rRec);
    const winner = localWins ? lRec : rRec;
    const loser = localWins ? rRec : lRec;
    days[k] = { ...winner, time: Math.max(lRec.time, rRec.time) };
    if (!localWins) changedLocally.push(k);
    // Concurrent edit: both sides changed since the last sync.
    if (loser.updatedAt > lastSyncAt && winner.updatedAt > lastSyncAt && loser.text !== winner.text) {
      conflicts.push({
        dayKey: k,
        kept: localWins ? 'local' : 'remote',
        loserText: loser.text,
        at: now,
      });
    }
  });

  const hours: Record<string, number> = { ...local.hours };
  Object.keys(remote.hours).forEach((h) => {
    hours[h] = Math.max(hours[h] || 0, remote.hours[h] || 0);
  });
  const hoursChangedLocally = Object.keys(hours).some((h) => (local.hours[h] || 0) !== hours[h]);

  const settingsChangedLocally = remote.settings.updatedAt > local.settings.updatedAt;
  const settings = settingsChangedLocally ? remote.settings : local.settings;

  return { days, hours, settings, changedLocally, hoursChangedLocally, settingsChangedLocally, conflicts };
}
