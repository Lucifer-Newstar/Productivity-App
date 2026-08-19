# Native desktop shell

**Date:** 2026-08-19
**Status:** implemented; Windows workflow verification pending

## Outcome

The final Windows setup opens Kaizen in a pinned Electron 43.4.1 `BrowserWindow` rather than the user's default browser. The shell starts the standalone frontend and deterministic Intelligence Engine on available ephemeral loopback ports, maps them behind stable `kaizen://app`, automatically brokers the one-time local pairing code in memory, and terminates both child process trees when the final window closes.

## Security

- `nodeIntegration: false`
- `contextIsolation: true`
- renderer sandbox enabled
- web security enabled
- persistent partition fixed to `persist:kaizen`
- external window/navigation denied except reviewed official GitHub repository links
- protocol requests accepted only for host `app`
- browser Origin/Host transport headers removed before internal loopback forwarding
- no pairing code in renderer storage, files or release reports
- child process logs redacted before any failure disclosure

## Storage migration

The former browser candidate used an HTTP browser origin. The desktop shell uses a separate Electron profile and stable custom origin. Automatic copying from arbitrary browser profiles is intentionally prohibited. Existing candidate users export the whole-product backup once and restore it in the desktop app. Future installer updates preserve the desktop profile.

## Remaining physical evidence

- native window displays all product spaces;
- startup succeeds while conventional ports 3000 and 4317 are occupied;
- automatic deterministic pairing completes;
- window close releases both assigned ports and leaves no child process;
- same-AppId setup update stops/replaces a running desktop build;
- backup migration and subsequent setup update preserve desktop data.
