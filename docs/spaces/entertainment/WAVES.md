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

Remaining Wave 1 polish: cover image upload, dedicated review spoiler toggle, queue drag-order and empty-state onboarding.

## Wave 2 — provider integrations

- Same-origin provider adapter routes
- MAL anime, AniList manga, TMDB movie/series
- Google Books + Open Library books
- Comic Vine comics and NYT bestseller discovery
- Normalized preview/import and metadata refresh
- Cache, timeout, provider rate limits and attribution
- Session-only BYOK overrides

## Wave 3 — organization and history

- Collections, favorites view and advanced smart filters
- Calendar, release/schedule events and `.ics` export
- Immutable activity timeline and monthly rollover
- Archive manager
- JSON/CSV backup and safe restore
- Trakt/MAL/AniList/Simkl/Kitsu import adapters

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
