# Health Space QA

Last audited: 2026-08-14 (planning phase, pre-wave-1).

## Current state

- `/health` route exists: returns 200, renders `<SpaceTasks space="health" />` placeholder via shared TopNav.
- No HealthShell, no dedicated health components, no healthTypes/healthAnalytics modules yet.
- `health` feature branch is checked out; working from spec in [FEATURES.md](./FEATURES.md).
- TypeScript strict is clean on `main` (pre-branch point `852a3b1`); build 33/33 routes ○ static; 29-route smoke test all PASS.

## Pre-merge QA gates (will be enforced at each wave)

Each wave must satisfy:

1. `cd frontend && npx tsc --noEmit` is **zero errors, zero warnings** (strict mode).
2. `cd frontend && npx next build` produces `○` (static) for every `/health/*` route. No server-rendered or dynamic routes introduced by accident.
3. Smoke test (`/tmp/smoke.sh` extended) hits all `/health/*` routes → all 200, no error-boundary markers ("Application error", "Unhandled Runtime Error", "Internal Server Error").
4. Hydration guard: no `useLayoutEffect`/client-only code running pre-mount; mount-flag pattern like Forge/Career; `_app.tsx` bootsplash pattern.
5. localStorage: `migrateHealth()` is idempotent; reloading the page doesn't double-seed or wipe data; `kaizen.root` key contains `health: {...}`.
6. No `console.log`/`console.debug` leftovers (errors allowed).
7. Hotkeys respect the standard guard (ignore while typing in input/textarea/select/contenteditable; ignore when Meta/Ctrl held for chord combos).
8. Dream journal PIN: wrong PIN doesn't unlock; PIN can be reset via settings with confirmation.
9. Photo attachments: Blob/dataURL loading doesn't crash; revoke URLs on delete; storage-cap warning shown when approaching localStorage cap.
10. Workout bridge:
    - Bodyweight entries from Workout appear in Health physique view without duplication.
    - Completing a Workout session surfaces a hydration/protein nudge in Health.
    - Setting sleep debt >10h in Health flags a deload nudge in Workout.
    - Logging an injury in Health surfaces a session-start warning in Workout.
    - No circular imports between `healthAnalytics.ts` and `workoutAnalytics.ts` (enforced via lint comment / grep check).
11. India/Chennai defaults:
    - First-load hydration goal applies ×1.1 Chennai multiplier for a 70kg male (≈ 2695 ml base).
    - Food library seeds ≥80 Indian dishes with idli/dosa/sambar rice/chicken 65/parotta/thali/filter coffee/etc.
    - Filter coffee preset is 90mg caffeine; chai 40mg.
    - Coconut water flagged as electrolyte drink.
    - Vit D/B12/Iron/Zinc/Calcium/Omega-3 deficiency badges appear in Apothecary when food/supp logs show gaps.
    - Crisis helplines reference Indian numbers (Vandrevala 1860-2662-345, iCall 9152987821, NIMHANS).
    - Timezone reset uses IST (Asia/Kolkata).
12. All 257 features in FEATURES.md are either ✅, 🟡 (partial/MVP with note), or explicitly deferred to a later version. No phantom features promised in UI.
13. Medical-disclaimer footer visible on every route.
14. Light theme (CLINIC) pass for all panels at end of wave 9.

## Per-wave QA checklist (template)

When a wave ships, append a section like:

```
## Wave N — <name> (date)

- [ ] tsc --noEmit clean
- [ ] next build: N/N routes ○ static
- [ ] smoke test: all /health/* routes 200
- [ ] Manual feature checklist (walk each UI element added in this wave)
- [ ] hydration check (no console errors/warnings, mount-guard in place)
- [ ] localStorage persistence across reloads
- [ ] Workout bridge: tested both directions added this wave
- [ ] Hotkeys don't fire inside inputs
- [ ] Docs updated (FEATURES.md items flipped to ✅; QA updated; BUGS.md updated for any bugs found & fixed)
- [ ] Commit message follows `feat(health): ...` / `fix(health): ...` / `docs(health): ...` convention
```

## Known gaps / backlog (pre-implementation)

- No backend sync (offline-first by design; `/api/health/*` stubs deferred).
- No PWA/notifications (gentle in-app nudges only for v1).
- No wearables/Bluetooth integration (manual entry only).
- Photo storage uses dataURL → IndexedDB migration in v1.2 (localStorage size cap ~5MB).
- AI/photo food recognition out of scope v1 (manual or dropdown pick only).
- Women's menstrual cycle tracking is feature-flagged OFF for male profile; type and UI must still exist (just hidden by profile) for future multi-user support.
- Alcohol tracker opt-in (legal age 21 in TN; hidden by default).

## Bugs found so far

None yet (Health hasn't shipped code on this branch). Bugs will be appended
here and mirrored to [`docs/bugs/BUGS.md`](/docs/bugs/BUGS.md) as BUG-00x with
H-prefix for Health-specific.
