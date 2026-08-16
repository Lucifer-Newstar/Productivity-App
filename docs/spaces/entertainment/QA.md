# Entertainment space — QA

_Last updated: 2026-08-16, Wave 0 + Wave 1 core._

## Automated gates

- [x] `npm audit` — zero vulnerabilities in both workspaces
- [x] `npm run lint`
- [x] `npx tsc --noEmit`
- [x] `npm run build` — `/entertainment` statically prerendered
- [x] Production HTTP smoke — `/entertainment` returns 200 and AFTERGLOW marker
- [x] Live AniList manga search — 7 normalized `Vagabond` matches
- [x] Live AniList trending — 12 normalized manga chart entries
- [x] Live AniList detail refresh — `Vagabond` plus normalized genres, HTTP 200
- [x] Invalid detail provider and cross-site detail request — rejected 400/403
- [x] Invalid session MAL override — bounded provider 400; credential not reflected
- [x] Unconfigured MAL/TMDB/NYT/Comic Vine charts — bounded explanatory 503
- [x] Cross-site trending request — rejected 403
- [x] Live Open Library fallback — 12 normalized `Dune` matches
- [x] Open Library cover redirect chain — allowlisted proxy returns bounded JPEG 200
- [x] Unconfigured MAL — bounded 503 with configuration guidance
- [x] Cross-site search and non-allowlisted image host — rejected 403
- [x] `node scripts/qa-entertainment.js` — 62/62 assertions

## Wave 1 functional checklist

- [x] Full-screen route opts out of shared TopNav
- [x] Dark/light AFTERGLOW shell
- [x] First-run state seeds and persists to `kaizen.entertainment`
- [x] Defensive migration fills arrays/progress/default fields
- [x] Dashboard KPIs derive from state
- [x] Continue row and priority queue derive from status
- [x] Manual add supports six media types
- [x] Status, rating, dates, repeats and priority are editable
- [x] Progress labels/counters vary by media type
- [x] Notes, reviews and tags persist
- [x] Favorite, archive and delete actions work
- [x] Search covers title, description, creators, genres, tags, notes and review
- [x] Type/status filters and sorting work
- [x] Empty result states are bounded

## Wave 3 organization checklist

- [x] Collections CRUD and membership management
- [x] Monday-first calendar and local RFC-style `.ics` export
- [x] Schedule date editing and provider release markers
- [x] Activity timeline resolves item/event labels
- [x] Monthly rollover runs once per month and archives only older completions
- [x] Archive restore/permanent cleanup maintains collection referential integrity
- [x] JSON restore uses bounded safe parser plus schema migration
- [x] CSV export applies formula-injection neutralization

## Security checklist

- [x] No provider credentials in frontend code or Entertainment state
- [x] No raw HTML rendering
- [x] No arbitrary remote cover URL is accepted in Wave 1
- [x] Delete requires confirmation
- [x] Persisted state has an explicit schema version and migration
- [x] Provider integration uses same-origin fixed adapters
- [x] Search validates type/query and rejects cross-site browser requests
- [x] Provider credentials are server-only and absent from normalized results
- [x] Image proxy validates HTTPS host, every redirect, MIME type, timeout and 5 MB cap
- [x] Manual cover upload reuses JPEG/PNG/WebP 2 MB validation
- [x] BYOK values are tab-session-only and sent as bounded headers, never URL params/state/export fields
- [x] Detail refresh validates provider/type/ID and merges catalogue-only fields
- [x] Approved TMDB logo is stored locally; Credits panel carries required notice
