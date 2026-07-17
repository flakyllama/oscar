// Calendar popover on the Write date heading: month grid with entry
// dots / today ring / selected fill, month paging, and a 12-year grid
// mode with the same footprint.

import { useState } from 'react';
import { keyFromOffset } from '../data/dates';
import { words, type Entries } from '../data/selectors';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

export interface CalendarPopoverProps {
  offset: number; // currently viewed day (relative to today)
  entries: Entries;
  onJump: (offset: number) => void;
}

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function CalendarPopover({ offset, entries, onJump }: CalendarPopoverProps) {
  // Opens on the viewed day's month.
  const [base, setBase] = useState(() => {
    const t = new Date();
    const [y, m] = keyFromOffset(offset).split('-').map(Number);
    return (y - t.getFullYear()) * 12 + (m - 1 - t.getMonth());
  });
  const [yearsMode, setYearsMode] = useState(false);
  const [yearPage, setYearPage] = useState(0);

  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const vm = new Date(t0.getFullYear(), t0.getMonth() + base, 1);
  const title = MONTHS_FULL[vm.getMonth()] + ' ' + vm.getFullYear();
  const nowY = t0.getFullYear();

  // Grid height adapts to the month's week count; year view matches it.
  const daysInMonth = new Date(vm.getFullYear(), vm.getMonth() + 1, 0).getDate();
  const gridH = Math.ceil((vm.getDay() + daysInMonth) / 7) * 28 + 12;

  const years: { label: string; current: boolean; go: () => void }[] = [];
  const yEnd = nowY - yearPage * 12;
  for (let y = yEnd - 11; y <= yEnd; y++) {
    const yy = y;
    years.push({
      label: String(y),
      current: y === vm.getFullYear(),
      go: () => {
        setBase((b) => Math.min(0, b + (yy - new Date(nowY, new Date().getMonth() + b, 1).getFullYear()) * 12));
        setYearsMode(false);
      },
    });
  }

  const cells: {
    label: string;
    selected: boolean;
    today: boolean;
    future: boolean;
    hasEntry: boolean;
    go: (() => void) | null;
  }[] = [];
  for (let i = 0; i < vm.getDay(); i++) {
    cells.push({ label: '', selected: false, today: false, future: false, hasEntry: false, go: null });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(vm.getFullYear(), vm.getMonth(), day);
    const off = Math.round((d.getTime() - t0.getTime()) / 86400000);
    const future = off > 0;
    const w = future ? 0 : words(entries[keyFromOffset(off)]);
    cells.push({
      label: String(day),
      selected: off === offset,
      today: off === 0,
      future,
      hasEntry: w > 0,
      go: future ? null : () => onJump(off),
    });
  }

  const nextEnabled = yearsMode ? yearPage > 0 : base < 0;

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translate(-50%, 0)',
        marginTop: 8,
        zIndex: 60,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 12,
        boxShadow: 'var(--shadow-lg)',
        animation: 'db-pop-cal .2s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button
          aria-label={yearsMode ? 'Previous years' : 'Previous month'}
          className="icon-btn"
          onClick={() => (yearsMode ? setYearPage((p) => p + 1) : setBase((b) => b - 1))}
        >
          <ChevronLeftIcon size={11} strokeWidth={2} />
        </button>
        <button
          className="t-mono cal-title-btn"
          onClick={() => {
            if (yearsMode) setYearsMode(false);
            else {
              setYearPage(Math.floor((nowY - vm.getFullYear()) / 12));
              setYearsMode(true);
            }
          }}
          style={{
            fontSize: 11,
            color: 'var(--fg)',
            background: 'none',
            border: 'none',
            padding: '3px 8px',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          {title}
        </button>
        <button
          aria-label={yearsMode ? 'Next years' : 'Next month'}
          className="icon-btn"
          style={{ opacity: nextEnabled ? 1 : 0.35 }}
          onClick={() => (yearsMode ? setYearPage((p) => Math.max(0, p - 1)) : setBase((b) => Math.min(0, b + 1)))}
        >
          <ChevronRightIcon size={11} strokeWidth={2} />
        </button>
      </div>
      {yearsMode ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 4,
            marginTop: 10,
            width: 208,
            height: gridH,
            alignContent: 'center',
            boxSizing: 'border-box',
          }}
        >
          {years.map((y) => (
            <button
              key={y.label}
              className="t-mono cal-year-btn"
              onClick={y.go}
              style={{
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: y.current ? 'var(--nav-active)' : 'transparent',
                border: 'none',
                borderRadius: 6,
                color: 'var(--fg)',
                fontSize: 11,
                cursor: 'pointer',
                padding: '0 14px',
              }}
            >
              {y.label}
            </button>
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 28px)',
            gap: 2,
            marginTop: 10,
            justifyItems: 'center',
          }}
        >
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i} className="t-mono" style={{ fontSize: 9, color: 'var(--muted-2)' }}>
              {d}
            </span>
          ))}
          {cells.map((c, i) => (
            <button
              key={i}
              className={'t-mono' + (c.go ? ' cal-day-btn' : '')}
              onClick={c.go ?? undefined}
              disabled={!c.go && c.label !== ''}
              tabIndex={c.label === '' ? -1 : undefined}
              style={{
                position: 'relative',
                width: 28,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: c.selected ? 'var(--nav-active)' : 'transparent',
                border: `1px solid ${c.today ? 'color-mix(in srgb, var(--accent) 60%, transparent)' : 'transparent'}`,
                borderRadius: 6,
                color: c.label === '' ? 'transparent' : c.future ? 'var(--muted-2)' : 'var(--fg)',
                fontSize: 11,
                cursor: c.go ? 'pointer' : 'default',
                padding: 0,
              }}
            >
              {c.label}
              <span
                style={{
                  position: 'absolute',
                  bottom: 2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: c.hasEntry ? 'var(--accent)' : 'transparent',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
