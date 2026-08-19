# Windows local installation

## Release format

Kaizen local v1 ships as one Windows x64 setup executable:

```text
Kaizen-1.0.0-win-x64-setup.exe
```

The installer bundles Node.js 20.19.0, the Next.js standalone server and deterministic Intelligence Engine. It does not include the Express reference API, a model runtime, cloud service, credentials or user records.

## Install

1. Verify the setup executable against its published `.sha256` file.
2. Run the setup executable as the intended Windows user.
3. Optionally allow setup to create the desktop shortcut.
4. Launch **Kaizen** from the desktop or Start Menu.
5. Keep the Kaizen console open while using the application; closing it stops the local runtime.

The installer is per-user and does not require administrator privileges.

## Installed entries

Setup creates a Kaizen Start Menu group containing:

- **Kaizen**;
- **Stop Kaizen**;
- **Verify Kaizen installation**;
- **Uninstall Kaizen**.

The same professional Kaizen icon is used by setup, Windows Apps, Start Menu and the optional desktop shortcut.

## Updates

Updater-enabled packaged builds check the official Kaizen GitHub Releases channel shortly after startup and every six hours while open. If a newer stable version is available, the global notification inbox shows **Download update**. Any installer built before this update feature was added must be manually replaced once with the final updater-enabled v1.0.0 setup; later releases can notify normally.

1. Export a backup before a significant update.
2. Select **Download update** to retrieve the exact official setup executable.
3. Run **Stop Kaizen** or close the Kaizen console.
4. Run the downloaded setup executable.
5. Setup detects the stable Kaizen `AppId`, reuses the existing install directory, stops any remaining package processes and upgrades installed files.
6. Launch Kaizen and run **Verify Kaizen installation**.

The update does not move or delete browser-profile records. Kaizen never silently downloads or executes setup and sends no personal records or telemetry during the release check. Offline use continues normally when the check is unavailable.

## Uninstall

Use **Uninstall Kaizen** from the Start Menu or Windows **Settings → Apps → Installed apps**. The uninstaller first stops the package-owned local services and then removes installed runtime files and shortcuts.

Product records remain in the browser profile under `http://127.0.0.1:3000`; uninstall intentionally does not erase them. Export a whole-product backup before uninstalling, changing browsers or deleting the browser profile.

## Data boundary

Browser records are not stored in the installation directory and are not encrypted by Kaizen. Do not use Kaizen in an untrusted/shared Windows account or browser profile. Store exported backups in an encrypted user-controlled location.

## Runtime behavior

The launcher reserves:

- `127.0.0.1:3000` — Next.js application;
- `127.0.0.1:4317` — deterministic Intelligence Engine.

Startup fails rather than selecting another port if either is occupied. This preserves the browser storage origin and exact security allowlists. The console displays the one-time local pairing code; it is never written to release reports.

## Packaged verification

With Kaizen stopped, run **Verify Kaizen installation**. It checks:

- required package layout and Express exclusion;
- all 39 user routes;
- eval-free loopback production CSP;
- cross-site pairing denial;
- deterministic provider identity;
- complete synthetic Core Today request/tool/SSE/source flow;
- shutdown and release of ports 3000 and 4317.

It writes `package-verification.json` containing only `PUBLIC-SANITIZED-AGGREGATE` results. Pairing codes and raw service logs are never written to that report.

## Offline scope

Core personal tracking, backup/recovery and deterministic Core Today work offline. Entertainment metadata provider features require network access and optional locally configured credentials. No remote AI provider is used.

## Build options

### GitHub Actions

Run the **Windows Installer** workflow manually with version `1.0.0`. Its Windows runner builds the setup executable, silently installs it, runs packaged verification, silently uninstalls it, and uploads the setup, checksum and sanitized verification report as one workflow artifact.

A normal branch push runs correctness CI but does not publish a release. Pushing an intentional annotated semantic version tag such as `v1.0.0` runs the same Windows verification and then creates an open-source GitHub Release containing the verified files. The complete provenance and failure rules are in [`CONTINUOUS-DELIVERY.md`](CONTINUOUS-DELIVERY.md).

### Local Windows build

Install Inno Setup 6, then run:

```powershell
powershell -ExecutionPolicy Bypass -File packaging/windows/build-installer.ps1 -Version 1.0.0
```

The setup executable and checksum are written to ignored `release-artifacts/`. The staged directory is only an installer build input and is not a public portable release.
