import { describe, it, expect } from 'vitest';
import {
  milestoneGroups,
  milestoneDays,
  celebrationsFor,
  RECORD_DAY_WORDS,
  LIFETIME_TARGETS,
} from './milestones';
import { keyFromOffset, todayKey } from './dates';
import type { Entries } from './selectors';

const text = (n: number) => Array(n).fill('word').join(' ');
// A fixed mid-day, mid-month anchor (a Wednesday, not Jan 1).
const NOON = new Date(2026, 5, 10, 12, 0, 0);

const names = (cs: { name: string }[]) => cs.map((c) => c.name);

function entriesAt(offsets: number[], wordsPer = 10, now = NOON): Entries {
  const out: Entries = {};
  offsets.forEach((off) => {
    out[keyFromOffset(off, now)] = text(wordsPer);
  });
  return out;
}

describe('milestoneGroups thresholds', () => {
  it('earns Record day at exactly the threshold, not below', () => {
    const under: Entries = { '2026-06-01': text(RECORD_DAY_WORDS - 1) };
    const at: Entries = { '2026-06-01': text(RECORD_DAY_WORDS) };
    const find = (e: Entries) =>
      milestoneGroups(e, {}, {}, 300)
        .flatMap((g) => g.items)
        .find((m) => m.label === 'Record day')!;
    expect(find(under).earned).toBe(false);
    expect(find(at).earned).toBe(true);
  });

  it('has a lifetime item for every target, including 25k', () => {
    const labels = milestoneGroups({}, {}, {}, 300)
      .find((g) => g.name === 'Lifetime')!
      .items.map((m) => m.label);
    expect(labels).toEqual(['10k words', '25k words', '50k words', '100k words']);
    expect(LIFETIME_TARGETS).toContain(25000);
  });

  it('earns collection targets at exact counts with earned dates', () => {
    const e: Entries = {};
    for (let i = 0; i < 50; i++) e[keyFromOffset(-i, NOON)] = text(5);
    const items = milestoneGroups(e, {}, {}, 300).find((g) => g.name === 'Collection')!.items;
    expect(items.find((m) => m.label === '50 entries')!.earned).toBe(true);
    expect(items.find((m) => m.label === '100 entries')!.earned).toBe(false);
  });
});

describe('milestoneDays', () => {
  it('maps earned days to glyph names (no colours in the data module)', () => {
    const e: Entries = { '2026-06-01': text(RECORD_DAY_WORDS) };
    const days = milestoneDays(milestoneGroups(e, {}, {}, 300));
    expect(days['2026-06-01']).toBeDefined();
    expect(days['2026-06-01'].glyph).toBe('smiley'); // First words wins the day
    expect('color' in days['2026-06-01']).toBe(false);
  });
});

describe('celebrationsFor — first words of the day', () => {
  const base = { goal: 300, daySeconds: 0 };

  it('greets a plain midday first word with a smiley', () => {
    const cs = celebrationsFor({ ...base, entries: {}, dayKey: todayKey(NOON), newText: 'hello', now: NOON });
    expect(names(cs)).toEqual(['smiley']);
  });

  it('picks the time-of-day glyph from the shared hour boundaries', () => {
    const at = (hour: number) => {
      const now = new Date(2026, 5, 10, hour, 0, 0);
      return names(
        celebrationsFor({ ...base, entries: {}, dayKey: todayKey(now), newText: 'hello', now }),
      )[0];
    };
    expect(at(1)).toBe('bat');
    expect(at(8)).toBe('sun');
    expect(at(22)).toBe('moon');
    expect(at(14)).toBe('smiley');
  });

  it('welcomes back after a gap of more than 3 days', () => {
    const entries = entriesAt([-5]);
    const cs = celebrationsFor({ ...base, entries, dayKey: todayKey(NOON), newText: 'back again', now: NOON });
    expect(names(cs)).toContain('welcome back');
  });

  it('celebrates entry counts only at the milestone targets', () => {
    const run = (priorCount: number) => {
      const entries = entriesAt(Array.from({ length: priorCount }, (_, i) => -(i + 1)));
      return names(
        celebrationsFor({ ...base, entries, dayKey: todayKey(NOON), newText: 'entry', now: NOON }),
      );
    };
    expect(run(49)).toContain('star'); // 50th entry
    expect(run(99)).toContain('star'); // 100th entry
    expect(run(149)).not.toContain('star'); // 150th — modulo drift is gone
    expect(run(364)).toContain('gem'); // 365th
  });

  it('fires the flame when the streak reaches a weekly mark', () => {
    const six = entriesAt([-1, -2, -3, -4, -5, -6]);
    const cs = celebrationsFor({ ...base, entries: six, dayKey: todayKey(NOON), newText: 'day seven', now: NOON });
    expect(names(cs)).toContain('flame');
    const five = entriesAt([-1, -2, -3, -4, -5]);
    const cs2 = celebrationsFor({ ...base, entries: five, dayKey: todayKey(NOON), newText: 'day six', now: NOON });
    expect(names(cs2)).not.toContain('flame');
  });
});

