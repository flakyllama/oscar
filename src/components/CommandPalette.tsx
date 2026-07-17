// ⌘K command palette: category groups, natural-language date parsing
// ("jun 12", "12 jun 2025", "yesterday", "tuesday"), selection follows
// hover and ↑↓, Enter runs.

import { useEffect, useRef, useState } from 'react';

export interface PaletteAction {
  cat: string;
  label: string;
  kbd: string;
  run: () => void;
}

// Parsed relative/absolute date queries; only past (or today) dates.
export function parseDateQuery(q: string, now: Date = new Date()): Date | null {
  q = (q || '').trim().toLowerCase();
  if (q.length < 3) return null;
  const t = new Date(now);
  t.setHours(0, 0, 0, 0);
  if ('today'.startsWith(q)) return t;
  if ('yesterday'.startsWith(q)) {
    const d = new Date(t);
    d.setDate(d.getDate() - 1);
    return d;
  }
  const dows = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const mdow = q.match(/^(?:last\s+)?([a-z]{3,})$/);
  if (mdow) {
    const di = dows.findIndex((n) => n.startsWith(mdow[1]));
    if (di >= 0) {
      const d = new Date(t);
      d.setDate(d.getDate() - (((t.getDay() - di + 6) % 7) + 1));
      return d;
    }
  }
  const mons = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  let m = q.match(/^([a-z]{3,})\s+(\d{1,2})(?:,?\s+(\d{4}))?$/);
  let mi = -1;
  let day = 0;
  let yr: number | null = null;
  if (m) {
    mi = mons.findIndex((n) => n.startsWith(m![1]));
    day = +m[2];
    yr = m[3] ? +m[3] : null;
  } else {
    m = q.match(/^(\d{1,2})\s+([a-z]{3,})(?:,?\s+(\d{4}))?$/);
    if (m) {
      mi = mons.findIndex((n) => n.startsWith(m![2]));
      day = +m[1];
      yr = m[3] ? +m[3] : null;
    }
  }
  if (mi < 0 || day < 1 || day > 31) return null;
  const d = new Date(yr || t.getFullYear(), mi, day);
  if (!yr && d > t) d.setFullYear(d.getFullYear() - 1);
  if (d > t || d.getDate() !== day) return null;
  return d;
}

export interface CommandPaletteProps {
  actions: PaletteAction[];
  onClose: () => void;
  onGoDate: (d: Date) => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function CommandPalette({ actions, onClose, onGoDate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, []);

  const q = query.toLowerCase();
  const filtered: PaletteAction[] = actions.filter((a) => a.label.toLowerCase().includes(q));
  const pd = parseDateQuery(query);
  if (pd) {
    filtered.unshift({
      cat: 'Jump to date',
      label:
        'Go to ' +
        DAY_NAMES[pd.getDay()] +
        ', ' +
        MONTHS[pd.getMonth()] +
        ' ' +
        pd.getDate() +
        (pd.getFullYear() !== new Date().getFullYear() ? ', ' + pd.getFullYear() : ''),
      kbd: '',
      run: () => onGoDate(pd),
    });
  }
  const idx = Math.min(index, Math.max(0, filtered.length - 1));
  const empty = q.length > 0 && filtered.length === 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '18vh',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440,
          maxWidth: 'calc(100vw - 48px)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          animation: 'db-fade .18s ease-out',
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setIndex((i) => Math.min(filtered.length - 1, i + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setIndex((i) => Math.max(0, i - 1));
            } else if (e.key === 'Enter') {
              filtered[idx]?.run();
            }
          }}
          placeholder="Type a command"
          className="no-focus-ring"
          style={{
            outline: 'none',
            fontWeight: 400,
            width: '100%',
            boxSizing: 'border-box',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            padding: '14px 16px',
            color: 'var(--fg)',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
          }}
        />
        <div style={{ padding: 6, maxHeight: 280, overflowY: 'auto' }}>
          {empty && (
            <div className="t-body" style={{ padding: '14px 10px', color: 'var(--muted)' }}>
              No command matches "{query}" — try fewer letters, or press <span className="kbd">Esc</span> to close.
            </div>
          )}
          {filtered.map((a, i) => (
            <div key={a.cat + a.label}>
              {a.cat !== (i > 0 ? filtered[i - 1].cat : null) && (
                <div className="t-eyebrow-sm" style={{ padding: '10px 10px 4px', fontSize: 9, color: 'var(--muted-2)' }}>
                  {a.cat}
                </div>
              )}
              <div
                className="palette-row"
                onClick={a.run}
                onMouseEnter={() => setIndex(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 8,
                  padding: '9px 10px',
                  cursor: 'pointer',
                  background: i === idx ? 'var(--nav-active)' : 'transparent',
                }}
              >
                <span className="t-body">{a.label}</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: a.kbd ? 'var(--muted)' : 'var(--muted-2)',
                    background: a.kbd ? 'color-mix(in srgb, var(--fg) 7%, transparent)' : 'transparent',
                    border: `1px solid ${a.kbd ? 'var(--border)' : 'transparent'}`,
                    borderRadius: 4,
                    padding: '1px 5px',
                  }}
                >
                  {a.kbd || '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
