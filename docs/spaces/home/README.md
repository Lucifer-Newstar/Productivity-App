# Home dashboard

The root route `/` is the App Router entry point and the shared launchpad for every Kaizen space.

## Shell

- `frontend/app/page.tsx` — dashboard entry.
- `frontend/app/AppShell.tsx` — active home view.
- `frontend/components/SideNav.tsx` — Dashboard, Tasks, Pomodoro, Notes, Habits and Calendar navigation.
- `frontend/app/layout.tsx` — theme/store providers and storage-quota warning.
- `frontend/app/profile/page.tsx` — full-page identity and per-space constants.

Home owns a dedicated `TopNav`, desktop `SideNav` and mobile section rail. Space navigation uses the centralized Lucide `SpaceIcon` mapping. The global avatar sits after the theme toggle in Home `TopNav` and in each space header, and navigates to `/profile`. It is not a floating overlay.

## Views

| View | Component | State |
|---|---|---|
| Dashboard | `Dashboard.tsx` | Tasks plus cross-space launch cards |
| Tasks | `Tasks.tsx` | Root `tasks` collection |
| Pomodoro | `Pomodoro.tsx` | Component timer state |
| Notes | `Notes.tsx` | Root `notes` collection |
| Habits | `Habits.tsx` | `kaizen.habits` |
| Calendar | `Calendar.tsx` | Task/date presentation |

## Space launch cards

The dashboard links to Workout, Projects/Forge, Career, Health/VITAL-SIGN and Entertainment/AFTERGLOW through the shared `SPACES` metadata in `lib/types.ts`.

## Persistence

- Tasks: `kaizen.tasks`
- Notes: `kaizen.notes`
- Habits: `kaizen.habits`
- Theme: `kaizen.theme`

Storage quota errors are caught and surfaced by `StorageErrorBanner`.

## Cross-space command center

The Overview is organized around seven questions:

1. Where am I? — five explainable Life Pulse dimensions.
2. What happened? — normalized recent growth timeline.
3. What matters today? — dated tasks, meetings, workouts and media plans.
4. What needs attention? — high/critical notifications from every space.
5. What should I do next? — ranked cross-space Next Action.
6. Am I improving? — seven-day momentum.
7. Where am I going? — twelve-week activity trajectory.

`lib/homeIntelligence.ts` contains deterministic formulas and ranking rules. No AI service is required and every Pulse row exposes its formula in the UI.

## Theme and motion

- Dark **Control System:** Space Grotesk, midnight command deck and telemetry lighting.
- Light **Daily Edition:** Manrope/Source Serif, editorial paper and coral/navy print treatment.
- Direction-aware transitions animate Dashboard, Tasks, Focus, Notes, Habits and Calendar.
- Font files are self-hosted npm assets.

## Current status

- `/` is statically prerendered.
- Included in the 39/39 production route smoke.
- Uses the current Next.js 16 App Router.
