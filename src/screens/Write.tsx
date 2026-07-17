// The Write screen: pixel tile, date heading + calendar popover, day
// nav chips, and the borderless editor with typing placeholder, margin
// word-milestones and typewriter scroll.

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { getStore } from '../data/store';
import { useStoreState } from '../data/useStore';
import { keyFromOffset, dateOf } from '../data/dates';
import { words, currentStreak } from '../data/selectors';
import { mkEvent, type GlyphEvent, type GlyphName } from '../components/glyphs';
import { PixelTile, type PixelTileHandle } from '../components/PixelTile';
import { CalendarPopover } from '../components/CalendarPopover';
import { useTooltip } from '../components/Tooltip';
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon, WordsIcon, FlameIcon } from '../components/Icons';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PROMPTS = [
  'What did today look like from where you stood?',
  'What small thing almost slipped by today?',
  'Where did the day quietly go?',
  'What little thing went right today?',
  'Maybe start with the weather and see where it takes you',
  'What would this morning think of tonight?',
];

export interface WriteProps {
  offset: number;
  dayAnim: string;
  focus: boolean;
  calOpen: boolean;
  setCalOpen: (open: boolean) => void;
  onNavDay: (delta: number) => void;
  onJump: (offset: number) => void;
  glyphEvent: GlyphEvent | null;
  setGlyphEvent: (ev: GlyphEvent | null) => void;
  lastType: number;
  onTyped: (dayKey: string, newWords: number) => void;
  taRef: RefObject<HTMLTextAreaElement>;
}

