// Milestones: 5 groups, 20 tiles, ×N badges, earned dates in tooltips.

import { useStoreState } from '../data/useStore';
import { milestoneGroups } from '../data/milestones';
import { GLYPHS, GLYPH_COLOR } from '../components/glyphs';
import { useTooltip } from '../components/Tooltip';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(d: Date | null): string | null {
  if (!d) return null;
  return (
    MONTHS[d.getMonth()] + ' ' + d.getDate() + (d.getFullYear() !== new Date().getFullYear() ? ', ' + d.getFullYear() : '')
  );
}

export function Milestones() {
  const state = useStoreState();
  const tooltip = useTooltip();
  const groups = milestoneGroups(state.entries, state.times, state.hours, state.goal);
  const all = groups.flatMap((g) => g.items);
  const earned = all.filter((m) => m.earned).length;

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
      <h1 className="t-page-title">Milestones</h1>
      <div className="t-body" style={{ color: 'var(--muted)', marginTop: 4 }}>
        {earned} of {all.length} earned
      </div>
      {groups.map((grp) => (
        <div key={grp.name} style={{ marginTop: 36 }}>
          <div className="t-eyebrow-sm">{grp.name}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {grp.items.map((m) => {
              const bmp = GLYPHS[m.glyph] || GLYPHS.blank;
              const col = m.earned
                ? GLYPH_COLOR[m.glyph] || 'var(--accent)'
                : 'color-mix(in srgb, var(--fg) 30%, transparent)';
              const cells: string[] = [];
              for (let r = 0; r < 8; r++)
                for (let c = 0; c < 8; c++) cells.push(bmp[r][c] === '1' ? col : 'transparent');
              const tip = m.earned ? m.req + ' — ' + (fmtDate(m.when) || 'earned') : m.req;
              return (
                <div
                  key={m.label}
                  onMouseEnter={tooltip.show(tip, true)}
                  onMouseLeave={tooltip.hide}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 7,
                    width: 76,
                    padding: '12px 0 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    background: 'var(--surface)',
                    opacity: m.earned ? 1 : 0.45,
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(8, 4px)',
                      gridTemplateRows: 'repeat(8, 4px)',
                      gap: 1,
                    }}
                  >
                    {cells.map((bg, i) => (
                      <div key={i} style={{ width: 4, height: 4, borderRadius: 1, background: bg }} />
                    ))}
                    {m.mult && (
                      <span
                        className="t-mono"
                        style={{
                          position: 'absolute',
                          right: -7,
                          bottom: -5,
                          width: 15,
                          height: 15,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 8,
                          color: m.earned ? GLYPH_COLOR[m.glyph] || 'var(--accent)' : 'var(--muted)',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '50%',
                        }}
                      >
                        {m.mult}
                      </span>
                    )}
                  </div>
                  <span
                    className="t-caption"
                    style={{ fontSize: 10, color: m.earned ? 'var(--fg)' : 'var(--muted)', textAlign: 'center' }}
                  >
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
