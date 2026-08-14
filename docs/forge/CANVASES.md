# Forge Canvases — tab catalog

All 16 strategy canvases are implemented in a single module
(`frontend/components/forge/sections/Canvases.tsx`, ~720 lines after wave 11) to
share the `ProjPicker`, `BlockEditor`, `EventAdder` and `SectionHeading` helpers
and to keep SmelterSection's AnimatePresence switch cheap.

Each canvas is a self-contained React component that reads/writes its slice of
`forge` state via `useStore()` — there is no canvas registry, no plugin system,
and no lazy loading (the module is small enough to ship in one chunk).

Every canvas follows the same template:

```
<SectionHeading title="…" subtitle="…" projId={projId} setProjId={setProjId} />
<div className="…fr-panel…">
  <ProjPicker value={projId} onChange={setProjId} />
  {/* grid / canvas / sticks */}
</div>
```

Linking a canvas to a project (`projId`) filters/curates entries that are
project-scoped; leaving it null treats the canvas as "global to the Forge".

---

## BMC — Business Model Canvas

- State slice: `forge.bmc` (map of `projectId | "global"` → `Bmc`)
- 9 blocks: Key Partners, Key Activities, Key Resources, Value Propositions,
  Customer Relationships, Channels, Customer Segments, Cost Structure, Revenue
  Streams.
- Each block is a `BlockEditor` list with inline add/delete.
- Visual: 4-column top band + tall middle VP + 2-column bottom band; amber
  block labels on iron plates.

## VPC — Value Proposition Canvas

- State slice: `forge.vpc`
- Two halves on a cream card:
  - **Customer profile**: jobs, pains, gains (rustic/rust-coloured).
  - **Value map**: products & services, pain-killers, gain-creators (cyan).
- Pains ↔ pain-killers and gains ↔ gain-creators are parallel lists so
  prioritisation gaps are visually obvious.

## Lean Canvas

- State slice: `forge.lean`
- Ash Maurya's lean-startup remix: Problem, Solution, Key Metrics, Unique Value
  Proposition, Unfair Advantage, Channels, Customer Segments, Cost Structure,
  Revenue Streams.
- Distinct colour coding vs BMC (burnt orange + cyan) so the two are never
  confused.

## Porter's Five Forces

- State slice: `forge.porter`
- Centre tile "Existing Rivalry" with four satellite tiles: Threat of New
  Entrants, Threat of Substitutes, Buyer Power, Supplier Power.
- Each force has editable intensity (1–5) + notes; the centre displays a
  composite "industry pressure" readout.

## PESTEL

- State slice: `forge.pestel`
- Six vertical columns for Political, Economic, Social, Technological,
  Environmental, Legal. Each is a sticky list with +add inline.
- Columns colour-coded to match the six letters (steel, amber, violet, cyan,
  green, orange).

## User Stories

- State slice: `forge.userStories`
- Stories are objects with `personaId?, asA, iWant, soThat, acceptanceCriteria[]`.
- Per-story card with persona picker and a checklist of AC items.
- "+ Story" button at the bottom of the project stack.

## Affinity Grouping

- State slice: `forge.affinity`
- A set of groups, each with a title and an arbitrary list of sticky notes.
- "+ Group" and "+ Note (ungrouped)" actions; notes can be moved between groups
  by re-keying (v1.x: in-place edit of group label + delete; drag to re-group
  slated for v1.2).

## Buy-a-Feature

- State slice: `forge.buyAFeature`
- Budget-constrained innovation game: a configurable $$ pool, feature rows with
  editable price, a "purchased" toggle.
- Running total + remaining budget readout; over-budget flairs red.

## Paired Comparison

- State slice: `forge.paired`
- Grid of N×N items; clicking the cell for row i vs column j votes for one side.
- Win-ranks auto-calculate from the pairwise vote matrix and display as a
  sorted leaderboard.

## Journey Map