describe('celebrationsFor — goal crossings', () => {
  it('rewards a quick goal with the bolt, a slow one with confetti', () => {
    const quick = celebrationsFor({
      entries: { [todayKey(NOON)]: text(299) },
      dayKey: todayKey(NOON),
      newText: text(300),
      goal: 300,
      daySeconds: 120,
      now: NOON,
    });
    expect(names(quick)).toContain('bolt');
    const slow = celebrationsFor({
      entries: { [todayKey(NOON)]: text(299) },
      dayKey: todayKey(NOON),
      newText: text(300),
      goal: 300,
      daySeconds: 1200,
      now: NOON,
    });
    expect(names(slow)).toContain('confetti');
  });

  it('fires the confetti ball on double goal (the Double goal milestone)', () => {
    const cs = celebrationsFor({
      entries: { [todayKey(NOON)]: text(599) },
      dayKey: todayKey(NOON),
      newText: text(600),
      goal: 300,
      daySeconds: 1200,
      now: NOON,
    });
    expect(names(cs)).toContain('confetti ball');
  });
});

describe('celebrationsFor — record day', () => {
  const day = todayKey(NOON);

  it('does not fire below the milestone bar (the old 100-word drift)', () => {
    const entries: Entries = { [keyFromOffset(-1, NOON)]: text(150), [day]: text(200) };
    const cs = celebrationsFor({ entries, dayKey: day, newText: text(201), goal: 0, daySeconds: 0, now: NOON });
    expect(names(cs)).not.toContain('heart');
  });

  it('fires when crossing the bar, and when beating a real record — once', () => {
    const crossing = celebrationsFor({
      entries: { [keyFromOffset(-1, NOON)]: text(300), [day]: text(RECORD_DAY_WORDS - 1) },
      dayKey: day,
      newText: text(RECORD_DAY_WORDS),
      goal: 0,
      daySeconds: 0,
      now: NOON,
    });
    expect(names(crossing)).toContain('heart');
    const beating = celebrationsFor({
      entries: { [keyFromOffset(-1, NOON)]: text(600), [day]: text(600) },
      dayKey: day,
      newText: text(601),
      goal: 0,
      daySeconds: 0,
      now: NOON,
    });
    expect(names(beating)).toContain('heart');
    const alreadyRecord = celebrationsFor({
      entries: { [keyFromOffset(-1, NOON)]: text(600), [day]: text(601) },
      dayKey: day,
      newText: text(602),
      goal: 0,
      daySeconds: 0,
      now: NOON,
    });
    expect(names(alreadyRecord)).not.toContain('heart');
  });
});

describe('celebrationsFor — lifetime and long session', () => {
  const day = todayKey(NOON);

  it('celebrates every lifetime target, including the once-missing 25k', () => {
    const entries: Entries = { [keyFromOffset(-1, NOON)]: text(24990), [day]: text(5) };
    const cs = celebrationsFor({ entries, dayKey: day, newText: text(15), goal: 0, daySeconds: 0, now: NOON });
    expect(names(cs)).toContain('medal');
  });

  it('awards the trophy on the final target', () => {
    const entries: Entries = { [keyFromOffset(-1, NOON)]: text(99990), [day]: text(5) };
    const cs = celebrationsFor({ entries, dayKey: day, newText: text(15), goal: 0, daySeconds: 0, now: NOON });
    expect(names(cs)).toContain('trophy');
  });

  it('proposes the hourglass once per day via the caller guard', () => {
    const ctx = {
      entries: { [day]: text(50) },
      dayKey: day,
      newText: text(51),
      goal: 0,
      daySeconds: 1800,
      now: NOON,
    };
    expect(names(celebrationsFor({ ...ctx, longSessionSeen: false }))).toContain('hourglass');
    expect(names(celebrationsFor({ ...ctx, longSessionSeen: true }))).not.toContain('hourglass');
  });
});
