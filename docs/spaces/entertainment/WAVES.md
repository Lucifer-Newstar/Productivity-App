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

## Wave 3 — organization and history 🟡 core complete

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

Remaining as Wave 3B: advanced compound filters and external Trakt/MAL/AniList/Simkl/Kitsu import adapters.

## Wave 4 — media-specific depth

- Book speed, editions, narrator and DNF analysis
- Comic/manga volume ownership and missing-volume tracker
- Series/anime season and episode logs, binge detection and schedules
- Movie venue/version plus acting/cinematography scores
- Anime source, seiyuu and OP/ED markers

## Wave 5 — discovery intelligence

- Local if-you-liked engine, mood pick and Surprise Me
- Provider trending panels
- Franchise gap finder
- Exploration score, blind spots and creator marathons

## Wave 6 — analytics

- Timeline, count/time/rating/genre/creator/decade reports
- Monthly tracker and year in review
- Completion, backlog and abandoned analysis
- Heatmap, mood, cost-per-hour and satisfaction trend

## Wave 7 — offline social simulation

- Friend recommendations and manual taste matching
- Shared groups, deterministic discussion prompts
- Gift and borrow/loan tracking

## Wave 8 — creation studio

- Review editor/templates, fan art and fan-fiction logs
- Cosplay projects, quotes, mood boards, dream casts and what-if writing

## Wave 9 — i18n, migration and QA

- UI translations and localized provider search
- Accessibility/responsive/security sweep
- Migration and analytics tests, route smoke and final docs audit

## Ground rules

Every wave must pass `npm audit`, ESLint, TypeScript, production build and route smoke. New persisted fields require a migration default. API keys never enter persisted state or exports. User-authored text renders through React, not raw HTML.
