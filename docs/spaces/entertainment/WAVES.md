# Entertainment / AFTERGLOW — implementation waves

## Wave 0 — contracts and provider plan ✅

- API provider matrix and constraints
- `EntertainmentState`, item, progress, collection and event contracts
- Defensive `migrateEntertainment()`
- Root-store persistence at `kaizen.entertainment`
- Full-screen route contract

## Wave 1 — cinema shell and core library ✅ initial slice

- AFTERGLOW full-screen dark/light cinema shell
- Dashboard KPIs, continue row and priority queue
- Manual Quick Add for all six media types
- Status, type-aware progress, rating, start/end dates and repeats
- Notes, reviews, priorities, genres, creators and tags
- Favorites, archive and delete
- Full-text local search, type/status filters and sorting
- Seed library for first-run demonstration

Wave 1 follow-up now also includes validated manual cover upload, a review spoiler flag and explicit numeric queue ordering. Rich drag-reorder remains optional interaction polish.

## Wave 2 — provider integrations ✅

Shipped in the first slice:

- Same-origin validated search route with per-client throttling
- MAL anime, AniList manga and TMDB movie/series adapters
- Google Books → Open Library fallback
- Comic Vine → Books fallback
- Normalized catalogue result preview/import in Quick Add
- Provider timeout, bounded result cache and 429 handling
- Allowlisted same-origin image proxy with redirect/type/5 MB controls
- Server-only environment configuration and provider-status endpoint
- Unified Discover screen with six media tabs and duplicate-import protection
- MAL airing chart, AniList manga trending, TMDB weekly film/TV, NYT bestsellers and Comic Vine recent issues
- Provider Credits footer with required TMDB non-endorsement notice

Final slice shipped:

- Detail enrichment/metadata refresh for MAL, AniList, TMDB, Google Books and Open Library
- Refresh merges catalogue fields while preserving progress, ratings, notes, reviews, tags and history
- Dedicated Providers & Credits panel with an approved local TMDB logo asset
- Session-only BYOK overrides transported as bounded same-origin headers; never root-state persisted/exported

Live-provider contract fixtures remain an ongoing QA improvement rather than a Wave 2 blocker.

## Wave 3 — organization and history ✅

Shipped:

- Cross-media collections with membership management
- Calendar month grid for schedules and provider release dates
- Local `.ics` export
- Immutable activity timeline
- Idempotent month-boundary rollover for previously completed titles
- Archive restore/permanent-delete manager
- CSV export with spreadsheet-formula neutralization
- Full JSON backup plus bounded, prototype-safe, migrated restore
- Entertainment schema v2 migration
- Advanced genre/tag/priority/rating/favorites/backlog-age smart filters
- MAL XML/XML.GZ, AniList JSON, Trakt CSV, Simkl CSV and Kitsu JSON import adapters
- Bounded import preview, status/progress mapping and duplicate suppression

## Wave 4 — media-specific depth ✅

- Books: page-session logger, reading speed/ETA, format, edition, narrator score and DNF reason
- Comics/manga: chapter+volume progress, format, creator/studio favorites and owned/read/missing volume matrix
- Series: season totals, per-episode logs/ratings, daily+weekly binge flags, platform and audio preference
- Release/schedule notifications: explicit permission and once-per-title/day local alerts
- Movies: venue/version plus acting/cinematography sub-scores and director favorites
- Anime: sub/dub, source, studio/seiyuu favorites, seasons/episodes and OP/ED song markers
- Entertainment schema v3 migration for every deep-tracking collection

## Wave 5 — discovery intelligence ✅

- Local If-you-liked scoring from 8+/favorites against queued genre/tag/creator/studio overlap
- Mood-based random Plan-to pick and full-library Surprise Me
- Six provider trending panels (shipped in Wave 2)
- Editable franchise name/order and missing-sequence gap detector
- 0–100 exploration score across genres, creators, decades, countries and media types
- Genre/decade/country blind-spot detector
- Creator/author/director marathon completion and average-rating view
- Fully local computation: no private library state is sent to recommendation services
- Entertainment schema v4 migration for country/franchise intelligence

## Wave 6 — analytics ✅

- Consumption timeline and completed totals by all six media types
- Total time, rating average/distribution and completion rate
- Genre count, average rating by genre and mood/tag breakdown
- Creator ranking and release-decade taste
- Monthly completion/time/rating tracker and satisfaction line
- Selectable year-in-review count/time/top-genre/top-rated report
- Oldest backlog and dropped-reason analysis
- 365-day activity heatmap merging events, reading sessions and episode logs
- Purchase-price total and cost per consumed hour
- Pure report builder with executable algorithm tests

## Wave 7 — offline social simulation ✅

- Private friend directory with manually entered per-title ratings
- Taste-match score from shared ratings and average 1–10 distance
- Friend recommendation log with title and private reason note
- Shared watch/read groups with manual member names and media membership
- Deterministic metadata-aware discussion prompts; no AI/network dependency
- Gift recipient/date/note and liked/not-yet reaction tracking
- Lent/borrowed direction, due-date overdue flag and return tracking
- Backend mirror collections for friends, recommendations, groups, gifts and loans
- Entertainment schema v5 migration and executable social-algorithm QA

## Wave 8 — creation studio

- Review editor/templates, fan art and fan-fiction logs
- Cosplay projects, quotes, mood boards, dream casts and what-if writing

## Wave 9 — i18n, migration and QA

- UI translations and localized provider search
- Accessibility/responsive/security sweep
- Migration and analytics tests, route smoke and final docs audit

## Ground rules

Every wave must pass `npm audit`, ESLint, TypeScript, production build and route smoke. New persisted fields require a migration default. API keys never enter persisted state or exports. User-authored text renders through React, not raw HTML.
