# Profile Glow credentials and gender-aware Health

**Date:** 2026-08-21
**Status:** implemented in source
**Electron:** unchanged

## Outcome

`/profile` Glow now hosts the same AFTERGLOW session catalogue keys as Providers & Credits. Each required key has a `!` help control with the official how-to URL. Health uses female Navy BF% (hip required), ICMR female iron, and an optional cycle log. Profile and Health pick up a warmer accent when gender is female; the five space OSes are unchanged (ADR-009).

## Credentials

- Keys: `afterglow.key.mal|tmdb|google|comicvine|nyt` in `sessionStorage` only.
- Shared helper: `frontend/lib/entertainmentKeys.ts`.
- Never stored in `kaizen.profile`, backups or Entertainment state.
- Help URLs: MAL, TMDB, Google Books, Comic Vine, NYT Books official docs.

## Health

- `navyBf(gender, …)` selects `navyBF_m` or `navyBF_f`.
- `currentBfPct` and Soma live/save use gender; hip required for female.
- `microDailyTargets("female")` sets iron to 29mg (ICMR adult women); folate stays 300 mcg DFE.
- `HealthState.cycleLog` + `estimatedNextPeriodStart`. Copy: educational, not medical advice.
- Identity gender writes `health.profile.gender` and enables cycle visibility for female.

## Non-goals

No Electron edits, no Workout S:W restyle, no clinical PCOS/diagnosis language, no AI writes.
