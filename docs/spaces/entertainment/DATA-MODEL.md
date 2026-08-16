# Entertainment data model

```text
EntertainmentState
 ├── schemaVersion: 1
 ├── items: EntertainmentItem[]
 │    ├── provider identity + normalized catalogue metadata
 │    ├── type/status/progress/rating/review
 │    ├── dates/repeats/priority/queue/tags
 │    └── favorite/archive/time/cost fields
 ├── collections: EntertainmentCollection[]
 ├── events: EntertainmentEvent[]
 └── settings: EntertainmentSettings
```

`MediaProgress` is a single sparse type with media-specific pairs: pages for books, chapters/volumes for comics and manga, episodes/seasons for series and anime, and a watched boolean for movies.

State persists under `kaizen.entertainment`. `migrateEntertainment()` supplies arrays and defaults for every existing item and caps loaded event history. All writes use functional `updateEntertainment()` patches.

Provider metadata is copied into an item at import time. It is not a live foreign object and is never allowed to overwrite personal fields during refresh.
