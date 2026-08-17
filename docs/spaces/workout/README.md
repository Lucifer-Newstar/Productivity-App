# Workout space 💪

The **Workout** space lives at `/workout/*` and ships as a full-screen imperial
Japanese obsidian-themed app. It's battle-tested on `main` — see
`docs/FEATURES.md` for the 149-feature checklist and `docs/qa/TEST-REPORT.md`
for the prior QA pass.

## Theme
- **Dark (forced):** imperial obsidian `#0a0709`, crimson `#b91c1c`/`#7f1d1d`, emperor
  gold `#d4af37`/`#fde68a`; Cinzel/Cormorant/Shippori Mincho type; GoldenDragon
  改善+善 kanji; katana slashes; crown sigil; damascus/grille/k-blade textures;
  ambient animated mesh blobs.

## Routes

| Path | Mounts |
|---|---|
| `/workout` | `WorkoutOverview` |
| `/workout/overview` | Overview dashboard |
| `/workout/gym` | Gym tracking (plates/1RM/Wilks/warmup/history/metrics) |
| `/workout/calisthenics` | Chains / skills / GtG / isometrics / EMOM / AMRAP / flows / mobility |
| `/workout/cardio` | Run/bike/swim/row/jump-rope logging |
| `/workout/schedule` | Routine builder, superset/giant-set linking, reorder blocks |
| `/workout/prs` | Personal records with history |
| `/workout/skills` | Calisthenics skill progressions |
| `/workout/charts` | Progress charts |
| `/workout/library` | Exercise library |
| `/workout/tools` | Workout calculators (1RM, plates, etc.) |
| `/workout/kanban` | Planning board |

## File map
```
frontend/
├── components/workout/       # All workout UI (WorkoutShell, ActiveWorkout, MuscleHeatmap, …)
├── pages/workout/*.tsx       # Route entry points
└── lib/
    ├── workoutAnalytics.ts   # Pure math (1RM, Wilks 2020, volume, readiness)
    ├── exerciseLibrary.ts    # Default exercise seed
    └── types.ts              # WorkoutState + all workout types (re-exported)
```

## Data model
See `docs/DATA-MODEL.md` — `WorkoutState` includes exercises, prs, skills,
routines, sessions (with rich WorkoutSetLog metadata), readiness, badges,
bodyweight, settings, caliChains/skills/flows, gtg, isometricLogs, intervalLogs,
mobility, planche entries, cardioLogs, programs, goals, customMetrics,
challenges, journal, board, restDays, etc. Persisted to `localStorage["kaizen.workout"]`.

## Key features shipped
- One-thumb in-session UI with superset/giant-set auto-skip
- 89-region anatomical muscle heatmap SVG
- Plate-loading calculator, Wilks 2020, Epley 1RM
- Unilateral (L/R) tracking with asymmetry auto-tag
- Block reorder (↑/↓ arrows)
- Rest timer audio chirps
- Badges, streaks, motivation board
- Workout types: gym, calisthenics (chains/skills/gtg/iso/interval/flow/mobility), cardio, programs, custom metrics
