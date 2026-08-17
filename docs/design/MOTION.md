# Motion language

## Home

- Direction-aware blur/slide transition when switching Dashboard, Tasks, Focus, Notes, Habits and Calendar.
- Staggered dashboard reveal.
- Completion-orbit draw animation.
- Space-card lift and instrument-card perspective hover.
- Dark view uses illumination reveal; light view uses a paper-reveal clip.

## Product spaces

- Workout: 3D charge-in and Battle overlay.
- Career: HudFlash terminal transition.
- Forge: HammerStrike and molten sweep.
- Health: EKG flash.
- Entertainment: keyed blur/fade slide for every internal module.

## Interaction rules

- Hover motion should be 2–7 px, never large layout movement.
- Tap feedback uses subtle scale reduction.
- Page transitions use 220–420 ms timing and ease `[0.22, 1, 0.36, 1]` unless a branded shell intentionally differs.
- Animation must communicate hierarchy/state, not run continuously without purpose.

## Accessibility

All new motion respects `prefers-reduced-motion`. The Home and AFTERGLOW roots reduce transition/animation durations to effectively zero; existing shell effects must retain their own reduced-motion guards during future touchups.
