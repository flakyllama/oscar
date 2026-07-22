// Settings: name, goal, theme, focus, passcode — plus the "Your data"
// section (storage meter, JSON backup/restore, sync, trash). Layout, copy
// and spacing match the Oscar.dc.html prototype.

import { useEffect, useRef, useState } from 'react';
import { getStore, Store } from '../data/store';
import { useStoreState } from '../data/useStore';
import { track } from '../data/analytics';
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

const iconBtnStyle = {
  ...ghostBtnStyle,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
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

// A 44×26 pill switch, matching the prototype's focus-mode toggle.
function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      aria-label={label}
      style={{
        boxSizing: 'border-box',
        position: 'relative',
        flexShrink: 0,
        width: 44,
        height: 26,
        border: '1px solid var(--border)',
        borderRadius: 13,
        padding: 0,
        cursor: 'pointer',
        background: on ? 'var(--accent)' : 'var(--bg)',
        transition: 'background .18s ease-out',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 20 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: on ? '#fff' : 'var(--muted)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'left .18s ease-out',
        }}
      />
    </button>
  );
}

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const UploadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

export function Settings({ focus, onToggleFocus }: { focus: boolean; onToggleFocus: () => void }) {
  const store = getStore();
  const state = useStoreState();
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
    b >= 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + ' MB' : b >= 1024 ? Math.round(b / 1024) + ' KB' : b + ' B';
  const quotaMb = Math.round(Store.QUOTA_BYTES / (1024 * 1024));
  const entryCount = entryKeys(state.entries).length;

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
      track({ name: 'import_used' });
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

      {/* ── Preferences ──────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
        <div style={rowStyle}>
          <div>
            <div className="t-body-strong">Name</div>
            <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 4 }}>
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
            <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 4 }}>
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
            <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 4 }}>
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
            <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 4 }}>
              Fades the chrome while you write
            </div>
          </div>
          <Toggle on={focus} onClick={onToggleFocus} label="Focus mode" />
        </div>

        {/* Passcode — moved up from the data section, now with Lock now. */}
        <div style={rowStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-body-strong">Passcode</div>
            <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 4 }}>
              {state.lockEnabled
                ? 'Your pages are sealed — Oscar asks for the passcode when he wakes'
                : 'Secure your journal with a passcode'}
              {passMsg && (
                <>
                  <br />
                  <span style={{ color: 'var(--accent)' }}>{passMsg}</span>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <input
              type="password"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              placeholder={state.lockEnabled ? 'Current passcode' : 'New passcode'}
              aria-label={state.lockEnabled ? 'Current passcode' : 'New passcode'}
              style={{ ...inputStyle, width: 140, fontSize: 13, fontFamily: 'var(--font-sans)' }}
            />
            {changingPass && (
              <input
                type="password"
                value={newPassInput}
                onChange={(e) => setNewPassInput(e.target.value)}
                placeholder="New passcode"
                aria-label="New passcode"
                style={{ ...inputStyle, width: 140, fontSize: 13, fontFamily: 'var(--font-sans)' }}
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
                  setPassMsg(ok ? 'Passcode removed — your pages are no longer sealed.' : 'Wrong passcode.');
                  if (ok) track({ name: 'passcode_removed' });
                } else {
                  await store.enablePasscode(passInput);
                  setPassMsg('Passcode set — keep it safe; Oscar can’t recover it.');
                  track({ name: 'passcode_set' });
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
            {state.lockEnabled && !changingPass && (
              <button className="ghost-btn" style={ghostBtnStyle} onClick={() => store.lock()}>
                Lock now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Your data ────────────────────────────────────────── */}
      <div className="t-eyebrow-sm" style={{ marginTop: 36 }}>
        Your data
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {/* Storage — full-width meter, entries left / usage right. */}
        <div style={{ ...rowStyle, display: 'block' }}>
          <div className="t-body-strong">Storage</div>
          <div
            style={{
              height: 4,
              background: 'color-mix(in srgb, var(--fg) 8%, transparent)',
              borderRadius: 2,
              marginTop: 12,
            }}
          >
            <div
              style={{
                height: '100%',
                width: Math.max(1, Math.min(100, Math.round(usagePct * 100))) + '%',
                background: nearQuota ? 'var(--danger)' : 'var(--accent)',
                borderRadius: 2,
                transition: 'width .3s ease-out',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
            <span className="t-caption" style={{ color: 'var(--muted)' }}>
              {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
            </span>
            <span className="t-caption" style={{ color: nearQuota ? 'var(--danger)' : 'var(--muted)' }}>
              {fmtBytes(usage)} of ~{quotaMb} MB used{nearQuota ? ' — nearly full, download a backup' : ''}
            </span>
          </div>
        </div>

        {/* Backup — JSON download / restore (the only export now). */}
        <div style={rowStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-body-strong">Backup</div>
            <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 4 }}>
              Download or restore your journal as a .json file
              {importMsg && (
                <>
                  <br />
                  <span style={{ color: 'var(--accent)' }}>{importMsg}</span>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              className="ghost-btn"
              style={iconBtnStyle}
              onClick={() => {
                download(
                  'oscar-backup-' + todayKey() + '.json',
                  JSON.stringify(makeBackup(state), null, 2),
                  'application/json',
                );
                track({ name: 'export_used' });
              }}
            >
              <DownloadIcon />
              Download
            </button>
            <button className="ghost-btn" style={iconBtnStyle} onClick={() => fileRef.current?.click()}>
              <UploadIcon />
              Restore
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

        <SyncPanel />

        {/* Usage analytics — anonymous, content-free product usage. */}
        <div style={rowStyle}>
          <div style={{ maxWidth: 430 }}>
            <div className="t-body-strong">Usage analytics</div>
            <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 4 }}>
              Share anonymous usage stats — never <em>what</em> you wrote.
            </div>
          </div>
          <Toggle
            on={state.analyticsEnabled}
            onClick={() => store.setAnalyticsEnabled(!state.analyticsEnabled)}
            label="Usage analytics"
          />
        </div>

        {/* Trash */}
        <div style={{ ...rowStyle, display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div className="t-body-strong">Trash</div>
              <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 4 }}>
                {trashKeys.length === 0
                  ? `Cleared pages land here and stay restorable for ${Store.TRASH_TTL_DAYS} days`
                  : trashKeys.length +
                    (trashKeys.length === 1 ? ' page' : ' pages') +
                    ` in the trash · cleared automatically after ${Store.TRASH_TTL_DAYS} days`}
              </div>
            </div>
            {trashKeys.length > 0 && (
              <button className="ghost-btn" style={{ ...ghostBtnStyle, flexShrink: 0 }} onClick={() => store.emptyTrash()}>
                Empty trash
              </button>
            )}
          </div>
          {trashKeys.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
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
                    <button
                      className="ghost-btn"
                      style={{ ...ghostBtnStyle, height: 26, fontSize: 11 }}
                      aria-label={`Restore ${k}`}
                      onClick={() => store.restoreDay(k)}
                    >
                      Restore
                    </button>
                    <button
                      className="ghost-btn"
                      style={{ ...ghostBtnStyle, height: 26, fontSize: 11 }}
                      aria-label={`Delete ${k} forever`}
                      onClick={() => store.purgeDay(k)}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
