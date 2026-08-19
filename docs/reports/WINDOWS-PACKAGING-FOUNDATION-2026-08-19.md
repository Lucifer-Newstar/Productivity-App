# Windows packaging foundation

**Date:** 2026-08-19
**Status:** implementation corrected after run-1 install-root failure; Windows rerun pending

## Implemented

- Next.js standalone production output.
- Loopback-package CSP mode that remains eval-free without upgrading local HTTP to unavailable HTTPS.
- Checksum-pinned official Node.js 20.19.0 Windows x64 runtime.
- Internal runtime staging builder.
- One per-user Inno Setup executable containing the complete application.
- Registered Windows uninstaller plus branded desktop, Start Menu, verification and uninstall entries.
- Pinned Electron 43.4.1 native desktop shell for frontend and deterministic Intelligence Engine.
- Dynamic loopback ports, stable `kaizen://app` origin, readiness checks, single-instance behavior and process-state file.
- Stop command and uninstall shutdown hook.
- SHA-256 sidecar for the single installer.
- Static/executable packaging contract QA.
- Bundled privacy-safe verifier covering 39 routes, local CSP, cross-site denial, deterministic Core Today and released ports.
- GitHub Windows workflow for build, silent install, packaged verification, silent uninstall and artifact upload.
- Release publication only on an intentional `v*` tag; manual runs create private workflow artifacts without publishing a release.

## Frozen runtime contents

```text
Kaizen
├── desktop                  Electron runtime + native shell main process
├── runtime/node             pinned child-service Node runtime
├── frontend                 Next.js standalone server
├── intelligence             compiled deterministic engine + production dependency
├── scripts/stop.cjs
├── start-kaizen.cmd
├── stop-kaizen.cmd
├── VERSION
└── README.txt
```

The Express reference API, model artifacts, evaluation outputs, credentials, user data and build caches are excluded.

## Security decisions

- Services bind only to `127.0.0.1`.
- The desktop shell allocates available ephemeral loopback ports and preserves storage at stable private origin `kaizen://app`.
- The fixed Node archive URL is accompanied by the official SHA-256 value.
- Production dependencies install from lockfiles with lifecycle scripts disabled for the engine staging copy.
- Package artifacts are ignored and never treated as source.
- Browser data remains under the trusted-profile ADR and survives uninstall.

## Remaining release evidence

A real Windows x64 host must still verify:

1. installer staging and compilation;
2. setup executable checksum and signature readiness;
3. clean install and first launch;
4. engine pairing and Core Today;
5. offline route and local-data behavior;
6. synthetic backup export/restore;
7. update over an existing installation;
8. stop and uninstall behavior;
9. browser records remain intentionally separate;
10. no process or bound port remains after stop/uninstall.

No release artifact is approved until this physical-host matrix passes.
