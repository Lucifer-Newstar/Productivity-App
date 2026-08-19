# Browser backup and corruption recovery

**Date:** 2026-08-19
**Backlog items:** APP-106, APP-109

## Whole-product backup

Added one versioned backup for all ten authoritative browser keys. AI sessions, provider overrides and revision/evaluation metadata are excluded.

The Local data recovery panel is accessible from Notification Center and from storage/corruption warnings. Export downloads JSON; restore validates and reloads after success.

## Security and durability

- 25 MB total text ceiling
- 8 MB per persisted value
- exact classification/version and exact authoritative-key set
- nested JSON parsing for every product slice
- depth/node/array and unsafe-key rejection
- strict dark/light theme validation
- rollback to original values after any storage write failure
- no AI session credential export

## Hydration correction

The root store now uses render state for hydration readiness rather than a mutable ref shared by two effects. Persisted state is parsed/migrated before writes are enabled. A corrupt key:

1. is not overwritten with seed/default state;
2. blocks persistence for that mounted slice;
3. emits a `corrupt` storage event;
4. surfaces the recovery panel.

## Validation

`npm run qa:backup` provides eight checks for complete-key export, secret exclusion, valid parsing, replacement/removal semantics, unknown/unsafe/theme rejection and rollback. The suite is required in frontend CI.

Per-space CSV/JSON formats remain for portability; the whole-product format is the release recovery contract.