import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionTracker, SESSION_IDLE_MS } from './session';
import type { SessionRecord } from './store';

function recorder() {
  const seconds: Array<{ dayKey: string; seconds: number }> = [];
  const sessions: SessionRecord[] = [];
  return {
    seconds,
    sessions,
    sink: {
      addSeconds: (dayKey: string, s: number) => seconds.push({ dayKey, seconds: s }),
      addSession: (rec: SessionRecord) => sessions.push(rec),
    },
  };
}

describe('SessionTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 10, 12, 0, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('accrues one second per tick while typing is recent on the active day', () => {
    const r = recorder();
    const t = new SessionTracker(r.sink);
    t.start();
    t.setActiveDay('2026-06-10');
    t.noteTyping('2026-06-10', 5);
    vi.advanceTimersByTime(5000);
    expect(r.seconds).toHaveLength(5);
    expect(r.seconds[0]).toEqual({ dayKey: '2026-06-10', seconds: 1 });
    t.stop();
  });

  it('stops accruing when the writer is looking at another day or view', () => {
    const r = recorder();
    const t = new SessionTracker(r.sink);
    t.start();
    t.setActiveDay(null); // e.g. on the Stats screen
    t.noteTyping('2026-06-10', 5);
    vi.advanceTimersByTime(5000);
    expect(r.seconds).toHaveLength(0);
    t.stop();
  });

  it('finalizes after the idle window with the words added and the last-type end', () => {
    const r = recorder();
    const t = new SessionTracker(r.sink);
    t.start();
    t.setActiveDay('2026-06-10');
    const start = Date.now();
    t.noteTyping('2026-06-10', 1); // opening keystroke: startWords 0
    vi.advanceTimersByTime(4000);
    t.noteTyping('2026-06-10', 12);
    const lastType = Date.now();
    vi.advanceTimersByTime(SESSION_IDLE_MS + 1000);
    expect(r.sessions).toHaveLength(1);
    expect(r.sessions[0]).toEqual({ dayKey: '2026-06-10', start, end: lastType, words: 12 });
    // No further accrual once finalized.
    const accrued = r.seconds.length;
    vi.advanceTimersByTime(5000);
    expect(r.seconds).toHaveLength(accrued);
    t.stop();
  });

  it('rotates the session when the day changes mid-stream', () => {
    const r = recorder();
    const t = new SessionTracker(r.sink);
    t.start();
    t.noteTyping('2026-06-09', 8); // startWords 7
    vi.advanceTimersByTime(2000);
    t.noteTyping('2026-06-09', 10);
    t.noteTyping('2026-06-10', 1); // day flip: finalize the 9th, open the 10th
    expect(r.sessions).toHaveLength(1);
    expect(r.sessions[0].dayKey).toBe('2026-06-09');
    expect(r.sessions[0].words).toBe(3); // 10 - 7
    vi.advanceTimersByTime(SESSION_IDLE_MS);
    expect(r.sessions).toHaveLength(2);
    expect(r.sessions[1].dayKey).toBe('2026-06-10');
    t.stop();
  });

  it('ends a rotated session at its own last keystroke, not the next day’s', () => {
    const r = recorder();
    const t = new SessionTracker(r.sink);
    t.start();
    t.noteTyping('2026-06-09', 1);
    vi.advanceTimersByTime(3000);
    t.noteTyping('2026-06-09', 40);
    const lastTypeOn9th = Date.now();
    // Tab left open for hours, then typing resumes on the next day.
    vi.advanceTimersByTime(13 * 3600 * 1000);
    t.noteTyping('2026-06-10', 1);
    expect(r.sessions[0].dayKey).toBe('2026-06-09');
    expect(r.sessions[0].end).toBe(lastTypeOn9th);
    t.stop();
  });

  it('drops sessions that added no words (deleting text only)', () => {
    const r = recorder();
    const t = new SessionTracker(r.sink);
    t.noteTyping('2026-06-10', 0); // deletion: startWords 0, lastWords 0
    t.flush();
    expect(r.sessions).toHaveLength(0);
  });

  it('flush is safe with no open session and start is idempotent', () => {
    const r = recorder();
    const t = new SessionTracker(r.sink);
    t.flush();
    t.start();
    t.start();
    t.setActiveDay('2026-06-10');
    t.noteTyping('2026-06-10', 3);
    vi.advanceTimersByTime(1000);
    expect(r.seconds).toHaveLength(1); // one interval, not two
    t.stop();
  });
});
