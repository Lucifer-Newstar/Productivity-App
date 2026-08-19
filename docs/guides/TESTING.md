# Testing and release gates

## Frontend gates

```bash
cd frontend
npm ci
npx tsc --noEmit
npm run lint
npm audit --omit=dev
npm run build
```

Hosted pull-request enforcement is defined in [`CI.md`](CI.md) and `.github/workflows/ci.yml`. CI uses CPU runners and never starts a rejected model.

## Domain suites

```bash
node scripts/qa-health.js                    # 458 assertions
npm run qa:entertainment                     # 168 structural/security assertions
npm run qa:entertainment:intelligence        # 9 executable tests
npm run qa:entertainment:reports             # 11 executable tests
npm run qa:entertainment:social              # 5 executable tests
npm run qa:entertainment:migration           # 9 executable tests
npm run qa:security                          # 8 frontend security tests
npm run qa:notifications                     # global notification rules/settings
npm run qa:ui                                # icon/font/theme/motion foundation
npm run qa:home                              # cross-space command intelligence
npm run qa:csp                               # dev vs production CSP separation
npm run qa:core                              # local dates and habit streak correctness
npm run qa:baseline                          # empty user history vs retained product catalogs
npm run qa:backup                            # whole-product backup/restore and rollback security
npm run qa:resilience                        # route errors, navigation history and corrupt storage
npm run qa:packaging                         # Windows bundle/runtime/installer/CD contracts
npm run qa:update                            # release checks, notification links and in-place updates
npm run qa:docs                              # documentation links/status/contracts
```

Entertainment executable total: **42/42**.

## Backend gates

```bash
cd backend
npm ci
npm run build
npm run security:startup
npm audit --omit=dev
KAIZEN_API_KEY=security-test-key npm start
# second terminal
KAIZEN_API_KEY=security-test-key npm run security:test   # 13 attack checks
```

## Runtime smoke

Production smoke covers 39 user routes:

- Home: 1
- Career: 10 including redirect
- Entertainment: 1
- Health: 10
- Projects: 5
- Workout: 12 including redirect

Entertainment also has five dynamic Next.js provider routes. Runtime security smoke verifies cross-site rejection, image-host denial, request 31 rate limiting, locale fallback and required headers.

## What each gate catches

| Gate | Primary failures |
|---|---|
| TypeScript | Model/action/prop and migration contract drift |
| Source commentary | Maintained code files without any explanatory comment/module documentation |
| ESLint | Dynamic execution and configured source-quality rules |
| Next build | Router, server/client boundary and prerender failures |
| Health QA | H1–H39 formulas, routes, bridge and regressions |
| Entertainment structural | Feature wiring, provider, import, security and documentation contracts |
| Executable suites | Recommendation/report/social/migration math and edge cases |
| Frontend security | URL/CSV/image/restore/request-guard regressions |
| Backend security | Auth, CORS, unsafe payload, ID, overwrite and CSV attacks |
| HTTP smoke | Production server route failures |

## Intelligence Engine v0.1.1 deterministic baseline

```bash
cd ai
npm ci
npm run typecheck
npm test
npm run build
npm audit --omit=dev

cd ../frontend
npm run qa:ai
npm run qa:comments
```

Engine tests cover contracts, schema rejection, deterministic-default configuration, model-setting rejection, zero provider tool authority, one-time pairing, session expiry, unsafe JSON, rate limits, bounded orchestration, source grounding, content injection, attempted tool escalation and a real loopback HTTP/SSE/tool-result flow. Frontend QA covers revisions, bounded snapshots, sources, session tokens, fixed proxying, deterministic provider composition and explicit read-only/no-model UI copy.

## Intelligence Engine v0.1.1 evaluation archive

```bash
cd ai
npm run qa:v0.1.1
npm run eval:v0.1.1
npm run qa:v0.1.1:model-design
npm run build:v0.1.1:corpus
npm run qa:v0.1.1:model-harness
```

These suites preserve the frozen route/contracts and historical evaluation reproducibility. Harness QA verifies corpus integrity, safe scoring/sanitization, accepted public aggregates and `I1-PREFLIGHT-CLOSURE-1`. Every model stage is closed; the retained target scripts are historical and return `STAGE_NOT_AUTHORIZED`. Do not run or reclassify model evidence again.

## Intelligence Engine Wave 0

Wave 0 has a synthetic validation harness but no production AI feature:

```bash
cd ai/wave0
python scripts/qa_wave0.py
```

This gate verifies disabled-by-default candidates, strict hashes, loopback/no-download rules, revision/pairing, request-level cancellation plus orphan detection, three-sample cold loads per context, required native llama-bench coverage, concurrency-2 structured/tool reliability, embedding endpoint isolation, hardware capture, FTS ranking/filter/deletion, transport, lifecycle crash/restart, soak metrics, frozen scoring, allowlist sanitization and tracked-file privacy scanning.

Wave 0 is a closed historical no-selection cycle. Its harness remains reproducible, but no target rerun is authorized. See [`../ai/EVALUATION.md`](../ai/EVALUATION.md), [`../ai/ROADMAP.md`](../ai/ROADMAP.md), and the final [`../ai/WAVE-0-REPORT.md`](../ai/WAVE-0-REPORT.md). Every AI maintenance step still updates [`../ai/IMPLEMENTATION-LEDGER.md`](../ai/IMPLEMENTATION-LEDGER.md) and passes documentation QA.

## Historical reports

Older route counts and bundle sizes in `docs/quality/qa/TEST-REPORT.md`, dated per-space QA sections and the bug log are preserved as historical evidence. Current release claims must come from this document and the latest per-space QA file.
