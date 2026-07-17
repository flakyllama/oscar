# Oscar

A minimal, keyboard-first daily writing journal. One entry per calendar
day, a plain-text editor with a typewriter feel, and an 8×8 pixel tile
that reacts to your writing — an equalizer while you type, celebration
glyphs when you hit a milestone. Everything is stored locally; nothing
leaves your device unless you turn on file sync.

Built from the design handoff in [`design_handoff_oscar/`](design_handoff_oscar/)
(React + TypeScript + Vite, plain CSS custom properties, no component
library).

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
```

| Script            | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Vite dev server with HMR                       |
| `npm run build`   | Type-check (`tsc -b`) then production build    |
| `npm run preview` | Serve the production build                      |
| `npm test`        | Run the unit tests once (Vitest)               |
| `npm run test:watch` | Watch mode                                  |

Requires Node 18+.

### Handy URLs

- `?seed` — one-time demo data (six sample entries) if the journal is
  empty, e.g. `http://localhost:5173/?seed`. Nothing is seeded once you
  have real entries.
- `#tile-demo` — a standalone page that cycles every pixel-tile glyph,
  for working on the tile in isolation.

## The app

Six views, reachable from the floating toolbar or the keyboard:

- **Write** — the default. Borderless editor with an accent caret, a
  placeholder that greets you by name and types itself out, word-count
  milestones in the left margin, a typewriter scroll that keeps the
  caret near center, a session timer, day navigation, a "past day"
  banner, and an "on this day" card. The pixel tile lives up top.
- **Entries** — searchable list grouped by month and year.
- **Stats** — streak/total/entries/best-day tiles, a 28-day line chart,
  a 24-hour radial "writing hours" clock, weekday bars, a GitHub-style
  year heatmap (milestone days are colored by their glyph), a pace
  forecast, and vocabulary facts.
- **Milestones** — 20 achievements in 5 groups, earned dates in tooltips.
- **Settings** — name, daily goal, theme, focus mode, Markdown export,
  and all the data controls below.
- **Tile demo** — see `#tile-demo` above.

### Keyboard model

`⌘K` is the only ⌘ binding. Everything else lives on the `⌥` layer
(read via `e.code`, so the shortcuts work even while you're typing).

| Keys        | Action                    |
| ----------- | ------------------------- |
| `⌘K`        | Command palette           |
| `⌥W`        | Write / jump to today     |
| `⌥E`        | Entries                   |
| `⌥S`        | Stats                     |
| `⌥M`        | Milestones                |
| `⌥T`        | Settings                  |
| `⌥F`        | Toggle focus mode         |
| `⌥D`        | Toggle theme              |
| `←` / `→`   | Previous / next day (Write) |
| `⌥←` / `⌥→` | Back / forward a week     |
| `Esc`       | Unwind: palette → calendar → blur input → exit focus → back to Write |

The command palette also parses natural-language dates — "jun 12",
"12 jun 2025", "yesterday", "tuesday".

## Architecture

Plain React with a small hand-rolled store; no state library, no router
— view is a piece of `useState` in [`App.tsx`](src/App.tsx).

```
src/
├── App.tsx              View router, keyboard model, session tracking, footer
├── components/
│   ├── PixelTile.tsx    The 8×8 tile: equalizer + glyph stage
│   ├── glyphs.ts        Glyph bitmaps, colors, priorities, animation frames
│   ├── Toolbar.tsx      Floating nav with the sliding active indicator
│   ├── CalendarPopover.tsx / CommandPalette.tsx / Tooltip.tsx / Icons.tsx
├── screens/            Write, Entries, Stats, Milestones, Settings, TileDemo
├── data/
│   ├── store.ts         Typed store over localStorage (subscribe/snapshot)
│   ├── dates.ts         Local-date day keys + DST-safe arithmetic
│   ├── selectors.ts     Word counts, streaks, totals, histograms, forecast
│   ├── milestones.ts    The 20 milestone definitions + earned dates
│   ├── crypto.ts        WebCrypto AES-GCM passcode gate
│   ├── backup.ts        JSON export/import with merge-on-import
│   └── useStore.ts      useSyncExternalStore binding
├── sync/
│   ├── merge.ts         Pure LWW-per-day merge with tombstones
│   ├── identity.ts      Master key → HKDF account/auth/enc; sync-key codec
│   ├── target.ts        SyncTarget interface + IndexedDB persistence
│   ├── fileTarget.ts    File System Access backend
│   ├── cloudTarget.ts   Zero-knowledge Worker backend
│   └── engine.ts        Orchestrator: pull → merge → apply → push
├── styles/             tokens.css (theme) + app.css (interaction states)
└── ../worker/          Cloudflare Worker + KV sync backend (deployed separately)
```

### Data & privacy

All data lives in `localStorage` under `daybook.*` keys (entries, times,
hours, per-day sync metadata, settings). Day keys are **local calendar
dates** (`YYYY-MM-DD`), and all date math is DST-safe — see the tests in
[`dates.test.ts`](src/data/dates.test.ts).

- **Backup** — export/import the whole journal as JSON. Import *merges*:
  missing days are filled, and on a conflict the longer text wins.
- **Passcode** — optionally encrypt entries at rest with AES-GCM (key
  derived from the passcode via PBKDF2). Set it in Settings; there's no
  recovery, so keep it safe.
- **Trash** — cleared days are recoverable from Settings.
- **Storage meter** — Settings shows usage against the ~5 MB budget and
  warns before you hit it.

### Sync (optional)

Local-first is the source of truth; sync just exchanges one document
through a backend. Two backends sit behind a shared
[`SyncTarget`](src/sync/target.ts) interface and the same merge core:

- **Cloud** (default, every browser) — a zero-knowledge
  [Cloudflare Worker](worker/) over KV. Everything derives from one
  256-bit **master sync key**, shown once as a copyable code
  (`oscar1-…`); the client derives an account id, a bearer token, and an
  AES-GCM key from it via HKDF. The server stores only ciphertext and a
  *hash* of the auth token, so it can never read your journal. Add a
  device by pasting the same key.
- **File** (Chromium only) — a JSON file **you own**, via the File System
  Access API; drop it in an iCloud/Dropbox/Drive folder for no-server
  sync. Encryption here is the optional local passcode.

Both share:

- Last-write-wins per day-key, with tombstones so deletions propagate
  instead of resurrecting.
- Offline-first: edits queue locally and push when the backend is
  reachable; remote changes are picked up by polling.
- Concurrent edits to the same day surface as conflicts in Settings, with
  the losing version preserved (never silently dropped). A push that
  races another device (version conflict) re-pulls and re-merges.

The merge and identity logic are pure and unit-tested
([`merge.test.ts`](src/sync/merge.test.ts),
[`identity.test.ts`](src/sync/identity.test.ts)); the Worker has its own
handler tests ([`worker/index.test.ts`](worker/index.test.ts)).

**Deploying the cloud backend** is a few commands — see
[`worker/README.md`](worker/README.md). Point the app at your Worker with
`VITE_SYNC_ENDPOINT` at build time, or paste the URL into the Sync panel.

## Testing

```bash
npm test
```

54 unit tests cover the load-bearing logic: local-date/DST day keys,
streak and word-count selectors, backup merge, and the sync merge
(LWW + tombstones + conflict detection). The UI is verified manually
against the handoff screenshots.

## Design source

`design_handoff_oscar/` holds the original HTML prototype
(`Oscar.dc.html`) and its pattern/token references — the authoritative
source for every value, bitmap, and interaction. `PROMPTS.md` there is
the staged build plan this project was implemented from.
