// Demo page for the pixel tile: cycles through every glyph.
// Reachable at #tile-demo (not part of the app's normal navigation).

import { useEffect, useRef, useState } from 'react';
import { PixelTile, type PixelTileHandle } from '../components/PixelTile';

const DEMO_GLYPHS = [
  'idle', 'smiley', 'flame', 'sun', 'moon', 'heart', 'welcome back', 'confetti',
  'check', 'medal', 'trophy', 'cake', 'star', 'gem', 'bolt', 'hourglass', 'bat', 'confetti ball',
];

export function TileDemo({ theme }: { theme: 'dark' | 'light' }) {
  const [selected, setSelected] = useState<string>('smiley');
  const [cycling, setCycling] = useState(true);
  const tileRef = useRef<PixelTileHandle>(null);

  useEffect(() => {
    if (!cycling) return;
    const t = setInterval(() => {
      setSelected((cur) => DEMO_GLYPHS[(DEMO_GLYPHS.indexOf(cur) + 1) % DEMO_GLYPHS.length]);
    }, 3500);
    return () => clearInterval(t);
  }, [cycling]);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 640,
        padding: '64px 24px 120px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}
    >
      <div className="t-page-title">Tile glyphs</div>
      <PixelTile
        ref={tileRef}
        wordCount={120}
        progress={0.4}
        glyphEvent={null}
        lastType={0}
        theme={theme}
        demoGlyph={selected}
      />
      <div className="t-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
        {selected}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 480 }}>
        {DEMO_GLYPHS.map((g) => (
          <button
            key={g}
            className="ghost-btn"
            onClick={() => {
              setCycling(false);
              setSelected(g);
            }}
            style={{
              height: 26,
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '0 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              cursor: 'pointer',
              background: g === selected ? 'var(--nav-active)' : 'transparent',
              color: 'var(--fg)',
            }}
          >
            {g}
          </button>
        ))}
        <button
          className="ghost-btn"
          onClick={() => setCycling((c) => !c)}
          style={{
            height: 26,
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '0 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            cursor: 'pointer',
            background: cycling ? 'var(--nav-active)' : 'transparent',
            color: 'var(--accent)',
          }}
        >
          {cycling ? 'cycling…' : 'cycle'}
        </button>
      </div>
    </div>
  );
}
