# Current release status

**Date:** 2026-08-19
**Authority:** current code + application backlog; historical wave tables are supporting evidence only

## Product state

| Area | Current status |
|---|---|
| Frontend routes | 39 user routes implemented |
| Browser state | Authoritative, eleven versioned backup keys |
| Fresh profile | Empty personal history; catalogs/templates retained |
| Backup/recovery | Whole-product export, strict restore, rollback and corruption warning |
| Express | Reference/development only; excluded from v1 runtime |
| Deterministic Intelligence | Authoritative Core Today path |
| Model evaluation | Closed; no model selected |
| PR #4 | Merged as `06cf13c` |
| Main CI | GREEN — run `32260387533`, all four jobs |
| Windows package | Single setup executable + registered uninstaller/icons implemented; host validation pending |
| Cloud deployment | Not planned |

## Release gate

All identified P0/P1 application items are fixed, scoped or explicitly accepted. PR #4 and main CI are complete. Release is now blocked only on physical Windows evidence:

1. build the single Windows setup executable;
2. verify checksums;
3. clean install, launch, stop, update and uninstall;
4. verify offline routes and stable browser origin;
5. verify synthetic backup/restore and browser-data disclosure;
6. verify deterministic engine pairing and no residual ports/processes.

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
PR #4:                    MERGED — 06cf13c
Main CI:                  GREEN — 32260387533
Packaging implementation: COMPLETE LOCALLY
Windows host verification: PENDING
Release:                  NOT YET
```
