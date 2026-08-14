# Strategy canvases (Smelter §03)

All 16 strategy canvases live in
`frontend/components/forge/sections/Canvases.tsx` and are selected from the
Smelter tab rail. See the [README](README.md) for the file map; this doc lists
each tab's state shape and behavior.

| # | Canvas | State slice | Behavior |
|---|---|---|---|
| 1 | BMC | `forge.bmc[projectId|"global"]` | 9 blocks (KP/KA/KR/VP/CR/CH/CS/C$/R$) via BlockEditor |
| 2 | VPC | `forge.vpc[…]` | Two-column: customer profile (jobs/pains/gains) ↔ value map (products/pain-killers/gain-creators) |
| 3 | Lean | `forge.lean[…]` | 9-block Ash Maurya variant (Problem/Solution/UVP/Unfair/Channels/CSeg/Cost/Rev + Key Metrics) |
| 4 | Porter | `forge.porter[…]` | 5 forces (new entrants/substitutes/buyer/supplier/rivalry) with intensity 1–5 |
| 5 | PESTEL | `forge.pestel[…]` | 6 vertical column stickies (P/E/S/T/E/L) |
| 6 | User Stories | `forge.userStories` | persona/as-a/I-want/so-that cards + acceptance criteria checklist |
| 7 | Affinity | `forge.affinity` | Grouped sticky clusters |
| 8 | Buy-a-Feature | `forge.buyAFeature` | $$ pool + priced features + purchase log; running total + over-budget red |
| 9 | Paired | `forge.paired` | N×N vote matrix; auto-computed win-rank leaderboard |
| 10 | Journey Map | `forge.journeyMaps` | AWARE/CONSIDER/DECIDE/USE/RETAIN (user-addable); per-stage actions/thoughts/pains/opps; satisfaction 1–10 sliders; SVG satisfaction polyline |
| 11 | Service Blueprint | `forge.blueprints` | 5 swimlanes: CUSTOMER (green) / ONSTAGE (cyan) / BACKSTAGE (violet) / SUPPORT (steel) / EVIDENCE (amber); inline + add |
| 12 | Event Storming | `forge.eventStorms` | 4 sticky kinds on 3 dashed swimlanes: 🟧 events / 🟦 commands / 🟪 aggregates / 🟩 policies; staggered auto-place; hover-✕ delete |
| 13 | Mindmap | `forge.mindmaps` | Radial tree with root (violet); + per node adds child +180px/+36px; inline rename; recursive delete; dashed SVG connectors; 40 px grid |
| 14 | Free Canvas | `forge.canvases` | 24-px snap grid, 4 tools (sticky/box/dot/note) × 4 colors; sticky rotation + shadow; hover-✕ delete |
| 15 | Wireframes | `forge.wireframes` | Per-screen cards with sketch placeholders (nav/hero/CTA/button) + Figma-link notes; +SCREEN |
| 16 | Voice Notes | `forge.voiceNotes` | MediaRecorder + getUserMedia; pulsing red dot + mm:ss timer; Blob URL on `window.__forgeVoice`; inline `<audio controls>`; transcript textarea; delete revokes URL |

## Adding a new canvas
1. Add the collection type + default to `ForgeState` in `lib/forgeTypes.ts`.
2. Add the seed in `SEED_FORGE` and migration in `migrateForge` (`lib/store.tsx`).
3. Add a demo entry in `buildForgeDemo` (`lib/forgeDemo.ts`).
4. Implement the tab component in `Canvases.tsx` using `SectionHeading` + `ProjPicker`.
5. Register it in `TABS` in `SmelterSection.tsx` and add an `AnimatePresence` case.
6. Pick a unique lucide icon.

## Shared helpers
- `ProjPicker` — project selector dropdown used across all canvases.
- `BlockEditor` — generic draggable text block with inline add/delete.
- `SectionHeading` — consistent Bebas heading w/ accent bar.
- `EventAdder` — "+ event/command/aggregate/policy" adder used by Event Storming.
