# UI refresh — phase 1 foundation

## Branch

`ui-touchups`, created from merged `main`.

A dedicated branch does not inherently create merge conflicts. Conflicts only occur when another branch changes the same lines before integration; keeping UI work isolated protects stable `main` while the visual pass is reviewed.

## Implemented

### Iconography

- Replaced space emojis with centralized Lucide marks (`SpaceIcon`).
- Replaced Health symptom emojis with semantic medical/status icons.
- Replaced Workout cardio emojis with activity icons.
- Removed emoji fields from shared `SPACES` metadata.
- Replaced Home empty-state emojis with Lucide illustrations.

### Typography

Added self-hosted Fontsource families:

- Manrope
- Space Grotesk
- Sora
- Source Serif 4
- JetBrains Mono
- Barlow Condensed
- IBM Plex Sans
- Cinzel
- Cormorant Garamond

No runtime font CDN is used.

### Home dark theme — Control System

- Midnight navy/black command interface
- Cyan/violet/lime telemetry accents
- Space Grotesk + JetBrains Mono
- Instrument cards, grid field, completion orbit and illuminated progress

### Home light theme — Daily Edition

- Warm editorial paper
- Navy/coral print palette
- Manrope + Source Serif 4
- Square editorial cards, ruled rhythm and offset print shadows
- No dark-glass/neon reuse

### Motion

- Direction-aware blur/slide transitions for every Home sub-view
- Staggered dashboard entrance
- Drawn completion orbit
- Interactive metric/space cards
- Light-theme paper reveal and dark-theme illumination reveal
- Keyed AFTERGLOW module transitions
- Reduced-motion coverage

### Space type voices

- Workout: Cinzel/Cormorant
- Career: Space Grotesk/JetBrains Mono
- Forge: Barlow Condensed/JetBrains Mono
- Health: IBM Plex Sans/JetBrains Mono
- Entertainment: Sora

## Verification

- UI foundation checks: 15/15
- Documentation integrity: 14/14
- TypeScript: pass
- ESLint: pass
- Next.js production build: pass
