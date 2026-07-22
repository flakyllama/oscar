// Oscar's usage analytics: a deliberately tiny, content-free layer over
// Umami (privacy-first, cookieless, no personal data).
//
// The rule that makes this safe to ship inside a private journal: the ONLY
// thing that can be sent is one of the `AnalyticsEvent` variants below —
// event names plus enums and counts. There is no code path that passes
// entry text, titles, search terms, or day keys, and the type system won't
// let one exist. If it isn't in this union, it can't be tracked.
//
// It runs for all production usage — there is no per-user opt-in. Nothing
// loads or sends unless both hold:
//   1. a Umami endpoint is configured at build time (VITE_UMAMI_* below),
//   2. the browser isn't asking for Do Not Track.
// Umami's own script auto-tracks a single anonymous pageview per load
// (the "visit"); these custom events add feature-usage on top.

import type { View } from '../types';

// The allowlist. Every trackable event and its exact, content-free shape.
type AnalyticsEvent =
  | { name: 'view_changed'; view: View }
  | { name: 'writing_session'; words: number; minutes: number }
  | { name: 'day_cleared' }
  | { name: 'sync_enabled'; backend: 'cloud' | 'file' }
  | { name: 'sync_disabled' }
  | { name: 'passcode_set' }
  | { name: 'passcode_removed' }
  | { name: 'export_used' } // JSON backup download
  | { name: 'import_used' };

type EventData = Record<string, string | number | boolean>;

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

let enabled = false;
let injected = false;
let queue: AnalyticsEvent[] = [];

// Called once by App on mount. Turns analytics on for all production usage
// where a Umami endpoint is configured, unless the browser asks for Do Not
// Track. There is no per-user opt-in.
export function initAnalytics(): void {
  enabled = analyticsConfigured() && !doNotTrack();
  if (enabled && !injected) inject();
}

function inject(): void {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = SRC;
  s.setAttribute('data-website-id', WEBSITE_ID);
  s.setAttribute('data-do-not-track', 'true'); // belt-and-suspenders
  s.addEventListener('load', flush);
  document.head.appendChild(s);
}

function send(event: AnalyticsEvent): void {
  const { name, ...data } = event;
  window.umami?.track(name, data as EventData);
}

function flush(): void {
  if (!window.umami) return;
  const pending = queue;
  queue = [];
  pending.forEach(send);
}

export function track(event: AnalyticsEvent): void {
  if (!enabled || typeof window === 'undefined') return;
  // Events fired before the tracker finished loading are queued and flushed
  // on its `load`, so the first interactions of a session aren't dropped.
  if (window.umami) send(event);
  else queue.push(event);
}
