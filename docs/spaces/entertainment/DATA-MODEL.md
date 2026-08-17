# Entertainment data model

```text
EntertainmentState
 ├── schemaVersion: 4
 ├── items: EntertainmentItem[]
 │    ├── provider identity + normalized catalogue metadata
 │    ├── type/status/progress/rating/review
 │    ├── dates/repeats/priority/queue/tags
 │    ├── BookDetails (format/edition/narrator/readingLogs)
 │    ├── ComicDetails (format/owned+read volume states)
 │    ├── SeriesDetails (platform/audio/seasons/episode logs/alerts)
 │    ├── MovieDetails (venue/version/acting/cinematography)
 │    ├── AnimeDetails (audio/source/seiyuu/OP/ED)
 │    ├── countries[] + franchise/franchiseOrder (discovery intelligence)
 │    └── favorite talent/archive/time/cost fields
 ├── collections: EntertainmentCollection[]
 ├── events: EntertainmentEvent[]
 ├── settings: EntertainmentSettings
 └── lastRolloverMonth?: YYYY-MM       # idempotency guard
```

`MediaProgress` is a single sparse type with media-specific pairs: pages for books, chapters/volumes for comics and manga, episodes/seasons for series and anime, and a watched boolean for movies.

State persists under `kaizen.entertainment`. Schema v4 retains all deep-tracking defaults and adds country/franchise normalization for local discovery intelligence. `migrateEntertainment()` supplies every array/default and caps loaded event history. All writes use functional `updateEntertainment()` patches.

Provider metadata is copied into an item at import time. It is not a live foreign object and is never allowed to overwrite personal fields during refresh.
