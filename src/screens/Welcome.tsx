// The first-run welcome + handoff. Oscar introduces himself (a smiley
// pixel tile, a few lines about what he does, a name field), then on
// "Start writing" the copy cascades away, the tile glides to the centre
// and "works" through a couple of loading lines, flashes a gold ripple,
// and flies up to where the editor's tile will be — a seamless hand-off
// into the Write screen. Timings and copy are ported from Oscar.dc.html.

import { useCallback, useEffect, useRef, useState } from 'react';
import { PixelTile, type WelcomeTileState } from '../components/PixelTile';
import { EDITOR_TILE_TOP } from './Write';
import type { Theme } from '../data/store';

const LOAD_POOL = [
  'Pressing a fresh page',
  'Filling the inkwell',
  'Sharpening the pencil',
  'Dusting off the desk',
  'Winding the clock',
  'Turning on the desk lamp',
  'Locking the vault',
  'Lining up the margins',
  'Warming up the confetti',
];

// The editor tile lands at the top of the centred 640px column
// (EDITOR_TILE_TOP px down, horizontally centred). Computing it — rather
// than measuring the not-yet-mounted editor — keeps the flow self-contained.
const TILE = 80;
// Keep names short enough that the "Remembering the name …" loading line
// always finishes typing inside its slot (see startMsg).
const MAX_NAME = 40;

type Handoff = 'load' | 'land' | null;

interface WelcomeProps {
  theme: Theme;
  initialName: string;
  onNameChange: (name: string) => void; // persist as typed
  onStart: () => void; // hand-off begins — mark the welcome as seen
  onFinish: (name: string) => void; // hand off to the editor
}

