# Notification scope decisions

The proposed 198-item list was reviewed against fields and workflows that actually exist. The system intentionally does not pretend to support unavailable sensors, services or background delivery.

## Kept for the active foundation

High-value rules with reliable current data:

- Workout schedule/miss, weigh-in and PR
- Career certification/contact/follow-up/application/skill aging
- Forge project/task health, deadlines and budget
- Health meals, water, caffeine, sleep and stress
- Entertainment releases, continuity, ratings, backlog and exchanges
- Evening cross-space pulse

## Event-driven follow-up wave

Useful rules that should be emitted directly by actions/timers rather than periodic scans:

- Rest timer complete, AMRAP set and hydration breaks
- Post-workout nutrition/recovery/soreness prompts
- Streak, volume, milestone, course, roadmap and project celebrations
- Focus timer/meeting completion prompts
- Health goal/habit achievements
- Entertainment progress percentages and completion celebrations
- Weekly/monthly/yearly digests

## Deferred until supporting data exists

- Equipment reminders: no reliable per-scheduled-session equipment plan
- Interview/meeting “tomorrow/15 minutes” reminders: no complete calendar/time model across all entries
- New role alerts: no job-search provider or saved-search service
- Referral opportunity from external hiring data
- Doctor follow-up, vaccines, lab recurrence and medication refill schedules: current Health records are logs, not prescription/care plans
- Screen-time and social-interaction alerts: no OS telemetry
- Energy-budget/focus-mode page hiding: no implemented global energy/focus-mode model
- Entertainment challenge progress: no Entertainment challenge entity
- API sync reminder: frontend is intentionally local-first and does not auto-sync

## Removed for safety or honesty

- Automatic PHQ-9/GAD-7 “screening reminders” as if Kaizen were a clinical service. These require an explicit evidence-based feature, consent and crisis pathway—not a generic timer.
- Diagnostic language such as “depression detected.” Wellness notifications remain non-diagnostic.
- PWA vibration/badge/background-push toggles before a service worker/push architecture exists.
- Exact body-composition claims when inputs are insufficient; existing Health analytics should generate these only from validated trends.

## Duplicates consolidated

- Workout and Health weigh-in/measurement/photo reminders become shared health/body-composition rules rather than duplicate alerts.
- Hydration rules share Health as source of truth; Workout can consume pre-session context.
- Data backup reminders become one global maintenance rule.
- Project ship → Career portfolio/skill bump uses the existing bridge event rather than two independent scanners.
