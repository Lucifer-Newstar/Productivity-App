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
- [x] `node scripts/qa-entertainment.js` — 130/130 structural assertions
- [x] `npm run qa:entertainment:intelligence` — 9/9 executable intelligence tests
- [x] `npm run qa:entertainment:reports` — 11/11 executable report tests
- [x] `npm run qa:entertainment:social` — 5/5 executable social tests

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
- [x] MAL anime/manga XML and compressed XML.GZ parser
- [x] AniList and Kitsu JSON parsers
- [x] Trakt and Simkl CSV parsers
- [x] Expanded-import 20 MB and imported-record 10,000 caps
- [x] Import preview plus provider-ID/title fallback de-duplication
- [x] Compound genre/tag/priority/rating/favorites/backlog-age filters

## Wave 4 deep-tracking checklist

- [x] Book sessions calculate pages/hour and estimated completion time
- [x] Book format, edition, narrator rating and DNF reason
- [x] Comic/manga owned/read/missing matrix up to 200 volumes
- [x] Season totals and episode-level logs/ratings
- [x] Daily/weekly binge thresholds
- [x] Streaming platform, sub/dub/original preference
- [x] Permission-gated release notifications with once-per-title/day acknowledgement
- [x] Movie venue, version, cinematography and acting scores
- [x] Anime source, studio, seiyuu and OP/ED markers
- [x] Favorite creator/studio toggles
- [x] Schema v3 deep-array migration defaults

## Wave 5 local-intelligence checklist

- [x] Weighted If-you-liked recommendations only target active Plan-to items
- [x] Mood picker uses normalized tags; Surprise Me excludes archive
- [x] Exploration score spans genre/creator/decade/country/media type
- [x] Blind spots detect low-coverage genres, decades and countries
- [x] Franchise gaps require explicit franchise/order and report missing positions
- [x] Creator marathon reports tracked/completed works and average rating
- [x] Recommendation calculations are pure/local and call no provider endpoint
- [x] Schema v4 backfills country arrays and editable franchise metadata

## Wave 6 reporting checklist

- [x] Timeline, total count/time and completion KPIs
- [x] 1–10 rating histogram and average
- [x] Genre count/rating, creator and decade reports
- [x] Monthly count/time/rating and satisfaction trend
- [x] Selectable year-in-review summary
- [x] Backlog age and dropped-reason analysis
- [x] 365-day heatmap combines events and deep logs
- [x] Editable purchase price plus total/cost-per-hour
- [x] Pure report algorithms covered by executable fixtures

## Wave 7 offline-social checklist

- [x] Manual friend CRUD and per-title ratings
- [x] Taste score compares only mutually rated titles
- [x] Private recommendation notes
- [x] Group member names and media membership
- [x] Deterministic discussion prompts perform no network request
- [x] Gift reaction tracking
- [x] Lent/borrowed due/overdue/returned lifecycle
- [x] Deleting a friend cleans their recommendations
- [x] Schema v5 backfills every social collection
- [x] Backend exposes matching generic CRUD resources

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
