import { describe, it, expect } from 'vitest';
import { keyOf, todayKey, keyFromOffset, dateOf, keyShift, daysBetween, offsetOf } from './dates';

describe('day keys are local-date based', () => {
  it('uses the local calendar date, not UTC (the prototype bug)', () => {
    // 2026-07-16 00:30 local. In any timezone west of UTC,
    // toISOString() would yield 2026-07-15 — keyOf must not.
    const d = new Date(2026, 6, 16, 0, 30);
    expect(keyOf(d)).toBe('2026-07-16');
  });

  it('keeps the same key across the whole local day', () => {
    expect(keyOf(new Date(2026, 6, 16, 0, 0, 0))).toBe('2026-07-16');
    expect(keyOf(new Date(2026, 6, 16, 23, 59, 59))).toBe('2026-07-16');
  });

  it('rolls over exactly at local midnight', () => {
    expect(keyOf(new Date(2026, 6, 15, 23, 59, 59))).toBe('2026-07-15');
    expect(keyOf(new Date(2026, 6, 16, 0, 0, 0))).toBe('2026-07-16');
  });

  it('pads months and days', () => {
    expect(keyOf(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('keyFromOffset', () => {
  const base = new Date(2026, 6, 16, 12, 0);

  it('walks calendar days', () => {
    expect(keyFromOffset(0, base)).toBe('2026-07-16');
    expect(keyFromOffset(-1, base)).toBe('2026-07-15');
    expect(keyFromOffset(-16, base)).toBe('2026-06-30');
  });

  it('crosses month and year boundaries', () => {
    expect(keyFromOffset(-197, base)).toBe('2025-12-31');
  });

  it('is not skewed by DST transitions (spring forward, US)', () => {
    // 2026-03-08 is the US spring-forward date (23-hour day).
    // Millisecond arithmetic (±86400000) from Mar 9 would land on
    // Mar 7 23:00 and produce the wrong key in some approaches.
    const afterDst = new Date(2026, 2, 9, 0, 30);
    expect(keyFromOffset(-1, afterDst)).toBe('2026-03-08');
    expect(keyFromOffset(-2, afterDst)).toBe('2026-03-07');
  });

  it('is not skewed by DST transitions (fall back, US)', () => {
    // 2026-11-01 is the US fall-back date (25-hour day).
    const afterDst = new Date(2026, 10, 2, 0, 30);
    expect(keyFromOffset(-1, afterDst)).toBe('2026-11-01');
    expect(keyFromOffset(-2, afterDst)).toBe('2026-10-31');
  });
});

describe('daysBetween / offsetOf / keyShift', () => {
  it('daysBetween counts whole calendar days across DST', () => {
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2); // spans spring-forward
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2); // spans fall-back
    expect(daysBetween('2026-07-16', '2026-07-15')).toBe(-1);
  });

  it('keyShift moves by calendar days across boundaries', () => {
    expect(keyShift('2026-03-08', 1)).toBe('2026-03-09');
    expect(keyShift('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('offsetOf is negative for the past', () => {
    const now = new Date(2026, 6, 16, 9, 0);
    expect(offsetOf('2026-07-16', now)).toBe(0);
    expect(offsetOf('2026-07-01', now)).toBe(-15);
  });

  it('dateOf round-trips with keyOf', () => {
    expect(keyOf(dateOf('2026-07-16'))).toBe('2026-07-16');
    expect(todayKey(new Date(2026, 6, 16, 23, 59))).toBe('2026-07-16');
  });
});
