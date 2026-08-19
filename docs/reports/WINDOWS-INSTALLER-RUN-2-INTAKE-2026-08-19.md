# Windows installer workflow run 2 intake

**Date:** 2026-08-19
**Run:** `32296168291`
**Commit:** `c4ba442`
**Result:** failed in **Build single-file setup**

## Intake

The supplied error summary reported a missing `frontend/dist` path. Kaizen's Next.js packaging contract does not use `frontend/dist`; the required frontend entry is:

```text
frontend/.next/standalone/server.js
```

The staging script already invoked both frontend and Intelligence builds, so adding another unverified generic build command would not identify which package output was actually absent. The native package also requires Electron's downloaded runtime under its own dependency tree.

## Correction

The Windows workflow now separates and names each phase:

1. install frontend, Intelligence and desktop dependencies from lockfiles;
2. build frontend and Intelligence workspaces with packaged environment flags;
3. assert exact required outputs:
   - Next standalone server;
   - compiled Intelligence server;
   - Electron Windows executable;
4. stage with `-SkipInstall -SkipBuild` so packaging cannot hide or duplicate a failed prerequisite;
5. compile the single Inno Setup executable.

The staging script repeats the exact output assertions when used locally. It never expects or copies `frontend/dist`.

## Delivery expansion

After the corrected Windows build passes, green `main` CD updates the public rolling `continuous` prerelease and replaces its verified assets. Stable semantic-version releases remain separately tag-, provenance-, privacy- and exact-CI-gated. Stable installed applications ignore the continuous prerelease.
