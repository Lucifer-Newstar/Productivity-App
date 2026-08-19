# Update delivery and open-source readiness

**Date:** 2026-08-19
**Status:** implemented locally; CI/CD verification pending

## Update lifecycle

```text
main change
→ Kaizen CI
→ automatic verified candidate setup artifact
→ reviewed annotated release tag
→ gated GitHub Release
→ Electron desktop app starts frontend/engine on dynamic loopback ports
→ packaged app checks fixed official release endpoint
→ system notification
→ user downloads exact setup through local redirect
→ setup stops package services and upgrades existing AppId
→ browser-profile records remain at stable origin
```

The application checks only release metadata. It sends no user records, installation identifier, hostname, username, home path or telemetry. Failure is silent and offline operation continues. Setup download and execution remain user-confirmed.

## Security controls

- Strict stable semantic versions only.
- Fixed `Lucifer-Newstar/Productivity-App` API and release URLs.
- Exact versioned setup asset name.
- Five-second release lookup timeout and one-megabyte response cap.
- Local notification actions only; restored arbitrary schemes are rejected.
- Six-hour check interval and server caching.
- Stable Inno Setup AppId and previous installation directory.
- Existing package processes stopped before file replacement.
- Installer version must equal frontend package version.

## Repository cleanup

- Source tree contains no tracked dependency/build/release-artifact directories.
- Portable distribution was removed; one setup executable remains.
- ISC license is present in source, setup wizard and installed files.
- README, installation, CD, release notes, architecture, testing and release-status documentation are synchronized.
- Historical AI evaluation evidence remains intentionally retained and authorization-closed; it is not packaged.
- Obsolete local packaging branches are removed after this main commit; the remote packaging branch should be deleted after push.

## Remaining release gates

1. push `main` and require Kaizen CI green;
2. confirm automatic candidate Windows Installer run passes;
3. install and personally verify the candidate update path;
4. inspect checksum and both sanitized manifests;
5. explicitly authorize annotated `v1.0.0` tag;
6. verify published assets before announcement.
