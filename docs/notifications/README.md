# Kaizen notification system

_Status: foundation + high-value rule set implemented on branch `entertainment`._

## Architecture

```text
Root StoreProvider
 └── NotificationState (`kaizen.notifications`)
      ├── deduplicated inbox
      └── global/section/channel settings

NotificationCenter (mounted in App + Pages layouts)
 ├── evaluates pure rules on state changes and every 5 minutes
 ├── displays inbox on every route/full-screen shell
 ├── optionally delivers browser notifications while Kaizen is open
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
