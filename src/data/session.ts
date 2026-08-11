// The writing-session module: one home for the session lifecycle that
// used to be spread across App.tsx (a ref, a 1s interval and three
// callbacks). The editor reports keystrokes with `noteTyping`; this
// module accrues per-day seconds, rotates the session when the day
// changes, finalizes it after the idle window (or on unload), and
// fires the `writing_session` analytics event itself.

import { track } from './analytics';
import type { SessionRecord } from './store';
import { getStore } from './store';

// Typing pauses end a session after this long, and per-second time
// stops accruing at the same moment.
export const SESSION_IDLE_MS = 15000;
const TICK_MS = 1000;

// Where finished sessions and accrued seconds land (the store in prod,
// a recorder in tests).
export interface SessionSink {
  addSeconds(dayKey: string, seconds: number): void;
  addSession(rec: SessionRecord): void;
}

export class SessionTracker {
  private session: { dayKey: string; start: number; startWords: number; lastWords: number } | null = null;
  private lastTypeAt = 0;
  private activeDay: string | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private sink: SessionSink) {}

  start() {
    if (!this.timer) this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Seconds accrue only while the writer is looking at the typed day's
  // editor; the shell keeps this current (null when off the editor).
  setActiveDay(dayKey: string | null) {
    this.activeDay = dayKey;
  }

  noteTyping(dayKey: string, wordCount: number) {
    const now = Date.now();
    this.lastTypeAt = now;
    if (this.session && this.session.dayKey !== dayKey) this.flush();
    if (!this.session) {
      // The keystroke that opens a session already added a word;
      // starting one below keeps that word inside the session.
      this.session = { dayKey, start: now, startWords: wordCount > 0 ? wordCount - 1 : 0, lastWords: wordCount };
    } else {
      this.session.lastWords = wordCount;
    }
  }

  // Finalize the open session (idle timeout, day change, unload).
  // Sessions that added no words are dropped, matching the old shell.
  flush() {
    const s = this.session;
    if (!s) return;
    this.session = null;
    const w = Math.max(0, s.lastWords - s.startWords);
    if (w > 0) {
      this.sink.addSession({ dayKey: s.dayKey, start: s.start, end: this.lastTypeAt, words: w });
      track({ name: 'writing_session', words: w, minutes: Math.round((this.lastTypeAt - s.start) / 60000) });
    }
  }

  private tick() {
    const s = this.session;
    if (!s) return;
    const idle = Date.now() - this.lastTypeAt;
    if (idle >= SESSION_IDLE_MS) {
      this.flush();
    } else if (this.activeDay === s.dayKey) {
      this.sink.addSeconds(s.dayKey, 1);
    }
  }
}

let singleton: SessionTracker | null = null;
export function getSessionTracker(): SessionTracker {
  if (!singleton) {
    const store = getStore();
    singleton = new SessionTracker({
      addSeconds: (k, s) => store.addSeconds(k, s),
      addSession: (r) => store.addSession(r),
    });
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => singleton!.flush());
    }
  }
  return singleton;
}
