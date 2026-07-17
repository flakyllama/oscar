// Settings: goal, name, theme, focus, Markdown export — plus data
// management (JSON backup/import, storage meter, trash, passcode).

import { useEffect, useRef, useState } from 'react';
import { getStore, Store } from '../data/store';
import { useStoreState } from '../data/useStore';
import { dateOf, todayKey } from '../data/dates';
import { words, entryKeys } from '../data/selectors';
import { makeBackup, parseBackup, mergeBackup } from '../data/backup';
import { SyncPanel } from './SyncPanel';

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 16,
} as const;

const ghostBtnStyle = {
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
} as const;

const inputStyle = {
  fontWeight: 400,
  boxSizing: 'border-box',
  height: 32,
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '6px 10px',
  color: 'var(--fg)',
  fontSize: 14,
  outlineColor: 'var(--accent)',
} as const;

function download(filename: string, text: string, type: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function Settings({ focus, onToggleFocus }: { focus: boolean; onToggleFocus: () => void }) {
  const store = getStore();
  const state = useStoreState();
  const [copiedAt, setCopiedAt] = useState(0);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [passMsg, setPassMsg] = useState<string | null>(null);
  const [passInput, setPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Storage usage meter.
  const [usage, setUsage] = useState(() => store.usageBytes());
  useEffect(() => {
    setUsage(store.usageBytes());
  }, [state, store]);
  const usagePct = usage / Store.QUOTA_BYTES;
  const nearQuota = usagePct > 0.8;
  const fmtBytes = (b: number) =>
    b >= 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';

  const dark = state.theme === 'dark';
  const trashKeys = Object.keys(state.trash).sort().reverse();

  const onImportFile = async (file: File) => {
    try {
      const backup = parseBackup(await file.text());
      const merged = mergeBackup(state, backup);
      store.replaceData({
        entries: merged.entries,
        times: merged.times,
        hours: merged.hours,
        sessions: merged.sessions,
      });
      setImportMsg(
        `Imported: ${merged.added} new ${merged.added === 1 ? 'day' : 'days'}` +
          (merged.conflicts.length
            ? `, ${merged.conflicts.length} ${merged.conflicts.length === 1 ? 'conflict' : 'conflicts'} (kept the longer text)`
            : ''),
      );
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : 'Import failed.');
    }
  };

  const segBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        boxSizing: 'border-box',
        height: 24,
        border: 'none',
        borderRadius: 6,
        padding: '0 12px',
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        background: active ? 'var(--nav-active)' : 'transparent',
        color: active ? 'var(--fg)' : 'var(--muted)',
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 640,
        padding: '64px 24px 120px',
        boxSizing: 'border-box',
        animation: 'db-fade .25s ease-out',
      }}
    >
      <h1 className="t-page-title">Settings</h1>
      <div className="t-body" style={{ color: 'var(--muted)', marginTop: 4 }}>
        Make Oscar yours
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
        <div style={rowStyle}>
          <div>
            <div className="t-body-strong">Name</div>
            <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 2 }}>
              What should Oscar call you?
            </div>
          </div>
          <input
            type="text"
            value={state.name}
            onChange={(e) => store.setName(e.target.value)}
            placeholder="Your name"
            style={{ ...inputStyle, width: 140, fontFamily: 'var(--font-sans)' }}
          />
        </div>
        <div style={rowStyle}>
          <div>
            <div className="t-body-strong">Daily goal</div>
            <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 2 }}>
              Words per day
            </div>
          </div>
          <input
            type="number"
            value={state.goal > 0 ? state.goal : ''}
            onChange={(e) =>
              store.setGoal(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
            }
            placeholder="None"
            min={0}
            step={50}
            style={{ ...inputStyle, width: 88, fontFamily: 'var(--font-mono)' }}
          />
        </div>
        <div style={rowStyle}>
          <div>
            <div className="t-body-strong">Theme</div>
            <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 2 }}>
              Sets the mood of the page
            </div>
          </div>
          <div
            style={{
              boxSizing: 'border-box',
              height: 32,
              display: 'flex',
              gap: 4,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 3,
            }}
          >
            {segBtn('Dark', dark, () => store.setTheme('dark'))}
            {segBtn('Light', !dark, () => store.setTheme('light'))}
          </div>
        </div>
        <div style={rowStyle}>
          <div>
            <div className="t-body-strong">Focus mode</div>
            <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 2 }}>
              Fades the chrome while you write
            </div>
          </div>
          <button
            onClick={onToggleFocus}
            role="switch"
            aria-checked={focus}
            style={{
              boxSizing: 'border-box',
              position: 'relative',
              width: 44,
              height: 26,
              border: '1px solid var(--border)',
              borderRadius: 13,
              padding: 0,
              cursor: 'pointer',
              background: focus ? 'var(--accent)' : 'var(--bg)',
              transition: 'background .18s ease-out',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: focus ? 20 : 2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: focus ? '#fff' : 'var(--muted)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transition: 'left .18s ease-out',
              }}
            />
          </button>
        </div>
      </div>

      <div style={{ ...rowStyle, marginTop: 8 }}>
        <div>
          <div className="t-body-strong">Export</div>
          <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 2 }}>
            Entries will be exported as markdown (.md) files
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="ghost-btn"
            style={ghostBtnStyle}
            onClick={() => {
              try {
                navigator.clipboard.writeText(state.entries[todayKey()] || '');
              } catch {
                /* clipboard unavailable */
              }
              setCopiedAt(Date.now());
              setTimeout(() => setCopiedAt(0), 2000);
            }}
          >
            {copiedAt ? 'Copied' : 'Copy today'}
          </button>
          <button
            className="ghost-btn"
            style={ghostBtnStyle}
            onClick={() => {
              const ks = entryKeys(state.entries);
              const md = ks
                .map((k) => {
                  const dd = dateOf(k);
                  return (
                    '## ' + MONTHS_FULL[dd.getMonth()] + ' ' + dd.getDate() + ', ' + dd.getFullYear() + '\n\n' + state.entries[k].trim() + '\n'
                  );
                })
                .join('\n');
              download('oscar.md', md, 'text/markdown');
            }}
          >
            Download all
          </button>
        </div>
      </div>

      {/* ── Data management ──────────────────────────────────── */}
      <div className="t-eyebrow-sm" style={{ marginTop: 36 }}>
        Data
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        <SyncPanel />
        <div style={rowStyle}>
          <div>
            <div className="t-body-strong">Backup</div>
            <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 2 }}>
              Everything as JSON — entries, times, hours, settings
              {importMsg && (
                <>
                  <br />
                  <span style={{ color: 'var(--accent)' }}>{importMsg}</span>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="ghost-btn"
              style={ghostBtnStyle}
              onClick={() =>
                download(
                  'oscar-backup-' + todayKey() + '.json',
                  JSON.stringify(makeBackup(state), null, 2),
                  'application/json',
                )
              }
            >
              Export
            </button>
            <button className="ghost-btn" style={ghostBtnStyle} onClick={() => fileRef.current?.click()}>
              Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportFile(f);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        <div style={rowStyle}>
          <div style={{ flex: 1 }}>
            <div className="t-body-strong">Storage</div>
            <div className="t-caption" style={{ color: nearQuota ? 'var(--danger)' : 'var(--muted)', marginTop: 2 }}>
              {fmtBytes(usage)} of ~{fmtBytes(Store.QUOTA_BYTES)} used
              {nearQuota ? ' — nearly full, export a backup' : ''}
            </div>
            <div
              style={{
                height: 4,
                background: 'color-mix(in srgb, var(--fg) 8%, transparent)',
                borderRadius: 2,
                marginTop: 8,
                maxWidth: 320,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: Math.max(1, Math.min(100, usagePct * 100)) + '%',
                  background: nearQuota ? 'var(--danger)' : 'var(--accent)',
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        </div>

        <div style={rowStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-body-strong">Trash</div>
            <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 2 }}>
              {trashKeys.length === 0
                ? 'Cleared days land here and can be restored'
                : trashKeys.length + (trashKeys.length === 1 ? ' day' : ' days') + ' in the trash'}
            </div>
            {trashKeys.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {trashKeys.map((k) => {
                  const dd = dateOf(k);
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="t-mono" style={{ fontSize: 12, color: 'var(--muted)', minWidth: 90 }}>
                        {MONTHS_FULL[dd.getMonth()].slice(0, 3)} {dd.getDate()}, {dd.getFullYear()}
                      </span>
                      <span
                        className="t-caption"
                        style={{
                          color: 'var(--muted-2)',
                          flex: 1,
                          minWidth: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {state.trash[k].text.split('\n')[0]} · {words(state.trash[k].text)} words
                      </span>
                      <button className="ghost-btn" style={{ ...ghostBtnStyle, height: 26, fontSize: 11 }} onClick={() => store.restoreDay(k)}>
                        Restore
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={rowStyle}>
          <div style={{ flex: 1 }}>
            <div className="t-body-strong">Passcode</div>
            <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 2 }}>
              {state.lockEnabled
                ? 'Entries are encrypted at rest (AES-GCM)'
                : 'Encrypt your entries at rest with a passcode'}
              {passMsg && (
                <>
                  <br />
                  <span style={{ color: 'var(--accent)' }}>{passMsg}</span>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="password"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              placeholder={state.lockEnabled ? 'Current passcode' : 'New passcode'}
              aria-label={state.lockEnabled ? 'Current passcode' : 'New passcode'}
              style={{ ...inputStyle, width: 140, fontFamily: 'var(--font-sans)' }}
            />
            {changingPass && (
              <input
                type="password"
                value={newPassInput}
                onChange={(e) => setNewPassInput(e.target.value)}
                placeholder="New passcode"
                aria-label="New passcode"
                style={{ ...inputStyle, width: 140, fontFamily: 'var(--font-sans)' }}
              />
            )}
            {state.lockEnabled && !changingPass && (
              <button
                className="ghost-btn"
                style={ghostBtnStyle}
                onClick={() => {
                  setChangingPass(true);
                  setPassMsg(null);
                }}
              >
                Change
              </button>
            )}
            <button
              className="ghost-btn"
              style={ghostBtnStyle}
              onClick={async () => {
                if (!passInput) return;
                if (changingPass) {
                  if (!newPassInput) return;
                  const ok = await store.changePasscode(passInput, newPassInput);
                  setPassMsg(ok ? 'Passcode changed.' : 'Wrong current passcode.');
                  if (ok) setChangingPass(false);
                  setNewPassInput('');
                } else if (state.lockEnabled) {
                  const ok = await store.disablePasscode(passInput);
                  setPassMsg(ok ? 'Passcode removed.' : 'Wrong passcode.');
                } else {
                  await store.enablePasscode(passInput);
                  setPassMsg('Passcode set — keep it safe; it cannot be recovered.');
                }
                setPassInput('');
              }}
            >
              {changingPass ? 'Save' : state.lockEnabled ? 'Remove' : 'Set'}
            </button>
            {changingPass && (
              <button
                className="ghost-btn"
                style={ghostBtnStyle}
                onClick={() => {
                  setChangingPass(false);
                  setPassInput('');
                  setNewPassInput('');
                  setPassMsg(null);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
