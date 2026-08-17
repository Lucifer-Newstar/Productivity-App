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

## Historical reports

Older route counts and bundle sizes in `docs/quality/qa/TEST-REPORT.md`, dated per-space QA sections and the bug log are preserved as historical evidence. Current release claims must come from this document and the latest per-space QA file.
