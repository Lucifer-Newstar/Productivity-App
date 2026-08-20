# Hosted CI run 4 intake

**Date:** 2026-08-20
**Run:** `32400876377`
**Commit:** `8b3cc95`
**Result:** Frontend application failed in Product and security suites

## Failure

`npm run qa:docs` failed one contract:

```text
✗ continuous delivery requires provenance, reviewed notes and sanitized assets
```

Packaging, update, TypeScript and ESLint were not the failing step. Windows Installer run `32401008835` was skipped because CI did not go green.

## Root cause

`8b3cc95` changed continuous delivery from a rolling `continuous` prerelease plus intentional tag publication to automatic stable patch publication after green `main` CI. `docs/guides/CONTINUOUS-DELIVERY.md` no longer contains `tagged commit belongs to main history` or `Kaizen Continuous Build`. `qa:docs` still required those strings.

## Correction

- `qa:docs` now asserts push-triggered main CI, patch increment and `PUBLIC-SANITIZED-AGGREGATE`.
- Windows installation and root README copy match automatic stable patch publication.
- Manual `workflow_dispatch` remains non-publishing.

No product, model, Express or desktop-protocol change is included.
