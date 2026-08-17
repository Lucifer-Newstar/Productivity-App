# Kaizen — Docs index

Kaizen is a **5-space productivity monorepo** built on Next.js 16 (Pages Router + an App Router `/` dashboard). All spaces live in one frontend, one React Context store, and one `localStorage` persistence root — there is no standalone "Forge app".

```
productivity-app/
├── frontend/
│   ├── pages/                # Pages Router routes (one folder per space)
│   │   ├── _app.tsx          # Providers + TopNav vs FULLSCREEN switch
│   │   ├── projects/         # Projects space (a.k.a. "Forge")
│   │   ├── workout/          # Workout space
│   │   ├── career/           # Career space
│   │   ├── health/           # Health space (VITAL-SIGN OS, 10 FULLSCREEN routes, v1.1)
│   │   └── entertainment/    # Entertainment space (placeholder)
│   ├── app/                  # App Router home "/" (dashboard)
│   ├── components/           # UI (TopNav, SideNav, SpaceTasks, Dashboard, Notes, Habits, Pomodoro, Calendar, Tasks)
│   │   ├── forge/            # Projects space (internal codename — routes live at /projects/*)
│   │   ├── workout/          # Workout space
│   │   ├── career/           # Career space
│   │   └── health/           # Health space (VITAL-SIGN shell + 20 section components)
│   └── lib/                  # Shared store, types, themes, algorithms, demo seeds
├── backend/                  # Express skeleton (offline-first; frontend does not call it)
└── docs/                     # You are here
```

> **Note on the "Forge" codename:** the Projects space is branded **"Forge"** in the UI (⚒️ in the top nav, "THE FORGE" wordmark in the full-screen shell, "the forge" / "anvil" / "heat" / "quarry" / "smelter" / "vault" / "foundry" nomenclature inside the space). That is **display branding only** — it is not a standalone app or separate product. Code lives under `components/forge/` because that was the internal module name when the shell was built out; routes live at `/projects/*` per the space architecture.

## Where to look

### Top-level references
| File | Covers |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Monorepo layout, rendering model, state, themes, persistence, build |
| [`DATA-MODEL.md`](DATA-MODEL.md) | Entity shapes for Workout, Projects, Career (root store) |
| [`FEATURES.md`](FEATURES.md) | Per-space feature audit (✅/🟡/❌) |
| [`ALGORITHMS.md`](ALGORITHMS.md) | Pure math helpers (1RM/Wilks, plate loading, readiness, velocity regression) |
| [`API.md`](API.md) | Backend REST reference |
| [`SECURITY.md`](SECURITY.md) | Threat model, deployment controls, audit findings and security tests |

### Per-space docs (`docs/spaces/<space>/`)
| Space | Route | Full-screen | Status |
|---|---|---|---|
| **projects** (Forge) | `/projects/*` | ✅ | v1.0 shipped — see [`spaces/projects/README.md`](spaces/projects/README.md) |
| **workout** | `/workout/*` | ✅ | Battle-tested — see [`spaces/workout/README.md`](spaces/workout/README.md) |
| **career** | `/career/*` | ✅ | Night HUD / Blueprint — see [`spaces/career/README.md`](spaces/career/README.md) |
| **health** | `/health/*` | ✅ | VITAL-SIGN OS v1.1 shipped (216 ✅ of 281 spec rows, waves 1-9) — see [`spaces/health/README.md`](spaces/health/README.md) / [`FEATURES.md`](spaces/health/FEATURES.md) / [`WAVES.md`](spaces/health/WAVES.md) |
| **entertainment** | `/entertainment` | ✅ | AFTERGLOW v1.0 — Waves 0–9, 94✅/2🟡/0❌ — see [`spaces/entertainment/README.md`](spaces/entertainment/README.md) |

Each space folder holds:
- `README.md` — routes, theme tokens, architecture, file map.
- `FEATURES.md` (where applicable) — detailed per-feature checklist.
- `QA.md` — smoke-test checklist + per-route pass/fail for the last QA sweep.

### Quality & bugs
| Folder | Contents |
|---|---|
| [`qa/`](qa/) | Cross-space QA test plans (workout QA report lives there historically) |
| [`bugs/`](bugs/) | `BUGS.md` — root-cause log of every bug found and fixed, dated |

## Build & verify

```bash
cd frontend
npx tsc --noEmit      # must be clean
npx next build        # all routes should be ○ (static prerender)
```

Last known good build (2026-08-14 v1.0):
- 33/33 routes static (○)
- Shared CSS 14.7 kB
- Smelter (heaviest Projects page) First Load JS 210 kB
- 0 TypeScript errors
- 29/29 HTTP 200 on production smoke test

## Git conventions

- `main` — stable. Feature branches merge in after explicit approval; old branches (`projects`, `career`, `workout`) have been merged and deleted. The `health` branch merged into main (v1.1, 2026-08-15) and was deleted per convention.
- Author: `Lucifer-Newstar <navin.jairam@gmail.com>` (pass via `git -c user.name=... -c user.email=... commit`).
- No remote is configured (`fatal: 'origin' does not appear`); the repo is local-only by design.
