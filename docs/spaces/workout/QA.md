# Workout space — QA

_Last full pass: 2026-08-13 (see `docs/qa/TEST-REPORT.md` for that report). Sanity-re-verified 2026-08-14._

## Build verification

```
/workout              465 B   163 kB
/workout/overview     8.1 kB  205 kB
/workout/gym          7.14 kB 194 kB
/workout/calisthenics 8.84 kB 198 kB
/workout/cardio       4.27 kB 194 kB
/workout/schedule     6.21 kB 194 kB
/workout/prs          4.29 kB 192 kB
/workout/skills       5.35 kB 193 kB
/workout/charts       6.76 kB 194 kB
/workout/library      7.64 kB 204 kB  (558 ms)
/workout/tools        11.1 kB 198 kB
/workout/kanban       5.71 kB 193 kB
```

All routes ○ static. `tsc --noEmit` clean.

## HTTP smoke (production build, 2026-08-14)

| Route | Status | Hydration marker |
|---|---|---|
| `/workout` | 200 | 0 |
| `/workout/overview` | 200 | 0 |
| `/workout/gym` | 200 | 0 |
| `/workout/calisthenics` | 200 | 0 |
| `/workout/cardio` | 200 | 0 |
| `/workout/schedule` | 200 | 0 |
| `/workout/prs` | 200 | 0 |
| `/workout/skills` | 200 | 0 |
| `/workout/charts` | 200 | 0 |
| `/workout/library` | 200 | 0 |
| `/workout/tools` | 200 | 1 (string "Hydration pre/post (ml)" in water tracker) |
| `/workout/kanban` | 200 | 0 |

No error-boundary markers in any response.

## Known v1.2+ scope
See `docs/FEATURES.md` for the detailed per-feature status. The workout space is
considered battle-tested; future work is incremental polish.
