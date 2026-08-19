# Core local-date and habit correctness

**Date:** 2026-08-19
**Backlog items:** APP-003, APP-101

## Corrections

### Local-calendar dates

Added `localDateKey`, `dateFromLocalKey` and `addLocalDays` to represent persisted `YYYY-MM-DD` values in the user's local calendar rather than UTC.

Updated:

- Home Calendar cell keys, Today selection and selected-date rendering
- Task created-date fallback and overdue comparison
- Dashboard same-day Health water lookup
- central store `todayIso()` generation
- Habit seven-day date generation

This prevents local midnight in IST and other positive-offset zones from being serialized as the previous UTC day.

### Habit streaks

Habit streak is now derived from normalized history instead of manually incremented state.

- Today completion includes today in the streak.
- If today is unfinished, a streak through yesterday remains visible.
- Gaps stop the streak.
- Unchecking today recalculates correctly.
- Invalid/duplicate persisted dates are removed during migration.
- Seed streaks no longer claim completions absent from history.
- Corrupt habit JSON falls back safely instead of breaking the view.

## Regression suite

Added `npm run qa:core` with nine checks covering IST UTC-boundary behavior, local parsing, invalid dates, month rollover, consecutive/broken streaks, unchecking and history migration.

The suite is included in hosted frontend CI. Local validation: **9/9 checks pass**, TypeScript passes and ESLint passes.

## Scope

No AI capability, backend integration or product feature expansion was added. Remaining date-key usages in specialized historical/report helpers should adopt the shared utility when touched, but the confirmed Home/task/habit correctness paths are fixed.