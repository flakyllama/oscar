# Handoff: Oscar — a daily writing journal

## Overview
Oscar is a minimal, keyboard-first daily journal. One entry per calendar day, a plain-text editor with a typewriter feel, and an 8×8 pixel tile that reacts to your writing (equalizer while typing, celebration glyphs for milestones). Supporting screens: searchable Entries list, Stats dashboard, Milestones trophy shelf, Settings. All data persists locally.

## About the Design Files
The files in this bundle are **design references created in HTML** — working prototypes showing the intended look and behavior, not production code to copy directly. The task is to **recreate these designs in the target codebase's environment** (React/Next.js, Vue, Svelte, etc.) using its established patterns. If no codebase exists yet, a React + TypeScript + Vite (or Next.js) app with plain CSS variables is a good fit — the design uses no component library.

Open `Oscar.dc.html` in a browser to use the working prototype. `Oscar Patterns.dc.html` documents tokens/glyphs/motion; `Oscar Components.dc.html` documents composed UI patterns. The prototype's source (one HTML file: template + a `Component` logic class at the bottom) is the authoritative reference for all values and logic, including the full 8×8 glyph bitmaps and trigger conditions.

## Fidelity
**High-fidelity.** Colors, typography, spacing, animations, and interactions are final. Recreate pixel-perfectly.

## Design Tokens
Base theme comes from the bundled Forma stylesheet (`_ds/**/colors_and_type.css`) — dark (`#111113` bg) and light (`#F5F5F3`) themes via a `data-theme` attribute and CSS variables (`--bg`, `--fg`, `--surface`, `--border`, `--muted`, `--muted-2`, `--nav-hover`, `--nav-active`, `--row-hover`, `--shadow-lg`, `--font-sans`, `--font-mono`, plus type classes `t-page-title`, `t-body`, `t-caption`, `t-eyebrow-sm`, `t-mono`, `t-card-title`, `t-stat-primary`, `t-stat-secondary`).

Oscar's overrides/additions:
- **Accent**: `oklch(0.72 0.16 280)` (purple-indigo) — both themes
- **Glyph colors**: check `--z2` (green) · sun/trophy `--z3` (amber) · flame `--z4` (red) · heart `--z5` · moon `oklch(0.82 0.11 80)` · welcome-back `oklch(0.72 0.15 145)` · medal (copper) `oklch(0.75 0.11 40)` · cake `oklch(0.78 0.13 350)` · star `oklch(0.85 0.14 95)` · gem `oklch(0.8 0.13 200)` · bolt `oklch(0.88 0.16 100)` · hourglass `oklch(0.8 0.06 230)` · confetti-ball `oklch(0.85 0.02 260)` · bat `oklch(0.72 0.14 310)` · confetti uses the 8 `--tag-flair-N` colors
- **Intensity ramp** (shared by heatmap, weekday bars, hours clock): `color-mix(in srgb, var(--accent) (30 + level×70)%, transparent)` where level = words/goal clamped 0–1. "Best in set" highlight: `color-mix(in srgb, white 12%, var(--accent))`
- **Radii**: cards 16px · tiles/rows/popovers 12px · buttons/cells 6–8px
- **Utility classes**: `.kbd` (mono 10px badge, 7% fg fill, 1px border, radius 4, padding 1px 5px) · `.icon-btn` (24×24, 6% fg fill, 1px border, radius 6, hover `--nav-hover`)
- **Focus**: 2px accent `:focus-visible` outline, offset 2px (keyboard only; suppressed on the editor and search)
- **Section rhythm**: eyebrow headings 36px above, 8–12px below

## Screens

