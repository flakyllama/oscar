import { describe, it, expect } from 'vitest';
import { makeBackup, parseBackup, mergeBackup, type BackupFile } from './backup';
import type { StoreState } from './store';

function state(partial: Partial<StoreState> = {}): StoreState {
  return {
    entries: {},
    times: {},
    hours: {},
    sessions: [],
    trash: {},
    goal: 300,
    theme: 'dark',
    name: '',
    analyticsEnabled: false,
    welcomed: true,
    lockEnabled: false,
    locked: false,
    dayMeta: {},
    pendingSync: {},
    pendingSettingsAt: 0,
    settingsMeta: { updatedAt: 0 },
    syncConflicts: [],
    syncMeta: { deviceId: '', lastSyncAt: 0 },
    devices: {},
    ...partial,
  };
}

function backup(partial: Partial<BackupFile> = {}): BackupFile {
  return {
    app: 'oscar',
    schemaVersion: 1,
    exportedAt: '2026-07-16T00:00:00.000Z',
    entries: {},
    times: {},
    hours: {},
    sessions: [],
    settings: { goal: 300, theme: 'dark', name: '' },
    ...partial,
  };
}

describe('backup round-trip', () => {
  it('export → parse preserves data', () => {
    const s = state({ entries: { '2026-07-15': 'hello world' }, goal: 500 });
    const parsed = parseBackup(JSON.stringify(makeBackup(s)));
    expect(parsed.entries['2026-07-15']).toBe('hello world');
    expect(parsed.settings.goal).toBe(500);
  });

  it('rejects invalid JSON and foreign files', () => {
    expect(() => parseBackup('nope')).toThrow('Not valid JSON.');
    expect(() => parseBackup('{"app":"other"}')).toThrow('Not an Oscar backup file.');
  });
});

describe('mergeBackup', () => {
  it('fills days missing locally', () => {
    const r = mergeBackup(state(), backup({ entries: { '2026-07-01': 'from backup' } }));
    expect(r.entries['2026-07-01']).toBe('from backup');
    expect(r.added).toBe(1);
    expect(r.conflicts).toEqual([]);
  });

  it('on conflict, the version with more words wins; ties keep local', () => {
    const local = state({ entries: { '2026-07-01': 'short local', '2026-07-02': 'tie a' } });
    const r = mergeBackup(
      local,
      backup({ entries: { '2026-07-01': 'much longer backup text here', '2026-07-02': 'tie b' } }),
    );
    expect(r.entries['2026-07-01']).toBe('much longer backup text here');
    expect(r.entries['2026-07-02']).toBe('tie a');
    expect(r.conflicts.sort()).toEqual(['2026-07-01', '2026-07-02']);
  });

  it('ignores empty incoming entries', () => {
    const r = mergeBackup(state({ entries: { '2026-07-01': 'keep me' } }), backup({ entries: { '2026-07-01': '  ', '2026-07-02': '' } }));
    expect(r.entries['2026-07-01']).toBe('keep me');
    expect(r.added).toBe(0);
  });

  it('times and hours take the max (idempotent re-import)', () => {
    const local = state({ times: { '2026-07-01': 600 }, hours: { '7': 100 } });
    const inc = backup({ times: { '2026-07-01': 400, '2026-07-02': 900 }, hours: { '7': 250 } });
    const once = mergeBackup(local, inc);
    expect(once.times).toEqual({ '2026-07-01': 600, '2026-07-02': 900 });
    expect(once.hours['7']).toBe(250);
    const twice = mergeBackup(state({ ...local, times: once.times, hours: once.hours }), inc);
    expect(twice.times).toEqual(once.times);
    expect(twice.hours).toEqual(once.hours);
  });

  it('sessions union-dedupe on (dayKey, start)', () => {
    const a = { dayKey: '2026-07-01', start: 1, end: 2, words: 10 };
    const b = { dayKey: '2026-07-01', start: 5, end: 6, words: 20 };
    const r = mergeBackup(state({ sessions: [a] }), backup({ sessions: [a, b] }));
    expect(r.sessions).toEqual([a, b]);
  });
});
