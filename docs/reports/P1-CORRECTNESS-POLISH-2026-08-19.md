# P1 correctness and durability polish

**Date:** 2026-08-19
**Backlog items:** APP-102, APP-104, APP-105

## Wilks correctness

Removed the `weight × 3` placeholder. The calculator now requires an explicit squat+bench+deadlift total and shows no Wilks result until that input exists. Bodyweight and category selection remain explicit.

## Focus-cycle persistence

Completed focus cycles and focused minutes persist under `kaizen.focus`, are included in whole-product backup and are described as retained in the browser profile. Active countdown state remains intentionally screen-session state. Skip now advances immediately instead of leaving a paused zero timer.

## Forge voice-note scope

Audio remains session-only because Blob URLs cannot be durable localStorage data. The UI now:

- explicitly states the session-only boundary;
- provides a download action while the Blob is available;
- tells users to download before reload;
- displays transcript-retained/audio-unavailable state after reload;
- continues revoking Blob URLs on deletion.

This closes the item by honest session-only/export scope rather than pretending audio is persisted.

## Validation

- Wilks entered-total behavior is covered by core correctness QA.
- `kaizen.focus` is included in the eleven-key backup contract.
- Voice disclosure/download is covered by production baseline structural QA.
- TypeScript and ESLint pass.