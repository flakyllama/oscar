// Shared intensity-ramp helpers (heatmap, weekday bars, hours clock).
// level = words/goal clamped 0–1.

export function ramp(level: number): string {
  return 'color-mix(in srgb, var(--accent) ' + Math.round(30 + level * 70) + '%, transparent)';
}

// "Best in set" highlight.
export const bestMix = 'color-mix(in srgb, white 12%, var(--accent))';
