// Oscar's root: view-state router, keyboard model, session/time
// tracking, footer (past-day banner, on-this-day card, toolbar),
// command palette and the passcode gate.

import { useCallback, useEffect, useRef, useState } from 'react';
import './styles/app.css';
import { getStore } from './data/store';
import { useStoreState } from './data/useStore';
import { maybeSeed } from './data/seed';
import { keyFromOffset, keyShift, dateOf } from './data/dates';
import { words } from './data/selectors';
import type { GlyphEvent } from './components/glyphs';
import { mkEvent } from './components/glyphs';
import type { View } from './types';
import { TooltipProvider, useTooltip } from './components/Tooltip';
import { Toolbar } from './components/Toolbar';
import { CommandPalette, type PaletteAction } from './components/CommandPalette';
import { Write } from './screens/Write';
import { Entries } from './screens/Entries';
import { Stats } from './screens/Stats';
import { Milestones } from './screens/Milestones';
import { Settings } from './screens/Settings';
import { TileDemo } from './screens/TileDemo';
import { ArrowRightIcon, HistoryIcon } from './components/Icons';

maybeSeed();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pastWhen(days: number): string {
  if (days === 1) return 'yesterday';
  if (days < 7) return days + ' days ago';
  if (days < 30) return Math.round(days / 7) + (Math.round(days / 7) === 1 ? ' week ago' : ' weeks ago');
  if (days < 365) return Math.round(days / 30) + (Math.round(days / 30) === 1 ? ' month ago' : ' months ago');
  return Math.round(days / 365) + (Math.round(days / 365) === 1 ? ' year ago' : ' years ago');
}

function LockGate({ onUnlocked }: { onUnlocked: () => void }) {
  const store = getStore();
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <div className="t-page-title">Oscar</div>
      <div className="t-body" style={{ color: 'var(--muted)' }}>
        Your entries are encrypted — enter your passcode
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await store.unlock(pass);
          if (ok) onUnlocked();
          else setError(true);
        }}
        style={{ display: 'flex', gap: 8 }}
      >
        <input
          type="password"
          autoFocus
          value={pass}
          onChange={(e) => {
            setPass(e.target.value);
            setError(false);
          }}
          placeholder="Passcode"
          style={{
            fontWeight: 400,
            boxSizing: 'border-box',
            height: 32,
            width: 180,
            background: 'var(--surface)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: 8,
            padding: '6px 10px',
            color: 'var(--fg)',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            outlineColor: 'var(--accent)',
          }}
        />
        <button
          type="submit"
          className="ghost-btn"
          style={{
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
          }}
        >
          Unlock
        </button>
      </form>
      {error && (
        <div className="t-caption" style={{ color: 'var(--danger)' }}>
          Wrong passcode — try again.
        </div>
      )}
    </div>
  );
}

