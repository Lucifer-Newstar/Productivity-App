# Windows local installation

## Supported release formats

Kaizen local v1 ships for Windows x64 in two equivalent formats:

- per-user Inno Setup installer;
- portable ZIP.

Both bundle Node.js 20.19.0, the Next.js standalone server and deterministic Intelligence Engine. Neither includes the Express reference API, a model runtime, cloud service, user records or provider credentials.

## Installer

1. Verify the published `.sha256` file.
2. Run `Kaizen-<version>-win-x64-setup.exe` as the intended Windows user.
3. Keep the Kaizen console open while using the application.
4. Use **Stop Kaizen** from the Start Menu before an update or uninstall.

The installer is per-user and does not require administrator privileges.

## Portable ZIP

1. Verify the ZIP checksum and extract it to a local folder.
2. Run `start-kaizen.cmd`.
3. Keep the console open while using Kaizen at `http://127.0.0.1:3000`.
4. Run `stop-kaizen.cmd` before moving or deleting the folder.

Do not launch Kaizen from an untrusted/shared Windows account or browser profile.

## Data and uninstall behavior

Product records remain in the browser profile under the stable loopback origin `http://127.0.0.1:3000`. They are not stored in the installation directory and are not encrypted by Kaizen. Uninstalling the application does not erase browser records.

Before an update, uninstall or browser-profile change:

1. open **Local data recovery**;
2. export a whole-product backup;
3. store it in an encrypted user-controlled location;
4. test restore only with synthetic/non-sensitive data during release verification.

## Runtime behavior

The launcher reserves these loopback-only ports:

- `127.0.0.1:3000` — Next.js application;
- `127.0.0.1:4317` — deterministic Intelligence Engine.

Startup fails rather than selecting another port if either is occupied. This preserves the browser storage origin and exact security allowlists. The console displays the one-time local pairing code; it is never written to release reports.

## Offline scope

Core personal tracking, backup/recovery and deterministic Core Today work offline. Entertainment metadata search/trending/detail features require network access and optional locally configured provider credentials. No remote AI provider is used.

## Build commands

From Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File packaging/windows/build-portable.ps1 -Version 1.0.0
powershell -ExecutionPolicy Bypass -File packaging/windows/build-installer.ps1 -Version 1.0.0
```

Inno Setup 6 is required only to compile the installer. Build outputs and downloaded runtimes remain under ignored `release-artifacts/`.
