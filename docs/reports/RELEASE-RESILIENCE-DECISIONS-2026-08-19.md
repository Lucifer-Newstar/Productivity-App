# Release resilience and local security decisions

**Date:** 2026-08-19
**Backlog items:** APP-108, APP-110, APP-112, APP-113

## Trusted local profile

ADR-013 accepts unencrypted browser persistence for the single-user local v1 release. The OS account and trusted browser profile are the at-rest boundary. Kaizen does not claim encryption; users must protect the device/profile and store exported backups in encrypted user-controlled storage.

This acceptance remains subject to Windows/local packaging and offline verification after merge.

## Route recovery

Added App Router loading/error boundaries and a Pages Router fallback. Recovery copy states that local records are not intentionally cleared, offers retry/Home actions and links storage problems to Data recovery.

## Home navigation history

Home section changes now update `?view=` through the App Router. Search-param changes drive the rendered section, allowing deep links and browser Back/Forward traversal while preserving directional transitions.

## Health terminology

The `/health/sync` route remains for compatibility, but navigation now labels it **Profile** with “Profile & workout bridge” description. It is not server synchronization.

## Validation

`npm run qa:resilience` verifies query history, search-param handling, App/Pages error boundaries, corruption write blocking and recovery integration. TypeScript, ESLint and production build remain required in CI.