### Write (default)
Centered column, max-width 640px. Top-to-bottom: pixel tile (80×80, radius 14, contains the 8×8 glyph grid of 6px cells with 2px gaps), clickable date heading ("Today" / "Yesterday" / weekday + `Jul 16` mono subtitle) that opens the **calendar popover**, a day-nav row (icon-btn arrows, session timer chip `1:12`, word count `380 (127%)`, streak chip), then the borderless editor. Details:
- **Editor**: transparent textarea, no focus ring, accent caret (hidden while empty — a 2px animated placeholder cursor shows instead). Placeholder greets by name ("Welcome back, Sara") and types out character-by-character; rotates to soft prompts after ~30s idle. Typewriter scroll keeps the caret near center once it drifts >40px. Word-count milestones (100, 200, …) render in the left margin at the line where they were crossed; accent when ≥ goal.
- **Focus mode** (⌥F): chrome fades to 5% opacity (hover restores), leaving just the text.
- **Past-day banner**: when viewing a past day, docks above the toolbar — "You're viewing 3 weeks ago · Jump to today →" (arrow slides 3px on hover). Clicking Write again while on a past day also snaps to today.
- **On-this-day card**: on today's empty editor, shows the entry from 1 year (or 1 month) ago; slides down/away when typing starts; click opens that day.
- **Calendar popover**: month grid (7×28px columns, 26px cells), accent dot on days with entries, today ring, selected fill, future disabled; ‹ › month paging; clicking the "July 2026" title flips to a 12-year grid (same footprint; ‹ › then page 12 years); opens on the viewed day's month; Esc closes. Grid height adapts to the month's week-count; year view matches it.

### Entries (⌥E)
Page title + subtitle, search input, entries grouped by month/year. Rows: mono weekday+date (52px), one-line preview (ellipsis), word count (accent if ≥ goal). Hover: `--row-hover` fill, accent-mixed border, right-arrow slides in. Rows are focusable (Enter/Space opens).

### Stats (⌥S)
Sections separated by eyebrow headings:
1. **Stat tiles** (4-up, 4px gap): Streak / Total words / Entries / Best day; captions pinned to tile bottoms (flex column + margin-top auto) — "longest 11 d", "≈ 45 pages", "since Jun 2025", best-day date.
2. **Rhythm**: *Daily words* card — 28-day line chart (128px tall): accent-45% polyline, per-day dots (goal-hit: bestMix + glow, written: accent 7px, empty: 12% fg 5px), dashed goal line, y-axis 0→max (k-format), date ticks ending "today". Then a 2-up row: *Writing hours* — 24-spoke radial clock (spokes 3px rounded, length 4–24px by volume, golden hour solid accent, center shows e.g. "7am · golden hour"), and *Weekdays* — 7 bars (S M T W T F S), best day highlighted.
3. **The year**: *Every day* card — GitHub-style heatmap of the selected calendar year (8px cells, 2px gap), month labels above (20px gap), Mon/Wed/Fri labels left (9px mono), year pager (icon-btns + year, forward disabled at current year). Cell glow scales with words; **milestone days** render in their glyph's color at full glow and name the milestone in the tooltip. Cells are clickable → jump to that day.
4. **Forecast strip**: accent-tinted banner — "At your recent pace — about N words a day — you'll pass 25,000 words around Mar 4." (last-14-day pace → next round target).
5. **Vocabulary**: two-column divider rows — Favorite word (stopwords + contractions excluded), Distinct words, Average entry, Time on the keyboard.
6. Charts animate on entry: line sweeps in via clip-path (.7s), dots pop with 18ms stagger, clock hands grow (20ms/hour), bars rise (50ms stagger), heatmap wipes (.8s). Replayed on every visit.

### Milestones (⌥M, trophy icon in toolbar)
"N of 20 earned" + groups: **Beginnings** (First words, Early bird <9am, Night owl ≥9pm, Witching hour 12–3am) · **Streaks** (7/30/60/90 days — the flame tile carries a ×2/×3/×4 circle badge overlapping its bottom-right) · **Big days** (Quick goal <10min, Long session ≥30min, Double goal, Record day ≥500) · **Lifetime** (10k/25k/50k words medal, 100k trophy) · **Collection** (50/100/365 entries, Anniversary). Tiles: 76px wide, 8×8 glyph at 4px cells; locked = 45% opacity, grey glyph; tooltip shows requirement + date earned (computed from entry history).

