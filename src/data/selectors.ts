import { type DayKey, keyFromOffset, keyShift, daysBetween, todayKey } from './dates';

export type Entries = Record<DayKey, string>;
export type Times = Record<DayKey, number>;
export type Hours = Record<string, number>;

export function words(text: string | undefined | null): number {
  const s = (text || '').trim();
  return s ? s.split(/\s+/).length : 0;
}

// Keys of non-empty entries, ascending.
export function entryKeys(entries: Entries): DayKey[] {
  return Object.keys(entries)
    .filter((k) => words(entries[k]) > 0)
    .sort();
}

// Consecutive days written ending today (or yesterday if today is empty).
export function currentStreak(entries: Entries, now: Date = new Date()): number {
  const has = (off: number) => words(entries[keyFromOffset(off, now)]) > 0;
  let n = 0;
  const start = has(0) ? 0 : -1;
  while (has(start - n)) n++;
  return n;
}

export function longestStreak(entries: Entries): number {
  const has = (k: DayKey) => words(entries[k]) > 0;
  const keys = Object.keys(entries).filter(has).sort();
  let best = 0;
  keys.forEach((k) => {
    if (has(keyShift(k, -1))) return;
    let len = 1;
    while (has(keyShift(k, len))) len++;
    best = Math.max(best, len);
  });
  return best;
}

export function totalWords(entries: Entries): number {
  return entryKeys(entries).reduce((a, k) => a + words(entries[k]), 0);
}

export function bestDayWords(entries: Entries): number {
  return entryKeys(entries).reduce((a, k) => Math.max(a, words(entries[k])), 0);
}

export function bestDayKey(entries: Entries): DayKey | null {
  const keys = entryKeys(entries);
  if (!keys.length) return null;
  return keys.reduce((a, k) => (words(entries[k]) > words(entries[a]) ? k : a), keys[0]);
}

// Per-hour histogram comes straight from the stored hours map; this
// normalizes string keys and fills the 24 buckets.
export function hourHistogram(hours: Hours): number[] {
  const out = new Array(24).fill(0);
  Object.keys(hours).forEach((h) => {
    const i = parseInt(h, 10);
    if (i >= 0 && i < 24) out[i] = hours[h] || 0;
  });
  return out;
}

export function goldenHour(hours: Hours): number | null {
  let best: number | null = null;
  let bw = 0;
  hourHistogram(hours).forEach((v, h) => {
    if (v > bw) {
      bw = v;
      best = h;
    }
  });
  return best;
}

export const STOPWORDS = new Set(
  "the,a,an,and,or,but,of,to,in,on,at,is,it,was,i,my,me,for,with,that,this,as,be,are,so,we,he,she,they,you,his,her,them,by,from,not,no,had,have,has,were,been,than,then,there,their,what,when,where,which,who,will,would,could,should,do,did,done,also,just,now,out,up,down,into,over,after,before,about,one,two,its,im,it's,don't,i'm,i've,i'll,i'd,that's,didn't,can't,won't,wasn't,isn't,there's,here's,you're,we're,they're,doesn't,haven't,hasn't,couldn't,wouldn't,shouldn't,let's,what's,she's,he's,who's,aren't,weren't,you'll,you've,we'll,we've,they've,they'll".split(
    ',',
  ),
);

export function vocabulary(entries: Entries): {
  topWord: string | null;
  topCount: number;
  distinct: number;
} {
  const freq: Record<string, number> = {};
  const uniq = new Set<string>();
  entryKeys(entries).forEach((k) => {
    (entries[k].toLowerCase().match(/[a-z']+/g) || []).forEach((w) => {
      uniq.add(w);
      if (!STOPWORDS.has(w) && w.length > 2) freq[w] = (freq[w] || 0) + 1;
    });
  });
  let topWord: string | null = null;
  let topCount = 0;
  Object.keys(freq).forEach((w) => {
    if (freq[w] > topCount) {
      topCount = freq[w];
      topWord = w;
    }
  });
  return { topWord, topCount, distinct: uniq.size };
}

export const FORECAST_TARGETS = [
  1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000,
];

// Last-14-day pace → ETA for the next round lifetime target.
export function forecast(
  entries: Entries,
  now: Date = new Date(),
): { pace: number; target: number; eta: Date } | null {
  let recent14 = 0;
  for (let i = 0; i < 14; i++) recent14 += words(entries[keyFromOffset(-i, now)]);
  const pace = recent14 / 14;
  const total = totalWords(entries);
  const target = FORECAST_TARGETS.find((t) => t > total);
  if (pace < 5 || !target) return null;
  const eta = new Date(now);
  eta.setDate(eta.getDate() + Math.ceil((target - total) / pace));
  return { pace, target, eta };
}

// First key at/after which the cumulative word count crossed `threshold`.
export function lifetimeCrossKey(entries: Entries, threshold: number): DayKey | null {
  let cum = 0;
  for (const k of entryKeys(entries)) {
    cum += words(entries[k]);
    if (cum >= threshold) return k;
  }
  return null;
}

// First key that completed a run of `days` consecutive written days.
export function streakCrossKey(entries: Entries, days: number): DayKey | null {
  let run = 0;
  let prev: DayKey | null = null;
  for (const k of entryKeys(entries)) {
    run = prev && daysBetween(prev, k) === 1 ? run + 1 : 1;
    prev = k;
    if (run >= days) return k;
  }
  return null;
}

export function spanDays(entries: Entries, now: Date = new Date()): number {
  const first = entryKeys(entries)[0];
  return first ? daysBetween(first, todayKey(now)) : 0;
}
