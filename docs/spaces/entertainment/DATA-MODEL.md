# Entertainment data model

```text
EntertainmentState
 ├── schemaVersion: 5
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
 ├── friends: EntertainmentFriend[]        # manual ratings for taste match
 ├── recommendations: FriendRecommendation[]
 ├── groups: SharedMediaGroup[]
 ├── gifts: MediaGift[]
 ├── loans: MediaLoan[]
 ├── settings: EntertainmentSettings
 └── lastRolloverMonth?: YYYY-MM       # idempotency guard
```

`MediaProgress` is a single sparse type with media-specific pairs: pages for books, chapters/volumes for comics and manga, episodes/seasons for series and anime, and a watched boolean for movies.

State persists under `kaizen.entertainment`. Schema v5 retains media/discovery defaults and adds offline-social arrays for friends, recommendations, groups, gifts and loans. `migrateEntertainment()` supplies every array/default and caps loaded event history. All writes use functional `updateEntertainment()` patches.

Provider metadata is copied into an item at import time. It is not a live foreign object and is never allowed to overwrite personal fields during refresh.
