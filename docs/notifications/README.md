# Kaizen notification system

_Status: foundation + high-value rule set merged into `main`._

## Architecture

```text
Root StoreProvider
 └── NotificationState (`kaizen.notifications`)
      ├── deduplicated inbox
      └── global/section/channel settings

NotificationCenter (mounted in App + Pages layouts)
 ├── evaluates pure rules on state changes and every 5 minutes
 ├── maps the current URL to one section
 ├── displays only that section plus Global notifications
 ├── optionally delivers only context-visible browser notifications while open
 └── routes actions back to the relevant space
```

The system is local-first. No push service, account or remote notification database is required.

## Implemented rule families

- Workout: scheduled/missed sessions, weigh-in and same-day PR celebrations.
- Career: certification expiry, stale contacts, follow-ups, birthdays, application aging and skill decay.
- Projects: blocked/off-track health, project deadlines, budget thresholds, task due/overdue/stuck/aging.
- Health: meal checks, hydration, caffeine, sleep debt and sustained high stress.
- Entertainment: releases/schedules, continue reminders, rating, backlog/queue, friend recommendations and loans.
- System: evening daily pulse.

See [`RULE-CATALOG.md`](RULE-CATALOG.md) for exact behavior and [`SCOPE-DECISIONS.md`](SCOPE-DECISIONS.md) for pruned/deferred requests.

## Section visibility

- `/workout/*` → Workout + Global
- `/career/*` → Career + Global
- `/projects/*` → Projects + Global
- `/health/*` → Health + Global
- `/entertainment` → Entertainment + Global
- `/` and unknown routes → Global only

Notifications remain in one persisted inbox, but section-specific entries and browser delivery are hidden outside their owning space. Mark-all-read affects only the currently visible context. Settings can still configure every section from any route.

## Data Setup assistant

The clipboard-check button opens a cross-space readiness checklist. Each section gets a priority notification until its minimum personal data is present and the user explicitly confirms it.

- Workout: bodyweight and at least one routine.
- Career: roadmap plus a skill or career goal.
- Projects: at least one real project.
- Health: explicit confirmation of age, height, gender, city and sleep target because seeded defaults affect formulas.
- Entertainment: at least one configured provider or explicit manual-only acceptance.

A Global setup alert reports how many sections remain. Confirmed setup alerts become irrelevant immediately without deleting notification history. Users can reset confirmation when their profile changes.

## Notification lifecycle

1. A pure rule returns a candidate with a deterministic `sourceKey`.
2. `addNotification()` ignores an already-seen key.
3. The inbox stores at most 2,000 entries.
4. Users can read, dismiss or mark all read.
5. Browser delivery records `browserDeliveredAt` to prevent repeat delivery.
6. DND, quiet hours, snooze, frequency, section and kind settings are applied before browser delivery.

## Important delivery limitation

Browser notifications currently work **while Kaizen is open**. Reliable closed-app/background delivery requires a service worker, installable PWA and push/scheduled backend. The UI says this explicitly; vibration and app-icon badges were removed from the active settings scope until that architecture exists.

## Data model

- `frontend/lib/notificationTypes.ts`
- `frontend/lib/notificationRules.ts`
- `frontend/components/NotificationCenter.tsx`
- Persistence: `localStorage["kaizen.notifications"]`
- Express mirror: `/api/notifications` + `/api/notifications/settings`
