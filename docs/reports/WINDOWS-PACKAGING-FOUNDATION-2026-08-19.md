# Windows packaging foundation

**Date:** 2026-08-19
**Status:** implementation complete; physical Windows install/update/uninstall verification pending

## Implemented

- Next.js standalone production output.
- Loopback-package CSP mode that remains eval-free without upgrading local HTTP to unavailable HTTPS.
- Checksum-pinned official Node.js 20.19.0 Windows x64 runtime.
- Portable directory and ZIP builder.
- Per-user Inno Setup installer definition and builder.
- Shared launcher for frontend and deterministic Intelligence Engine.
- Fixed ports, stable browser origin, readiness checks, duplicate/occupied-port refusal and process-state file.
- Stop command and uninstall shutdown hook.
- SHA-256 sidecars for ZIP and installer.
- Static/executable packaging contract QA.
- Bundled privacy-safe verifier covering 39 routes, local CSP, cross-site denial, deterministic Core Today and released ports.

## Frozen runtime contents

```text
Kaizen
├── runtime/node
├── frontend                 Next.js standalone server
├── intelligence             compiled deterministic engine + production dependency
├── scripts/launcher.cjs
├── scripts/stop.cjs
├── start-kaizen.cmd
├── stop-kaizen.cmd
├── VERSION
└── README.txt
```

The Express reference API, model artifacts, evaluation outputs, credentials, user data and build caches are excluded.

## Security decisions

- Services bind only to `127.0.0.1`.
- Ports remain exactly 3000 and 4317 to preserve origin and allowlist contracts.
- The fixed Node archive URL is accompanied by the official SHA-256 value.
- Production dependencies install from lockfiles with lifecycle scripts disabled for the engine staging copy.
- Package artifacts are ignored and never treated as source.
- Browser data remains under the trusted-profile ADR and survives uninstall.

## Remaining release evidence

A real Windows x64 host must still verify:

1. portable build and checksum;
2. installer compilation and checksum;
3. clean install and first launch;
4. engine pairing and Core Today;
5. offline route and local-data behavior;
6. synthetic backup export/restore;
7. update over an existing installation;
8. stop and uninstall behavior;
9. browser records remain intentionally separate;
10. no process or bound port remains after stop/uninstall.

No release artifact is approved until this physical-host matrix passes.
