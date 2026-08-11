// Oscar's root: view-state router, keyboard model, session/time
// tracking, footer (past-day banner, on-this-day card, toolbar),
// command palette and the passcode gate.

import { useCallback, useEffect, useRef, useState } from 'react';
import './styles/app.css';
import { getStore } from './data/store';
import { useStoreState } from './data/useStore';
import { getSessionTracker } from './data/session';
import { syncAnalytics, track } from './data/analytics';
import { maybeSeed } from './data/seed';
import { keyFromOffset, keyShift, keyOf, offsetOf, dateOf } from './data/dates';
import { words, entryKeys } from './data/selectors';
import type { GlyphEvent } from './components/glyphs';
import { mkEvent } from './components/glyphs';
import type { View } from './types';
import { TooltipProvider, useTooltip } from './components/Tooltip';
import { Toolbar } from './components/Toolbar';
import { CommandPalette, type PaletteAction } from './components/CommandPalette';
import { Write } from './screens/Write';
import { Welcome } from './screens/Welcome';
import { Entries } from './screens/Entries';
import { Stats } from './screens/Stats';
import { Milestones } from './screens/Milestones';
import { Settings } from './screens/Settings';
import { TileDemo } from './screens/TileDemo';
import { Locked } from './screens/Locked';
import { ArrowRightIcon, HistoryIcon } from './components/Icons';
import { getSyncEngine } from './sync/engine';

maybeSeed();

// Dev-only console access for debugging/testing the store and sync.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__oscar = { getStore, getSyncEngine };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pastWhen(days: number): string {
  if (days === 1) return 'yesterday';
  if (days < 7) return days + ' days ago';
  if (days < 30) return Math.round(days / 7) + (Math.round(days / 7) === 1 ? ' week ago' : ' weeks ago');
  if (days < 365) return Math.round(days / 30) + (Math.round(days / 30) === 1 ? ' month ago' : ' months ago');
  return Math.round(days / 365) + (Math.round(days / 365) === 1 ? ' year ago' : ' years ago');
}

