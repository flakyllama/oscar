import { describe, it, expect } from 'vitest';
import { mergeSync, type SyncSide, type SyncDayRecord } from './merge';

const NOW = 1_800_000_000_000;
const T0 = NOW - 100_000; // lastSyncAt
const BEFORE = T0 - 50_000; // edited before the last sync
const AFTER_A = T0 + 10_000; // edited after the last sync
const AFTER_B = T0 + 20_000; // edited after, later

function side(days: Record<string, SyncDayRecord> = {}, partial: Partial<SyncSide> = {}): SyncSide {
  return {
    days,
    hours: {},
    settings: { goal: 300, name: '', updatedAt: 0 },
    ...partial,
  };
}

function rec(text: string, updatedAt: number, extra: Partial<SyncDayRecord> = {}): SyncDayRecord {
  return { text, time: 60, updatedAt, ...extra };
}

describe('mergeSync — last-write-wins per day-key', () => {
  it('takes one-sided records as-is', () => {
    const r = mergeSync(
      side({ '2026-07-01': rec('local only', BEFORE) }),
      side({ '2026-07-02': rec('remote only', BEFORE) }),
      T0,
      NOW,
    );
    expect(r.days['2026-07-01'].text).toBe('local only');
    expect(r.days['2026-07-02'].text).toBe('remote only');
    expect(r.changedLocally).toEqual(['2026-07-02']);
    expect(r.conflicts).toEqual([]);
  });

  it('newer text wins in both directions', () => {
    const r1 = mergeSync(
      side({ d: rec('new local', AFTER_A) }),
      side({ d: rec('old remote', BEFORE) }),
      T0,
      NOW,
    );
    expect(r1.days.d.text).toBe('new local');
    expect(r1.changedLocally).toEqual([]);

    const r2 = mergeSync(
      side({ d: rec('old local', BEFORE) }),
      side({ d: rec('new remote', AFTER_A) }),
      T0,
      NOW,
    );
    expect(r2.days.d.text).toBe('new remote');
    expect(r2.changedLocally).toEqual(['d']);
  });

  it('is idempotent — re-merging the merged result changes nothing', () => {
    const local = side({ a: rec('la', AFTER_A), b: rec('lb', BEFORE) });
    const remote = side({ a: rec('ra', AFTER_B), c: rec('rc', BEFORE) });
    const first = mergeSync(local, remote, T0, NOW);
    const again = mergeSync(
      { days: first.days, hours: first.hours, settings: first.settings },
      { days: first.days, hours: first.hours, settings: first.settings },
      NOW,
      NOW + 1,
    );
    expect(again.days).toEqual(first.days);
    expect(again.changedLocally).toEqual([]);
    expect(again.conflicts).toEqual([]);
  });
});

describe('mergeSync — tombstones', () => {
  it('a newer tombstone beats an older write', () => {
    const r = mergeSync(
      side({ d: rec('still here', BEFORE) }),
      side({ d: rec('', AFTER_A, { deletedAt: AFTER_A }) }),
      T0,
      NOW,
    );
    expect(r.days.d.deletedAt).toBe(AFTER_A);
    expect(r.changedLocally).toEqual(['d']);
  });

  it('a newer write beats an older tombstone (day resurrected)', () => {
    const r = mergeSync(
      side({ d: rec('rewritten', AFTER_B) }),
      side({ d: rec('', AFTER_A, { deletedAt: AFTER_A }) }),
      T0,
      NOW,
    );
    expect(r.days.d.deletedAt).toBeUndefined();
    expect(r.days.d.text).toBe('rewritten');
  });

  it('tombstones propagate when only one side has the day', () => {
    const r = mergeSync(side({}), side({ d: rec('', BEFORE, { deletedAt: BEFORE }) }), T0, NOW);
    expect(r.days.d.deletedAt).toBe(BEFORE);
  });
});

describe('mergeSync — conflicts', () => {
  it('flags concurrent edits (both sides after lastSync) and keeps the newer', () => {
    const r = mergeSync(
      side({ d: rec('local version', AFTER_A) }),
      side({ d: rec('remote version', AFTER_B) }),
      T0,
      NOW,
    );
    expect(r.days.d.text).toBe('remote version');
    expect(r.conflicts).toEqual([
      { dayKey: 'd', kept: 'remote', loserText: 'local version', at: NOW },
    ]);
  });

  it('does NOT flag a plain catch-up (only one side changed since lastSync)', () => {
    const r = mergeSync(
      side({ d: rec('old', BEFORE) }),
      side({ d: rec('newer elsewhere', AFTER_A) }),
      T0,
      NOW,
    );
    expect(r.conflicts).toEqual([]);
  });

  it('does not flag identical texts even with concurrent stamps', () => {
    const r = mergeSync(
      side({ d: rec('same words', AFTER_A) }),
      side({ d: rec('same words', AFTER_B) }),
      T0,
      NOW,
    );
    expect(r.conflicts).toEqual([]);
    expect(r.days.d.updatedAt).toBe(AFTER_B);
  });
});

describe('mergeSync — hours, time and settings', () => {
  it('takes the max per hour bucket and per-day time', () => {
    const r = mergeSync(
      side({ d: { text: 'x', time: 300, updatedAt: AFTER_A } }, { hours: { '7': 100, '9': 50 } }),
      side({ d: { text: 'x', time: 500, updatedAt: AFTER_A } }, { hours: { '7': 40, '22': 80 } }),
      T0,
      NOW,
    );
    expect(r.days.d.time).toBe(500);
    expect(r.hours).toEqual({ '7': 100, '9': 50, '22': 80 });
    expect(r.hoursChangedLocally).toBe(true);
  });

  it('settings follow the newer stamp', () => {
    const r = mergeSync(
      side({}, { settings: { goal: 300, name: 'Sara', updatedAt: BEFORE } }),
      side({}, { settings: { goal: 500, name: 'Sara', updatedAt: AFTER_A } }),
      T0,
      NOW,
    );
    expect(r.settings.goal).toBe(500);
    expect(r.settingsChangedLocally).toBe(true);
  });
});
