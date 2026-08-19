# CI foundation implementation

**Date:** 2026-08-19
**Workflow:** `.github/workflows/ci.yml`
**Hosted run status:** pending first authenticated push
**Model/GPU execution:** prohibited and absent

## Implemented jobs

### Frontend application

Runs Node 20.19, clean install, TypeScript, ESLint, all Health/Entertainment/security/notification/UI/Home/AI/core-correctness/docs/comment suites, production build and production-dependency audit.

### Reference API

Runs clean install/build, starts the real loopback Express process with a test service key, executes 13 security checks and audits production dependencies.

### Deterministic Intelligence

Runs Node 20.19 and Python 3.12, TypeScript, 24 tests, deterministic v0.1.1 QA/evaluation, closed model-design/harness QA, build, tracked privacy scan, reproducibility diff and production-dependency audit.

It does not invoke preflight/full/operations commands. `I1-PREFLIGHT-CLOSURE-1` remains enforced.

### Frontend to deterministic Core Today

`scripts/ci/core-today-integration.mjs` starts the actual built engine and Next.js server, then verifies:

- cross-site pairing rejection;
- one-time pairing and bearer session;
- deterministic provider identity and `nativeToolCalling: false`;
- unsupported-intent rejection;
- fixed `focus-today → get_today@1.0` flow;
- exact arguments and synthetic browser callback;
- response source/freshness verification;
- privacy-safe metrics;
- session revocation.

The script redacts pairing codes from failure logs, uses no external service and terminates process groups. A first implementation exposed a cleanup hang from Next's child process; process-group shutdown and exit waiting were corrected, and local execution now exits zero without orphan ports.

## Workflow controls

- Trigger: PRs to `main`; pushes to `ai` or `main`
- Permissions: contents read only
- Concurrency: superseded branch runs cancel
- Timeouts on every job
- npm lockfile caches only
- No repository or cloud secret required
- No deployment step
- No model download/runtime/GPU job
- No personal laptop runner

## Required checks

Recommended branch protection names:

```text
Frontend application
Reference API
Deterministic Intelligence
Frontend to deterministic Core Today
```

## Local validation

- YAML parsed and four-job structure verified.
- Workflow text contains no model/preflight execution command.
- Live integration script passed and left no process on ports 3000/4317.
- All underlying frontend/backend/AI suites passed on the current branch.
- Documentation and privacy gates include the CI contract.

## Validation summary

```text
Workflow YAML/four-job/no-model structural check: PASS
Local deterministic live integration: PASS
Frontend TypeScript/ESLint/build and all domain suites: PASS
Backend build/security smoke: PASS
AI TypeScript/24 tests/build/design/harness: PASS
Documentation QA: 52/52 PASS
Source commentary QA: 259/259 PASS
Orphan ports/processes after integration: none
Git diff check: PASS
Staged privacy scan: PASS
```

## Remaining gate

The workflow has not run on GitHub because this environment has no authenticated push/PR session. APP-001 and APP-005 remain “implemented, pending hosted proof.” A green hosted run is required before they are complete.

CI does not unblock the other P0 items: production seed data, timezone correctness and persistence/backend authority remain release blockers.