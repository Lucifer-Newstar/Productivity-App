# Local release topology

## Supported v1 topology

```text
Windows/local machine
 ├── Next.js application
 │    ├── browser-authoritative local persistence
 │    └── optional Entertainment provider BFF routes
 └── deterministic Intelligence Engine on loopback
```

ADR-012 excludes the Express reference API from the packaged local v1 runtime. The frontend consumes zero Express endpoints, and the service is in-memory development/reference code.

Cloud deployment, multi-user hosting and public network exposure are not part of the current release phase.

## Application requirements

1. Install from lockfiles with Node 20.9+.
2. Configure optional Entertainment provider credentials in local server environment only.
3. Run all gates in [`TESTING.md`](TESTING.md).
4. Build the frontend and deterministic engine.
5. Bind the Intelligence Engine to loopback only.
6. Preserve security headers from `next.config.js`.
7. Verify browser backup/restore before packaging.

The application remains usable without Entertainment provider credentials. Deterministic Intelligence requires the local engine/pairing flow but no model runtime.

## Express reference API

Express may be run manually for development/security testing. It is not product persistence, synchronization or backup.

- Default bind is `127.0.0.1`.
- Non-loopback bind now refuses startup without `KAIZEN_API_KEY`.
- Data disappears on restart.
- No user identity or row-level authorization exists.

Do not package or auto-start Express for v1. Any future durable backend requires a new architecture decision.

## Important limitations

- Browser state is currently unencrypted at rest.
- localStorage is synchronous and finite.
- Provider session overrides are not a secrets vault.
- Valid local images can fill browser storage.
- Whole-product backup/corruption recovery remains a release gate.

## Provider compliance

- Display the approved local TMDB logo and required non-endorsement text.
- Comic Vine is configured for non-commercial use; review licensing before commercialization.
- Respect provider rate limits, attribution and caching terms.

## Release checklist

- [ ] Hosted CI checks green
- [ ] P0/P1 completion backlog resolved or explicitly accepted
- [ ] Frontend and deterministic engine builds pass
- [ ] All domain/security/integration tests pass
- [ ] 39 user routes verified
- [ ] No model/provider stage is reachable
- [ ] Fresh profile has no fabricated personal history
- [ ] Whole-product backup/restore passes with synthetic data
- [ ] Sensitive localStorage risk accepted or replaced
- [x] Windows installer and portable packaging implementation
- [ ] Physical Windows install/update/uninstall and offline operation verified

Build and installation instructions: [`WINDOWS-INSTALLATION.md`](WINDOWS-INSTALLATION.md).