function AppInner() {
  const store = getStore();
  const state = useStoreState();
  const tooltip = useTooltip();

  const [view, setView] = useState<View>(() => (window.location.hash === '#tile-demo' ? 'tile-demo' : 'editor'));
  const [offset, setOffset] = useState(0);
  const [focus, setFocus] = useState(false);
  const [dayAnim, setDayAnim] = useState('none');
  const [calOpen, setCalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [glyphEvent, setGlyphEvent] = useState<GlyphEvent | null>(null);
  const [lastType, setLastType] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const flip = useRef(false);
  const typedKey = useRef<string | null>(null);
  const lastTypeRef = useRef(0);
  const session = useRef<{ dayKey: string; start: number; startWords: number; lastWords: number } | null>(null);
  const saveErrTimer = useRef<ReturnType<typeof setTimeout>>();

  // First-visit hello (the prototype greets with confetti on load).
  useEffect(() => {
    setGlyphEvent(mkEvent('confetti', 2400, true));
  }, []);

  // Theme side effects.
  useEffect(() => {
    document.body.style.background = state.theme === 'dark' ? '#111113' : '#F5F5F3';
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Tooltips are suppressed in focus mode on the editor.
  useEffect(() => {
    tooltip.setSuppressed(focus && view === 'editor');
  }, [focus, view, tooltip]);

  // Quota-safe save surfacing.
  useEffect(
    () =>
      store.onSaveFailure(() => {
        setSaveError("Couldn't save — storage is full. Export a backup from Settings.");
        clearTimeout(saveErrTimer.current);
        saveErrTimer.current = setTimeout(() => setSaveError(null), 6000);
      }),
    [store],
  );

  // ── Session time accumulation (pauses after 15s idle) ───────
  const finalizeSession = useCallback(() => {
    const s = session.current;
    if (s) {
      session.current = null;
      const w = Math.max(0, s.lastWords - s.startWords);
      if (w > 0) store.addSession({ dayKey: s.dayKey, start: s.start, end: lastTypeRef.current, words: w });
    }
  }, [store]);

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      const curKey = keyFromOffset(offset);
      if (view === 'editor' && lastTypeRef.current && now - lastTypeRef.current < 15000 && typedKey.current === curKey) {
        store.addSeconds(curKey, 1);
      } else if (session.current && now - lastTypeRef.current >= 15000) {
        finalizeSession();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [view, offset, store, finalizeSession]);

  useEffect(() => {
    const flush = () => finalizeSession();
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [finalizeSession]);

  const onTyped = useCallback(
    (dayKey: string, newWords: number) => {
      const now = Date.now();
      setLastType(now);
      lastTypeRef.current = now;
      typedKey.current = dayKey;
      if (session.current && session.current.dayKey !== dayKey) finalizeSession();
      if (!session.current) {
        session.current = { dayKey, start: now, startWords: newWords > 0 ? newWords - 1 : 0, lastWords: newWords };
      } else {
        session.current.lastWords = newWords;
      }
    },
    [finalizeSession],
  );

  // ── Navigation ──────────────────────────────────────────────
  const goView = useCallback(
    (v: View) => {
      setPaletteOpen(false);
      setCalOpen(false);
      if (v === 'editor' && view !== 'editor') setDayAnim('db-fade .25s ease-out');
      setView(v);
    },
    [view],
  );

  const navDay = useCallback(
    (delta: number) => {
      setOffset((cur) => {
        if (delta > 0 && cur >= 0) return cur;
        flip.current = !flip.current;
        setDayAnim((delta < 0 ? 'db-in-l-' : 'db-in-r-') + (flip.current ? 'a' : 'b') + ' .28s ease-out');
        setView('editor');
        setCalOpen(false);
        return Math.min(0, cur + delta);
      });
    },
    [],
  );

  const jumpOffset = useCallback((off: number) => {
    if (off > 0) return;
    setView('editor');
    setOffset(off);
    setCalOpen(false);
    setPaletteOpen(false);
    setDayAnim('db-fade .25s ease-out');
  }, []);

  const goDate = useCallback(
    (d: Date) => {
      const t = new Date();
      t.setHours(0, 0, 0, 0);
      const d2 = new Date(d);
      d2.setHours(0, 0, 0, 0);
      jumpOffset(Math.round((d2.getTime() - t.getTime()) / 86400000));
    },
    [jumpOffset],
  );

  const goEditor = useCallback(() => {
    // Clicking Write while on a past day snaps to today.
    if (view === 'editor' && offset < 0) jumpOffset(0);
    else goView('editor');
  }, [view, offset, jumpOffset, goView]);

  const toggleFocus = useCallback(() => {
    setFocus((f) => !f);
    setView('editor');
    setPaletteOpen(false);
  }, []);

  const toggleTheme = useCallback(() => {
    store.setTheme(store.getSnapshot().theme === 'dark' ? 'light' : 'dark');
  }, [store]);

  // ── Keyboard model ──────────────────────────────────────────
  const stateRef = useRef({ view, offset, focus, calOpen, paletteOpen });
  stateRef.current = { view, offset, focus, calOpen, paletteOpen };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = stateRef.current;
      const mod = e.metaKey || e.ctrlKey;
      // ⌘K — the only ⌘ binding.
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      // Esc unwinds: palette → calendar → blur input → focus mode → Write.
      if (e.key === 'Escape') {
        if (st.paletteOpen) {
          setPaletteOpen(false);
          return;
        }
        if (st.calOpen) {
          setCalOpen(false);
          return;
        }
        const ae = document.activeElement as HTMLElement | null;
        if (ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT')) {
          ae.blur();
          return;
        }
        if (st.focus) {
          setFocus(false);
          return;
        }
        if (st.view !== 'editor') {
          goView('editor');
          return;
        }
      }
      if (st.paletteOpen) return;
      // ⌥-layer via e.code — safe from browser bindings, works while
      // typing (Alt+letter types special chars on macOS).
      if (e.altKey && !mod && !e.shiftKey) {
        const act: Record<string, () => void> = {
          KeyW: () => goView('editor'),
          KeyE: () => goView('home'),
          KeyS: () => goView('stats'),
          KeyT: () => goView('settings'),
          KeyM: () => goView('milestones'),
          ArrowLeft: () => navDay(-7),
          ArrowRight: () => navDay(7),
          KeyF: toggleFocus,
          KeyD: toggleTheme,
        };
        const fn = act[e.code];
        if (fn) {
          e.preventDefault();
          fn();
          return;
        }
      }
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      const typing = tag === 'TEXTAREA' || tag === 'INPUT';
      if (typing) return;
      const k = e.key.toLowerCase();
      if (st.view === 'editor' && e.key.length === 1 && !mod && !e.altKey) {
        // On Write, printable keys always type: refocus the editor and
        // let the character land there.
        taRef.current?.focus();
        return;
      }
      if (k === 'arrowleft' && st.view === 'editor') navDay(-1);
      else if (k === 'arrowright' && st.view === 'editor') navDay(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goView, navDay, toggleFocus, toggleTheme]);

  // ── Palette actions ─────────────────────────────────────────
  const paletteActions: PaletteAction[] = [
    { cat: 'Go to', label: 'Entries', kbd: '⌥ E', run: () => goView('home') },
    { cat: 'Go to', label: 'Stats', kbd: '⌥ S', run: () => goView('stats') },
    { cat: 'Go to', label: 'Milestones', kbd: '⌥ M', run: () => goView('milestones') },
    { cat: 'Go to', label: 'Settings', kbd: '⌥ T', run: () => goView('settings') },
    { cat: 'Days', label: 'Go to today', kbd: '⌥ W', run: () => jumpOffset(0) },
    { cat: 'Days', label: 'Previous day', kbd: '←', run: () => { setPaletteOpen(false); navDay(-1); } },
    { cat: 'Days', label: 'Next day', kbd: '→', run: () => { setPaletteOpen(false); navDay(1); } },
    { cat: 'Days', label: 'Back a week', kbd: '⌥ ←', run: () => { setPaletteOpen(false); navDay(-7); } },
    { cat: 'Days', label: 'Forward a week', kbd: '⌥ →', run: () => { setPaletteOpen(false); navDay(7); } },
    { cat: 'View', label: 'Toggle focus mode', kbd: '⌥ F', run: toggleFocus },
    { cat: 'View', label: 'Toggle theme', kbd: '⌥ D', run: () => { toggleTheme(); setPaletteOpen(false); } },
  ];

  // ── On-this-day card ────────────────────────────────────────
  const curKey = keyFromOffset(offset);
  const curText = state.entries[curKey] || '';
  let otd: { k: string; delta: number } | null = null;
  if (offset === 0 && view === 'editor') {
    for (const delta of [-365, -366, -30, -31]) {
      const k = keyShift(curKey, delta);
      if (words(state.entries[k]) > 0) {
        otd = { k, delta };
        break;
      }
    }
  }

  const chromeOpacity = focus && view === 'editor' ? 0.05 : 1;
  const pastBannerOn = view === 'editor' && offset < 0;

  return (
    <div
      data-theme={state.theme}
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg)',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'background .15s',
      }}
    >
      {view === 'editor' && (
        <Write
          offset={offset}
          dayAnim={dayAnim}
          focus={focus}
          calOpen={calOpen}
          setCalOpen={setCalOpen}
          onNavDay={navDay}
          onJump={jumpOffset}
          glyphEvent={glyphEvent}
          setGlyphEvent={setGlyphEvent}
          lastType={lastType}
          onTyped={onTyped}
          taRef={taRef}
        />
      )}
      {view === 'home' && <Entries onOpen={jumpOffset} />}
      {view === 'stats' && <Stats onJump={jumpOffset} />}
      {view === 'milestones' && <Milestones />}
      {view === 'settings' && <Settings focus={focus} onToggleFocus={() => setFocus((f) => !f)} />}
      {view === 'tile-demo' && <TileDemo theme={state.theme} />}

      {/* Save-failure banner */}
      {saveError && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 90,
            background: 'var(--surface)',
            border: '1px solid var(--danger)',
            borderRadius: 12,
            padding: '8px 14px',
            boxShadow: 'var(--shadow-lg)',
            animation: 'db-fade .25s ease-out',
          }}
          className="t-body"
        >
          {saveError}
        </div>
      )}

      {/* Fixed footer: banners + toolbar */}
      <div style={{ position: 'fixed', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ position: 'relative', width: 'max-content' }}>
          {pastBannerOn && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxSizing: 'border-box',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '8px 12px',
                boxShadow: 'var(--shadow-lg)',
                pointerEvents: 'auto',
                animation: 'db-fade .25s ease-out',
              }}
            >
              <span className="t-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
                You're viewing {pastWhen(-offset)} ·
              </span>
              <button
                onClick={() => jumpOffset(0)}
                className="t-body"
                style={{
                  fontSize: 13,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Jump to today
                <ArrowRightIcon size={12} strokeWidth={2.2} className="jump-arrow" style={{ transition: 'transform .18s ease' }} />
              </button>
            </div>
          )}
          {otd && (
            <div
              className="otd-card"
              onClick={() => otd && jumpOffset(otd.delta)}
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxSizing: 'border-box',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '8px 12px',
                boxShadow: 'var(--shadow-lg)',
                cursor: 'pointer',
                pointerEvents: curText.length > 0 ? 'none' : 'auto',
                opacity: curText.length > 0 ? 0 : focus ? 0.05 : 1,
                transform: curText.length > 0 ? 'translateY(14px)' : 'none',
              }}
            >
              <HistoryIcon size={14} stroke="var(--muted)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="t-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {(() => {
                    const dd = dateOf(otd.k);
                    return 'On this day · ' + MONTHS[dd.getMonth()] + ' ' + dd.getDate() + ', ' + dd.getFullYear();
                  })()}
                </div>
                <div
                  className="t-body"
                  style={{
                    fontWeight: 400,
                    fontSize: 13,
                    color: 'var(--muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: 2,
                  }}
                >
                  {(state.entries[otd.k] || '').split('\n')[0]}
                </div>
              </div>
              <ArrowRightIcon size={14} stroke="var(--muted-2)" style={{ flexShrink: 0 }} />
            </div>
          )}
          <Toolbar
            view={view}
            paletteOpen={paletteOpen}
            chromeOpacity={chromeOpacity}
            onGoEditor={goEditor}
            onGo={goView}
            onOpenPalette={() => setPaletteOpen(true)}
          />
        </div>
      </div>

      {paletteOpen && <CommandPalette actions={paletteActions} onClose={() => setPaletteOpen(false)} onGoDate={goDate} />}
    </div>
  );
}

export default function App() {
  const state = useStoreState();
  const [, forceRender] = useState(0);

  if (state.locked) {
    return (
      <div data-theme={state.theme} style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>
        <LockGate onUnlocked={() => forceRender((n) => n + 1)} />
      </div>
    );
  }

  return (
    <TooltipProvider theme={state.theme}>
      <AppInner />
    </TooltipProvider>
  );
}
