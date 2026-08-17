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
npm run qa:docs                              # documentation links/status/contracts
```

Entertainment executable total: **42/42**.

## Backend gates

```bash
cd backend
npm ci
npm run build
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
| ESLint | Dynamic execution and configured source-quality rules |
| Next build | Router, server/client boundary and prerender failures |
| Health QA | H1–H39 formulas, routes, bridge and regressions |
| Entertainment structural | Feature wiring, provider, import, security and documentation contracts |
| Executable suites | Recommendation/report/social/migration math and edge cases |
| Frontend security | URL/CSV/image/restore/request-guard regressions |
| Backend security | Auth, CORS, unsafe payload, ID, overwrite and CSV attacks |
| HTTP smoke | Production server route failures |

## Intelligence Engine Wave 0

Wave 0 has a synthetic validation harness but no production AI feature:

```bash
cd ai/wave0
python scripts/qa_wave0.py
```

This gate verifies disabled-by-default model candidates, loopback configuration, no automatic downloads, revision and pairing prototypes, Python syntax, hardware capture, SQLite FTS deletion, SSE/WebSocket probe, deterministic mock model evaluation and absence of production `get_today()` code.

Target GPU/model/thermal results must be produced separately on the RTX 3050 laptop and cannot be replaced by sandbox QA. See [`../ai/EVALUATION.md`](../ai/EVALUATION.md), [`../ai/ROADMAP.md`](../ai/ROADMAP.md), and the incomplete [`../ai/wave-0/WAVE-0-SELECTION-REPORT.md`](../ai/wave-0/WAVE-0-SELECTION-REPORT.md).

## Historical reports

Older route counts and bundle sizes in `docs/quality/qa/TEST-REPORT.md`, dated per-space QA sections and the bug log are preserved as historical evidence. Current release claims must come from this document and the latest per-space QA file.
