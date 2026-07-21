// The 8×8 pixel tile: an equalizer driven by keystroke energy while
// typing, and a glyph stage for celebration events. All values ported
// verbatim from the Oscar.dc.html prototype.

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { GLYPHS, GLYPH_COLOR, FLAIR, frameFor, mkEvent, type GlyphEvent, type GlyphName } from './glyphs';

export interface PixelTileHandle {
  // Inject keystroke energy; cadence 0 (slow) … 1 (fast).
  keystroke: (cadence: number) => void;
  // Flash a random cell white (word-century pop).
  pop: () => void;
}

// Drives the lock-screen tile: a steel-blue lock with a shine sweep and a
// breathing glow that brightens on input focus, shakes + flashes danger on a
// wrong passcode, and opens (lockOpen → smiley + gold ripple) on unlock.
export interface LockTileState {
  denyAt: number; // epoch ms of the last wrong attempt (0 = none)
  denyN: number; // wrong-attempt counter (alternates the shake keyframe)
  unlockAt: number; // epoch ms the unlock animation started (0 = sealed)
  focus: boolean; // passcode input focused → brighter glow
}

// Welcome / first-run tile state. When set, the tile drops its editor
// behaviour (word count, energy, events) and shows Oscar's smiley: idle,
// "working" (eyes dart) while the loading messages type, then blank once
// he hands off to the editor. The gold ripple + brighter glow are the
// flourishes at the end of the handoff.
export interface WelcomeTileState {
  reacting: boolean; // name field focused / just typed → celebrate
  phase: 'intro' | 'work' | 'done';
  rippleAt: number | null; // gold ripple start (epoch ms), or null
}

const WELCOME_RIPPLE = 'oklch(0.85 0.14 95)'; // warm gold

export interface PixelTileProps {
  wordCount: number;
  progress: number; // 0..1 toward goal
  glyphEvent: GlyphEvent | null;
  lastType: number; // epoch ms of last keystroke (0 = never)
  pastGoalHit?: boolean; // viewing a past day that hit goal → dim static check
  idleRings?: boolean; // idle >90s ring animation allowed (editor view)
  theme: 'dark' | 'light';
  glowStrength?: number;
  typingPulse?: boolean;
  demoGlyph?: string; // demo/storybook: force a glyph ('auto' = live)
  onCelebrate?: (ev: GlyphEvent) => void; // 5 rapid clicks → confetti
  locked?: LockTileState | null; // lock-screen mode (overrides the glyph stage)
  welcome?: WelcomeTileState | null; // first-run welcome mode (see above)
}

const EQ_PROFILE = [4, 6, 3, 8, 5, 7, 2, 6];

