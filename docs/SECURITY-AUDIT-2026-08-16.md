# Kaizen full-site security audit — 2026-08-16

## Executive summary

An authorized white-box review was performed against the complete `entertainment` branch after AFTERGLOW Waves 0–9. Scope included the Next.js frontend, Express reference API, all five spaces, local persistence, provider adapters, file imports, exports, image handling, dynamic routes, dependency trees and deployment headers.

**Result after remediation:** no known critical/high findings remain open in the reviewed single-user/offline-first threat model. Production dependency audits report zero vulnerabilities in both workspaces. The remaining risks are architectural and documented below.

## Scope and methods

- Dependency and lockfile audit: frontend and backend production/development trees
- Secret/credential scan of tracked source and docs
- Static sink review: raw HTML, dynamic code execution, URLs, links, images, file readers, storage, browser permissions and exports
- HTTP trust-boundary review: CORS, auth, rate limits, body limits, cache controls, provider proxy routes and image redirects
- Import review: JSON, CSV, XML, XML.GZ, image data URLs and backup restoration
- SSRF review: fixed provider hosts, image allowlist and redirect revalidation
- Injection review: React rendering, URL schemes, CSV formulas, prototype keys and XML entities
- Denial-of-service review: compressed inputs, upstream response bodies, request buckets, caches, collection limits and localStorage quota
- Runtime regression: all frontend routes, backend attack suite, provider route abuse cases and security headers

This was not an external black-box penetration test and did not include third-party infrastructure, cloud account configuration or provider-side systems.

## Findings and remediation

| ID | Severity | Finding | Status / remediation |
|---|---|---|---|
| SEC-01 | Critical if exposed | Express data API had no authentication and listened broadly | **Fixed earlier:** loopback bind by default; optional constant-time `KAIZEN_API_KEY`; strict CORS |
| SEC-02 | High | Vulnerable Next.js/PostCSS dependency chain | **Fixed earlier:** Next.js 16/React 19 upgrade; audits now clean |
| SEC-03 | High | API memory/CPU abuse through unrestricted requests and rows | **Fixed earlier:** request/write limits, body/complexity/table/set caps |
| SEC-04 | High | Prototype/shape attacks through generic CRUD and sync | **Fixed earlier:** unsafe-key recursion checks, strict JSON/object and ID validation |
| SEC-05 | High | MAL `.xml.gz` decompression was converted to text before enforcing the expanded-size limit | **Fixed:** streaming decompression now cancels immediately above 20 MB |
| SEC-06 | Medium | Provider JSON and proxied images could allocate an unbounded response when `Content-Length` was absent or false | **Fixed:** streaming 2 MB JSON and 5 MB image ceilings with cancellation |
| SEC-07 | Medium | Catalogue route rate-limit maps and provider-result cache could grow indefinitely; details/image/status routes lacked a shared limiter | **Fixed:** shared all-route guard, expired-bucket pruning, hard map/cache caps and per-route limits |
| SEC-08 | Medium | Restored Entertainment backups could reintroduce SVG/HTML data URLs or arbitrary remote cover URLs despite upload-time controls | **Fixed:** schema migration now accepts only bounded JPEG/PNG/WebP data URLs and exact same-origin image-proxy URLs; art/cosplay/board images are sanitized and capped |
| SEC-09 | Medium | Spreadsheet exports could execute formulas | **Fixed earlier:** every user-controlled CSV cell is neutralized before RFC-4180 quoting |
| SEC-10 | Medium | User-controlled external links could use executable URL schemes | **Fixed earlier:** HTTP(S)-only URL normalizer at render boundaries |
| SEC-11 | Medium | localStorage quota exceptions could escape persistence effects, leaving users unaware that sensitive changes were not saved | **Fixed:** persistence catches quota failures and surfaces a global non-sensitive warning with backup guidance |
| SEC-12 | Low | MAL XML parser accepted document type/entity declarations | **Fixed:** `DOCTYPE` and `ENTITY` declarations are rejected before DOM parsing |
| SEC-13 | Low | Browser transport/isolation headers omitted HSTS, CORP, Origin-Agent-Cluster and cross-domain policy restrictions | **Fixed:** headers added globally |
| SEC-14 | Low | Entertainment route controls were duplicated and inconsistent | **Fixed:** same-origin and bounded per-process guard shared by search, trending, detail, status and image routes |

## Current controls

### Frontend

- CSP, frame denial, MIME sniffing denial, HSTS, strict referrer policy, CORP, COOP, Origin-Agent-Cluster and restrictive Permissions Policy
- No `eval`, `new Function` or user-controlled raw HTML
- React-escaped user content and plain-text review preview
- HTTP(S)-only user links
- JPEG/PNG/WebP-only 2 MB uploads
- Bounded/sanitized backup restoration
- Formula-safe CSV exports
- Same-origin fixed provider adapters; no user-selected upstream URL
- Every upstream redirect revalidated against an exact image-host allowlist
- Provider response, cache and route-abuse limits
- Session-only BYOK values; never root-state persisted or returned
- Storage quota warning rather than an uncaught persistence failure

### Express backend

- Loopback bind by default
- Optional API-key authentication on all data routes
- Constant-time credential comparison
- Explicit CORS allowlist
- Helmet and no-store responses
- General/write rate limits
- Strict bounded JSON and recursive complexity checks
- Prototype-pollution key rejection
- ID, duplicate and table-capacity controls
- Bounded errors without framework disclosure

## Verification results

- Frontend `npm audit`: **0 vulnerabilities**
- Backend `npm audit`: **0 vulnerabilities**
- Frontend type check: passed
- ESLint security gates: passed
- Production build: passed
- Entertainment structural/security assertions: **168/168**
- Entertainment executable tests: intelligence 9/9, reports 11/11, social 5/5, migration 9/9, frontend security 8/8
- Backend attack suite: 13/13
- Production route smoke: 39/39 HTTP 200
- Security headers present on production responses

## Accepted architectural risks

1. **Local data is not encrypted at rest.** Anyone with the unlocked browser profile or same-origin script execution can read health, journal, social and Entertainment data.
2. **BYOK credentials are not a secure vault.** `sessionStorage` limits lifetime but credentials remain available to same-origin JavaScript. Server environment variables are recommended.
3. **CSP remains pragmatic.** Next.js App Router bootstrap requires inline scripts in this deployment, so `script-src 'unsafe-inline'` remains. `eval` is still forbidden. A nonce-based dynamic middleware policy is the next hardening step.
4. **Rate limits are process-local.** Multi-instance production needs a shared Redis/WAF limiter, and the reverse proxy must overwrite client-IP headers.
5. **The Express API is not multi-user.** A service API key is not row-level authorization. Do not expose it as a public account service.
6. **No encrypted database or durable backend exists.** Express records disappear on restart.
7. **No independent browser DAST/E2E security runner exists.** Current coverage combines source review, unit/attack suites, build checks and HTTP smoke.
8. **Large quantities of valid raster images can still exhaust browser storage.** Individual images and restored collections are capped, and quota failures are surfaced, but IndexedDB remains the correct future media store.

## Deployment requirements

- HTTPS only outside localhost
- Preserve all frontend headers at the reverse proxy
- Set `KAIZEN_API_KEY` and explicit `CORS_ORIGINS` before exposing Express
- Keep all provider secrets server-side where possible
- Configure the reverse proxy to overwrite, not append untrusted, `X-Real-IP` / `X-Forwarded-For`
- Add shared rate limiting before horizontal scaling
- Run all verification commands in `docs/SECURITY.md` before release
