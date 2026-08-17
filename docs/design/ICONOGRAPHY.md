# Iconography

## Primary library

Kaizen uses `lucide-react` for interface and semantic icons.

## Space marks

| Space | Icon |
|---|---|
| Projects / Forge | `Anvil` |
| Workout | `Dumbbell` |
| Career | `BriefcaseBusiness` |
| Entertainment | `Clapperboard` |
| Health | `HeartPulse` |

`components/SpaceIcon.tsx` is the single mapping source. Navigation, dashboard cards, task chips and calendar labels consume this component instead of storing emoji strings in `SPACES`.

## Rules

- Use outline icons with consistent 1.8–2.1 stroke widths.
- Use color and container shape to communicate the owning space.
- Icon-only controls require accessible labels.
- Do not mix multiple icon libraries in one control group.
- Decorative icons must use `aria-hidden`.

## Emoji policy

Emoji are not primary navigation or system iconography. They may remain only where they are user-authored content or intentionally expressive rewards, such as a custom motivation-board entry. Health symptom and Workout cardio selectors use semantic Lucide icons.
