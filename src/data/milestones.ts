// The achievements module: the 20 milestones (5 groups, shown on the
// Milestones screen and the Stats heatmap) and the celebration glyphs
// the Write screen fires while typing. Both read the same threshold
// tables below, so the two can't drift apart.

import { type DayKey, dateOf, keyOf, keyShift, daysBetween } from './dates';
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
import type { GlyphName } from './glyphNames';

// ── Thresholds — the one table ──────────────────────────────────

export const STREAK_TARGETS = [7, 30, 60, 90] as const;
export const LIFETIME_TARGETS = [10000, 25000, 50000, 100000] as const;
export const COLLECTION_TARGETS = [
  { count: 50, glyph: 'star' },
  { count: 100, glyph: 'star' },
  { count: 365, glyph: 'gem' },
] as const;
export const RECORD_DAY_WORDS = 500;
export const QUICK_GOAL_MAX_SEC = 600;
export const LONG_SESSION_SEC = 1800;
export const EARLY_BIRD_BEFORE_HOUR = 9;
export const NIGHT_OWL_FROM_HOUR = 21;
export const WITCHING_BEFORE_HOUR = 3;
// A gap of strictly more days than this earns a "welcome back".
export const WELCOME_BACK_GAP_DAYS = 3;

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
  const earlyOn = Object.keys(hours).some((h) => parseInt(h, 10) < EARLY_BIRD_BEFORE_HOUR && hours[h] > 0);
  const lateOn = Object.keys(hours).some((h) => parseInt(h, 10) >= NIGHT_OWL_FROM_HOUR && hours[h] > 0);
  const witchingOn = Object.keys(hours).some((h) => parseInt(h, 10) < WITCHING_BEFORE_HOUR && hours[h] > 0);
  const dblK = goal > 0 ? keysAsc.find((k) => words(entries[k]) >= goal * 2) : null;
  const boltK =
    goal > 0
      ? keysAsc.find((k) => words(entries[k]) >= goal && (times[k] || 0) > 0 && times[k] < QUICK_GOAL_MAX_SEC)
      : null;
  const longK = keysAsc.find((k) => (times[k] || 0) >= LONG_SESSION_SEC);
  const trophyAt = LIFETIME_TARGETS[LIFETIME_TARGETS.length - 1];

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
      items: STREAK_TARGETS.map((t, i) => ({
        glyph: 'flame',
        label: t + ' days',
        earned: lgStreak >= t,
        req: 'Write ' + t + ' days in a row',
        when: dOf(streakCrossKey(entries, t)),
        ...(i > 0 ? { mult: '×' + (i + 1) } : {}),
      })),
    },
    {
      name: 'Big days',
      items: [
        { glyph: 'bolt', label: 'Quick goal', earned: !!boltK, req: 'Hit your goal in under 10 minutes', when: dOf(boltK) },
        { glyph: 'hourglass', label: 'Long session', earned: !!longK, req: 'Write for 30 minutes in a day', when: dOf(longK) },
        { glyph: 'ball', label: 'Double goal', earned: !!dblK, req: 'Write twice your goal in a day', when: dOf(dblK) },
        {
          glyph: 'heart',
          label: 'Record day',
          earned: best >= RECORD_DAY_WORDS,
          req: 'Write ' + RECORD_DAY_WORDS + ' words in a day',
          when: dOf(keysAsc.find((k) => words(entries[k]) >= RECORD_DAY_WORDS)),
        },
      ],
    },
    {
      name: 'Lifetime',
      items: LIFETIME_TARGETS.map((t) => ({
        glyph: t === trophyAt ? 'trophy' : 'medal',
        label: t / 1000 + 'k words',
        earned: total >= t,
        req: 'Reach ' + t.toLocaleString('en-US') + ' lifetime words',
        when: dOf(lifetimeCrossKey(entries, t)),
      })),
    },
    {
      name: 'Collection',
      items: [
        ...COLLECTION_TARGETS.map((t) => ({
          glyph: t.glyph,
          label: t.count + ' entries',
          earned: keysAsc.length >= t.count,
          req: 'Write ' + t.count + ' entries',
          when: dOf(keysAsc[t.count - 1]),
        })),
        { glyph: 'cake', label: 'Anniversary', earned: span >= 365, req: 'A full year of journaling since your first entry', when: firstK ? dateOf(keyShift(firstK, 365)) : null },
      ],
    },
  ];
}

// Milestone days for the year heatmap: day key → glyph + label. Colour
// is the consumer's business (glyphs.ts is a presentation table).
export function milestoneDays(groups: MilestoneGroup[]): Record<DayKey, { glyph: string; label: string }> {
  const out: Record<DayKey, { glyph: string; label: string }> = {};
  groups.forEach((g) =>
    g.items.forEach((m) => {
      if (m.earned && m.when instanceof Date) {
        const iso = keyOf(m.when);
        if (!out[iso]) out[iso] = { glyph: m.glyph, label: m.label };
      }
    }),
  );
  return out;
}