export const PixelTile = forwardRef<PixelTileHandle, PixelTileProps>(function PixelTile(
  {
    wordCount,
    progress,
    glyphEvent,
    lastType,
    pastGoalHit = false,
    idleRings = true,
    theme,
    glowStrength = 0.6,
    typingPulse = true,
    demoGlyph = 'auto',
    onCelebrate,
    locked = null,
    welcome = null,
  },
  ref,
) {
  const [phase, setPhase] = useState(0);
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);
  const [ripple, setRipple] = useState<{ r: number; c: number; at: number } | null>(null);
  const [pop, setPop] = useState<{ r: number; c: number; at: number } | null>(null);
  const [selfEvent, setSelfEvent] = useState<GlyphEvent | null>(null);
  const [demoHoldUntil, setDemoHoldUntil] = useState(0);
  const energy = useRef([0, 0, 0, 0, 0, 0, 0, 0]);
  const ecol = useRef(-1);
  const wasGlyph = useRef(0);
  const clicks = useRef<number[]>([]);
  const fastTick = useRef(0);

  // Equalizer decay + animation phase: ×0.72 per 220ms tick.
  useEffect(() => {
    const t = setInterval(() => {
      energy.current = energy.current.map((v) => v * 0.72);
      setPhase((p) => p + 1);
    }, 220);
    return () => clearInterval(t);
  }, []);

  // Fast re-render while a ripple/pop is animating (they move at ~60ms).
  useEffect(() => {
    if (!ripple && !pop) return;
    const t = setInterval(() => {
      fastTick.current++;
      setPhase((p) => p); // no-op guard; force below
      setRipple((r) => (r && Date.now() - r.at < 800 ? { ...r } : r && Date.now() - r.at >= 800 ? null : r));
      setPop((p2) => (p2 && Date.now() - p2.at >= 450 ? null : p2 ? { ...p2 } : p2));
    }, 60);
    return () => clearInterval(t);
  }, [ripple?.at, pop?.at]);

  useImperativeHandle(ref, () => ({
    keystroke(cadence: number) {
      ecol.current = (ecol.current + 1) % 8;
      const kick = 1 + cadence * 3;
      const e = energy.current;
      e[ecol.current] = Math.min(8, e[ecol.current] + kick);
      e[(ecol.current + 7) % 8] = Math.min(8, e[(ecol.current + 7) % 8] + kick * 0.35);
      e[(ecol.current + 1) % 8] = Math.min(8, e[(ecol.current + 1) % 8] + kick * 0.35);
    },
    pop() {
      setPop({ r: Math.floor(Math.random() * 8), c: Math.floor(Math.random() * 8), at: Date.now() });
    },
  }));

  // Unlock ripple: 500ms after the unlock animation starts, bloom a gold
  // ring out from the tile's centre (matches lockOpen → smiley hand-off).
  useEffect(() => {
    if (!locked || !locked.unlockAt) return;
    const t = setTimeout(() => setRipple({ r: 3.5, c: 3.5, at: Date.now() }), 500);
    return () => clearTimeout(t);
  }, [locked?.unlockAt]);

  const now = Date.now();
  const p = progress;
  const recentType = typingPulse && now - lastType < 2500;
  const lockDenyOn = !!locked && !!locked.denyAt && now - locked.denyAt < 1200;

  // ── Resolve the active glyph ────────────────────────────────
  const ev = selfEvent && now < selfEvent.until ? selfEvent : glyphEvent;
  const evActive = !!ev && now < ev.until;
  const demoHeld = demoHoldUntil > now;
  let glyph: string | null = null;
  let glyphName: GlyphName | null = null;
  let glyphDim = false;
  let celebrating = false;
  let glyphEl: number | null = null;
  if (locked) {
    // Sealed → lock; wrong passcode → lockDeny (lock bitmap, danger colour);
    // unlocking → lockOpen for 450ms, then a blinking smiley.
    const u = locked.unlockAt;
    glyphName = u ? (now - u < 450 ? 'lockOpen' : 'smiley') : lockDenyOn ? 'lockDeny' : 'lock';
    celebrating = !!u;
    glyph = glyphName === 'smiley' ? frameFor('smiley', phase, null) : glyphName === 'lockDeny' ? 'lock' : glyphName;
  } else if (welcome) {
    // Welcome overrides everything: always the smiley, in one of three
    // states. 'blank' is a real (all-zero) bitmap, so the equalizer never
    // shows through.
    glyphName = 'smiley';
    celebrating = welcome.reacting;
    glyph =
      welcome.phase === 'done'
        ? 'blank'
        : welcome.phase === 'work'
          ? frameFor('smileyWork', phase, null)
          : welcome.reacting
            ? frameFor('smiley', phase, null)
            : 'smiley';
  } else if (demoGlyph !== 'auto' && !demoHeld) {
    glyphName = demoGlyph as GlyphName;
    celebrating = true;
    glyphEl = (phase % 16) * 220;
    if (demoGlyph !== 'confetti') glyph = frameFor(glyphName, phase, null);
  } else if (evActive && !(ev!.ambient && recentType)) {
    glyphName = ev!.name;
    celebrating = ev!.name !== 'idle';
    glyphEl = ev!.total - (ev!.until - now);
    if (ev!.name !== 'confetti') glyph = frameFor(ev!.name, phase, glyphEl);
  } else if (pastGoalHit) {
    glyphName = 'check';
    glyph = 'check';
    glyphDim = true;
  } else if (idleRings && lastType > 0 && now - lastType > 90000) {
    glyphName = 'idle';
    glyph = frameFor('idle', phase, null);
    glyphDim = true;
  }

  const confetti = glyphName === 'confetti';
  const glyphColor = (glyphName && GLYPH_COLOR[glyphName]) || 'var(--accent)';
  const dimBg = 'color-mix(in srgb, var(--fg) 9%, transparent)';

  // ── Paint the 8×8 grid ──────────────────────────────────────
  const grid: string[][] = [];
  for (let r = 0; r < 8; r++) {
    grid.push([]);
    for (let c = 0; c < 8; c++) grid[r].push(dimBg);
  }

  const confElapsed = confetti && evActive && ev!.name === 'confetti' ? ev!.total - (ev!.until - now) : null;
  if (confetti && !(confElapsed != null && confElapsed < 450)) {
    // Confetti rain in the 8 flair colors.
    const rnd = (n: number) => {
      const x = Math.sin(n * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 12; i++) {
      const spd = 1 + (i % 3) * 0.4;
      const t = Math.floor(phase * spd + i * 4);
      const cyc = Math.floor(t / 10);
      const row = (t % 10) - 1;
      const col = Math.floor(rnd(i * 31 + cyc * 17) * 8);
      if (row >= 0 && row < 8)
        grid[row][col] = `color-mix(in oklch, ${FLAIR[Math.floor(rnd(i * 7 + cyc * 3) * 8)]} 100%, oklch(${(
          0.72 + rnd(i * 13 + cyc) * 0.1
        ).toFixed(2)} 0.15 ${Math.floor(rnd(i * 5 + cyc * 11) * 360)}))`;
    }
  } else if (glyph) {
    const bmp = GLYPHS[glyph];
    const cyc = Math.floor(phase / 2);
    const rndB = (n: number) => {
      const x = Math.sin(n * 91.7) * 24634.63;
      return x - Math.floor(x);
    };
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (bmp[r][c] === '1') {
          // bolt redraws top-to-bottom every cycle
          if (glyphName === 'bolt' && glyphEl != null && r > glyphEl / 75) continue;
          let col = glyphDim ? `color-mix(in srgb, ${glyphColor} 75%, transparent)` : glyphColor;
          // New Year's ball: facets twinkle in confetti colors
          if (glyphName === 'confetti ball' && rndB(r * 8 + c + cyc * 31) < 0.4)
            col = FLAIR[Math.floor(rndB((r * 8 + c) * 7 + cyc * 13) * 8)];
          // medal/trophy/gem/hourglass/lock: diagonal shine sweep
          if (
            (glyphName === 'medal' ||
              glyphName === 'trophy' ||
              glyphName === 'gem' ||
              glyphName === 'hourglass' ||
              glyphName === 'lock') &&
            (r + c === cyc % 14 || r + c === (cyc % 14) - 1)
          )
            col = `color-mix(in srgb, white 55%, ${glyphColor})`;
          // bolt: one bright flash right after the strike draws in
          if (glyphName === 'bolt' && glyphEl != null && glyphEl >= 1250 && glyphEl < 1500)
            col = `color-mix(in srgb, white 45%, ${glyphColor})`;
          grid[r][c] = col;
        }
  } else {
    // Equalizer: 8 columns, base height from goal progress, energy on top.
    for (let c2 = 0; c2 < 8; c2++) {
      const base = wordCount > 0 ? Math.max(1, Math.round(EQ_PROFILE[c2] * p)) : 0;
      let hgt: number;
      if (recentType) {
        hgt = Math.max(base > 0 ? 1 : 0, Math.min(8, Math.round(energy.current[c2] + base * 0.4)));
      } else {
        const dance = wordCount > 0 ? Math.round(Math.sin(phase * 0.12 + c2 * 0.9) * 0.7) : 0;
        hgt = Math.max(base > 0 ? 1 : 0, Math.min(8, base + dance));
      }
      for (let r = 0; r < 8; r++) {
        if (8 - r <= hgt)
          grid[r][c2] = (8 - r) === hgt && p < 1 ? 'color-mix(in srgb, var(--accent) 55%, transparent)' : 'var(--accent)';
      }
    }
  }

  if (pop && now - pop.at < 450) grid[pop.r][pop.c] = 'var(--fg)';

  // The welcome flow drives its ripple by prop (gold, from the tile
  // centre, slower); the editor tile ripples on click (glyph-coloured).
  const activeRipple = welcome
    ? welcome.rippleAt != null
      ? { r: 3.5, c: 3.5, at: welcome.rippleAt }
      : null
    : ripple;
  const rippleDur = welcome ? 1500 : 800;
  const rippleColor = welcome ? WELCOME_RIPPLE : glyphColor;
  let rippleOn = false;
  if (activeRipple) {
    const rel = now - activeRipple.at;
    if (rel < rippleDur) {
      rippleOn = true;
      const rad = rel / (rippleDur / 7.3);
      for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++)
          if (Math.abs(Math.hypot(r - activeRipple.r, c - activeRipple.c) - rad) < 0.85) grid[r][c] = rippleColor;
    }
  }

  // Hover highlight + bloom-in stagger.
  const cells: { bg: string; d: string }[] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      let bg = grid[r][c];
      if (hoverCell && !rippleOn) {
        const dist = Math.hypot(r - hoverCell.r, c - hoverCell.c);
        if (dist < 1.8) bg = `color-mix(in srgb, var(--fg) ${dist < 0.8 ? 30 : 14}%, ${bg})`;
      }
      // check draws left-to-right; bolt strikes top-to-bottom; others bloom radially
      const d =
        hoverCell || rippleOn
          ? '0ms'
          : glyph === 'check'
            ? c * 70 + 'ms'
            : glyph === 'bolt'
              ? r * 50 + 'ms'
              : glyph || confetti || wasGlyph.current
                ? Math.round(Math.hypot(r - 3.5, c - 3.5) * 45) + 'ms'
                : '0ms';
      cells.push({ bg, d });
    }
  if (glyph || confetti) wasGlyph.current = now;
  else if (wasGlyph.current && now - wasGlyph.current > 700) wasGlyph.current = 0;

  // ── Glow ────────────────────────────────────────────────────
  let pulseBoost = 0;
  if (glyphName === 'heart') pulseBoost = glyph === 'heart' ? 0.3 : 0.05;
  else if (glyphName === 'flame') pulseBoost = 0.1 + 0.15 * Math.abs(Math.sin(phase * 1.7));
  else if (glyphName === 'moon') pulseBoost = glyph === 'moon2' ? 0.2 : 0.06;
  else if (glyphName === 'sun') pulseBoost = glyph === 'sun' ? 0.2 : 0.05;
  else if (glyphName === 'bolt') pulseBoost = glyphEl != null && glyphEl >= 1250 && glyphEl < 1500 ? 0.3 : 0.1;
  else if (confetti) pulseBoost = 0.15 + 0.1 * Math.abs(Math.sin(phase * 0.9));
  else if (celebrating) pulseBoost = 0.15;
  const breathe = 0.05 * Math.sin(phase * 0.25);
  const rippleGlow =
    activeRipple && now - activeRipple.at < rippleDur ? 0.35 * (1 - (now - activeRipple.at) / rippleDur) : 0;
  const glowMul = theme === 'dark' ? 1 : 1.7;
  let glowA: number;
  if (locked) {
    glowA = ((locked.unlockAt ? 0.5 : lockDenyOn ? 0.5 : locked.focus ? 0.32 : 0.16 + breathe) + rippleGlow) * glowMul;
  } else if (welcome) {
    glowA = ((celebrating ? 0.3 + pulseBoost : 0.18 + breathe) + rippleGlow) * glowMul;
    // Brighter, pulsing while Oscar is "working" through the loading messages.
    if (welcome.phase === 'work') glowA = (0.42 + 0.26 * (0.5 + 0.5 * Math.sin(phase * 0.5)) + rippleGlow) * glowMul;
  } else {
    glowA =
      ((wordCount === 0 && !celebrating
        ? 0
        : (0.12 + 0.4 * p) * glowStrength + (recentType ? 0.12 : 0) + (celebrating ? 0.05 + pulseBoost : breathe)) +
        rippleGlow) *
      glowMul;
  }
  const glowColor =
    confetti || glyphName === 'confetti ball'
      ? `var(--tag-flair-${(Math.floor(phase / 6) % 8) + 1})`
      : locked && rippleGlow > 0
        ? 'oklch(0.85 0.14 95)'
        : welcome && rippleGlow > 0
          ? WELCOME_RIPPLE
          : glyphColor;
  const iconGlow = `0 0 ${Math.round(16 + 44 * p + (celebrating ? 28 : 0) + rippleGlow * 40)}px color-mix(in srgb, ${glowColor} ${Math.max(0, Math.min(100, Math.round(glowA * 100)))}%, transparent)`;

  // ── Pointer handlers ────────────────────────────────────────
  const cellAt = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const c = Math.max(0, Math.min(7, Math.floor((e.clientX - rect.left - 9) / 8)));
    const r = Math.max(0, Math.min(7, Math.floor((e.clientY - rect.top - 9) / 8)));
    return { r, c };
  };

  const style: CSSProperties = {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 14,
    background: theme === 'dark' ? '#161618' : 'var(--surface-2)',
    border: '1px solid var(--border)',
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 6px)',
    gridTemplateRows: 'repeat(8, 6px)',
    gap: 2,
    placeContent: 'center',
    boxShadow: iconGlow,
    transition: 'box-shadow .5s',
    cursor: locked || welcome ? 'default' : 'pointer',
    ...(lockDenyOn ? { animation: `db-shake-${locked!.denyN % 2 ? 'a' : 'b'} .4s ease-in-out` } : {}),
  };

  // The welcome tile is passive (no hover highlight or click ripple) — it's
  // narrated by the flow, not poked by the reader.
  return (
    <div
      style={style}
      onMouseMove={
        locked || welcome
          ? undefined
          : (e) => {
              const { r, c } = cellAt(e);
              setHoverCell((cur) => (cur && cur.r === r && cur.c === c ? cur : { r, c }));
            }
      }
      onMouseLeave={locked || welcome ? undefined : () => setHoverCell(null)}
      onClick={
        locked || welcome
          ? undefined
          : (e) => {
              const { r, c } = cellAt(e);
              const t = Date.now();
              clicks.current = clicks.current.filter((x) => t - x < 1600);
              clicks.current.push(t);
              if (clicks.current.length >= 5) {
                clicks.current = [];
                const party = mkEvent('confetti', 2900);
                setSelfEvent(party);
                setRipple(null);
                setDemoHoldUntil(t + 3700);
                onCelebrate?.(party);
              } else {
                setRipple({ r, c, at: t });
              }
            }
      }
    >
      {cells.map((cell, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 1.5,
            background: cell.bg,
            transition: `background .35s ease-out ${cell.d}`,
          }}
        />
      ))}
    </div>
  );
});