export function Welcome({ theme, initialName, onNameChange, onStart, onFinish }: WelcomeProps) {
  const [name, setName] = useState(initialName);
  const [focused, setFocused] = useState(false);
  const [handoff, setHandoff] = useState<Handoff>(null);
  const [tileGo, setTileGo] = useState(false);
  const [tileShift, setTileShift] = useState(0);
  const [workOn, setWorkOn] = useState(false);
  const [done, setDone] = useState(false);
  const [rippleAt, setRippleAt] = useState<number | null>(null);
  const [loadMsgs, setLoadMsgs] = useState<string[] | null>(null);
  const [loadIdx, setLoadIdx] = useState(0);
  const [loadChars, setLoadChars] = useState(0);
  const [cloneRect, setCloneRect] = useState<{ left: number; top: number } | null>(null);

  const tileRef = useRef<HTMLDivElement>(null);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const intervals = useRef<Array<ReturnType<typeof setInterval>>>([]);
  const started = useRef(false);

  // Clear every scheduled timer/interval on unmount so a fast operator
  // (Start → land → editor) never leaves a stray tick running.
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      intervals.current.forEach(clearInterval);
      timers.current = [];
      intervals.current = [];
    },
    [],
  );

  const land = useCallback(() => {
    setHandoff('land');
    const left = Math.round(window.innerWidth / 2 - TILE / 2);
    // Two rAFs so the clone paints at centre before it transitions out.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setCloneRect({ left, top: EDITOR_TILE_TOP })),
    );
    timers.current.push(setTimeout(() => onFinish(name.trim()), 1300));
  }, [name, onFinish]);

  const startWriting = useCallback(() => {
    if (started.current) return;
    started.current = true;
    onStart(); // mark seen now, so a mid-hand-off refresh won't replay it

    const n = name.trim();
    const msgs = [...LOAD_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
    if (n) msgs[1] = 'Remembering the name ' + n;

    const rect = tileRef.current?.getBoundingClientRect();
    const dy = rect ? Math.round(window.innerHeight / 2 - (rect.top + rect.height / 2)) : 0;

    setHandoff('load');
    setTileShift(dy);
    setLoadMsgs(msgs);
    setLoadIdx(0);
    setLoadChars(0);
    setTileGo(false);
    setWorkOn(false);

    // Glide the tile to centre only once the copy has finished cascading out.
    timers.current.push(setTimeout(() => setTileGo(true), 1200));

    const startMsg = (i: number) => {
      // Retire the previous line's typer before starting the next, so two
      // never write loadChars at once (a long line could outrun its slot).
      intervals.current.forEach(clearInterval);
      intervals.current = [];
      if (i >= msgs.length) {
        // Final flourish: smiley blanks, gold ripple, then fly up.
        setDone(true);
        timers.current.push(setTimeout(() => setRippleAt(Date.now()), 400));
        timers.current.push(setTimeout(land, 2000));
        return;
      }
      setLoadIdx(i);
      setLoadChars(0);
      setWorkOn(true);
      const full = msgs[i] + '…';
      const iv = setInterval(() => {
        setLoadChars((prev) => {
          if (prev >= full.length) {
            clearInterval(iv);
            return prev;
          }
          return prev + 1;
        });
      }, 35);
      intervals.current.push(iv);
      timers.current.push(setTimeout(() => startMsg(i + 1), 3500));
    };
    timers.current.push(setTimeout(() => startMsg(0), 2400));
  }, [name, land, onStart]);

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (handoff) return;
    const v = e.target.value;
    setName(v);
    onNameChange(v);
  };

  // db-w-up in, db-w-out on exit — the staggered cascade.
  const anim = (inDelay: number, outDelay: number) =>
    handoff
      ? `db-w-out .45s ease-in ${outDelay}s both`
      : `db-w-up .45s ease-out ${inDelay}s both`;

  const tileState: WelcomeTileState = {
    reacting: focused && !handoff,
    phase: done ? 'done' : handoff === 'load' && workOn ? 'work' : 'intro',
    rippleAt,
  };

  const tileBg = theme === 'dark' ? '#161618' : 'var(--surface-2)';
  const textPe = handoff ? 'none' : 'auto';
  const loadMsg = loadMsgs ? (loadMsgs[loadIdx] + '…').slice(0, loadChars) : '';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 640,
        minHeight: '100vh',
        boxSizing: 'border-box',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'db-fade .35s ease-out',
      }}
    >
      {handoff !== 'land' && (
        <>
          <div
            ref={tileRef}
            style={{
              width: TILE,
              height: TILE,
              transform: handoff === 'load' && tileGo ? `translateY(${tileShift}px)` : 'translateY(0px)',
              transition: 'transform 1s cubic-bezier(.55,.05,.2,1)',
              animation: handoff ? 'none' : 'db-w-pop .5s cubic-bezier(.34,1.4,.5,1) both',
            }}
          >
            <PixelTile
              wordCount={0}
              progress={0}
              glyphEvent={null}
              lastType={0}
              idleRings={false}
              theme={theme}
              welcome={tileState}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: textPe,
            }}
          >
            <div className="t-page-title" style={{ marginTop: 24, animation: anim(0.25, 0.6) }}>
              Oscar
            </div>
            <div
              className="t-body"
              style={{
                color: 'var(--muted)',
                marginTop: 8,
                textAlign: 'center',
                maxWidth: 380,
                textWrap: 'pretty',
                animation: anim(0.35, 0.5),
              }}
            >
              Meet your writing companion. You bring a few honest words, he'll remember the rest.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
              <Bullet anim={anim(0.5, 0.4)}>
                <PencilIcon />
                <span className="t-body" style={{ fontSize: 14, color: 'var(--fg)' }}>
                  Oscar keeps a page per day, saved as you type
                </span>
              </Bullet>
              <Bullet anim={anim(0.6, 0.3)}>
                <FlameIcon />
                <span className="t-body" style={{ fontSize: 14, color: 'var(--fg)' }}>
                  He counts your streaks and celebrates your milestones
                </span>
              </Bullet>
              <Bullet anim={anim(0.7, 0.2)}>
                <CommandIcon />
                <span className="t-body" style={{ fontSize: 14, color: 'var(--fg)' }}>
                  He speaks keyboard — <span className="kbd">⌘ K</span> asks him anything
                </span>
              </Bullet>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 36, animation: anim(0.95, 0.1) }}>
              <input
                type="text"
                value={name}
                onChange={onInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') startWriting();
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="What should Oscar call you?"
                aria-label="Your name"
                maxLength={MAX_NAME}
                autoFocus
                style={{
                  boxSizing: 'content-box',
                  height: 36,
                  width: '27ch',
                  padding: '0 12px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  outline: 'none',
                  color: 'var(--fg)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: 400,
                }}
              />
              <button
                onClick={startWriting}
                style={{
                  boxSizing: 'border-box',
                  height: 36,
                  border: 'none',
                  borderRadius: 8,
                  padding: '0 16px',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Start writing
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="jump-arrow"
                  style={{ transition: 'transform .18s ease' }}
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>

            <div
              className="t-mono"
              style={{
                fontSize: 11,
                color: 'var(--muted-2)',
                marginTop: 20,
                width: '100%',
                maxWidth: 380,
                textAlign: 'center',
                textWrap: 'pretty',
                animation: anim(1.05, 0),
              }}
            >
              Your words stay on your device, encrypted securely under lock and key.
            </div>
          </div>

          {handoff === 'load' && (
            <div
              style={{
                position: 'fixed',
                left: 0,
                right: 0,
                top: 'calc(50% + 60px)',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <span className="t-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                {loadMsg}
              </span>
            </div>
          )}
        </>
      )}

      {handoff === 'land' && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            zIndex: 80,
            pointerEvents: 'none',
            left: cloneRect ? cloneRect.left + 'px' : '50%',
            top: cloneRect ? cloneRect.top + 'px' : '50%',
            transform: cloneRect ? 'none' : 'translate(-50%,-50%)',
            transition:
              'left .65s cubic-bezier(.55,.05,.2,1), top .65s cubic-bezier(.55,.05,.2,1), transform .65s cubic-bezier(.55,.05,.2,1)',
            width: TILE,
            height: TILE,
            borderRadius: 14,
            background: tileBg,
            border: '1px solid var(--border)',
            boxShadow: '0 0 40px color-mix(in srgb, oklch(0.85 0.14 95) 22%, transparent)',
          }}
        />
      )}
    </div>
  );
}

function Bullet({ anim, children }: { anim: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, animation: anim }}>{children}</div>
  );
}

const svgProps = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'var(--accent)',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  style: { flexShrink: 0 },
};

function PencilIcon() {
  return (
    <svg {...svgProps}>
      <path d="M12 20h9" />
      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg {...svgProps}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function CommandIcon() {
  return (
    <svg {...svgProps}>
      <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
    </svg>
  );
}
