# Final local regression matrix

**Date:** 2026-08-19
**Scope:** latest local application-completion commits
**Result:** PASS LOCALLY — HOSTED CI GREEN (`32255861421`)

## Frontend

- TypeScript: PASS
- ESLint: PASS
- Production build: PASS
- User routes: 39 implemented
- Health: 458 assertions PASS
- Entertainment structural: 168/168 PASS
- Entertainment executable: 42/42 PASS
- Frontend security: 8/8 PASS
- CSP: 6/6 PASS
- Notifications: 16/16 PASS
- UI foundation: 23/23 PASS
- Home intelligence: 10/10 PASS
- Deterministic AI frontend: 15/15 PASS
- Core correctness: 10/10 PASS
- Production baseline: 12/12 PASS
- Backup/recovery: 8/8 PASS
- Resilience/navigation: 8/8 PASS

## Backend

- TypeScript build: PASS
- Non-loopback/no-key startup rejection: PASS
- Auth/CORS/payload/ID/CSV/404 security smoke: 13/13 PASS
- Runtime health count: 138 tables / 12 singletons

## Intelligence

- TypeScript/build: PASS
- Engine tests: 24/24 PASS
- Focused v0.1.1 tests: 10/10 PASS
- Deterministic frozen gate: PASS
- Model-design QA: 16/16 PASS
- Model-harness QA: 18/18 PASS
- Model stages: all closed

## Live integration

`node scripts/ci/core-today-integration.mjs`: PASS

Verified actual Next proxy and deterministic engine pairing, session, fixed route, tool callback, source/freshness, metrics, revocation and process cleanup.

## Documentation/privacy

- Documentation QA: 60/60 PASS at regression time
- Commentary QA: 268/268 PASS
- Diff check: PASS
- Privacy scan: required again immediately before commit

## Remaining external gates

1. First GitHub-hosted execution of all four CI jobs
2. Final PR diff regeneration with hosted result
3. Authenticated PR creation
4. Human review and explicit merge approval
5. Windows/local packaging after merge only

No cloud deployment, model work, AI scope expansion or MLOps is authorized.