# Windows installer workflow run 3 intake

**Date:** 2026-08-19
**Run:** `32300571378`
**Commit:** `b24df2e`
**Result:** Electron runtime output missing before workspace build

## Failure

The explicit output gate correctly reported that the pinned Electron package did not contain its downloaded Windows runtime at `node_modules/electron/dist/electron.exe` after `npm ci`.

## Root cause

Electron 43.4.1 declares `install-electron` as a package binary but no longer declares a package lifecycle `postinstall` script. Therefore `npm ci`, reinstalling with `--force`, or running a generic npm rebuild does not guarantee that the platform runtime is downloaded. The dependency package itself was installed correctly; its separate runtime installer had not run.

## Correction

Both Windows workflow and local staging now execute the pinned dependency's installer directly:

```text
node packaging/desktop/node_modules/electron/install.js
```

The workflow immediately asserts `electron.exe` exists before building other workspaces. Local staging applies the same command and repeats the exact output gate before copying files. No unpinned `npm install electron` fallback is used, so `package-lock.json` remains authoritative.

## Release behavior

A corrected green `main` run builds and verifies the installer, uploads its Actions artifact and refreshes the public rolling `continuous` prerelease. Stable release publication still requires an annotated semantic-version tag and all existing provenance/privacy gates.
