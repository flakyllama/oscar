# Oscar

The domain language of Oscar, a local-first daily writing journal. One
entry per calendar day; everything else — sessions, milestones, sync —
derives from that.

## Language

### The journal

**Entry**:
The text written for one calendar day. There is exactly one per day key.
_Avoid_: Note, document, post

**Day key**:
A local calendar date (`YYYY-MM-DD`) identifying an entry. All date
arithmetic goes through the dates module — never millisecond division.
_Avoid_: Date string, ISO date

**Writing session**:
One stretch of typing on a day, ended by a 15-second idle pause, a day
change, or unload. Owned by the session module (`src/data/session.ts`);
per-day seconds accrue only while the typed day's editor is showing.
_Avoid_: Sitting, visit

**Trash**:
The 30-day recovery buffer for cleared days. Clearing is a soft delete;
the sync tombstone lives separately in day metadata.
_Avoid_: Archive, recycle bin

### Achievements

**Milestone**:
One of the 20 earnable achievements shown on the Milestones screen.
Thresholds live in the achievements module (`src/data/milestones.ts`)
and nowhere else.
_Avoid_: Badge, trophy (that's one milestone's glyph)

**Celebration**:
A glyph the pixel tile plays when an edit earns something — computed by
the achievements module (`celebrationsFor`), proposed by the Write
screen, arbitrated by priority.
_Avoid_: Animation, reward

**Glyph**:
An 8×8 bitmap the pixel tile can show (flame, heart, medal…). Bitmaps,
colours and priorities are presentation, in `src/components/glyphs.ts`;
the data layer refers to glyphs by name only.

### Sync

**Sync document**:
The one exchanged blob: days (text + time + updatedAt), hours, settings,
devices. Its types live in `src/sync/document.ts`, a leaf both the store
and the sync layer may import.
_Avoid_: Payload, state

**Sync target**:
A backend holding the sync document behind the `SyncTarget` interface —
cloud (default) or file. Each target owns its transport and encryption.
_Avoid_: Backend, provider

**StorePort**:
The engine's store-facing seam (`src/sync/port.ts`): the store as the
sync layer sees it. Adapters: the real store in the app, an in-memory
store in engine tests.

**Pending**:
Local changes queued for the next push — edited day keys plus a
settings-changed stamp. Cleared only for changes captured by a
completed sync's snapshot.
_Avoid_: Dirty, unsaved

**Tombstone**:
A day-metadata record marking a cleared day so the deletion propagates
instead of resurrecting. Lives in day metadata, not the trash.

### Shell

**Navigate**:
The one verb in the shell (`App.tsx`) that changes the view. It owns the
shared bookkeeping — closing overlays, the day animation, the
`view_changed` analytics event — so no path can skip it.
_Avoid_: Route, goto, setView

**Usage analytics**:
The content-free event allowlist in `src/data/analytics.ts`, sent over a
transport seam (Umami adapter in production, recording adapter in
tests). Counts *that* something happened, never *what* was written.
_Avoid_: Telemetry, tracking (in UI copy)
