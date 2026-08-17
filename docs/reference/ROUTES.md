# Route inventory

_Last verified: 2026-08-16; 39/39 user routes HTTP 200._

## Home

- `/`

## Career

- `/career` → redirect to Projects Hub
- `/career/projects`
- `/career/roadmaps`
- `/career/skills`
- `/career/certs`
- `/career/network`
- `/career/jobs`
- `/career/portfolio`
- `/career/daily`
- `/career/command`

## Entertainment

- `/entertainment`

Same-origin dynamic routes:

- `/api/entertainment/search?q=&type=&lang=`
- `/api/entertainment/trending?type=&lang=`
- `/api/entertainment/details?provider=&id=&type=&lang=`
- `/api/entertainment/providers`
- `/api/entertainment/image?url=`

## Health

- `/health`
- `/health/nutrition`
- `/health/hydration`
- `/health/sleep`
- `/health/physique`
- `/health/supplements`
- `/health/vitals`
- `/health/mind`
- `/health/sync`
- `/health/reports`

## Projects / Forge

- `/projects`
- `/projects/quarry`
- `/projects/smelter`
- `/projects/vault`
- `/projects/p/[id]`

## Workout

- `/workout` → redirect to Overview
- `/workout/overview`
- `/workout/gym`
- `/workout/calisthenics`
- `/workout/cardio`
- `/workout/schedule`
- `/workout/prs`
- `/workout/skills`
- `/workout/charts`
- `/workout/library`
- `/workout/tools`
- `/workout/kanban`

## Express

Express uses base URL `http://127.0.0.1:4000/api`. Its complete resource list is in [`../API.md`](../API.md). Liveness routes are `/api/health-check` and legacy `/api/health`.