// ── Celebrations ────────────────────────────────────────────────
// What did this edit just earn? Pure: the caller passes the store
// state from BEFORE the edit plus the new text, and gets back glyph
// proposals (highest-priority one wins inside the tile).

export interface Celebration {
  name: GlyphName;
  ms: number;
}

export interface EditContext {
  entries: Entries; // state BEFORE this edit
  dayKey: DayKey;
  newText: string;
  goal: number;
  daySeconds: number; // seconds already written on dayKey
  longSessionSeen?: boolean; // caller's once-per-day hourglass guard
  now?: Date;
}

export function celebrationsFor(ctx: EditContext): Celebration[] {
  const { entries, dayKey, newText, goal, daySeconds } = ctx;
  const now = ctx.now ?? new Date();
  const prevW = words(entries[dayKey]);
  const newW = words(newText);
  const after: Entries = { ...entries, [dayKey]: newText };
  const out: Celebration[] = [];

  // First words of the day: an arrival glyph, plus anything the new
  // entry itself completes (collection targets, anniversary, streaks).
  if (prevW === 0 && newW > 0) {
    const h = now.getHours();
    const priorKeys = entryKeys(entries).filter((k) => k < dayKey);
    const prior = priorKeys[priorKeys.length - 1];
    const gapDays = prior ? daysBetween(prior, dayKey) : 0;
    const d = dateOf(dayKey);
    if (d.getMonth() === 0 && d.getDate() === 1) out.push({ name: 'confetti ball', ms: 4200 });
    else if (gapDays > WELCOME_BACK_GAP_DAYS) out.push({ name: 'welcome back', ms: 4400 });
    else if (h < WITCHING_BEFORE_HOUR) out.push({ name: 'bat', ms: 2400 });
    else if (h < EARLY_BIRD_BEFORE_HOUR) out.push({ name: 'sun', ms: 2000 });
    else if (h >= NIGHT_OWL_FROM_HOUR) out.push({ name: 'moon', ms: 2000 });
    else out.push({ name: 'smiley', ms: 2400 });

    const newCount = entryKeys(after).length;
    const hit = COLLECTION_TARGETS.find((t) => t.count === newCount);
    if (hit) out.push({ name: hit.glyph, ms: hit.glyph === 'gem' ? 4000 : 3600 });

    const first = priorKeys[0];
    if (first) {
      const f = dateOf(first);
      if (f.getMonth() === d.getMonth() && f.getDate() === d.getDate() && d.getFullYear() > f.getFullYear())
        out.push({ name: 'cake', ms: 4000 });
    }

    // Streaks are counted in days written, so they extend on first
    // words — weekly cadence, which covers every streak milestone.
    // Measured at the edited day, not today: filling an old gap only
    // celebrates the run that day actually completes.
    const stk = runEndingAt(after, dayKey);
    if (stk >= 7 && (stk % 7 === 0 || (STREAK_TARGETS as readonly number[]).includes(stk)))
      out.push({ name: 'flame', ms: 3200 });
  }

  // Goal crossings (bolt matches the Quick-goal milestone's clock;
  // the confetti ball matches Double goal's glyph).
  if (goal > 0 && prevW < goal && newW >= goal)
    out.push({ name: daySeconds < QUICK_GOAL_MAX_SEC ? 'bolt' : 'confetti', ms: 3200 });
  if (goal > 0 && prevW < goal * 2 && newW >= goal * 2) out.push({ name: 'confetti ball', ms: 3600 });

  // Lifetime total and best-other-day in ONE pass — this runs on every
  // keystroke, so it must not scan the journal more than once.
  let prevTotal = 0;
  let prevBest = 0;
  for (const k of Object.keys(entries)) {
    const w = words(entries[k]);
    prevTotal += w;
    if (k !== dayKey && w > prevBest) prevBest = w;
  }

  // Record day: edge-triggered when this edit makes today the best
  // day at or beyond the milestone's bar.
  const wasRecord = prevW > prevBest && prevW >= RECORD_DAY_WORDS;
  const isRecord = newW > prevBest && newW >= RECORD_DAY_WORDS;
  if (isRecord && !wasRecord) out.push({ name: 'heart', ms: 3000 });

  // Lifetime targets, trophy on the last.
  const newTotal = prevTotal - prevW + newW;
  const trophyAt = LIFETIME_TARGETS[LIFETIME_TARGETS.length - 1];
  for (const t of LIFETIME_TARGETS)
    if (prevTotal < t && newTotal >= t)
      out.push(t === trophyAt ? { name: 'trophy', ms: 4400 } : { name: 'medal', ms: 4000 });

  // Long session, once per day (the caller keeps the guard).
  if (daySeconds >= LONG_SESSION_SEC && !ctx.longSessionSeen && newW > prevW)
    out.push({ name: 'hourglass', ms: 3600 });

  return out;
}

// Consecutive written days ending at `dayKey` — the run this edit just
// extended. (currentStreak only ever measures the run ending today.)
function runEndingAt(entries: Entries, dayKey: DayKey): number {
  let n = 0;
  let k = dayKey;
  while (words(entries[k]) > 0) {
    n++;
    k = keyShift(k, -1);
  }
  return n;
}
