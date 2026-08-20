# Desktop error log path

**Date:** 2026-08-20
**Status:** implemented in source
**Path:** `%LOCALAPPDATA%\Kaizen\desktop-error.log`

## Measured fact

A stuck launch wrote `%LOCALAPPDATA%\Kaizen\runtime.json` without `desktopReady` and without `desktop-error.log`. The previous writer only ran inside `fail()`, and `fail()` was not invoked when `loadURL("kaizen://app/")` hung after services started.

## Correction

`packaging/desktop/main.cjs` now:

- resolves the log with `path.join(LOCALAPPDATA or TEMP, "Kaizen", "desktop-error.log")`;
- appends redacted lines (does not overwrite);
- writes that file from `fail()`;
- treats a 20-second `kaizen://app` load timeout as a failure so the log is created for the hang that previously left only `runtime.json`.

Pairing codes and profile paths remain redacted. No model, cloud or Express change is included.
