# Theme systems

## Home

### Dark — Control System

- Space Grotesk + JetBrains Mono
- Midnight navy/black command deck
- Cyan/violet/lime telemetry accents
- Rounded instrument panels, grid field and illuminated orbit metrics

### Light — Daily Edition

- Manrope body + Source Serif display
- Warm editorial paper with navy/coral ink
- Near-square cards, offset print shadows and ruled-paper rhythm
- No dark-theme glass or neon treatment

## Workout

- Fonts: Cinzel + Cormorant Garamond
- Dark: imperial obsidian/crimson/gold, dragon/scale textures
- Light: parchment/burgundy/bronze training manuscript
- Route transition: 3D charge-in and Battle navigation

## Career

- Fonts: Space Grotesk + JetBrains Mono
- Dark: Night HUD, cyan grid, scanline and terminal instrumentation
- Light: cream engineering blueprint with blue structural ink and red-pencil accents
- Route transition: HUD flash

## Projects / Forge

- Fonts: Barlow Condensed + JetBrains Mono
- Dark: molten Foundry, steel plate, weld and ember language
- Light: Drafting Room vellum, graphite and construction grid
- Route transition: HammerStrike

## Health / VITAL-SIGN

- Fonts: IBM Plex Sans + JetBrains Mono
- Dark: ICU monitor navy, EKG green and blood-red alerts
- Light: Clinic white/slate/lime with chart-paper structure
- Route transition: EKG sweep

## Entertainment / AFTERGLOW

- Font: Sora
- Dark: Midnight Screening, violet black with fuchsia/cyan projection light
- Light: Matinee, blush-white/plum with restrained cinematic color
- Internal transition: blur/fade slide between every module

## Shared rules

- Themes use the global `kaizen.theme` preference.
- A light theme must not be a simple color inversion of its dark counterpart.
- Text contrast, focus states and reduced-motion behavior remain mandatory.
- Native `<select>` option lists and the global notification inbox must keep readable ink in both themes.
- Fonts are self-hosted npm assets; no runtime CDN dependency.
- Japanese geometry (waves, hemp, hatch) may overlay a space in that space’s own colour. No Japanese letters. Type, radius and motion stay unique per space (ADR-009).
- Male vs female chrome is Profile + Health only: Instrument/VITALS vs Atelier/CLINIC. Do not clone one gender look across Workout, Career, Forge or Glow.
