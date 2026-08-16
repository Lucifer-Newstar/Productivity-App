# Security

_Last reviewed: 2026-08-16_

## Security model

Kaizen is currently an **offline-first, single-user application**. The browser stores all live frontend data in `localStorage`; the frontend does not call the Express API. The backend is a development/reference sync service with in-memory data. It is not an internet-facing multi-user service and must not be treated as one until persistent storage, identities and per-user authorization are implemented.

Health, journal, career and progress-photo data are sensitive. A user or script with access to the browser profile/origin can read localStorage. The dream-journal PIN is only a casual UI privacy gate, not cryptographic protection.

## Secure deployment

### Frontend

- Serve only over HTTPS outside localhost.
- Keep the security headers from `frontend/next.config.js` at the reverse proxy.
- Do not broaden CSP sources without review.
- Never place secrets in `NEXT_PUBLIC_*`; all such values are delivered to the browser.
- Builds fail on TypeScript errors. Run the verification commands below before release.

### Backend

The API binds to `127.0.0.1` by default. This is the safe development mode.

If network access is intentionally required:

```bash
HOST=0.0.0.0 \
KAIZEN_API_KEY='generate-a-long-random-secret' \
CORS_ORIGINS='https://kaizen.example.com' \
npm start
```

Place it behind an HTTPS reverse proxy. Do not expose it without `KAIZEN_API_KEY`. Clients may send the key as `X-Kaizen-Key` or `Authorization: Bearer …`. Liveness routes (`/api/health-check` and legacy `/api/health`) remain public and reveal no records.

Relevant controls:

| Variable | Default | Purpose |
|---|---:|---|
| `HOST` | `127.0.0.1` | Listening interface |
| `PORT` | `4000` | Listening port |
| `KAIZEN_API_KEY` | unset | Protects all non-liveness API routes when configured |
| `CORS_ORIGINS` | localhost origins | Comma-separated browser-origin allowlist |
| `JSON_LIMIT` | `5mb` | Express JSON request limit |
| `RATE_LIMIT` | `300` / 15 min | Per-client total API limit |
| `WRITE_RATE_LIMIT` | `120` / 15 min | Per-client mutation limit |
| `MAX_ROWS_PER_TABLE` | `20000` | In-memory collection cap |

API protections include Helmet headers, no-store responses, explicit CORS, read/write rate limits, constant-time API-key comparison, strict JSON parsing, recursive complexity/depth checks, prototype-pollution key rejection, ID validation, duplicate-ID conflict handling, per-table capacity limits and bounded session sets.

## Import/export safety

- External links are restricted to HTTP/HTTPS before rendering; `javascript:`, `data:`, `file:` and similar schemes are blocked.
- Spreadsheet exports prefix formula-leading values before RFC-4180 quoting to prevent CSV injection.
- Forge/workout imports are limited to 5 MB and bounded record counts.
- Forge JSON restore recursively removes prototype-pollution keys and rejects excessive depth, arrays and strings.
- Health image uploads accept only JPEG, PNG and WebP and are limited to 2 MB. SVG is rejected.
- Exports contain private user data. Store and share them accordingly.

## Browser headers

The frontend sends:

- Content-Security-Policy (self by default; no plugins/frames; constrained fonts/images/media)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`
- strict-origin referrer policy
- same-origin opener policy
- restrictive permissions policy
- no `X-Powered-By` header

The App Router currently requires inline bootstrap scripts, so CSP allows inline scripts but does **not** allow `eval`. Moving to nonce-based CSP is recommended when the app gets a dynamic request middleware/deployment layer.

## Verification

```bash
cd frontend
npm audit --omit=dev
npx tsc --noEmit
npm run build
node scripts/qa-health.js

cd ../backend
npm audit --omit=dev
npm run build
# In another terminal: KAIZEN_API_KEY=security-test-key npm start
KAIZEN_API_KEY=security-test-key npm run security:test
```

The security smoke suite checks authentication, CORS, security/rate-limit headers, malformed body rejection, prototype-pollution resistance, unsafe IDs, duplicate overwrite prevention, CSV injection and JSON 404 behavior.

## 2026-08-16 assessment

The authorized local assessment exercised dependency, HTTP, storage/import, URL, file-upload, CSV and API trust boundaries.

### Fixed

1. **High — vulnerable framework/build dependencies:** upgraded Next.js 14/React 18 to patched Next.js 16/React 19 and upgraded transitive tooling; production audits are clean.
2. **Critical if exposed — unauthenticated API:** loopback bind is now default; optional API-key enforcement protects every data endpoint.
3. **High — unlimited API abuse/memory exhaustion:** added body, complexity, rate, table and session-set limits.
4. **High — prototype/shape attacks through sync and CRUD:** unsafe keys, non-object bodies, malformed IDs and oversized sync collections are rejected.
5. **Medium — arbitrary URL schemes:** user-controlled Career links now permit only HTTP/HTTPS.
6. **Medium — CSV formula injection:** frontend and backend exports neutralise formula-leading cells.
7. **Medium — unbounded/untrusted imports:** file-size, depth, record and JSON-key controls added.
8. **Medium — unrestricted image data URLs:** image type and size validation added; SVG blocked.
9. **Medium — missing browser/API hardening headers:** frontend CSP and related headers plus backend Helmet are enabled.
10. **Low — information/error disclosure:** framework header removed; API errors and unknown routes return bounded JSON.
11. **Process — builds ignored type/lint failures:** TypeScript build bypass removed.

### Accepted / remaining risks

- **No per-user authorization:** an API key is service-level only. Do not use this backend as a public multi-user API.
- **No database or at-rest encryption:** backend data disappears on restart; localStorage is readable by same-origin scripts and browser-profile users.
- **No CSRF token:** API-key headers plus strict CORS mitigate browser CSRF. If cookie authentication is introduced, add CSRF protection and SameSite cookies.
- **No browser E2E security suite:** current tests are HTTP/static/build focused.
- **Pragmatic CSP:** inline scripts remain allowed for Next bootstrap. A nonce-based policy would be stronger.
- **Typography fallback:** external Google Font imports were removed to eliminate a third-party CSS/font trust boundary; the configured local/system fallback stacks are used unless fonts are self-hosted later.
- **Denial of service is mitigated, not eliminated:** in-memory service limits are per process and rate limiting is not distributed. Use a shared store/WAF when scaling.

## Reporting

Do not include real health records, journal text, photos, API keys or exported backups in an issue. Report the affected component, reproducible steps using synthetic data, impact and suggested remediation privately to the repository owner.
