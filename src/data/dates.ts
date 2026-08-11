// Day keys are LOCAL-date based ('YYYY-MM-DD' in the user's timezone).
// The prototype derived keys via Date#toISOString(), which shifts entries
// to the previous/next day for anyone west/east of UTC near midnight —
// all arithmetic here works on local calendar dates instead.

export type DayKey = string;

export function keyOf(d: Date): DayKey {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function todayKey(now: Date = new Date()): DayKey {
  return keyOf(now);
}

// Date-part construction (not ms arithmetic) so DST transitions can't
// skip or double a day.
export function keyFromOffset(offset: number, now: Date = new Date()): DayKey {
  return keyOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset));
}

export function dateOf(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function keyShift(key: DayKey, delta: number): DayKey {
  const d = dateOf(key);
  return keyOf(new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta));
}

// Whole calendar days between two keys (b - a), DST-safe via UTC anchors.
export function daysBetween(a: DayKey, b: DayKey): number {
  const da = dateOf(a);
  const db = dateOf(b);
  return Math.round(
    (Date.UTC(db.getFullYear(), db.getMonth(), db.getDate()) -
      Date.UTC(da.getFullYear(), da.getMonth(), da.getDate())) /
      86400000,
  );
}

// Offset of a key relative to today (negative = past).
export function offsetOf(key: DayKey, now: Date = new Date()): number {
  return daysBetween(todayKey(now), key);
}

// ── Calendar vocabulary ─────────────────────────────────────────
// The one home for month/weekday names, so screens don't redeclare
// them (they used to exist in nine files).

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
