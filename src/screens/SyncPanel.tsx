// The Sync card in Settings. Cloud is the only path in the UI now (works in
// every browser, zero-knowledge); the file backend stays in the engine but
// is no longer surfaced. Connected devices are read from the synced
// registry. Layout and copy match the Oscar.dc.html prototype.

import { useState, useSyncExternalStore, type CSSProperties } from 'react';
import { getStore } from '../data/store';
import { useStoreState } from '../data/useStore';
import { track } from '../data/analytics';
import { isHandheld } from '../data/device';
import { dateOf, MONTHS } from '../data/dates';
import { getSyncEngine } from '../sync/engine';

const card: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 16,
};
const ghost: CSSProperties = {
  boxSizing: 'border-box',
  height: 32,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0 12px',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  background: 'transparent',
  color: 'var(--fg)',
  whiteSpace: 'nowrap',
};
const primary: CSSProperties = {
  ...ghost,
  background: 'var(--accent)',
  borderColor: 'transparent',
  color: '#fff',
};
const input: CSSProperties = {
  fontWeight: 400,
  boxSizing: 'border-box',
  height: 32,
  flex: 1,
  minWidth: 0,
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '6px 10px',
  color: 'var(--fg)',
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  outlineColor: 'var(--accent)',
};

function agoLabel(t: number): string {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return Math.round(s / 60) + 'm ago';
  if (s < 86400) return Math.round(s / 3600) + 'h ago';
  return Math.round(s / 86400) + 'd ago';
}

const KeyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
    <circle cx="16.5" cy="7.5" r="0.5" fill="currentColor" />
  </svg>
);
const CloudIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </svg>
);
const ComputerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);

