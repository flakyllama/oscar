// JSON backup export/import with merge-on-import conflict handling.

import { SCHEMA_VERSION, type SessionRecord, type StoreState, type Theme } from './store';
import { words, type Entries, type Times, type Hours } from './selectors';

export interface BackupFile {
  app: 'oscar';
  schemaVersion: number;
  exportedAt: string;
  entries: Entries;
  times: Times;
  hours: Hours;
  sessions: SessionRecord[];
  settings: { goal: number; theme: Theme; name: string };
}

export function makeBackup(state: StoreState, now: Date = new Date()): BackupFile {
  return {
    app: 'oscar',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    entries: state.entries,
    times: state.times,
    hours: state.hours,
    sessions: state.sessions,
    settings: { goal: state.goal, theme: state.theme, name: state.name },
  };
}

export function parseBackup(json: string): BackupFile {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Not valid JSON.');
  }
  const b = data as Partial<BackupFile>;
  if (!b || b.app !== 'oscar' || typeof b.entries !== 'object' || b.entries === null) {
    throw new Error('Not an Oscar backup file.');
  }
  return {
    app: 'oscar',
    schemaVersion: b.schemaVersion ?? 0,
    exportedAt: b.exportedAt ?? '',
    entries: b.entries as Entries,
    times: (b.times as Times) || {},
    hours: (b.hours as Hours) || {},
    sessions: (b.sessions as SessionRecord[]) || [],
    settings: b.settings ?? { goal: 300, theme: 'dark', name: '' },
  };
}

export interface MergeResult {
  entries: Entries;
  times: Times;
  hours: Hours;
  sessions: SessionRecord[];
  added: number; // days that only existed in the backup
  conflicts: string[]; // days where both sides had different text (longer won)
}

// Merge rules: a day missing locally is filled from the backup; when both
// sides have text the version with more words wins (ties keep local).
// Times/hours take the max per key so re-importing the same backup can't
// double-count; sessions union-dedupe on (dayKey, start).
export function mergeBackup(local: StoreState, incoming: BackupFile): MergeResult {
  const entries: Entries = { ...local.entries };
  let added = 0;
  const conflicts: string[] = [];
  Object.keys(incoming.entries).forEach((k) => {
    const inc = incoming.entries[k] || '';
    if (!words(inc)) return;
    const cur = entries[k] || '';
    if (!words(cur)) {
      entries[k] = inc;
      added++;
    } else if (cur !== inc) {
      conflicts.push(k);
      if (words(inc) > words(cur)) entries[k] = inc;
    }
  });

  const times: Times = { ...local.times };
  Object.keys(incoming.times).forEach((k) => {
    times[k] = Math.max(times[k] || 0, incoming.times[k] || 0);
  });

  const hours: Hours = { ...local.hours };
  Object.keys(incoming.hours).forEach((h) => {
    hours[h] = Math.max(hours[h] || 0, incoming.hours[h] || 0);
  });

  const seen = new Set(local.sessions.map((s) => s.dayKey + ':' + s.start));
  const sessions = [
    ...local.sessions,
    ...incoming.sessions.filter((s) => !seen.has(s.dayKey + ':' + s.start)),
  ].sort((a, b) => a.start - b.start);

  return { entries, times, hours, sessions, added, conflicts };
}
