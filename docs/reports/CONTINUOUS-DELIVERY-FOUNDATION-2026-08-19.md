# Continuous delivery foundation

**Date:** 2026-08-19
**Status:** implemented; first tagged release not yet authorized

## Purpose

The Windows Installer workflow now serves as a gated continuous-delivery pipeline. Manual runs produce private artifacts. Green `main` CI refreshes a public rolling `continuous` prerelease after Windows verification, while only an intentional annotated semantic-version tag can publish a stable open-source GitHub Release. This is artifact delivery, not cloud application deployment.

## Release gates

A tagged release requires:

- strict semantic version matching `frontend/package.json`;
- annotated tag provenance;
- tagged commit on `main` history;
- successful push-triggered Kaizen CI on that exact commit;
- tracked-file privacy scan;
- reviewed version-specific release notes;
- pinned Node.js 20.19.0 and Inno Setup 6.7.1;
- successful setup build, silent install, running-process in-place update, packaged runtime verification and silent uninstall;
- sanitized package verification and delivery manifests.

Failure in any gate publishes nothing.

## Distribution and licensing

The repository now includes the ISC License already declared by application package metadata. `docs/releases/v1.0.0.md` provides reviewed user-facing release notes, privacy boundaries and known limitations, including unsigned-installer disclosure.

## Remaining evidence

Before tagging v1.0.0:

1. push this CD implementation to `main`;
2. require main Kaizen CI green on the exact commit;
3. run Windows Installer manually and personally test the downloaded setup;
4. inspect checksum, verification report and delivery manifest;
5. explicitly authorize the annotated v1.0.0 tag.
