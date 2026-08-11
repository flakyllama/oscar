// Stats: stat tiles, daily-words line chart, writing-hours radial
// clock, weekday bars, year heatmap (with milestone-colored days),
// forecast strip and vocabulary rows.

import { useState } from 'react';
import { useStoreState } from '../data/useStore';
import { keyFromOffset, dateOf, keyOf, offsetOf, MONTHS, DAY_NAMES } from '../data/dates';
import {
  words,
  entryKeys,
  totalWords,
  bestDayWords,
  bestDayKey,
  currentStreak,
  longestStreak,
  hourHistogram,
  goldenHour,
  vocabulary,
  forecast,
} from '../data/selectors';
import { milestoneGroups, milestoneDays } from '../data/milestones';
import { GLYPH_COLOR } from '../components/glyphs';
import { useTooltip } from '../components/Tooltip';
import { ArrowLeftIcon, ArrowRightIcon, TrendIcon } from '../components/Icons';
import { ramp, bestMix } from '../lib/colors';

// "Sundays", "Mondays", … for the weekday-bars captions.
const WEEKDAYS_FULL = DAY_NAMES.map((d) => d + 's');

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 20,
} as const;

function fmtHour(h: number): string {
  return h === 0 ? '12am' : h < 12 ? h + 'am' : h === 12 ? '12pm' : h - 12 + 'pm';
}

