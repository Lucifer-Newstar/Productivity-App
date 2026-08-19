# Continuous integration

Kaizen CI runs on GitHub-hosted Ubuntu CPU runners for pull requests to `main` and pushes to `main`, legacy `ai`, or the active `windows-packaging` branch. The explicit packaging branch trigger prevents a plain push from being silently untested.

```text
.github/workflows/ci.yml
```

## Security boundary

CI validates code correctness only.

It does not:

- download or run GGUF/model artifacts;
- invoke the historical target preflight/full/operations scripts;
- require a GPU;
- expose a personal laptop as a runner;
- deploy to cloud infrastructure;
- perform MLOps, memory, retrieval or v0.2 work.

`I1-PREFLIGHT-CLOSURE-1` remains active. Model harness QA proves all execution stages stay closed.

## Jobs

### Frontend application

- Node 20.19
- `npm ci`
- TypeScript
- ESLint
- Health QA
- Entertainment structural/intelligence/report/social/migration QA
- Frontend security and CSP
- Notifications, UI and Home intelligence
- Deterministic AI frontend checks
- Windows packaging-contract QA (no artifact build on Linux)
- Documentation and commentary QA
- Next.js production build
- Production-dependency audit

### Reference API

- Node 20.19
- `npm ci`
- TypeScript build
- Starts loopback server with a test service key
- Runs 13 auth/CORS/payload/ID/CSV/404 security checks
- Production-dependency audit

This job does not imply that the frontend consumes Express or that Express is durable production storage.

### Deterministic Intelligence

- Node 20.19 and Python 3.12
- TypeScript/contracts/tests/build
- Frozen deterministic v0.1.1 QA/evaluation
- Closed model-design/harness QA without model execution
- Tracked-file privacy scan
- `git diff --exit-code` after generated deterministic fixtures
- Production-dependency audit

### Frontend to deterministic Core Today

The integration job starts the actual deterministic engine and Next.js development server, then verifies through the fixed same-origin proxy:

1. cross-site pairing rejection;
2. one-time pairing;
3. deterministic provider identity and zero native tools;
4. unsupported-intent rejection;
5. fixed `focus-today` request;
6. exact `get_today@1.0` arguments;
7. synthetic browser snapshot callback;
8. source/freshness response verification;
9. privacy-safe metrics;
10. session revocation.

The script redacts the pairing code from failure logs and terminates both process groups.

## Required checks before merge

Recommended branch protection check names:

```text
Frontend application
Reference API
Deterministic Intelligence
Frontend to deterministic Core Today
```

The product completion backlog still blocks merge even when these checks are green. CI proves current behavior; it does not prove seeded data, timezone, persistence architecture or every release decision is finished.

## Local reproduction

Use the commands in [`TESTING.md`](TESTING.md). The live integration job can be reproduced after installing frontend/AI dependencies and building AI:

```bash
cd ai
npm ci
npm run build
cd ../frontend
npm ci
cd ..
node scripts/ci/core-today-integration.mjs
```

No provider environment variable is required; deterministic mode is the application default.