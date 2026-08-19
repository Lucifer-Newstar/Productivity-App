# Local release data authority and reference API hardening

**Date:** 2026-08-19
**Backlog items:** APP-004, APP-107
**Decision:** ADR-012

## Data authority

The local v1 release remains browser-authoritative. React Context plus versioned `kaizen.*` persistence is the sole product-data source of truth.

The Express service is not packaged as application persistence because:

- the frontend consumes zero Express data endpoints;
- the service is in-memory and loses state on restart;
- it has no user identity, migrations, conflicts or domain-schema guarantees;
- wiring it now would create a false and less-durable sync path.

Express remains buildable/testable reference code for future architecture work. Any durable backend requires a new ADR.

## Release consequences

Browser-only authority does not mean durability work is finished. Before release:

- APP-106 must provide corruption/hydration recovery;
- APP-109 must prove whole-product backup/restore across every authoritative key;
- APP-108 must explicitly accept or replace unencrypted sensitive localStorage;
- deployment docs must not claim server synchronization.

## Reference API hardening

Non-loopback Express binding now fails before `listen()` unless `KAIZEN_API_KEY` is configured. The previous warning-only behavior was not a sufficient security boundary.

Added `npm run security:startup`, which spawns the built server with `HOST=0.0.0.0` and no key, verifies non-zero exit and confirms the bounded configuration error. Backend CI runs this before the authenticated 13-check smoke.

## Scope

No frontend API dependency, database, cloud service, identity system or synchronization behavior was added. This is a release-authority decision and fail-closed security correction.