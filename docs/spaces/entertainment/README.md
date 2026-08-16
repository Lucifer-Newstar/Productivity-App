# Entertainment space — AFTERGLOW 🎬

AFTERGLOW is Kaizen's local-first media tracker for books, comics, manga, movies, TV series and anime. The former `SpaceTasks` placeholder was replaced by a full-screen cinema shell in Wave 1.

## Route and files

- Route: `/entertainment` (`Page.fullScreen = true`)
- UI: `frontend/components/entertainment/EntertainmentPage.tsx`
- Types/seeds/migration: `frontend/lib/entertainmentTypes.ts`
- Store key: `localStorage["kaizen.entertainment"]`
- Provider plan: [`APIS.md`](APIS.md)
- Delivery plan: [`WAVES.md`](WAVES.md)
- 96-feature audit: [`FEATURES.md`](FEATURES.md)
- QA: [`QA.md`](QA.md)

## Current implementation — Wave 0 + Wave 1 core

- AFTERGLOW dark/light full-screen shell
- Dashboard with active, queued, completed and consumed-time KPIs
- Continue and priority-queue cards
- Manual Quick Add across all six media types
- Statuses: planned, in progress, completed, paused and dropped
- Type-aware page/chapter/episode/movie progress
- Rating, review, notes, dates, repeats, priority, creators, genres and tags
- Favorites, archive and delete
- Full-text local search, filters and five sorting modes
- Defensive persistence migration and first-run seed

Wave 2 is now in progress: Quick Add can search/import through same-origin MAL, AniList, TMDB, Google Books/Open Library and Comic Vine adapters. Providers that require credentials return a clear configuration message; AniList and Open Library work without keys. Remote covers are fetched only through an allowlisted, bounded image proxy.

## Theme

**Dark — Midnight Screening:** near-black violet, projected fuchsia/cyan light, translucent screening-room panels and a marquee beam.

**Light — Matinee:** warm blush-white, plum text and restrained neon accents. It reuses Kaizen's global theme preference but does not inherit the generic TopNav.

External font imports are not used; system/local fallback stacks preserve the security policy.

## State boundary

`EntertainmentState` owns items, collections, immutable activity events and settings. Provider metadata and personal tracking are intentionally separated at field level: metadata refreshes must never overwrite ratings, progress, notes, reviews, tags, favorites or history.

The root store exposes one functional `updateEntertainment()` mutator, matching Health/Forge/Career update semantics and avoiding stale-closure writes.