function AppInner({ autoFocusEditor = false }: { autoFocusEditor?: boolean }) {
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // First-run onboarding: shown once, when there's no name/history yet.
  const [welcome, setWelcome] = useState(() => {
    const snap = store.getSnapshot();
    return !snap.welcomed && entryKeys(snap.entries).length === 0;
  });
  // One-time greeting the editor shows right after the welcome hand-off.
  const [postWelcome, setPostWelcome] = useState(false);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const flip = useRef(false);
  const saveErrTimer = useRef<ReturnType<typeof setTimeout>>();
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>();

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4000);
  }, []);

  // Welcome hand-off: the flow persists the name as typed; here we just
  // record that it's been seen and cue the editor's one-time greeting.
  const finishWelcome = useCallback(
    (finalName: string) => {
      if (finalName) store.setName(finalName);
      store.setWelcomed();
      setWelcome(false);
      setPostWelcome(true);
    },
    [store],
  );

  // First-visit hello (the prototype greets with confetti on load).
  useEffect(() => {
    setGlyphEvent(mkEvent('confetti', 2400, true));
  }, []);

  // Land in the editor focused after an unlock (App() sets autoFocusEditor).
  useEffect(() => {
    if (autoFocusEditor && view === 'editor') taRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // File sync engine (no-op where the File System Access API is missing).
  useEffect(() => {
    getSyncEngine().start();
  }, []);

  // Usage analytics: injects the (optional) tracker and gates every event
  // on the opt-in setting + Do Not Track. A no-op unless a Umami endpoint
  // is configured and the user has turned this on in Settings.
  useEffect(() => {
    syncAnalytics(state.analyticsEnabled);
  }, [state.analyticsEnabled]);

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

  // ── Writing session: lives in the session module; the shell just
  // keeps its active-day gate current (seconds accrue only while the
  // typed day's editor is showing).
  useEffect(() => {
    const tracker = getSessionTracker();
    tracker.start();
    tracker.setActiveDay(view === 'editor' ? keyFromOffset(offset) : null);
  }, [view, offset]);

  // ── Navigation ──────────────────────────────────────────────
  // The one verb every view change goes through. It owns the shared
  // bookkeeping — closing overlays, retiring the post-welcome greeting,
  // the day animation, and the view_changed analytics event (fired only
  // when the view actually changes) — so no path can skip it.
  const navigate = useCallback(
    (v: View, opts: { offset?: number; anim?: string } = {}) => {
      setPaletteOpen(false);
      setCalOpen(false);
      setPostWelcome(false);
      if (opts.offset !== undefined) setOffset(opts.offset);
      if (opts.anim) setDayAnim(opts.anim);
      else if (v === 'editor' && view !== 'editor') setDayAnim('db-fade .25s ease-out');
      setView(v);
      if (v !== view) track({ name: 'view_changed', view: v });
    },
    [view],
  );

  const navDay = useCallback(
    (delta: number) => {
      if (delta > 0 && offset >= 0) return;
      flip.current = !flip.current;
      navigate('editor', {
        offset: Math.min(0, offset + delta),
        anim: (delta < 0 ? 'db-in-l-' : 'db-in-r-') + (flip.current ? 'a' : 'b') + ' .28s ease-out',
      });
    },
    [offset, navigate],
  );

  const jumpOffset = useCallback(
    (off: number) => {
      if (off > 0) return;
      navigate('editor', { offset: off, anim: 'db-fade .25s ease-out' });
    },
    [navigate],
  );

  const goDate = useCallback((d: Date) => jumpOffset(offsetOf(keyOf(d))), [jumpOffset]);

  const goEditor = useCallback(() => {
    // Clicking Write while on a past day snaps to today.
    if (view === 'editor' && offset < 0) jumpOffset(0);
    else navigate('editor');
  }, [view, offset, jumpOffset, navigate]);

  const toggleFocus = useCallback(() => {
    setFocus((f) => !f);
    navigate('editor');
  }, [navigate]);

  const toggleTheme = useCallback(() => {
    store.setTheme(store.getSnapshot().theme === 'dark' ? 'light' : 'dark');
  }, [store]);

  // ── Keyboard model ──────────────────────────────────────────
  // Reads app state straight from the closure and re-registers when it
  // changes (navigation is rare; typing doesn't touch these values).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The welcome flow owns the keyboard (Enter → Start writing lives there).
      if (welcome) return;
      const mod = e.metaKey || e.ctrlKey;
      // ⌘K — the only ⌘ binding.
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      // Esc unwinds: palette → calendar → blur input → focus mode → Write.
      if (e.key === 'Escape') {
        if (paletteOpen) {
          setPaletteOpen(false);
          return;
        }
        if (calOpen) {
          setCalOpen(false);
          return;
        }
        const ae = document.activeElement as HTMLElement | null;
        if (ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT')) {
          ae.blur();
          return;
        }
        if (focus) {
          setFocus(false);
          return;
        }
        if (view !== 'editor') {
          navigate('editor');
          return;
        }
      }
      if (paletteOpen) return;
      // ⌥-layer via e.code — safe from browser bindings, works while
      // typing (Alt+letter types special chars on macOS).
      if (e.altKey && !mod && !e.shiftKey) {
        const act: Record<string, () => void> = {
          KeyW: () => navigate('editor'),
          KeyE: () => navigate('home'),
          KeyS: () => navigate('stats'),
          KeyT: () => navigate('settings'),
          KeyM: () => navigate('milestones'),
          ArrowLeft: () => navDay(-7),
          ArrowRight: () => navDay(7),
          KeyF: toggleFocus,
          KeyD: toggleTheme,
          KeyL: () => store.lock(),
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
      if (view === 'editor' && e.key.length === 1 && !mod && !e.altKey) {
        // On Write, printable keys always type: refocus the editor and
        // let the character land there.
        taRef.current?.focus();
        return;
      }
      if (k === 'arrowleft' && view === 'editor') navDay(-1);
      else if (k === 'arrowright' && view === 'editor') navDay(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [welcome, paletteOpen, calOpen, focus, view, navigate, navDay, toggleFocus, toggleTheme, store]);

  // ── Palette actions ─────────────────────────────────────────
  const curKey = keyFromOffset(offset);
  const curText = state.entries[curKey] || '';

  const paletteActions: PaletteAction[] = [
    { cat: 'Go to', label: 'Entries', kbd: '⌥ E', run: () => navigate('home') },
    { cat: 'Go to', label: 'Stats', kbd: '⌥ S', run: () => navigate('stats') },
    { cat: 'Go to', label: 'Milestones', kbd: '⌥ M', run: () => navigate('milestones') },
    { cat: 'Go to', label: 'Settings', kbd: '⌥ T', run: () => navigate('settings') },
    { cat: 'Days', label: 'Go to today', kbd: '⌥ W', run: () => jumpOffset(0) },
    { cat: 'Days', label: 'Previous day', kbd: '←', run: () => { setPaletteOpen(false); navDay(-1); } },
    { cat: 'Days', label: 'Next day', kbd: '→', run: () => { setPaletteOpen(false); navDay(1); } },
    { cat: 'Days', label: 'Back a week', kbd: '⌥ ←', run: () => { setPaletteOpen(false); navDay(-7); } },
    { cat: 'Days', label: 'Forward a week', kbd: '⌥ →', run: () => { setPaletteOpen(false); navDay(7); } },
    { cat: 'View', label: 'Toggle focus mode', kbd: '⌥ F', run: toggleFocus },
    { cat: 'View', label: 'Toggle theme', kbd: '⌥ D', run: () => { toggleTheme(); setPaletteOpen(false); } },
  ];

  // Clearing is offered only when there's something to clear. It's a soft
  // delete, so the palette runs it without a confirm and says where it went.
  if (words(curText) > 0) {
    paletteActions.push({
      cat: 'Days',
      label: 'Clear this day',
      kbd: '',
      run: () => {
        store.softDeleteDay(curKey);
        setPaletteOpen(false);
        showNotice('Day cleared — restore it from Settings.');
        track({ name: 'day_cleared' });
      },
    });
  }

  // Lock is offered only when a passcode is set.
  if (state.lockEnabled) {
    paletteActions.push({
      cat: 'View',
      label: 'Lock Oscar',
      kbd: '⌥ L',
      run: () => {
        setPaletteOpen(false);
        store.lock();
      },
    });
  }

  // ── On-this-day card ────────────────────────────────────────
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

  // Right after the welcome, greet by name once — then the editor falls
  // back to its usual "Welcome back" / "Start writing" placeholder.
  const welcomeGreeting = postWelcome
    ? (state.name || '').trim()
      ? 'Nice to meet you, ' + state.name.trim() + '. What did today look like?'
      : 'What did today look like from where you stood?'
    : undefined;

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
      {welcome ? (
        <Welcome
          theme={state.theme}
          initialName={state.name}
          onNameChange={(n) => store.setName(n)}
          onStart={() => store.setWelcomed()}
          onFinish={finishWelcome}
        />
      ) : (
      <>
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
          onTyped={() => setPostWelcome(false)}
          taRef={taRef}
          welcomeGreeting={welcomeGreeting}
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

      {/* Transient confirmation (e.g. a day was cleared) */}
      {notice && !saveError && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 90,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '8px 14px',
            boxShadow: 'var(--shadow-lg)',
            color: 'var(--muted)',
            animation: 'db-fade .25s ease-out',
          }}
          className="t-body"
        >
          {notice}
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
            onGo={navigate}
            onOpenPalette={() => setPaletteOpen(true)}
          />
        </div>
      </div>

      {paletteOpen && <CommandPalette actions={paletteActions} onClose={() => setPaletteOpen(false)} onGoDate={goDate} />}
      </>
      )}
    </div>
  );
}

export default function App() {
  const state = useStoreState();
  const justUnlocked = useRef(false);

  if (state.locked) {
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
        }}
      >
        <Locked
          onUnlocked={() => {
            justUnlocked.current = true;
          }}
        />
      </div>
    );
  }

  return (
    <TooltipProvider theme={state.theme}>
      <AppInner autoFocusEditor={justUnlocked.current} />
    </TooltipProvider>
  );
}
