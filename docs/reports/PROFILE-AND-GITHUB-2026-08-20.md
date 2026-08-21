# Global profile and Forge GitHub linking

**Date:** 2026-08-20
**Status:** implemented in source
**Electron:** unchanged

## Outcome

A global `ProfileDock` avatar opens from Home `TopNav` and as a floating control on full-screen spaces. The drawer edits identity (`kaizen.profile`) and writes through to existing Workout, Forge, Career, Health and Entertainment slices. Daily logs stay in-space.

Forge can list public GitHub repositories through a same-origin BFF (`/api/forge/github/repos`) with a fixed `api.github.com` host. Optional PATs remain in `sessionStorage` and are excluded from backups. Linked repos appear on project drilldown.

Schema v2 backups include `kaizen.profile`. Schema v1 backups without that key still restore.

## Non-goals

No Electron/packaging edits, no GitHub writes, no Express production persistence, no AI scope change.
