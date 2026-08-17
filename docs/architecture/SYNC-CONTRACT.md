# Frontend ↔ Express sync contract

The Express API mirrors browser domains but is not called automatically by the frontend.

## Envelope

```json
{
  "tables": {
    "tasks": {},
    "notes": {},
    "...": {}
  },
  "singletons": {
    "...": {}
  }
}
```

`GET /api/sync` returns the envelope. `POST /api/sync` accepts the envelope and the historical flat-table shape. Rows require valid IDs; unsafe keys, excessive complexity and over-capacity tables are rejected.

## Domain mapping

| Frontend slice | Representative tables | Singleton documents |
|---|---|---|
| Core | `tasks`, `notes` | — |
| Workout | exercises, sessions, PRs, calisthenics, cardio, goals, journal, kanban | `workoutSettings`, `workoutMeta` |
| Career | roadmaps, skills, courses, contacts, applications, projects, daily/global collections | `careerMeta` |
| Forge | projects, tasks, ideation, strategy canvases, sprints, reviews, audit | `forgeStreak`, `forgeSettings` |
| Health | meals, water, sleep, measurements, supplements, vitals, mind, symptoms, goals | profile/settings/routines/meta |
| Entertainment | items, collections, events, social records and creation studio | `entertainmentSettings` |
| Notifications | `notifications` | `notificationSettings` |

Current server total: **138 tables and 12 singletons**.

## Sync invariants

- IDs are stable and unique per table.
- Collection sync replaces the addressed in-memory table; it is not a merge protocol.
- Singleton PUT performs a shallow merge.
- Personal/provider secrets must not be included.
- Data URLs count against body limits.
- The in-memory service resets on restart.

## Future production requirements

Before enabling automatic/cloud sync:

1. Add user identities and per-row authorization.
2. Replace in-memory tables with durable storage.
3. Define conflict/version semantics rather than whole-table replacement.
4. Encrypt sensitive records at rest.
5. Move media blobs to object storage/IndexedDB and sync references.
6. Add auditability, deletion/export rights and backup policy.
7. Add integration tests generated from shared schemas.
