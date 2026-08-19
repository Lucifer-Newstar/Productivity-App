# Hosted CI run 2 intake

**Date:** 2026-08-19
**Run:** `32255006909`
**Commit:** `615da49`
**Outcome:** frontend failed; Reference API and Deterministic Intelligence passed; integration was dependency-skipped

## Failure

The frontend product/security step reached `qa:entertainment:migration` and failed its final legacy assertion:

```text
AssertionError [ERR_ASSERTION]: false == true
frontend/scripts/qa-entertainment-migration.ts:16
```

The `operator: '=='` field is Node's assertion-error formatter, not invalid TypeScript syntax and not evidence that strict equality was parsed incorrectly. The preceding `qa:entertainment:intelligence` suite passed 9/9.

The actual defect was a stale migration expectation that `migrateEntertainment(null)` must create one or more personal Entertainment records. The production-data baseline intentionally changed fresh profiles to an empty personal library. The test now requires schema v6 and an exactly empty `items` array.

## Scope and validation

This is a test-contract correction only. Runtime migration behavior is unchanged, and no gate is weakened: the migration test is aligned with the already-approved empty-production-library policy and uses an exact deep equality assertion.

Local validation after correction:

- Entertainment structural QA: 168/168 pass
- Entertainment intelligence: 9/9 pass
- Entertainment migration: 9/9 pass
- frontend TypeScript: pass

## Required rerun

Push the focused correction to `ai` and obtain a third hosted run on the new head. All four jobs must pass before PR creation. The `ai` → `main` PR remains on hold and must remain unmerged pending human review.