- State slice: `forge.journeyMaps`
- Default stages: AWARE → CONSIDER → DECIDE → USE → RETAIN (user can add more).
- Per-stage: actions, thoughts, pain points, opportunities + a 1–10 satisfaction
  slider.
- Live SVG satisfaction **polyline** with stage dots is rendered above the
  stages so dips (pain) and peaks (delight) are instantly visible.

## Service Blueprint

- State slice: `forge.blueprints`
- Five horizontal swimlanes, each with its own accent colour:
  - CUSTOMER ACTIONS (green)
  - ONSTAGE (visible employee actions, cyan)
  - BACKSTAGE (invisible employee actions, violet)
  - SUPPORT PROCESSES (steel)
  - EVIDENCE (artifacts, amber)
- Inline "+ step" add per lane; delete per step.

## Event Storming

- State slice: `forge.eventStorms`
- Four sticky kinds rendered on a wide board with three dashed horizontal
  swimlane dividers (timeline flow left → right):
  - 🟧 Domain events (amber)
  - 🟦 Commands (cyan)
  - 🟪 Aggregates (violet)
  - 🟩 Policies (green)
- The `EventAdder` helper lets you pick a kind and drop a new sticky at a
  staggered X position; stickies are removable by hover-✕.
- v1.x: positions are auto-placed; free drag → v1.2.

## Mindmap

- State slice: `forge.mindmaps` (one per project/global)
- Radial tree: root node (violet, larger) in the centre; "+" button on any node
  adds a child auto-positioned at +180 px right / 36 px vertical step.
- Inline rename; delete removes the node **and all descendants** recursively.
- Dashed SVG connector lines rendered between every parent/child pair.
- Faint 40px grid background so the map reads like a drafting sheet.
- v1.x: click-to-place (no drag-reposition).

## Free Canvas

- State slice: `forge.canvases`
- 24px snap-grid canvas with four tool types × four colours:
  - 🟨 Sticky note (rotated 0–3° for hand-placed feel, shadow)
  - 🟦 Box (rect block with label)
  - ⚫ Dot (small circle marker)
  - 📝 Note (text block, full-width)
- Click-to-place at the next grid coordinate; hover-✕ to delete.
- v1.x: click-to-place only.

## Wireframes

- State slice: `forge.wireframes`
- Per-screen cards with a sketch "placeholder" region containing labelled
  boxes for **nav / hero / CTA / button** (the kind of quick lo-fi wireframe
  you'd draw in a notebook) plus a free-text notes field that the team uses
  for Figma links, user-test notes, etc.
- "+ Screen" button appends a new card; per-card delete.

## Voice Notes

- State slice: `forge.voiceNotes` (metadata only)
- Uses the browser `MediaRecorder` API (`getUserMedia`) to capture mic audio.
- During record: pulsing red dot + mm:ss elapsed timer.
- On stop: a `VoiceNote` is pushed to state with `{id, title, createdAt, transcript?, mimeType}`.
  The actual audio `Blob` is stored on `window.__forgeVoice[id]` as an
  `objectURL` — **session only** (Blob URLs can't be localStorage-persisted).
  An `<audio controls>` element plays it back.
- Free-text transcript textarea per note.
- Delete revokes the object URL and removes from `window.__forgeVoice`.

---

## Adding a new canvas (future)

1. Add the collection type + default to `ForgeState` in `forgeTypes.ts`.
2. Add a seed entry in `SEED_FORGE` and migration in `migrateForge` (`store.tsx`).
3. Add a demo entry in `buildForgeDemo` (`forgeDemo.ts`).
4. Build the tab component in `Canvases.tsx` following the `SectionHeading` +
   `ProjPicker` template.
5. Add a tab entry to `TABS` in `SmelterSection.tsx` and an `AnimatePresence`
   case that renders the component.
6. Pick an icon from `lucide-react` that doesn't clash with the existing 31 tabs.
