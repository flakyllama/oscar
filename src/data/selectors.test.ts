import { describe, it, expect } from 'vitest';
import {
  words,
  currentStreak,
  longestStreak,
  totalWords,
  entryKeys,
  hourHistogram,
  goldenHour,
  vocabulary,
  forecast,
  lifetimeCrossKey,
  streakCrossKey,
} from './selectors';
import { keyFromOffset } from './dates';

describe('words', () => {
  it('counts whitespace-separated tokens', () => {
    expect(words('one two three')).toBe(3);
    expect(words('  padded   spacing\n\nand newlines ')).toBe(4);
  });
  it('is 0 for empty/blank/nullish text', () => {
    expect(words('')).toBe(0);
    expect(words('   \n ')).toBe(0);
    expect(words(undefined)).toBe(0);
    expect(words(null)).toBe(0);
  });
  it('counts punctuation-attached tokens as words', () => {
    expect(words("it's a test — really.")).toBe(5);
  });
});

function entriesAt(offsets: number[], now: Date): Record<string, string> {
  const entries: Record<string, string> = {};
  offsets.forEach((off, i) => {
    entries[keyFromOffset(off, now)] = 'entry number ' + i;
  });
  return entries;
}

describe('currentStreak', () => {
  const now = new Date(2026, 6, 16, 22, 0);

  it('counts consecutive days ending today', () => {
    expect(currentStreak(entriesAt([0, -1, -2], now), now)).toBe(3);
  });

  it("doesn't break when today is still unwritten (anchors at yesterday)", () => {
    expect(currentStreak(entriesAt([-1, -2, -3], now), now)).toBe(3);
  });

  it('is 0 after a gap', () => {
    expect(currentStreak(entriesAt([-2, -3], now), now)).toBe(0);
  });

  it('stops at gaps', () => {
    expect(currentStreak(entriesAt([0, -1, -3, -4], now), now)).toBe(2);
  });

  it('ignores empty-text days', () => {
    const entries = entriesAt([0, -1], now);
    entries[keyFromOffset(-1, now)] = '   ';
    expect(currentStreak(entries, now)).toBe(1);
  });

  it('spans a DST transition (streak across US spring-forward)', () => {
    const dstNow = new Date(2026, 2, 9, 8, 0); // Mar 9, day after spring-forward
    expect(currentStreak(entriesAt([0, -1, -2, -3], dstNow), dstNow)).toBe(4);
  });

  it('spans local midnight correctly (just before/after)', () => {
    const before = new Date(2026, 6, 16, 23, 59);
    const after = new Date(2026, 6, 17, 0, 1);
    const entries = entriesAt([0, -1], before); // Jul 16 + Jul 15
    expect(currentStreak(entries, before)).toBe(2);
    // At 00:01 the same entries are now yesterday+day-before: still 2.
    expect(currentStreak(entries, after)).toBe(2);
  });
});

describe('longestStreak', () => {
  const now = new Date(2026, 6, 16);

  it('finds the longest run anywhere in history', () => {
    expect(longestStreak(entriesAt([0, -5, -6, -7, -8, -20], now))).toBe(4);
  });

  it('handles a single entry', () => {
    expect(longestStreak(entriesAt([-3], now))).toBe(1);
  });

  it('is 0 with no entries', () => {
    expect(longestStreak({})).toBe(0);
  });

  it('counts runs across month boundaries', () => {
    expect(
      longestStreak({ '2026-06-29': 'a', '2026-06-30': 'b', '2026-07-01': 'c' }),
    ).toBe(3);
  });

  it('counts runs across DST', () => {
    expect(
      longestStreak({ '2026-03-07': 'a', '2026-03-08': 'b', '2026-03-09': 'c' }),
    ).toBe(3);
  });
});

describe('aggregates', () => {
  it('totalWords sums non-empty entries', () => {
    expect(totalWords({ a: 'one two', b: 'three', c: '  ' })).toBe(3);
  });

  it('entryKeys filters blanks and sorts ascending', () => {
    expect(entryKeys({ '2026-01-02': 'x', '2026-01-01': 'y', '2026-01-03': ' ' })).toEqual([
      '2026-01-01',
      '2026-01-02',
    ]);
  });

  it('hourHistogram fills 24 buckets', () => {
    const h = hourHistogram({ '7': 120, '22': 40 });
    expect(h).toHaveLength(24);
    expect(h[7]).toBe(120);
    expect(h[22]).toBe(40);
    expect(h[0]).toBe(0);
  });

  it('goldenHour picks the biggest bucket', () => {
    expect(goldenHour({ '7': 120, '22': 240 })).toBe(22);
    expect(goldenHour({})).toBe(null);
  });

  it('vocabulary excludes stopwords and contractions', () => {
    const v = vocabulary({ a: "the the the harbor harbor don't it's" });
    expect(v.topWord).toBe('harbor');
    expect(v.topCount).toBe(2);
  });
});

describe('forecast & threshold keys', () => {
  const now = new Date(2026, 6, 16, 12, 0);

  it('returns null with no recent pace', () => {
    expect(forecast({}, now)).toBe(null);
  });

  it('projects the next round target from 14-day pace', () => {
    const entries: Record<string, string> = {};
    for (let i = 0; i < 14; i++) {
      entries[keyFromOffset(-i, now)] = Array(100).fill('w').join(' ');
    }
    const f = forecast(entries, now)!;
    expect(f.pace).toBe(100);
    expect(f.target).toBe(2500); // total is 1400 → next target 2500
    expect(f.eta.getTime()).toBeGreaterThan(now.getTime());
  });

  it('lifetimeCrossKey finds the crossing day', () => {
    const entries = {
      '2026-01-01': Array(60).fill('w').join(' '),
      '2026-01-02': Array(60).fill('w').join(' '),
    };
    expect(lifetimeCrossKey(entries, 100)).toBe('2026-01-02');
    expect(lifetimeCrossKey(entries, 500)).toBe(null);
  });

  it('streakCrossKey finds the day a run reached N', () => {
    const entries = { '2026-01-01': 'a', '2026-01-02': 'b', '2026-01-03': 'c' };
    expect(streakCrossKey(entries, 3)).toBe('2026-01-03');
    expect(streakCrossKey(entries, 4)).toBe(null);
  });
});
