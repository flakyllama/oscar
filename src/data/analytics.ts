// Oscar's usage analytics: a deliberately tiny, content-free layer over
// Umami (privacy-first, cookieless, no personal data).
//
// The rule that makes this safe to ship inside a private journal: the ONLY
// thing that can be sent is one of the `AnalyticsEvent` variants below —
// event names plus enums and counts. There is no code path that passes
// entry text, titles, search terms, or day keys, and the type system won't
// let one exist. If it isn't in this union, it can't be tracked.
//
// Nothing loads or sends unless all three hold:
//   1. a Umami endpoint is configured at build time (VITE_UMAMI_* below),
//   2. the user hasn't opted out (Settings → Usage analytics; on by default),
//   3. the browser isn't asking for Do Not Track.
// Umami's own script auto-tracks a single anonymous pageview per load
// (the "visit"); these custom events add feature-usage on top.
//
// The runtime sits behind a transport seam: the Umami script adapter in
// production, a recording adapter in analytics.test.ts — which is what
// makes the consent gate and the queue-then-flush path testable.

import type { View } from '../types';

// The allowlist. Every trackable event and its exact, content-free shape.
export type AnalyticsEvent =
  | { name: 'view_changed'; view: View }
  | { name: 'writing_session'; words: number; minutes: number }
  | { name: 'day_cleared' }
  | { name: 'sync_enabled'; backend: 'cloud' | 'file' }
  | { name: 'sync_disabled' }
  | { name: 'passcode_set' }
  | { name: 'passcode_removed' }
  | { name: 'export_used' } // JSON backup download
  | { name: 'import_used' };

export type EventData = Record<string, string | number | boolean>;

interface Umami {
  track: (event: string, data?: EventData) => void;
}
declare global {
  interface Window {
    umami?: Umami;
  }
}

const SRC = ((import.meta.env.VITE_UMAMI_SRC as string | undefined) ?? '').trim();
const WEBSITE_ID = ((import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined) ?? '').trim();

// True when a Umami endpoint is wired up at build time (i.e. a production
// build). Empty in dev, so nothing loads or sends locally.
function analyticsConfigured(): boolean {
  return SRC !== '' && WEBSITE_ID !== '';
}

function doNotTrack(): boolean {
  if (typeof navigator === 'undefined') return false;
  const w = window as unknown as { doNotTrack?: string };
  const n = navigator as Navigator & { msDoNotTrack?: string };
  const dnt = navigator.doNotTrack || w.doNotTrack || n.msDoNotTrack;
  return dnt === '1' || dnt === 'yes';
}

// ── The transport seam ──────────────────────────────────────────

export interface AnalyticsTransport {
  // Load the tracker; call onReady once events can be delivered.
  // Returns false if injection couldn't happen and should be retried.
  inject(onReady: () => void): boolean | void;
  ready(): boolean;
  send(name: string, data: EventData): void;
}

// Production adapter: the Umami script tag.
function umamiTransport(): AnalyticsTransport {
  return {
    // Returns false when there's no document to inject into, so the
    // caller can try again once one exists.
    inject(onReady) {
      if (typeof document === 'undefined') return false;
      const s = document.createElement('script');
      s.async = true;
      s.src = SRC;
      s.setAttribute('data-website-id', WEBSITE_ID);
      s.setAttribute('data-do-not-track', 'true'); // belt-and-suspenders
      s.addEventListener('load', onReady);
      document.head.appendChild(s);
      return true;
    },
    ready: () => typeof window !== 'undefined' && !!window.umami,
    send: (name, data) => window.umami?.track(name, data),
  };
}

// ── The gate + queue, independent of transport ──────────────────

export interface AnalyticsDeps {
  configured(): boolean;
  doNotTrack(): boolean;
  transport: AnalyticsTransport;
}

export function createAnalytics(deps: AnalyticsDeps) {
  let consented = false;
  let injected = false;
  const queue: AnalyticsEvent[] = [];

  const send = (event: AnalyticsEvent) => {
    const { name, ...data } = event;
    deps.transport.send(name, data as EventData);
  };
  // Events fired before the tracker finished loading are queued and
  // flushed on its load, so the first interaction after opt-in isn't
  // dropped.
  const flush = () => {
    if (!deps.transport.ready()) return;
    while (queue.length) send(queue.shift()!);
  };

  return {
    // Called by App on mount and whenever the setting changes. Injects the
    // tracker the first time it's enabled; a later opt-out just stops events
    // (the already-loaded script can't be unloaded, but it goes silent).
    syncAnalytics(enabled: boolean): void {
      consented = enabled && deps.configured() && !deps.doNotTrack();
      // Only latch when the injection actually happened — a no-op
      // injection (no document yet) must stay retryable.
      if (consented && !injected) injected = deps.transport.inject(flush) !== false;
    },
    track(event: AnalyticsEvent): void {
      if (!consented) return;
      if (deps.transport.ready()) send(event);
      else queue.push(event);
    },
  };
}

// The app-wide instance, wired to the real gate and the Umami adapter.
const analytics = createAnalytics({
  configured: analyticsConfigured,
  doNotTrack,
  transport: umamiTransport(),
});

export function syncAnalytics(enabled: boolean): void {
  analytics.syncAnalytics(enabled);
}

export function track(event: AnalyticsEvent): void {
  analytics.track(event);
}
