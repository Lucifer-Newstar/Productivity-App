# Windows installer workflow run 1 intake

**Date:** 2026-08-19
**Result:** failed during installed-package verification

## Failure

The setup executable built and installed, but `verify-package.mjs` attempted to read:

```text
%LOCALAPPDATA%\Programs\VERSION
```

The expected file was:

```text
%LOCALAPPDATA%\Programs\Kaizen\VERSION
```

## Root cause

Runtime scripts are installed under `Kaizen\scripts`. Both the verifier and normal launcher resolved two parent levels from that directory, reaching `Programs` instead of the Kaizen installation root. The visible failure occurred at the verifier's first `VERSION` read; the same path defect would also have prevented the normal launcher from finding bundled frontend, engine and Node files.

## Correction

- `verify-package.mjs` now resolves exactly one parent directory.
- `launcher.cjs` receives the same correction.
- Packaging QA executes an install-root depth assertion and statically verifies the verifier expression.

No test gate was weakened. The corrected Windows workflow must rebuild, install, verify and uninstall a fresh setup executable before the installer is accepted.

**Subsequent topology note:** ADR-016 replaced the console/browser launcher with a native Electron lifecycle owner before public release. The verifier retains the corrected one-level install-root contract; the obsolete launcher file is no longer packaged.