export function SyncPanel() {
  const store = getStore();
  const state = useStoreState();
  const engine = getSyncEngine();
  const sync = useSyncExternalStore(engine.subscribe, engine.getStatus);

  const [endpoint, setEndpoint] = useState(engine.cloudEndpointDefault());
  const [keyInput, setKeyInput] = useState('');
  const [enteringKey, setEnteringKey] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const pending = Object.keys(state.pendingSync).length;
  const lastSyncAt = state.syncMeta.lastSyncAt;
  const needEndpoint = engine.cloudEndpointDefault() === '';
  const selfId = state.syncMeta.deviceId;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setMsg(err instanceof Error ? err.message : 'Something went wrong.');
      }
    } finally {
      setBusy(false);
    }
  };

  // One path for "connect with a pasted key" — the Enter key and the
  // Connect button share it, so sync_enabled can't fire twice.
  const connectWithKey = () =>
    run(async () => {
      await engine.connectCloudWithKey(keyInput.trim(), endpoint.trim());
      setKeyInput('');
      setEnteringKey(false);
      track({ name: 'sync_enabled', backend: 'cloud' });
    });

  const copyKey = (k: string) => {
    try {
      navigator.clipboard.writeText(k);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the key is visible to copy manually */
    }
  };

  const caption = !sync.connected
    ? 'One key connects every device — set up here, enter it there.'
    : sync.needsPermission
      ? `${sync.label} — permission needed after reload`
      : (sync.kind === 'cloud' ? 'Cloud' : sync.label) +
        (lastSyncAt ? ` · synced ${agoLabel(lastSyncAt)}` : '') +
        (pending ? ` · ${pending} pending` : sync.syncing ? ' · syncing…' : '');

  const choosing = !sync.connected && !enteringKey;
  const devices = Object.values(state.devices).sort((a, b) => {
    if (a.id === selfId) return -1;
    if (b.id === selfId) return 1;
    return b.lastSyncAt - a.lastSyncAt;
  });

  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: 28, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <div className="t-body-strong">Sync across devices</div>
          <div
            className="t-caption"
            style={{ color: sync.error ? 'var(--danger)' : 'var(--muted)', marginTop: 4, maxWidth: 380 }}
          >
            {sync.error || caption}
          </div>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch' }}>
          {/* Disconnected: choose a way in. */}
          {choosing && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={ghost} disabled={busy} onClick={() => setEnteringKey(true)}>
                <KeyIcon />
                Enter key
              </button>
              <button
                style={primary}
                disabled={busy || (needEndpoint && !endpoint.trim())}
                onClick={() =>
                  run(async () => {
                    await engine.connectCloudNew(endpoint.trim());
                    setRevealedKey(engine.cloudSyncKey());
                    track({ name: 'sync_enabled', backend: 'cloud' });
                  })
                }
              >
                <CloudIcon />
                Set up cloud sync
              </button>
            </div>
          )}

          {/* Connected: sync / disconnect, with a subtle key reveal beneath. */}
          {sync.connected && !sync.needsPermission && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={ghost} disabled={busy || sync.syncing} onClick={() => engine.syncNow()}>
                  {sync.syncing ? 'Syncing…' : 'Sync now'}
                </button>
                <button
                  style={{ ...ghost, color: 'var(--muted)' }}
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await engine.disconnect();
                      setRevealedKey(null);
                      setEnteringKey(false);
                      track({ name: 'sync_disabled' });
                    })
                  }
                >
                  Disconnect
                </button>
              </div>
              {sync.kind === 'cloud' && !revealedKey && (
                <button
                  onClick={() => setRevealedKey(engine.cloudSyncKey())}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    color: 'var(--muted)',
                  }}
                >
                  Show sync key
                </button>
              )}
            </div>
          )}

          {sync.connected && sync.needsPermission && (
            <button style={primary} disabled={busy} onClick={() => run(() => engine.reconnect())}>
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Endpoint (only when the API isn't same-origin, e.g. a self-hosted worker). */}
      {!sync.connected && needEndpoint && (
        <input
          type="url"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="https://your-worker.workers.dev"
          style={{ ...input, flex: 'unset', width: '100%', fontFamily: 'var(--font-sans)', fontSize: 14 }}
        />
      )}

      {/* Just set up: prompt to save the key. */}
      {sync.connected && sync.kind === 'cloud' && revealedKey && (
        <div className="t-caption" style={{ color: 'var(--accent)', textWrap: 'pretty' }}>
          Sync is on. Save this key somewhere safe — it's the only way to reach your journal from another device, and
          it can't be recovered.
        </div>
      )}

      {/* Key reveal row (connected + cloud). */}
      {sync.connected && sync.kind === 'cloud' && revealedKey && (
        <KeyReveal syncKey={revealedKey} copied={copied} onCopy={() => copyKey(revealedKey)} />
      )}

      {/* Enter an existing key. */}
      {enteringKey && !sync.connected && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && keyInput.trim() && !(needEndpoint && !endpoint.trim())) {
                connectWithKey();
              }
            }}
            placeholder="oscar1-…"
            style={input}
          />
          <button
            style={primary}
            disabled={busy || !keyInput.trim() || (needEndpoint && !endpoint.trim())}
            onClick={connectWithKey}
          >
            Connect
          </button>
          <button style={ghost} disabled={busy} onClick={() => setEnteringKey(false)}>
            Cancel
          </button>
        </div>
      )}

      {msg && (
        <div className="t-caption" style={{ color: 'var(--danger)' }}>
          {msg}
        </div>
      )}

      {/* Connected devices, read from the synced registry. */}
      {sync.connected && devices.length > 0 && (
        <>
          <div style={{ borderTop: '1px solid var(--border)', margin: '4px -16px 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 2 }}>
            <div className="t-eyebrow-sm" style={{ fontSize: 10, color: 'var(--muted-2)' }}>
              Connected devices
            </div>
            {devices.map((dv) => {
              const added = new Date(dv.addedAt);
              const isSelf = dv.id === selfId;
              return (
                <div key={dv.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {isHandheld(dv.platform) ? <PhoneIcon /> : <ComputerIcon />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t-body" style={{ fontSize: 13, fontWeight: 500 }}>
                      {dv.platform}
                    </div>
                    <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 1 }}>
                      {dv.browser} · added {MONTHS[added.getMonth()]} {added.getDate()}
                    </div>
                  </div>
                  {isSelf ? (
                    <span
                      className="t-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--accent)',
                        background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                        borderRadius: 5,
                        padding: '2px 7px',
                        flexShrink: 0,
                      }}
                    >
                      This device
                    </span>
                  ) : (
                    <span className="t-caption" style={{ color: 'var(--muted-2)', flexShrink: 0 }}>
                      synced {agoLabel(dv.lastSyncAt)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Conflicts (both devices edited the same day). */}
      {state.syncConflicts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px dashed var(--border)', paddingTop: 12 }}>
          <div className="t-caption" style={{ color: 'var(--muted)' }}>
            Edited on two devices at once:
          </div>
          {state.syncConflicts.map((c) => {
            const dd = dateOf(c.dayKey);
            return (
              <div key={c.dayKey} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="t-mono" style={{ fontSize: 12, color: 'var(--danger)', minWidth: 90 }}>
                  {MONTHS[dd.getMonth()]} {dd.getDate()}, {dd.getFullYear()}
                </span>
                <span
                  className="t-caption"
                  style={{ color: 'var(--muted-2)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  kept {c.kept === 'local' ? 'this device' : 'the other device'} · other: {c.loserText.split('\n')[0] || '(cleared)'}
                </span>
                <button style={{ ...ghost, height: 26, fontSize: 11 }} onClick={() => store.restoreConflictVersion(c.dayKey)}>
                  Keep other
                </button>
                <button style={{ ...ghost, height: 26, fontSize: 11, color: 'var(--muted)' }} onClick={() => store.dismissSyncConflict(c.dayKey)}>
                  Dismiss
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KeyReveal({ syncKey, copied, onCopy }: { syncKey: string; copied: boolean; onCopy: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
      <code
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 10px',
          wordBreak: 'break-all',
          color: 'var(--fg)',
        }}
      >
        {syncKey}
      </code>
      <button
        style={{
          boxSizing: 'border-box',
          alignSelf: 'stretch',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '0 12px',
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          background: 'transparent',
          color: 'var(--fg)',
        }}
        onClick={onCopy}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