export function Write({
  offset,
  dayAnim,
  focus,
  calOpen,
  setCalOpen,
  onNavDay,
  onJump,
  glyphEvent,
  setGlyphEvent,
  lastType,
  onTyped,
  taRef,
}: WriteProps) {
  const store = getStore();
  const state = useStoreState();
  const tooltip = useTooltip();
  const tileRef = useRef<PixelTileHandle>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [milestones, setMilestones] = useState<{ top: string; label: number; color: string }[]>([]);
  const [phShown, setPhShown] = useState('');
  const phTarget = useRef('');
  const phTimer = useRef<ReturnType<typeof setInterval>>();
  const phIdleRef = useRef(Date.now());
  const promptIdx = useRef<number | null>(null);
  const caretTop = useRef<number | null>(null);
  const measureTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastKeyAt = useRef(0);
  const hourglassDay = useRef('');

  const curKey = keyFromOffset(offset);
  const curText = state.entries[curKey] || '';
  const wordCount = words(curText);
  const goal = state.goal;
  const pct = goal > 0 ? Math.round((wordCount / goal) * 100) : 0;
  const progress = goal > 0 ? Math.min(1, pct / 100) : Math.min(1, wordCount / 300);
  const streak = currentStreak(state.entries);

  const d = dateOf(curKey);
  const dayTitle = offset === 0 ? 'Today' : offset === -1 ? 'Yesterday' : DAY_NAMES[d.getDay()];
  const subParts = [MONTHS[d.getMonth()] + ' ' + d.getDate()];
  if (d.getFullYear() !== new Date().getFullYear()) subParts.push(String(d.getFullYear()));
  const dateSubtitle = subParts.join(' · ');

  const sessionSec = state.times[curKey] || 0;
  const sessionLabel = Math.floor(sessionSec / 60) + ':' + String(sessionSec % 60).padStart(2, '0');

  // ── Placeholder: greets by name and types out ───────────────
  const typePlaceholder = useCallback((text: string) => {
    if (phTarget.current === text) {
      phIdleRef.current = Date.now();
      return;
    }
    phTarget.current = text;
    clearInterval(phTimer.current);
    phIdleRef.current = Date.now();
    let i = 0;
    setPhShown('');
    phTimer.current = setInterval(() => {
      i++;
      setPhShown(text.slice(0, i));
      if (i >= text.length) clearInterval(phTimer.current);
    }, 42);
  }, []);

  const greeting = (state.name || '').trim() ? 'Welcome back, ' + state.name.trim() : 'Start writing';

  useEffect(() => {
    if (curText.length === 0) {
      phTarget.current = '';
      typePlaceholder(greeting);
    }
    return () => clearInterval(phTimer.current);
    // Re-greet whenever the viewed day (or the name) changes.
  }, [curKey, greeting]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rotate to soft prompts after ~30s idle on an empty editor.
  useEffect(() => {
    const t = setInterval(() => {
      if ((state.entries[curKey] || '').length === 0 && Date.now() - phIdleRef.current > 30000) {
        promptIdx.current = ((promptIdx.current ?? Math.floor(Math.random() * PROMPTS.length)) + 1) % PROMPTS.length;
        typePlaceholder(PROMPTS[promptIdx.current]);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [curKey, state.entries, typePlaceholder]);

  // ── Editor measurement: margin milestones + caret position ──
  const measureEditor = useCallback(
    (withCaret?: boolean): number | null => {
      const ta = taRef.current;
      if (!ta) return null;
      const cs = getComputedStyle(ta);
      if (!mirrorRef.current) {
        mirrorRef.current = document.createElement('div');
        ta.parentNode!.appendChild(mirrorRef.current);
      }
      const m = mirrorRef.current;
      m.style.cssText =
        'position:absolute;top:0;left:0;visibility:hidden;pointer-events:none;white-space:pre-wrap;word-wrap:break-word;width:' +
        ta.clientWidth +
        'px;font:' +
        cs.font +
        ';line-height:' +
        cs.lineHeight;
      const text = ta.value;
      const re = /\S+/g;
      let count = 0;
      const idxs: { i: number; n: number }[] = [];
      while (re.exec(text)) {
        count++;
        if (count % 100 === 0) idxs.push({ i: re.lastIndex, n: count });
      }
      m.textContent = '';
      let last = 0;
      const spans: { sp: HTMLSpanElement; n: number }[] = [];
      idxs.forEach(({ i, n }) => {
        m.appendChild(document.createTextNode(text.slice(last, i)));
        const sp = document.createElement('span');
        m.appendChild(sp);
        spans.push({ sp, n });
        last = i;
      });
      m.appendChild(document.createTextNode(text.slice(last)));
      const next = spans.map(({ sp, n }) => ({
        top: sp.offsetTop + 'px',
        label: n,
        color: goal > 0 && n >= goal ? 'var(--accent)' : 'var(--muted-2)',
      }));
      setMilestones((cur) => (JSON.stringify(next) !== JSON.stringify(cur) ? next : cur));
      let top: number | null = null;
      if (withCaret) {
        m.textContent = text.slice(0, ta.selectionEnd);
        const cSp = document.createElement('span');
        cSp.textContent = '​';
        m.appendChild(cSp);
        top = cSp.offsetTop;
      }
      return top;
    },
    [goal, taRef],
  );

  // Typewriter scroll: keep the caret near center once it drifts >40px.
  const scheduleMeasure = useCallback(
    (withCaret?: boolean) => {
      clearTimeout(measureTimer.current);
      measureTimer.current = setTimeout(() => {
        const top = measureEditor(withCaret);
        if (withCaret && top != null && top !== caretTop.current) {
          caretTop.current = top;
          const ta = taRef.current!;
          const y = ta.getBoundingClientRect().top + window.scrollY + top;
          const target = Math.max(0, y - window.innerHeight * 0.45);
          if (Math.abs(window.scrollY - target) > 14) window.scrollTo({ top: target });
        }
      }, 30);
    },
    [measureEditor, taRef],
  );

  const autosize = useCallback(() => {
    const ta = taRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.max(320, ta.scrollHeight) + 'px';
    }
  }, [taRef]);

  useEffect(() => {
    autosize();
    scheduleMeasure();
  }, [curKey, autosize, scheduleMeasure]);

  // ── Input: persist + glyph triggers + energy ────────────────
  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const prevW = words(state.entries[curKey]);
    const newW = words(text);
    const entries = { ...state.entries, [curKey]: text };

    // Glyph event proposals (higher priority wins; ambient loses to typing).
    const cur = glyphEvent;
    let evNext: GlyphEvent | null = cur && Date.now() < cur.until && !cur.ambient ? cur : null;
    const propose = (name: GlyphName, ms: number) => {
      const c = mkEvent(name, ms);
      if (!evNext || c.pri >= evNext.pri) evNext = c;
    };

    if (prevW === 0 && newW > 0) {
      const h = new Date().getHours();
      const priorKeys = Object.keys(state.entries)
        .filter((k) => k < curKey && words(state.entries[k]) > 0)
        .sort();
      const prior = priorKeys[priorKeys.length - 1];
      const gapDays = prior
        ? Math.round((dateOf(curKey).getTime() - dateOf(prior).getTime()) / 86400000)
        : 0;
      const dd = dateOf(curKey);
      if (dd.getMonth() === 0 && dd.getDate() === 1) propose('confetti ball', 4200);
      else if (gapDays > 3) propose('welcome back', 4400);
      else if (h < 3) propose('bat', 2400);
      else if (h < 9) propose('sun', 2000);
      else if (h >= 21) propose('moon', 2000);
      else propose('smiley', 2400);
      const newCount =
        priorKeys.length +
        Object.keys(state.entries).filter((k) => k > curKey && words(state.entries[k]) > 0).length +
        1;
      if (newCount % 365 === 0) propose('gem', 4000);
      else if (newCount % 50 === 0) propose('star', 3600);
      const first = priorKeys[0];
      if (first) {
        const f = dateOf(first);
        if (f.getMonth() === dd.getMonth() && f.getDate() === dd.getDate() && dd.getFullYear() > f.getFullYear())
          propose('cake', 4000);
      }
    }
    if (goal > 0 && prevW < goal && newW >= goal) {
      const stk = currentStreak(entries);
      propose(stk > 0 && stk % 7 === 0 ? 'flame' : (state.times[curKey] || 0) < 600 ? 'bolt' : 'confetti', 3200);
    }
    const prevBest = Object.keys(state.entries)
      .filter((k) => k !== curKey)
      .reduce((a, k) => Math.max(a, words(state.entries[k])), 0);
    if (prevBest >= 100 && prevW <= prevBest && newW > prevBest) propose('heart', 3000);
    const prevTotal = Object.keys(state.entries).reduce((a, k) => a + words(state.entries[k]), 0);
    const newTotal = prevTotal - prevW + newW;
    for (const t of [10000, 50000]) if (prevTotal < t && newTotal >= t) propose('medal', 4000);
    if (prevTotal < 100000 && newTotal >= 100000) propose('trophy', 4400);
    if ((state.times[curKey] || 0) >= 1800 && hourglassDay.current !== curKey && newW > prevW) {
      hourglassDay.current = curKey;
      propose('hourglass', 3600);
    }
    setGlyphEvent(evNext);

    // Cadence-driven equalizer energy: fast typing kicks harder.
    phIdleRef.current = Date.now();
    const now = Date.now();
    const gap = Math.min(2000, now - (lastKeyAt.current || now));
    lastKeyAt.current = now;
    tileRef.current?.keystroke(1 - gap / 2000);

    if (newW > 0 && Math.floor(newW / 100) > Math.floor(prevW / 100)) tileRef.current?.pop();

    store.setEntry(curKey, text);
    if (newW > prevW) store.addHourWords(new Date().getHours(), newW - prevW);
    onTyped(curKey, newW);
    scheduleMeasure(true);
    autosize();
  };

  const chip = (tip: string, content: React.ReactNode) => (
    <div
      className="t-mono"
      aria-label={tip}
      onMouseEnter={tooltip.show(tip)}
      onMouseLeave={tooltip.hide}
      style={{
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '5px 10px',
        color: 'var(--muted)',
      }}
    >
      {content}
    </div>
  );

  const chromeOpacity = focus ? 0.05 : 1;

  return (
    <div
      ref={wrapRef}
      style={{
        width: '100%',
        maxWidth: 640,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '56px 24px 120px',
        boxSizing: 'border-box',
        animation: dayAnim,
      }}
    >
      <div
        className="chrome-fade"
        style={{ opacity: chromeOpacity, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <PixelTile
          ref={tileRef}
          wordCount={wordCount}
          progress={progress}
          glyphEvent={glyphEvent}
          lastType={lastType}
          pastGoalHit={offset < 0 && pct >= 100}
          theme={state.theme}
          onCelebrate={setGlyphEvent}
        />
        <div style={{ marginTop: 20, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            className="date-btn"
            aria-label="Pick a date"
            aria-haspopup="dialog"
            aria-expanded={calOpen}
            onClick={() => setCalOpen(!calOpen)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 12px',
              margin: 0,
              cursor: 'pointer',
              color: 'inherit',
              font: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              borderRadius: 12,
            }}
          >
            <div className="t-page-title">{dayTitle}</div>
            <div className="t-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
              {dateSubtitle}
            </div>
          </button>
          {calOpen && <CalendarPopover offset={offset} entries={state.entries} onJump={onJump} />}
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
          <button
            aria-label="Previous day"
            className="day-nav-btn"
            onClick={() => onNavDay(-1)}
            onMouseEnter={tooltip.show('Previous day')}
            onMouseLeave={tooltip.hide}
            style={{
              width: 32,
              alignSelf: 'stretch',
              borderRadius: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <ArrowLeftIcon size={14} strokeWidth={2} />
          </button>
          {chip('Session duration', (
            <>
              <ClockIcon size={12} />
              {sessionLabel}
            </>
          ))}
          {chip('Number of words', (
            <>
              <WordsIcon size={12} />
              {wordCount}
              <span
                style={{
                  color: pct >= 100 ? 'var(--accent)' : 'color-mix(in srgb, var(--muted-2) 70%, transparent)',
                }}
              >
                {goal > 0 ? '(' + pct + '%)' : ''}
              </span>
            </>
          ))}
          {chip('Consecutive days written', (
            <>
              <FlameIcon size={12} />
              {streak}
            </>
          ))}
          <button
            aria-label="Next day"
            className="day-nav-btn"
            onClick={() => onNavDay(1)}
            onMouseEnter={tooltip.show('Next day')}
            onMouseLeave={tooltip.hide}
            style={{
              width: 32,
              alignSelf: 'stretch',
              borderRadius: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              opacity: offset === 0 ? 0.35 : 1,
            }}
          >
            <ArrowRightIcon size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', marginTop: 36 }}>
        {milestones.map((mk) => (
          <div
            key={mk.label}
            className="margin-milestone"
            style={{
              position: 'absolute',
              left: -44,
              top: mk.top,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: mk.color }}>{mk.label}</span>
            <div style={{ width: 12, height: 1, background: mk.color }} />
          </div>
        ))}
        <textarea
          ref={taRef}
          value={curText}
          onChange={onInput}
          spellCheck={false}
          aria-label="Journal entry"
          className="no-focus-ring"
          style={{
            width: '100%',
            minHeight: 320,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: 'var(--fg)',
            fontFamily: 'var(--font-sans)',
            fontSize: 16,
            lineHeight: '28px',
            caretColor: curText.length === 0 ? 'transparent' : 'var(--accent)',
            padding: 0,
            overflow: 'hidden',
            display: 'block',
          }}
        />
        {curText.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              pointerEvents: 'none',
              fontSize: 16,
              lineHeight: '28px',
              color: 'color-mix(in srgb, var(--muted-2) 65%, transparent)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: 17,
                background: 'var(--accent)',
                verticalAlign: -3,
                animation: 'db-blink 1.1s infinite',
              }}
            />
            {phShown}
          </div>
        )}
      </div>
    </div>
  );
}
