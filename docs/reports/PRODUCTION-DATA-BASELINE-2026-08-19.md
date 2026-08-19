# Production data baseline

**Date:** 2026-08-19
**Backlog item:** APP-002

## Decision

Fresh production profiles contain no fabricated personal history. Product catalogs/templates remain available separately.

## Removed from automatic first-run state

- Core tasks and notes
- Instantiated Career roadmaps, achievements, goals, bullets and legacy tracks
- Initial Forge project
- Workout PRs, completed skill progress, motivation board and kanban cards
- Entertainment library items
- Home habits

Existing persisted user records are not deleted. Migrations preserve arrays already present in `kaizen.*` storage.

## Retained product content

- Exercise catalog
- Routine templates
- Calisthenics progression definitions, reset to unachieved
- Career roadmap template catalog, available for explicit creation
- Health food/supplement/reference catalogs
- Default settings and empty collection shapes

These are reusable product definitions, not claims about a user's history.

## Setup behavior

The Data Setup checklist now requires bodyweight plus a logged workout rather than treating a seeded routine template as real user setup. Career, Forge, Health and Entertainment continue to require real data or explicit confirmation/manual mode.

## Auditability

`FRESH_PROFILE_COUNTS` exposes the fresh-state separation for executable QA. `npm run qa:baseline` verifies ten personal-history categories are empty, catalogs remain populated, existing Entertainment records migrate intact, habits start empty and setup does not count routine templates.

Local validation: **8/8 production baseline checks pass**, **9/9 core correctness checks pass**, TypeScript and ESLint pass.

## Remaining related work

Production-visible destructive demo loaders remain APP-103 (P1). They must be hidden behind an explicit demo/developer mode before packaging. This change only removes automatic fabricated history and does not remove opt-in QA fixtures.