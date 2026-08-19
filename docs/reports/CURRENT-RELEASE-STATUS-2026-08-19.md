# Current release status

**Date:** 2026-08-19
**Authority:** current code + application backlog; historical wave tables are supporting evidence only

## Product state

| Area | Current status |
|---|---|
| Frontend routes | 39 user routes implemented |
| Browser state | Authoritative, eleven versioned backup keys |
| Fresh profile | Empty personal history; catalogs/templates retained |
| Demo data | Hidden/no-op unless explicit demo build flag |
| Local dates/habits | Corrected and regression-tested |
| Backup/recovery | Whole-product export, strict restore, rollback and corruption warning |
| Express | Reference/development only; excluded from v1 runtime |
| Express network security | Non-loopback requires service key |
| Deterministic Intelligence | Authoritative Core Today path |
| Model evaluation | Closed; no model selected |
| CI | GREEN — run `32255861421` passed all four jobs at `6a2c885` |
| Cloud deployment | Not planned |

## Backlog gate

All identified P0/P1 code or architecture items are now fixed, scoped or explicitly accepted locally. P2 items remain intentional deferrals.

The final local regression and hosted CI are green. The release remains blocked on review evidence:

1. authenticated `ai`→`main` PR creation;
2. human review and explicit merge approval.

## Post-merge-only gate

Windows/local packaging, clean install/update/uninstall, offline operation, backup restore and loopback engine startup are not started and must occur only after merge.

## Explicit non-goals

- no cloud deployment;
- no model or MLOps work;
- no AI v0.2;
- no Express production persistence;
- no remote provider;
- no personal laptop public runner.

## Release decision

```text
Local code completion:     COMPLETE
Hosted CI:                GREEN — 32255861421
PR creation:              AUTHORIZED — LEAVE UNMERGED
Merge:                    NOT AUTHORIZED
Windows packaging:        AFTER MERGE ONLY
Release:                  NOT YET
```
