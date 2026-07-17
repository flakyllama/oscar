// The Sync card in Settings. Cloud is the primary path (works in every
// browser, zero-knowledge); the File System Access option is offered as
// a no-server fallback where the browser supports it.

import { useState, useSyncExternalStore, type CSSProperties } from 'react';
import { getStore } from '../data/store';
import { useStoreState } from '../data/useStore';
import { dateOf } from '../data/dates';
import { getSyncEngine } from '../sync/engine';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const card: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 16,
};
const ghost: CSSProperties = {
  boxSizing: 'border-box',
  height: 32,
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
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  outlineColor: 'var(--accent)',
};

function agoLabel(t: number): string {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return Math.round(s / 60) + 'm ago';
  if (s < 86400) return Math.round(s / 3600) + 'h ago';
  return Math.round(s / 86400) + 'd ago';
}

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

  // Wrap an engine action: surface errors, ignore the user cancelling a
  // file picker (an AbortError).
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
    ? 'Sync your journal across devices — end-to-end encrypted, so the server never sees your writing.'
    : sync.needsPermission
      ? `${sync.label} — permission needed after reload`
      : `${sync.kind === 'cloud' ? 'Cloud' : sync.label}` +
        (lastSyncAt ? ` · synced ${agoLabel(lastSyncAt)}` : '') +
        (pending ? ` · ${pending} pending` : sync.syncing ? ' · syncing…' : '');

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div className="t-body-strong">Sync</div>
          <div
            className="t-caption"
            style={{ color: sync.error ? 'var(--danger)' : 'var(--muted)', marginTop: 2, maxWidth: 380 }}
          >
            {sync.error || caption}
          </div>
        </div>
        {sync.connected && !sync.needsPermission && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button style={ghost} disabled={busy || sync.syncing} onClick={() => engine.syncNow()}>
              {sync.syncing ? 'Syncing…' : 'Sync now'}
            </button>
            <button
              style={ghost}
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await engine.disconnect();
                  setRevealedKey(null);
                  setEnteringKey(false);
                })
              }
            >
              Disconnect
            </button>
          </div>
        )}
        {sync.connected && sync.needsPermission && (
          <button style={primary} disabled={busy} onClick={() => run(() => engine.reconnect())}>
            Reconnect
          </button>
        )}
      </div>

      {/* Connected + cloud: let the user reveal the key to add a device. */}
      {sync.connected && sync.kind === 'cloud' && (
        <div>
          {revealedKey ? (
            <KeyReveal syncKey={revealedKey} copied={copied} onCopy={() => copyKey(revealedKey)} />
          ) : (
            <button style={ghost} onClick={() => setRevealedKey(engine.cloudSyncKey())}>
              Show sync key
            </button>
          )}
        </div>
      )}

      {/* Disconnected: choose a backend. */}
      {!sync.connected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {needEndpoint && (
            <input
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://your-worker.workers.dev"
              style={{ ...input, flex: 'unset', width: '100%' }}
            />
          )}

          {revealedKey ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="t-caption" style={{ color: 'var(--accent)' }}>
                Sync is on. Save this key somewhere safe — it's the only way to reach your journal from another
                device, and it can't be recovered.
              </div>
              <KeyReveal syncKey={revealedKey} copied={copied} onCopy={() => copyKey(revealedKey)} />
            </div>
          ) : enteringKey ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="oscar1-…"
                style={input}
              />
              <button
                style={primary}
                disabled={busy || !keyInput.trim() || (needEndpoint && !endpoint.trim())}
                onClick={() =>
                  run(async () => {
                    await engine.connectCloudWithKey(keyInput.trim(), endpoint.trim());
                    setKeyInput('');
                    setEnteringKey(false);
                  })
                }
              >
                Connect
              </button>
              <button style={ghost} disabled={busy} onClick={() => setEnteringKey(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button
                style={primary}
                disabled={busy || (needEndpoint && !endpoint.trim())}
                onClick={() =>
                  run(async () => {
                    await engine.connectCloudNew(endpoint.trim());
                    setRevealedKey(engine.cloudSyncKey());
                  })
                }
              >
                Set up cloud sync
              </button>
              <button style={ghost} disabled={busy} onClick={() => setEnteringKey(true)}>
                I have a sync key
              </button>
            </div>
          )}

          {sync.fileSupported && !revealedKey && !enteringKey && (
            <div className="t-caption" style={{ color: 'var(--muted-2)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>Or sync to a file you own:</span>
              <button style={{ ...ghost, height: 26, fontSize: 11 }} disabled={busy} onClick={() => run(() => engine.connectFileNew())}>
                Create file
              </button>
              <button style={{ ...ghost, height: 26, fontSize: 11 }} disabled={busy} onClick={() => run(() => engine.connectFileExisting())}>
                Use existing
              </button>
            </div>
          )}
          {msg && <div className="t-caption" style={{ color: 'var(--danger)' }}>{msg}</div>}
        </div>
      )}

      {/* Conflicts (both devices edited the same day). */}
      {state.syncConflicts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px dashed var(--border)', paddingTop: 12 }}>
          <div className="t-caption" style={{ color: 'var(--muted)' }}>Edited on two devices at once:</div>
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
                <button style={{ ...ghost, height: 26, fontSize: 11 }} onClick={() => store.dismissSyncConflict(c.dayKey)}>
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
      <button style={{ ...ghost, alignSelf: 'stretch', height: 'auto' }} onClick={onCopy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
