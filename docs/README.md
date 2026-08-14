# Kaizen — Docs index

Kaizen is a 5-space productivity monorepo (Next.js Pages Router + an App Router
home). This folder is the human-readable map. Start here before touching code.

## Top-level docs

| File | What it covers |
|---|---|
| `ARCHITECTURE.md` | Monorepo layout, rendering model, state management, theming, persistence, git |
| `DATA-MODEL.md` | Entity shapes for Workout, Forge, and Career (root store keys) |
| `FEATURES.md` | Per-space feature audit (✅/🟡/❌) — the living checklist |
| `ALGORITHMS.md` | Pure math helpers (workout analytics, plate math, Wilks, etc.) |
| `API.md` | Backend REST route reference |
| `CAREER.md` | Career-space deep-dive (9 SECTORs, Night HUD + Blueprint themes) |

## Space sub-folders

| Folder | Space | Index |
|---|---|---|
| `forge/` | Forge PM-OS (`/projects/*`) | [`forge/README.md`](forge/README.md) — routes, theme, architecture, state, canvas catalog, shell niceties |
| `forge/CANVASES.md` | Forge strategy canvases — all 16 tab reference |
| `forge/HOTKEYS.md` | Forge keyboard shortcuts |
| `qa/` | QA / test notes | _(intentionally light — app is offline-first & UI-driven)_ |

## Spaces cheat sheet

| Space | Route | Full-screen | Dark theme | Light theme | Status |
|---|---|---|---|---|---|
| **Forge** (PM-OS) | `/projects/*` | ✅ | Foundry (iron/amber, hazard stripe, I-beam rail, diamond-plate footer, Bebas Neue) | Drafting Room (vellum/brass/pencil, 20/100 grid, APPROVED stamps) | **v1.0 shipped, merged to main** |
| **Workout** | `/workout/*` | ✅ | Imperial obsidian (crimson + emperor gold, Cinzel, kanji, crown) | Parchment / burgundy | Shipped (battle-tested) |
| **Career** | `/career/*` | ✅ | Night HUD (deep navy→black, cyan grid, scanlines, JetBrains Mono) | Blueprint (cream paper, cyan-blue ink, burnt-orange pencil) | Shipped |
| **Health** | `/health` | ❌ (shared `TopNav` + `SpaceTasks` stub) | n/a | n/a | Placeholder — next up for full-bleed (vitals / EKG-green / blood-red) |
| **Entertainment** | `/entertainment` | ❌ (shared `TopNav` + `SpaceTasks` stub) | n/a | n/a | Placeholder — next up (cinema neon / film noir) |

## Build & verify

```bash
cd frontend
npx tsc --noEmit      # must be clean
npx next build        # all 33 routes ○ static (pre-rendered)
```

Forge-only budget: shared CSS ~14.7 kB; Smelter First Load JS ~26 kB.

## Git conventions

- `main` — stable. Feature branches (`projects`, `career`, `workout`) merge in
  only after an explicit commander approval on this thread.
- Author: `Lucifer-Newstar <navin.jairam@gmail.com>` (pass via
  `git -c user.name=... -c user.email=... commit`).
- No remote configured — repo is local-only.
