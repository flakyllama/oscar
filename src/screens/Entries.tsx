// Entries: search + rows grouped by month/year.

import { useState } from 'react';
import { useStoreState } from '../data/useStore';
import { dateOf, offsetOf } from '../data/dates';
import { words, entryKeys, totalWords } from '../data/selectors';
import { SearchIcon, WordsIcon, ClockIcon, ArrowRightIcon } from '../components/Icons';

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Entries({ onOpen }: { onOpen: (offset: number) => void }) {
  const state = useStoreState();
  const [query, setQuery] = useState('');

  const keys = entryKeys(state.entries).reverse();
  const sq = query.trim().toLowerCase();
  const shownKeys = sq
    ? keys.filter((k) => state.entries[k].toLowerCase().includes(sq) || k.includes(sq))
    : keys;

  interface Row {
    key: string;
    off: number;
    date: string;
    preview: string;
    words: number;
    time: string;
    hitGoal: boolean;
  }
  const years: { label: string; months: { label: string; rows: Row[] }[] }[] = [];
  shownKeys.forEach((k) => {
    const dd = dateOf(k);
    const w = words(state.entries[k]);
    const yLabel = String(dd.getFullYear());
    let y = years[years.length - 1];
    if (!y || y.label !== yLabel) {
      y = { label: yLabel, months: [] };
      years.push(y);
    }
    const mLabel = MONTHS_FULL[dd.getMonth()];
    let g = y.months[y.months.length - 1];
    if (!g || g.label !== mLabel) {
      g = { label: mLabel, rows: [] };
      y.months.push(g);
    }
    const tsec = state.times[k] || 0;
    g.rows.push({
      key: k,
      off: offsetOf(k),
      date: DOW[dd.getDay()] + ' ' + dd.getDate(),
      preview: state.entries[k].split('\n')[0],
      words: w,
      time: tsec >= 60 ? Math.round(tsec / 60) + 'm' : tsec > 0 ? '<1m' : '',
      hitGoal: state.goal > 0 && w >= state.goal,
    });
  });

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
      <div className="t-page-title">Entries</div>
      <div className="t-body" style={{ color: 'var(--muted)', marginTop: 4 }}>
        {keys.length} entries · {totalWords(state.entries).toLocaleString()} words
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          boxSizing: 'border-box',
          height: 32,
          padding: '0 10px',
          marginTop: 20,
        }}
      >
        <SearchIcon
          size={14}
          stroke={query.length > 0 ? 'var(--accent)' : 'var(--muted)'}
          style={{ transition: 'stroke .35s ease-out' }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search entries"
          className="no-focus-ring"
          style={{
            fontWeight: 400,
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--fg)',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            padding: 0,
          }}
        />
      </div>
      {sq.length > 0 && shownKeys.length === 0 && (
        <div className="t-body" style={{ color: 'var(--muted)', marginTop: 24 }}>
          No entries match that yet, try with different words instead.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        {years.map((y) => (
          <div key={y.label}>
            <div className="t-mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', marginBottom: 12 }}>
              {y.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {y.months.map((g) => (
                <div key={g.label}>
                  <div className="t-eyebrow-sm" style={{ marginBottom: 8 }}>
                    {g.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {g.rows.map((e) => (
                      <div
                        key={e.key}
                        className="entry-row"
                        onClick={() => onOpen(e.off)}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault();
                            onOpen(e.off);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          padding: '14px 16px',
                          cursor: 'pointer',
                        }}
                      >
                        <div className="t-mono" style={{ fontSize: 12, color: 'var(--muted)', minWidth: 56, flexShrink: 0 }}>
                          {e.date}
                        </div>
                        <div
                          className="t-body"
                          style={{
                            fontWeight: 400,
                            flex: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: 'var(--fg)',
                          }}
                        >
                          {e.preview}
                        </div>
                        <div
                          className="t-mono"
                          style={{
                            fontSize: 12,
                            color: e.hitGoal ? 'var(--accent)' : 'var(--muted)',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <WordsIcon size={12} />
                          {e.words}
                        </div>
                        <div
                          className="t-mono"
                          style={{
                            fontSize: 12,
                            color: e.hitGoal ? 'var(--accent)' : 'var(--muted)',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <ClockIcon size={12} />
                          {e.time}
                        </div>
                        <div className="row-arrow">
                          <ArrowRightIcon size={14} stroke="var(--accent)" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
