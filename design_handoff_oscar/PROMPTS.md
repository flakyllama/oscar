# Claude Code prompts — building Oscar

Run these in order, one per session/PR. Each assumes the repo contains this handoff folder at `design_handoff_oscar/`. Always point Claude Code at `README.md` and `Oscar.dc.html` as ground truth.

## 1 — Scaffold + theme
> Read design_handoff_oscar/README.md. Scaffold a React 18 + TypeScript + Vite app for "Oscar", a local-first daily journal. No component library; plain CSS with custom properties. Port the theme tokens from design_handoff_oscar/_ds/**/colors_and_type.css and the Oscar overrides in README "Design Tokens" into src/styles/tokens.css (dark + light via [data-theme]). Add the .kbd and .icon-btn utilities, the focus-visible rule, and the keyframes found in the <style> block of Oscar.dc.html. Set up a view-state router (write | entries | stats | milestones | settings) with the floating bottom toolbar from README "Nav toolbar" — sliding active indicator included.

## 2 — Data layer
> Implement Oscar's storage in src/data/: a typed store over localStorage with keys daybook.entries/times/hours/goal/theme/name (shapes in README "State & Data"), plus (a) a schemaVersion key + migration hook, (b) cross-tab sync via the storage event, (c) a quota-safe save that surfaces failures, (d) selectors for word count, streaks (current/longest), lifetime totals, per-hour histogram. Unit-test the streak and word-count logic, including midnight/DST boundaries — day keys must be local-date based (fix the prototype's UTC key bug noted in README).

## 3 — Write screen
> Build the Write screen per README "Write": borderless editor with accent caret, typing-session timer (pause after 15s idle), word milestones in the left margin, typewriter scroll (recenter when caret drifts >40px), adaptive placeholder that greets by name and types out with a 2px blinking cursor (native caret hidden while empty), day navigation (←/→), past-day banner, on-this-day card, and focus mode. Match Oscar.dc.html exactly — open it side by side.

## 4 — Tile glyph engine
> Port the pixel tile from Oscar.dc.html: 8×8 grid, equalizer driven by keystroke energy (×0.72 decay per 220ms tick), and the glyph event system — copy the GLYPHS bitmaps, GLYPH_COLOR map, PRI priorities, frameFor animation frames, and every propose() trigger verbatim from the prototype source (README "The tile glyph system" summarizes them). Include radial bloom-in staggering, hover highlight, click ripple, glow, and the bolt draw-in/flash and shine-sweep effects. Make it a self-contained <PixelTile> component with a demo/storybook page cycling all glyphs.

## 5 — Calendar + palette + shortcuts
> Implement (a) the calendar popover on the Write date heading (month grid with entry dots/today ring/selected fill, month paging, year-grid mode with 12-year paging, fixed footprint, opens on viewed month), (b) the ⌘K command palette with category groups and natural-language date parsing ("jun 12", "yesterday", "tuesday"), and (c) the full keyboard model from README "Keyboard model" — ⌥-layer via e.code, Esc unwind order, printable-key refocus on Write.

## 6 — Entries + Stats + Milestones + Settings
> Build the remaining screens per README: Entries (search, month groups, hover/focus rows), Stats (stat tiles with bottom-pinned captions; daily-words line chart with axes/goal line; writing-hours radial clock; weekday bars; year heatmap with year pager, glow ramp, clickable + milestone-colored cells; forecast strip; vocabulary rows; entry animations with the exact stagger timings), Milestones (5 groups, 20 tiles, ×N badges, earned dates in tooltips), Settings (goal, name, theme, focus, Markdown export). Reuse the shared ramp()/bestMix color helpers.

## 7 — Data management
> Add user data management: JSON backup export/import (entries, times, hours, settings, schemaVersion) with merge-on-import conflict handling; per-session records ({dayKey, start, end, words}) written alongside the daily totals; a storage usage meter and quota warning in Settings; soft-delete (trash with restore) for cleared days; and an optional passcode gate that encrypts entries at rest (WebCrypto AES-GCM, key derived from passcode).

## 8 — Sync (optional)
> Design and implement cloud sync: pick a minimal backend (or use the File System Access API to sync to a user-owned file as a no-server option). Requirements: last-write-wins per day-key with tombstones, offline-first queue, and multi-device conflict surfacing in the UI. Keep local-first as the source of truth.
