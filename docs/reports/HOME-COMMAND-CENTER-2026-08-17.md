# Home Command Center redesign — 2026-08-17

## Goal

Move `/` from a task-count dashboard to the global operating surface for Kaizen: current state, next decision, attention and trajectory.

## Information hierarchy

1. Deterministic Command Brief
2. Ranked Next Action
3. Today command strip
4. Explainable five-dimension Life Pulse
5. Intelligent summaries for all five spaces
6. High-priority Needs Attention
7. Significant cross-space timeline
8. Seven-day momentum
9. Twelve-week activity arc

## Explainable Pulse

- Work: 45% project health + 35% task deadline health + 20% focus target
- Career: 55% roadmap + 30% skill gaps + 15% follow-up freshness
- Body: 40% readiness + 35% weekly training + 25% recency
- Health: 35% sleep + 30% hydration + 20% stress + 15% meals
- Life: 45% personal tasks + 40% habits + 15% leisure continuity

Scores are bounded 0–100 and each row exposes its formula. They are not medical or predictive claims.

## Next Action ranking

Candidates come from overdue/stuck/P1 Forge work, high-priority core tasks, Career follow-ups and roadmap milestones, and today's Workout routine. Reasons and source links remain visible.

## Verification

- `npm run qa:home` — 10/10 executable formula/ranking tests
- `npm run qa:ui` — command-center structure and interaction checks
- TypeScript, ESLint and production build pass
