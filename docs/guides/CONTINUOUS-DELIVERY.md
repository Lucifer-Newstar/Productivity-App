# Continuous delivery

Kaizen continuous delivery produces verified Windows artifacts and can publish an open-source GitHub Release. It does not deploy the application to cloud infrastructure.

## Delivery modes

### Automatic candidate after main CI

A successful push-triggered **Kaizen CI** run on `main` automatically starts Windows Installer against that exact commit. It builds, installs, verifies, uninstalls and uploads a 14-day candidate artifact. This is continuous delivery evidence, not a public release and not a cloud deployment.

### Manual artifact

Run **Windows Installer** through `workflow_dispatch`. This validates the requested semantic version, scans tracked files for privacy violations, builds and installs the setup executable, runs packaged verification, uninstalls it and uploads a 14-day Actions artifact.

Manual delivery never runs the publish job and never creates a GitHub Release.

### Tagged open-source release

An annotated `vMAJOR.MINOR.PATCH` tag activates publication. Before building, the delivery gate requires:

1. semantic tag version equals `frontend/package.json`;
2. tag object is annotated;
3. tagged commit belongs to `main` history;
4. exact tagged commit already has a successful push-triggered Kaizen CI run;
5. tracked-file privacy scan passes;
6. reviewed `docs/releases/<tag>.md` exists.

The Windows job then requires build, silent install, launch, in-place setup update with process shutdown, sanitized verification and silent uninstall to pass. Only after those gates does the publish job create the GitHub Release.

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
2. Set `frontend/package.json` version and reviewed release notes.
3. Push `main` and require all Kaizen CI jobs to pass on the exact commit.
4. Run the Windows Installer workflow manually and test its downloaded setup personally.
5. Create an annotated tag:

   ```bash
   git tag -a v1.0.0 -m "Kaizen v1.0.0"
   git push origin v1.0.0
   ```

6. Confirm **Validate delivery gate**, **Build and verify Windows setup**, and **Publish open-source release** pass.
7. Confirm release assets and checksums are present before announcing the release.

## Failure behavior

A failed gate publishes nothing. Correct the failure on `main`, wait for green CI, delete an unpublished local/remote tag if necessary, and create a new tag only after reviewing the corrected commit. Never move a tag after a GitHub Release has been published; use a new patch version instead.

## Unsigned installer disclosure

The pipeline reports Authenticode status but does not fabricate a signature. Until a code-signing certificate is configured, users may receive an unknown-publisher or SmartScreen warning. Signing can be added later using protected repository secrets and must never expose certificate material in logs or artifacts.
