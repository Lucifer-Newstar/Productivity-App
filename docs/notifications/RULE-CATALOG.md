# Notification rule catalog

Rules evaluate on application load, relevant state changes and a five-minute interval. Browser delivery still obeys quiet/DND/channel settings.

## Workout

| Rule | Trigger | Action |
|---|---|---|
| Workout scheduled | Routine `dayOfWeek` matches today | `/workout/schedule` |
| Missed workout | Yesterday had a scheduled routine and no finished session | `/workout/schedule` |
| Morning weigh-in | After 07:00 and no bodyweight row today | `/workout/overview` |
| PR celebration | PR date is today | `/workout/prs` |

## Career

| Rule | Trigger |
|---|---|
| Certification renewal | Expiry within 90 or 30 days |
| Certification expired | Expiry date passed |
| Stale contact | No contact for 90+ days |
| Follow-up due | `nextFollowUpAt` reached |
| Birthday | Contact month/day equals today |
| Application follow-up | Applied stage unchanged for 14+ days |
| Application stalled | Active pipeline item aged 21+ days |
| Skill decay | `lastUsedAt` aged 90+ days |

## Projects / Forge

| Rule | Trigger |
|---|---|
| Project health | Blocked or off-track |
| Deadline | Due within seven days or overdue |
| Budget | 80% threshold or over budget |
| Task due | Due today or overdue |
| Stuck task | `stuck = true` |
| Aging task | Open for 21+ days |

## Health

| Rule | Trigger |
|---|---|
| Breakfast/lunch/dinner check | Slot not logged after 10:00/14:00/22:00 |
| Hydration | After 10:00 with less than 500 ml logged; max one key per two-hour bucket |
| Caffeine | More than 400 mg today |
| Sleep debt | Last seven sleep rows total at least five hours below ideal |
| High stress | Last three check-ins all at least 7/10 |

These are wellness prompts, not diagnoses. High-stress wording recommends reducing load/support rather than claiming a medical condition.

## Entertainment

| Rule | Trigger |
|---|---|
| Release/planned today | `releaseDate` or `scheduledFor` equals today |
| Continue | In-progress title inactive for three days |
| Rating reminder | Completed at least one day, no rating |
| Backlog aging | Planned for at least 30 days |
| Queue cleanup | More than 50 planned titles |
| Empty queue | No active planned titles |
| Friend recommendation | Private recommendation waits 14 days |
| Loan reminder | Unreturned for 30 days |

## System

Evening Daily Pulse starts after 20:00 and summarizes completed workouts, meal logs, completed tasks and media completions.

## Dedupe

Rules use IDs plus dates/time buckets in `sourceKey`. One-time events use entity IDs. Repeating reminders use day, week or month buckets so they can recur without flooding.
