# Desktop protocol session binding

**Date:** 2026-08-20
**Status:** implemented in source; Windows host reinstall/verification pending
**Symptom:** installed Kaizen did not show the product UI and Windows reported that the PC does not have an app that can open the link

## Measured fact

The native shell loads `kaizen://app/` inside a `BrowserWindow` whose `webPreferences.partition` is `persist:kaizen`. The previous handler was registered with the default `protocol.handle("kaizen", ...)`, which applies only to the default session.

Chromium therefore treated `kaizen://` as an unknown OS protocol. Windows 11 surfaces that as “Your PC doesn’t have an app that can open this link” instead of forwarding the request to the loopback Next.js server.

`kaizen://` is intentionally not registered as a Windows URL protocol. Shortcuts already launch `desktop\electron.exe` with `desktop\main.cjs`.

## Correction

`packaging/desktop/main.cjs` now binds the handler to the same partition the window uses:

```text
session.fromPartition("persist:kaizen").protocol.handle("kaizen", ...)
```

Privileged-scheme registration before `app.ready` is unchanged. Host `app` remains the only accepted custom-protocol host. Pairing still stays in memory.

Packaging QA now asserts the session-scoped handler and rejects a default-session `protocol.handle("kaizen"` registration.

## Remaining evidence

A physical Windows x64 host must still:

1. install a build that includes this change;
2. launch from Start Menu/desktop shortcut;
3. confirm the native window renders product routes instead of the protocol dialog;
4. confirm closing the window still stops both loopback services.

No model, cloud, Express, or origin-policy change is included.