### Settings (⌥T, gear icon)
Daily word goal (number input, spinners hidden), name field, theme segment (dark/light), focus toggle, export: copy today / download all as Markdown.

### Command palette (⌘K)
Centered modal over dimmed backdrop. Search input; rows grouped under 9px eyebrow headings — **Jump to date** (parsed queries: "jun 12", "12 jun 2025", "yesterday", "tuesday" → "Go to Fri, Jun 12"), **Go to** (Entries/Stats/Milestones/Settings), **Days** (today, prev/next day ←/→, weeks ⌥←/⌥→), **View** (focus ⌥F, theme ⌥D). Selection follows hover and ↑↓; Enter runs; empty state: 'No command matches "xyz" — try fewer letters, or press [Esc] to close.'

## The tile glyph system
While typing, the tile is an 8-column equalizer driven by keystroke energy (decays ×0.72 per 220ms tick). Events propose glyphs with priorities (higher wins; typing clears ambient ones); all time out and revert:
- First words of the day → smiley (2.4s); before 9am sun; after 9pm moon; 12–3am bat (flapping); after a 3+ day gap "welcome back" growing-stem sequence (4.4s); on Jan 1 the confetti-ball (facets twinkle in flair colors, color-cycling glow, 4.2s)
- Goal crossed → confetti rain (3.2s); if in <10 min bolt (draws top→bottom ~600ms, white flash on completion, loops); on 7-day streak multiples flame
- Double goal → confetti; personal record → heart pulse (3s); 30-min session → hourglass (once/day, 3.6s)
- Lifetime word thresholds → medal/trophy; entry-count thresholds → star/gem; anniversary → cake (flame flicker)
- Medal/trophy/gem/hourglass share a diagonal shine sweep; viewing a past goal-hit day shows a dim static green check (draws left-to-right); idle >90s shows slow expanding rings
- Glyph pixels bloom in radially (45ms/px-distance stagger); tile hover highlights cells under cursor; click ripples

## Keyboard model
⌘K palette (the only ⌘ binding). ⌥-layer via `e.code` so shortcuts work while typing: W write/today, E entries, S stats, M milestones, T settings, F focus, D theme, ⌥←/⌥→ ±1 week. Plain ←/→ = ±1 day (editor view, not while typing). On Write, any printable key refocuses the editor. Esc unwinds: palette → calendar → blur input → exit focus mode → back to Write.

## State & Data
LocalStorage keys (prototype): `daybook.entries` `{ 'YYYY-MM-DD': text }` · `daybook.times` `{ key: seconds }` (accumulates while typing, pauses after 15s idle) · `daybook.hours` `{ 0–23: words }` · `daybook.goal` · `daybook.theme` · `daybook.name`. Derived at render: word counts, streaks, milestones, forecasts. In production: add schema versioning, per-session records (start/end/words), JSON backup/import, multi-tab safety (storage events), quota warnings; see PROMPTS.md phases 7–8.

## Assets
None — no images or icon fonts. Icons are inline SVGs (Lucide-style, 1.7–2.2 stroke); glyphs are 8×8 bitmaps in source. Fonts ship with the Forma CSS in `_ds/`.

## Files
- `Oscar.dc.html` — the full working prototype (template + logic; authoritative for all values, bitmaps, and trigger logic)
- `Oscar Patterns.dc.html` — tokens, glyph inventory, motion, shortcut scheme
- `Oscar Components.dc.html` — composed patterns (toolbar, tiles, rows, banners, palette, chart conventions)
- `support.js`, `_ds/` — runtime + base stylesheet so the prototypes open in a browser
- `PROMPTS.md` — staged Claude Code prompts to build the production app

## Screenshots
See `screenshots/` — write (+ calendar popover), entries, stats (3 scroll positions), milestones, settings, and the command palette, all in the dark theme.
