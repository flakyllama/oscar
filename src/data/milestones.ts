// The 20 milestones (5 groups), with earned-state and earned dates
// computed from entry history — ported from the prototype.

import { type DayKey, dateOf, keyShift } from './dates';
import {
  words,
  entryKeys,
  totalWords,
  bestDayWords,
  longestStreak,
  lifetimeCrossKey,
  streakCrossKey,
  spanDays,
  type Entries,
  type Times,
  type Hours,
} from './selectors';
import { GLYPH_COLOR } from '../components/glyphs';

export interface MilestoneDef {
  glyph: string;
  label: string;
  earned: boolean;
  req: string;
  when: Date | null;
  mult?: string;
}

export interface MilestoneGroup {
  name: string;
  items: MilestoneDef[];
}

export function milestoneGroups(
  entries: Entries,
  times: Times,
  hours: Hours,
  goal: number,
): MilestoneGroup[] {
  const keysAsc = entryKeys(entries);
  const total = totalWords(entries);
  const best = bestDayWords(entries);
  const lgStreak = longestStreak(entries);
  const span = spanDays(entries);
  const firstK = keysAsc[0];

  const dOf = (k: DayKey | null | undefined) => (k ? dateOf(k) : null);
  const earlyOn = Object.keys(hours).some((h) => parseInt(h, 10) < 9 && hours[h] > 0);
  const lateOn = Object.keys(hours).some((h) => parseInt(h, 10) >= 21 && hours[h] > 0);
  const witchingOn = Object.keys(hours).some((h) => parseInt(h, 10) < 3 && hours[h] > 0);
  const dblK = goal > 0 ? keysAsc.find((k) => words(entries[k]) >= goal * 2) : null;
  const boltK =
    goal > 0 ? keysAsc.find((k) => words(entries[k]) >= goal && (times[k] || 0) > 0 && times[k] < 600) : null;
  const longK = keysAsc.find((k) => (times[k] || 0) >= 1800);

  return [
    {
      name: 'Beginnings',
      items: [
        { glyph: 'smiley', label: 'First words', earned: keysAsc.length > 0, req: 'Write your first entry', when: dOf(firstK) },
        { glyph: 'sun', label: 'Early bird', earned: earlyOn, req: 'Write before 9am', when: null },
        { glyph: 'moon', label: 'Night owl', earned: lateOn, req: 'Write after 9pm', when: null },
        { glyph: 'bat', label: 'Witching hour', earned: witchingOn, req: 'Write between midnight and 3am', when: null },
      ],
    },
    {
      name: 'Streaks',
      items: [
        { glyph: 'flame', label: '7 days', earned: lgStreak >= 7, req: 'Write 7 days in a row', when: dOf(streakCrossKey(entries, 7)) },
        { glyph: 'flame', label: '30 days', earned: lgStreak >= 30, req: 'Write 30 days in a row', when: dOf(streakCrossKey(entries, 30)), mult: '×2' },
        { glyph: 'flame', label: '60 days', earned: lgStreak >= 60, req: 'Write 60 days in a row', when: dOf(streakCrossKey(entries, 60)), mult: '×3' },
        { glyph: 'flame', label: '90 days', earned: lgStreak >= 90, req: 'Write 90 days in a row', when: dOf(streakCrossKey(entries, 90)), mult: '×4' },
      ],
    },
    {
      name: 'Big days',
      items: [
        { glyph: 'bolt', label: 'Quick goal', earned: !!boltK, req: 'Hit your goal in under 10 minutes', when: dOf(boltK) },
        { glyph: 'hourglass', label: 'Long session', earned: !!longK, req: 'Write for 30 minutes in a day', when: dOf(longK) },
        { glyph: 'ball', label: 'Double goal', earned: !!dblK, req: 'Write twice your goal in a day', when: dOf(dblK) },
        { glyph: 'heart', label: 'Record day', earned: best >= 500, req: 'Write 500 words in a day', when: dOf(keysAsc.find((k) => words(entries[k]) >= 500)) },
      ],
    },
    {
      name: 'Lifetime',
      items: [
        { glyph: 'medal', label: '10k words', earned: total >= 10000, req: 'Reach 10,000 lifetime words', when: dOf(lifetimeCrossKey(entries, 10000)) },
        { glyph: 'medal', label: '25k words', earned: total >= 25000, req: 'Reach 25,000 lifetime words', when: dOf(lifetimeCrossKey(entries, 25000)) },
        { glyph: 'medal', label: '50k words', earned: total >= 50000, req: 'Reach 50,000 lifetime words', when: dOf(lifetimeCrossKey(entries, 50000)) },
        { glyph: 'trophy', label: '100k words', earned: total >= 100000, req: 'Reach 100,000 lifetime words', when: dOf(lifetimeCrossKey(entries, 100000)) },
      ],
    },
    {
      name: 'Collection',
      items: [
        { glyph: 'star', label: '50 entries', earned: keysAsc.length >= 50, req: 'Write 50 entries', when: dOf(keysAsc[49]) },
        { glyph: 'star', label: '100 entries', earned: keysAsc.length >= 100, req: 'Write 100 entries', when: dOf(keysAsc[99]) },
        { glyph: 'gem', label: '365 entries', earned: keysAsc.length >= 365, req: 'Write 365 entries', when: dOf(keysAsc[364]) },
        { glyph: 'cake', label: 'Anniversary', earned: span >= 365, req: 'A full year of journaling since your first entry', when: firstK ? dateOf(keyShift(firstK, 365)) : null },
      ],
    },
  ];
}

// Milestone days for the year heatmap: day key → glyph color + label.
export function milestoneDays(groups: MilestoneGroup[]): Record<DayKey, { color: string; label: string }> {
  const out: Record<DayKey, { color: string; label: string }> = {};
  groups.forEach((g) =>
    g.items.forEach((m) => {
      if (m.earned && m.when instanceof Date) {
        const iso =
          m.when.getFullYear() +
          '-' +
          String(m.when.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(m.when.getDate()).padStart(2, '0');
        if (!out[iso]) out[iso] = { color: GLYPH_COLOR[m.glyph] || 'var(--accent)', label: m.label };
      }
    }),
  );
  return out;
}
