# Desktop flash-close on shortcut launch

**Date:** 2026-08-20
**Status:** implemented in source; Windows host reinstall/verification pending
**Symptom:** desktop shortcut opened a window for a split second, then closed

## Measured fact

After the window was shown, any Intelligence Engine or frontend child exit called `app.quit()`. Startup failures also called `app.quit()` immediately after `dialog.showErrorBox`. On Windows that closes the new window before the user can read an error.

## Correction

`packaging/desktop/main.cjs` no longer quits the process on startup or child-service failure. It stops the failed services, keeps the native window open, and loads a redacted in-window **Kaizen failed to start** page. The user closes that window. `window-all-closed` still owns normal shutdown.

## Remaining evidence

Install a build that includes this change and confirm a failed launch leaves a readable window rather than a flash close.
