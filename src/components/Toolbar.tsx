// Floating bottom toolbar with the sliding active indicator.

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { PencilIcon, ListIcon, ChartIcon, CommandIcon, TrophyIcon, GearIcon } from './Icons';
import { useTooltip } from './Tooltip';
import type { View } from '../types';

export interface ToolbarProps {
  view: View;
  paletteOpen: boolean;
  chromeOpacity: number;
  onGoEditor: () => void;
  onGo: (v: View) => void;
  onOpenPalette: () => void;
}

const btnStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  border: 'none',
  borderRadius: 8,
  padding: '6px 10px',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  color: 'var(--fg)',
  background: 'transparent',
  transition: 'background .12s ease-out',
};

export function Toolbar({ view, paletteOpen, chromeOpacity, onGoEditor, onGo, onOpenPalette }: ToolbarProps) {
  const tooltip = useTooltip();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [ind, setInd] = useState<{ left: number; width: number } | null>(null);

  const activeKey = paletteOpen ? 'commands' : view;

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[activeKey];
      if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    // Fonts loading can shift widths; re-measure shortly after mount.
    const t = setTimeout(measure, 150);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [activeKey]);

  const btn = (
    key: string,
    onClick: () => void,
    content: ReactNode,
    aria?: string,
    tipText?: string,
  ) => (
    <button
      ref={(el) => (refs.current[key] = el)}
      className="nav-btn"
      aria-label={aria}
      onClick={onClick}
      onMouseEnter={tipText ? tooltip.show(tipText, true) : undefined}
      onMouseLeave={tipText ? tooltip.hide : undefined}
      style={btnStyle}
    >
      {content}
    </button>
  );

  return (
    <div
      className="chrome-fade"
      style={{
        position: 'relative',
        display: 'flex',
        gap: 4,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 4,
        pointerEvents: 'auto',
        boxShadow: 'var(--shadow-lg)',
        opacity: chromeOpacity,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: ind ? ind.left : 4,
          width: ind ? ind.width : 0,
          background: 'var(--nav-active)',
          borderRadius: 8,
          transition: 'left .25s cubic-bezier(0.4, 0, 0.2, 1), width .25s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: ind ? 1 : 0,
        }}
      />
      {btn('editor', onGoEditor, (
        <>
          <PencilIcon />Write<span className="kbd">⌥ W</span>
        </>
      ))}
      {btn('home', () => onGo('home'), (
        <>
          <ListIcon />Entries<span className="kbd">⌥ E</span>
        </>
      ))}
      {btn('stats', () => onGo('stats'), (
        <>
          <ChartIcon />Stats<span className="kbd">⌥ S</span>
        </>
      ))}
      {btn('commands', onOpenPalette, (
        <>
          <CommandIcon />Commands<span className="kbd">⌘ K</span>
        </>
      ))}
      {btn('milestones', () => onGo('milestones'), <TrophyIcon />, 'Milestones', 'Milestones')}
      {btn('settings', () => onGo('settings'), <GearIcon />, 'Settings', 'Settings')}
    </div>
  );
}
