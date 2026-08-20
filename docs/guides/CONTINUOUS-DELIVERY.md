# Continuous delivery

Kaizen continuous delivery produces verified Windows artifacts and can publish an open-source GitHub Release. It does not deploy the application to cloud infrastructure.

## Delivery modes

### Automatic stable release after main CI

A successful push-triggered **Kaizen CI** run on `main` automatically starts Windows Installer against that exact commit. It builds, installs, exercises a running in-place update, verifies, uninstalls and then publishes a stable GitHub Release. CD authenticates `gh release list` with `GH_TOKEN` from `github.token`, reads the highest existing stable release and increments its patch number: for example, `v1.0.1` becomes `v1.0.2`. The installer and packaged app both use that immutable version. It is artifact delivery, not cloud application deployment.

### Manual artifact

Run **Windows Installer** through `workflow_dispatch`. This validates the requested semantic version, scans tracked files for privacy violations, builds and installs the setup executable, runs packaged verification, uninstalls it and uploads a 14-day Actions artifact.

Manual delivery never runs the publication job and never creates or changes a GitHub Release.

### Stable-release guarantees

Only successful push-triggered CI runs from `main` can publish. Publication is serialized, so concurrent CI completions receive distinct patch numbers. The Windows job requires build, silent install, launch, in-place setup update with process shutdown, sanitized verification and silent uninstall to pass. Only after those gates does CD create and push an annotated immutable `vMAJOR.MINOR.PATCH` tag and its GitHub Release.

## GitHub Releases versus Packages

The Windows setup is distributed as a GitHub Release asset. GitHub Packages supports package ecosystems such as npm, Maven, NuGet and containers; publishing the installer as a fake npm/NuGet package would be misleading and would not improve updates. GitHub automatically provides source archives with each release, while the verified setup, checksum and manifests remain canonical release assets.

## Delivered files

```text
Kaizen-<version>-win-x64-setup.exe
Kaizen-<version>-win-x64-setup.exe.sha256
package-verification.json
release-manifest.json
```

Both JSON files use `PUBLIC-SANITIZED-AGGREGATE` classification. The delivery manifest records release version, commit, pinned build/runtime versions, Authenticode status and install/verify/uninstall result. It contains no runner username, home path, hostname, pairing code, personal record or raw service log.

## First release procedure

1. Keep `main` clean and pull latest changes.
2. Push `main` and require all Kaizen CI jobs to pass on the exact commit.
3. Confirm **Validate delivery gate**, **Build and verify Windows setup**, and **Publish stable patch release** pass.
4. Confirm release assets and checksums are present before announcing the release.

## Failure behavior

A failed gate publishes nothing. Correct the failure on `main` and wait for green CI; the next successful commit receives the next patch version. Published tags are never moved or reused.

## Unsigned installer disclosure

The pipeline reports Authenticode status but does not fabricate a signature. Until a code-signing certificate is configured, users may receive an unknown-publisher or SmartScreen warning. Signing can be added later using protected repository secrets and must never expose certificate material in logs or artifacts.
