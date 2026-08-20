# Desktop silent-start failure

**Date:** 2026-08-20
**Status:** implemented in source; Windows host reinstall/verification pending
**Symptom:** after the `kaizen://` protocol dialog was gone, launching Kaizen still appeared to do nothing

## Measured fact

The previous shell created the `BrowserWindow` with `show:false`, waited for Next.js and the Intelligence Engine (up to 40 seconds), then called `app.quit()` on any failure. The only disclosure was `console.error`, which `start-kaizen.cmd` never shows. Child-process exit during that wait also called `app.quit()` with no window.

Clicking the shortcut therefore produced no UI: no product window, no error dialog.

## Correction

`packaging/desktop/main.cjs` now:

- opens the native window immediately (`show:true`) with the branded background;
- starts loopback services after the window exists;
- shows `dialog.showErrorBox("Kaizen failed to start", ...)` on pairing, missing runtime, child-exit or load failure;
- writes a redacted `%LOCALAPPDATA%\\Kaizen\\desktop-error.log`;
- does not quit silently while the window has not become ready.

Protocol binding remains `session.fromPartition("persist:kaizen").protocol.handle("kaizen", ...)`. No Java wrapper, cloud, model or Express change is included.

## Remaining evidence

A physical Windows x64 host must install a build that includes this change, launch from the shortcut, and confirm either the product UI or an explicit failure dialog.
