# Standing weight, gender chrome, Japanese geometry

**Date:** 2026-08-21
**Status:** implemented in source
**Electron:** unchanged

## Outcome

`/profile` now hosts a **standing weight** (kg). It writes the latest Workout `bodyweight` log once. Health BMI / BMR / TDEE / water / protein, Soma ratios, and Home intelligence hydration all read that latest value until the user changes it. It is not a daily weigh-in.

Male vs female is **obvious on Profile and Health only** (ADR-009). Workout, Career, Forge and Glow keep their own OS. A light Japanese geometry overlay (waves, hemp, diagonals — **no letters**) sits on each space in that space’s own colour so pages stay unique.

## Standing weight

- Source of truth remains Workout `bodyweight[]` via `logBodyweight`.
- Helper: `latestStandingWeightKg`.
- Profile You + Health tabs: stepper + typed field (commit on blur).
- Live chips: BMI, BMR, TDEE, water, protein.

## Gender (Profile + Health)

- Male Profile: Instrument kicker, Space Grotesk name, 4px corners, teal/cyan accent.
- Female Profile: Atelier kicker, editorial italic name, pill corners, rose accent.
- Male Health: VITALS stencil, square cards, EKG green.
- Female Health: CLINIC italic brand, rounded cards, rose rail and trace.

## Japanese touch

Unique overlays only: Home seigaiha-cyan, Profile gold waves, Workout gold conic, Career HUD hatch, Forge ember diamond, Health green/rose waves, Glow violet shippo. No kanji, no shared typeface across spaces.

## Non-goals

No Electron edits, no restyle of all five space interiors into one look, no AI writes, no daily forced weigh-in.
