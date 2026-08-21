# Kaizen QA index

_Last synchronized: 2026-08-18. Historical reports retain their original dates and measurements._

## Current release gates

| Gate | Current result |
|---|---|
| Frontend TypeScript | Pass |
| ESLint | Pass |
| Next.js 16 production build | Pass |
| User-route smoke | 40/40 HTTP 200 |
| Frontend dependency audit | 0 vulnerabilities |
| Backend TypeScript build | Pass |
| Backend dependency audit | 0 vulnerabilities |
| Backend attack suite | 13/13 |
| Health QA | 458/458 |
| Entertainment structural/security | 168/168 |
| Entertainment executable suites | 42/42 |
| Notification rules/settings/setup/context | 16/16 |
| Documentation integrity | 14/14 |

## Commands

```bash
cd frontend
npm ci
npx tsc --noEmit
npm run lint
node scripts/qa-health.js
npm run qa:entertainment
npm run qa:entertainment:intelligence
npm run qa:entertainment:reports
npm run qa:entertainment:social
npm run qa:entertainment:migration
npm run qa:security
npm run qa:notifications
npm run qa:docs
npm audit --omit=dev
npm run build

cd ../backend
npm ci
npm run build
npm audit --omit=dev
KAIZEN_API_KEY=security-test-key npm start
# second terminal
KAIZEN_API_KEY=security-test-key npm run security:test
```

## Per-space QA

- [`../spaces/workout/QA.md`](../../spaces/workout/QA.md)
- [`../spaces/projects/QA.md`](../../spaces/projects/QA.md)
- [`../spaces/career/QA.md`](../../spaces/career/QA.md)
- [`../spaces/health/QA.md`](../../spaces/health/QA.md)
- [`../spaces/entertainment/QA.md`](../../spaces/entertainment/QA.md)

## Historical report

[`TEST-REPORT.md`](TEST-REPORT.md) is the original Workout-era baseline created before Health and Entertainment were completed. Its route counts, package versions and bundle sizes are historical measurements, not current release claims.

## Security evidence

- [`security/SECURITY.md`](../../security/SECURITY.md)
- [`security/AUDIT-2026-08-16.md`](../../security/AUDIT-2026-08-16.md)