export function Stats({ onJump }: { onJump: (offset: number) => void }) {
  const state = useStoreState();
  const tooltip = useTooltip();
  const [hmYearSel, setHmYearSel] = useState<number | null>(null);

  const { entries, times, hours, goal } = state;
  const keys = entryKeys(entries);
  const total = totalWords(entries);
  const best = bestDayWords(entries);
  const streak = currentStreak(entries);
  const longest = longestStreak(entries);

  // ── Daily words line chart (last 28 days) ───────────────────
  const maxBar = Math.max(best, goal, 1);
  const chartPts: string[] = [];
  const bars: {
    x: string;
    y: string;
    dotBg: string;
    dotSize: number;
    sh: string;
    delay: string;
    tip: string;
  }[] = [];
  for (let i = 27; i >= 0; i--) {
    const k = keyFromOffset(-i);
    const w = words(entries[k]);
    const x = ((27 - i) / 27) * 100;
    const y = 122 - Math.round((w / maxBar) * 114);
    chartPts.push(x.toFixed(2) + ',' + y);
    const dd = dateOf(k);
    bars.push({
      x: x.toFixed(2) + '%',
      y: y + 'px',
      delay: (27 - i) * 18 + 'ms',
      dotBg:
        goal > 0 && w >= goal
          ? bestMix
          : w > 0
            ? 'var(--accent)'
            : 'color-mix(in srgb, var(--fg) 12%, transparent)',
      dotSize: w > 0 ? 7 : 5,
      sh: goal > 0 && w >= goal ? '0 0 8px color-mix(in srgb, var(--accent) 55%, transparent)' : 'none',
      tip: MONTHS[dd.getMonth()] + ' ' + dd.getDate() + ' · ' + w + ' words',
    });
  }
  const chartLine = chartPts.join(' ');
  const goalY = goal > 0 ? 122 - Math.round(Math.min(1, goal / maxBar) * 114) : null;
  const xTicks = [27, 20, 13, 6, 0].map((i) => {
    const dd = dateOf(keyFromOffset(-i));
    return {
      left: ((27 - i) / 27) * 100 + '%',
      label: i === 0 ? 'today' : MONTHS[dd.getMonth()] + ' ' + dd.getDate(),
    };
  });
  const yMaxLabel = maxBar >= 1000 ? (maxBar / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(maxBar);

  // ── Writing hours radial clock ──────────────────────────────
  const hist = hourHistogram(hours);
  const maxHourW = Math.max(1, ...hist);
  const goldenH = goldenHour(hours);
  const hourSegs = hist.map((v, h) => {
    const n = v / maxHourW;
    return {
      rot: 'rotate(' + h * 15 + 'deg)',
      len: Math.round(4 + n * 20),
      delay: h * 20 + 'ms',
      bg: v > 0 ? (h === goldenH ? 'var(--accent)' : ramp(n)) : 'color-mix(in srgb, var(--fg) 16%, transparent)',
      tip: fmtHour(h) + ' · ' + v.toLocaleString() + ' words',
    };
  });

  // ── Weekday bars ────────────────────────────────────────────
  const wdTotals = [0, 0, 0, 0, 0, 0, 0];
  keys.forEach((k) => {
    wdTotals[dateOf(k).getDay()] += words(entries[k]);
  });
  const wdMax = Math.max(1, ...wdTotals);
  const wdBest = wdTotals.indexOf(Math.max(...wdTotals));
  const weekdayBars = wdTotals.map((v, i) => ({
    label: 'SMTWTFS'[i],
    delay: i * 50 + 'ms',
    tip: WEEKDAYS_FULL[i] + ' · ' + v.toLocaleString() + ' words',
    h: Math.max(2, Math.round((v / wdMax) * 88)),
    bg: v === 0 ? 'color-mix(in srgb, var(--fg) 8%, transparent)' : i === wdBest ? bestMix : ramp(v / wdMax),
    fg: i === wdBest && v > 0 ? 'var(--fg)' : 'var(--muted-2)',
  }));
  const weekdayCaption = wdTotals.some((v) => v > 0)
    ? 'Most words on ' + WEEKDAYS_FULL[wdBest]
    : 'Write to see your weekly rhythm';

  // ── Year heatmap with milestone days ────────────────────────
  const msDays = milestoneDays(milestoneGroups(entries, times, hours, goal));
  const nowYear = new Date().getFullYear();
  const hmYear = hmYearSel ?? nowYear;
  interface HmCell {
    bg: string;
    glow: string;
    off: number | null;
    tip: string | null;
  }
  const hmCells: HmCell[] = [];
  const hmMonths: { label: string; left: string }[] = [];
  const jan1 = new Date(hmYear, 0, 1);
  const dec31 = new Date(hmYear, 11, 31);
  const hmToday = new Date(); // hoisted: 365 cells shouldn't each re-derive today
  for (let i = 0; i < jan1.getDay(); i++) hmCells.push({ bg: 'transparent', glow: 'none', off: null, tip: null });
  let hmDays = 0;
  for (let d = new Date(jan1); d <= dec31; d.setDate(d.getDate() + 1)) {
    const off = offsetOf(keyOf(d), hmToday);
    if (d.getDate() === 1) hmMonths.push({ label: MONTHS[d.getMonth()], left: Math.floor(hmCells.length / 7) * 10 + 'px' });
    if (off > 0) {
      hmCells.push({ bg: 'color-mix(in srgb, var(--fg) 4%, transparent)', glow: 'none', off: null, tip: null });
      continue;
    }
    const k = keyOf(d);
    const w = words(entries[k]);
    if (w > 0) hmDays++;
    const lvl = goal > 0 ? Math.min(1, w / goal) : Math.min(1, w / 300);
    const ms = msDays[k];
    const msColor = ms ? GLYPH_COLOR[ms.glyph] || 'var(--accent)' : null;
    hmCells.push({
      bg: msColor ? msColor : w === 0 ? 'color-mix(in srgb, var(--fg) 7%, transparent)' : ramp(lvl),
      glow: msColor
        ? '0 0 8px ' + msColor
        : w > 0
          ? '0 0 ' + (2 + Math.round(lvl * 5)) + 'px color-mix(in srgb, var(--accent) ' + Math.round(lvl * 65) + '%, transparent)'
          : 'none',
      off,
      tip: MONTHS[d.getMonth()] + ' ' + d.getDate() + ' · ' + w + ' words' + (ms ? ' · ' + ms.label : ''),
    });
  }

  // ── Forecast + vocabulary ───────────────────────────────────
  const fc = forecast(entries);
  const forecastText = fc
    ? 'At your recent pace — about ' +
      Math.round(fc.pace) +
      ' words a day — you’ll pass ' +
      fc.target.toLocaleString() +
      ' words around ' +
      MONTHS[fc.eta.getMonth()] +
      ' ' +
      fc.eta.getDate() +
      (fc.eta.getFullYear() !== nowYear ? ', ' + fc.eta.getFullYear() : '') +
      '.'
    : 'Write a few days this week and Oscar will forecast your next milestone.';

  const vocab = vocabulary(entries);
  const sessTotal = keys.reduce((a, k) => a + (times[k] || 0), 0);
  const fmtDur = (sec: number) =>
    sec >= 3600 ? Math.floor(sec / 3600) + 'h ' + Math.round((sec % 3600) / 60) + 'm' : Math.round(sec / 60) + 'm';
  const vocabFacts = [
    { label: 'Favorite word', value: vocab.topWord ? '“' + vocab.topWord + '” · ' + vocab.topCount + '×' : '—' },
    { label: 'Distinct words', value: vocab.distinct.toLocaleString() },
    { label: 'Average entry', value: Math.round(total / Math.max(1, keys.length)) + ' words' },
    { label: 'Time on the keyboard', value: fmtDur(sessTotal) },
  ];

  const bestK = bestDayKey(entries);
  const bestCaption = bestK
    ? (() => {
        const bd = dateOf(bestK);
        return MONTHS[bd.getMonth()] + ' ' + bd.getDate() + (bd.getFullYear() !== nowYear ? ' ' + bd.getFullYear() : '');
      })()
    : '—';
  const entriesCaption = keys.length
    ? (() => {
        const fd = dateOf(keys[0]);
        return 'since ' + MONTHS[fd.getMonth()] + ' ' + fd.getFullYear();
      })()
    : '—';
  const pages = Math.round(total / 275);

  const statTile = (label: string, value: React.ReactNode, caption: string, primary = false) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div className="t-eyebrow-sm">{label}</div>
      <div className={primary ? 't-stat-primary' : 't-stat-secondary'} style={{ marginTop: primary ? 6 : 8 }}>
        {value}
      </div>
      <div className="t-caption" style={{ color: 'var(--muted)', marginTop: 'auto', paddingTop: 2 }}>
        {caption}
      </div>
    </div>
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
      <h1 className="t-page-title">Stats</h1>
      <div className="t-body" style={{ color: 'var(--muted)', marginTop: 4 }}>
        How your writing adds up
      </div>

      {/* Stat tiles */}
      <div className="stat-tiles" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, marginTop: 24 }}>
        {statTile(
          'Streak',
          <>
            {streak}
            <span style={{ fontSize: 14, color: 'var(--muted)' }}> d</span>
          </>,
          'longest ' + longest + ' d',
          true,
        )}
        {statTile('Total words', total.toLocaleString(), '≈ ' + Math.max(1, pages) + (pages <= 1 ? ' page' : ' pages'))}
        {statTile('Entries', keys.length, entriesCaption)}
        {statTile('Best day', best, bestCaption)}
      </div>

      {/* Rhythm */}
      <div className="t-eyebrow-sm" style={{ marginTop: 36 }}>
        Rhythm
      </div>
      <div style={{ ...cardStyle, marginTop: 8 }}>
        <div className="t-card-title">Daily words</div>
        <div className="t-caption" style={{ color: 'var(--muted)' }}>
          Last 4 weeks{goal > 0 ? ' · goal ' + goal : ''}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, marginRight: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 128, flexShrink: 0 }}>
            <span className="t-mono" style={{ fontSize: 9, color: 'var(--muted-2)', textAlign: 'right' }}>
              {yMaxLabel}
            </span>
            <span className="t-mono" style={{ fontSize: 9, color: 'var(--muted-2)', textAlign: 'right' }}>
              0
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                position: 'relative',
                height: 128,
                borderLeft: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                paddingLeft: 2,
              }}
            >
              {goalY != null && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: goalY,
                    borderTop: '1px dashed color-mix(in srgb, var(--fg) 18%, transparent)',
                  }}
                />
              )}
              <svg
                width="100%"
                height="128"
                viewBox="0 0 100 128"
                preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0, display: 'block', overflow: 'visible', animation: 'db-reveal .7s ease-out both' }}
              >
                <polyline
                  points={chartLine}
                  fill="none"
                  stroke="color-mix(in srgb, var(--accent) 45%, transparent)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {bars.map((b, i) => (
                <div
                  key={i}
                  onMouseEnter={tooltip.show(b.tip, true)}
                  onMouseLeave={tooltip.hide}
                  style={{
                    position: 'absolute',
                    left: b.x,
                    top: b.y,
                    width: b.dotSize,
                    height: b.dotSize,
                    transform: 'translate(-50%,-50%)',
                    borderRadius: '50%',
                    background: b.dotBg,
                    boxShadow: b.sh,
                    cursor: 'default',
                    animation: `db-pop2 .3s ease-out ${b.delay} backwards`,
                  }}
                />
              ))}
            </div>
            <div style={{ position: 'relative', height: 14, marginTop: 6 }}>
              {xTicks.map((xt, i) => (
                <span
                  key={i}
                  className="t-mono"
                  style={{
                    position: 'absolute',
                    left: xt.left,
                    transform: 'translateX(-50%)',
                    fontSize: 9,
                    color: 'var(--muted-2)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {xt.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Writing hours + Weekdays */}
      <div className="two-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 4 }}>
        <div style={cardStyle}>
          <div className="t-card-title">Writing hours</div>
          <div className="t-caption" style={{ color: 'var(--muted)' }}>
            When the words happen
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <div style={{ position: 'relative', width: 158, height: 158 }}>
              {hourSegs.map((hs, h) => (
                <div
                  key={h}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 3,
                    height: 79,
                    transform: `translate(-50%,-100%) ${hs.rot}`,
                    transformOrigin: 'bottom center',
                  }}
                >
                  <div
                    onMouseEnter={tooltip.show(hs.tip, true)}
                    onMouseLeave={tooltip.hide}
                    style={{ position: 'absolute', top: -2, left: -2, width: 7, height: hs.len, padding: 2, boxSizing: 'content-box' }}
                  >
                    <div
                      style={{
                        width: 3,
                        height: '100%',
                        borderRadius: 2,
                        background: hs.bg,
                        transformOrigin: 'top',
                        animation: `db-grow-v .4s ease-out ${hs.delay} backwards`,
                      }}
                    />
                  </div>
                </div>
              ))}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div className="t-stat-secondary">{goldenH == null ? '—' : fmtHour(goldenH)}</div>
                <div className="t-caption" style={{ color: 'var(--muted)' }}>
                  golden hour
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
          <div className="t-card-title">Weekdays</div>
          <div className="t-caption" style={{ color: 'var(--muted)' }}>
            {weekdayCaption}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 6, marginTop: 16 }}>
            {weekdayBars.map((wd, i) => (
              <div
                key={i}
                onMouseEnter={tooltip.show(wd.tip, true)}
                onMouseLeave={tooltip.hide}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 6,
                  height: '100%',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: wd.h,
                    background: wd.bg,
                    borderRadius: '3px 3px 1px 1px',
                    transformOrigin: 'bottom',
                    animation: `db-grow-v .45s ease-out ${wd.delay} backwards`,
                  }}
                />
                <span className="t-mono" style={{ fontSize: 9, color: wd.fg }}>
                  {wd.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The year */}
      <div className="t-eyebrow-sm" style={{ marginTop: 36 }}>
        The year
      </div>
      <div style={{ ...cardStyle, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="t-card-title">Every day</div>
            <div className="t-caption" style={{ color: 'var(--muted)' }}>
              {hmDays + (hmDays === 1 ? ' day written' : ' days written')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button aria-label="Previous year" className="icon-btn" onClick={() => setHmYearSel(hmYear - 1)}>
              <ArrowLeftIcon size={12} strokeWidth={2} />
            </button>
            <span className="t-mono" style={{ fontSize: 12, color: 'var(--fg)' }}>
              {hmYear}
            </span>
            <button
              aria-label="Next year"
              className="icon-btn"
              style={{ opacity: hmYear < nowYear ? 1 : 0.35 }}
              onClick={() => hmYear < nowYear && setHmYearSel(hmYear + 1)}
            >
              <ArrowRightIcon size={12} strokeWidth={2} />
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ height: 20 }} />
            <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 8px)', gap: 2 }}>
              <span />
              <span className="t-mono" style={{ fontSize: 9, lineHeight: '8px', color: 'var(--muted-2)' }}>Mon</span>
              <span />
              <span className="t-mono" style={{ fontSize: 9, lineHeight: '8px', color: 'var(--muted-2)' }}>Wed</span>
              <span />
              <span className="t-mono" style={{ fontSize: 9, lineHeight: '8px', color: 'var(--muted-2)' }}>Fri</span>
              <span />
            </div>
          </div>
          <div className="hm-scroll" style={{ overflowX: 'auto' }}>
            <div style={{ position: 'relative', height: 20 }}>
              {hmMonths.map((hmm, i) => (
                <span key={i} className="t-mono" style={{ position: 'absolute', left: hmm.left, top: 0, fontSize: 9, color: 'var(--muted-2)' }}>
                  {hmm.label}
                </span>
              ))}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateRows: 'repeat(7, 8px)',
                gridAutoFlow: 'column',
                gridAutoColumns: '8px',
                gap: 2,
                animation: 'db-reveal .8s ease-out both',
              }}
            >
              {hmCells.map((hc, i) => (
                <div
                  key={i}
                  onClick={hc.off != null ? () => onJump(hc.off!) : undefined}
                  onMouseEnter={hc.tip ? tooltip.show(hc.tip, true) : undefined}
                  onMouseLeave={hc.tip ? tooltip.hide : undefined}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: hc.bg,
                    boxShadow: hc.glow,
                    cursor: hc.off != null ? 'pointer' : 'default',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forecast strip */}
      <div
        style={{
          background: 'color-mix(in srgb, var(--accent) 9%, var(--surface))',
          border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--border))',
          borderRadius: 16,
          padding: '16px 20px',
          marginTop: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TrendIcon size={16} stroke="var(--accent)" style={{ flexShrink: 0 }} />
        <div className="t-body" style={{ color: 'var(--fg)' }}>
          {forecastText}
        </div>
      </div>

      {/* Vocabulary */}
      <div style={{ marginTop: 36 }}>
        <div className="t-eyebrow-sm">Vocabulary</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginTop: 6 }}>
          {vocabFacts.map((vf) => (
            <div
              key={vf.label}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span className="t-body" style={{ color: 'var(--muted)' }}>
                {vf.label}
              </span>
              <span className="t-mono" style={{ fontSize: 13, color: 'var(--fg)' }}>
                {vf.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
