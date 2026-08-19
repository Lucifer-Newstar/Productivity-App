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
| CI | Implemented locally; first hosted result pending |
| Cloud deployment | Not planned |

## Backlog gate

All identified P0/P1 code or architecture items are now fixed, scoped or explicitly accepted locally. P2 items remain intentional deferrals.

The final local regression is green. The release is blocked on hosted/review evidence:

1. first hosted GitHub CI run;
2. regenerated final PR diff/review after hosted results;
3. authenticated `ai`→`main` PR creation;
4. human review and explicit merge approval.

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
Local code completion:     READY FOR HOSTED CI
PR creation:              HOLD UNTIL HOSTED CI
Merge:                    NOT AUTHORIZED
Windows packaging:        AFTER MERGE ONLY
Release:                  NOT YET
```
