import { describe, it, expect } from 'vitest';
import { createAnalytics, type AnalyticsTransport, type EventData } from './analytics';

// The test adapter at the transport seam: records instead of sending.
function recordingTransport(opts: { ready?: boolean } = {}) {
  let isReady = opts.ready ?? true;
  let onReady: (() => void) | null = null;
  const sent: Array<{ name: string; data: EventData }> = [];
  let injections = 0;
  const transport: AnalyticsTransport = {
    inject(cb) {
      injections++;
      onReady = cb;
    },
    ready: () => isReady,
    send: (name, data) => sent.push({ name, data }),
  };
  return {
    transport,
    sent,
    get injections() {
      return injections;
    },
    becomeReady() {
      isReady = true;
      onReady?.();
    },
  };
}

function gate(overrides: { configured?: boolean; dnt?: boolean } = {}) {
  return {
    configured: () => overrides.configured ?? true,
    doNotTrack: () => overrides.dnt ?? false,
  };
}

describe('the consent × DNT × config gate', () => {
  it('sends nothing until syncAnalytics grants consent', () => {
    const t = recordingTransport();
    const a = createAnalytics({ ...gate(), transport: t.transport });
    a.track({ name: 'day_cleared' });
    expect(t.sent).toHaveLength(0);
    a.syncAnalytics(true);
    a.track({ name: 'day_cleared' });
    expect(t.sent).toHaveLength(1);
  });

  it('stays silent when no endpoint is configured at build time', () => {
    const t = recordingTransport();
    const a = createAnalytics({ ...gate({ configured: false }), transport: t.transport });
    a.syncAnalytics(true);
    a.track({ name: 'day_cleared' });
    expect(t.injections).toBe(0);
    expect(t.sent).toHaveLength(0);
  });

  it('respects Do Not Track over the user setting', () => {
    const t = recordingTransport();
    const a = createAnalytics({ ...gate({ dnt: true }), transport: t.transport });
    a.syncAnalytics(true);
    a.track({ name: 'day_cleared' });
    expect(t.injections).toBe(0);
    expect(t.sent).toHaveLength(0);
  });

  it('goes silent again after an opt-out, without re-injecting on re-enable', () => {
    const t = recordingTransport();
    const a = createAnalytics({ ...gate(), transport: t.transport });
    a.syncAnalytics(true);
    a.syncAnalytics(false);
    a.track({ name: 'day_cleared' });
    expect(t.sent).toHaveLength(0);
    a.syncAnalytics(true);
    a.track({ name: 'day_cleared' });
    expect(t.sent).toHaveLength(1);
    expect(t.injections).toBe(1); // the script is only ever injected once
  });
});

describe('event delivery', () => {
  it('sends the event name with its content-free payload', () => {
    const t = recordingTransport();
    const a = createAnalytics({ ...gate(), transport: t.transport });
    a.syncAnalytics(true);
    a.track({ name: 'writing_session', words: 120, minutes: 7 });
    expect(t.sent[0]).toEqual({ name: 'writing_session', data: { words: 120, minutes: 7 } });
  });

  it('queues events fired before the tracker loads, then flushes in order', () => {
    const t = recordingTransport({ ready: false });
    const a = createAnalytics({ ...gate(), transport: t.transport });
    a.syncAnalytics(true);
    a.track({ name: 'view_changed', view: 'stats' });
    a.track({ name: 'day_cleared' });
    expect(t.sent).toHaveLength(0);
    t.becomeReady();
    expect(t.sent.map((s) => s.name)).toEqual(['view_changed', 'day_cleared']);
  });
});
