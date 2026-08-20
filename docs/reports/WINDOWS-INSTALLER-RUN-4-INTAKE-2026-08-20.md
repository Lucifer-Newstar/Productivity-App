# Windows installer delivery-gate intake

**Date:** 2026-08-20
**Status:** implemented in source
**Symptom:** Validate delivery gate failed because `gh release list` had no token

## Measured fact

The Resolve release version step calls `gh release list` to allocate the next stable patch. GitHub CLI in Actions requires `GH_TOKEN`. The publish job already set `GH_TOKEN: ${{ github.token }}`; the delivery-gate job did not.

`gh` therefore exited with:

```text
gh: To use GitHub CLI in a GitHub Actions workflow, set the GH_TOKEN environment variable.
```

## Correction

The version step now sets `GH_TOKEN: ${{ github.token }}`. Packaging QA asserts that token is present next to `gh release list`. Permissions remain `contents: read` for listing public releases.

No product, model, Express or desktop-protocol change is included.
