# Kaizen Reference API

Optional Express 4 service that mirrors Kaizen domain contracts for local development, sync experiments, analytics parity and exports. The normal frontend does not depend on it and browser state remains authoritative.

## Important limitations

- In-memory only; data resets when the process restarts.
- Service-level API key, not multi-user identity or authorization.
- Reference/sync boundary, not a production public database.
- Loopback-only by default.

## Run locally

```bash
cd backend
npm ci
npm run dev
```

Default base URL:

```text
http://127.0.0.1:4000/api
```

Set a local API key when testing protected routes:

```bash
KAIZEN_API_KEY=development-only-secret npm run dev
```

## Production-style local run

```bash
npm run build
KAIZEN_API_KEY=<configure-locally> npm start
```

Do not expose the service directly to a network. Any intentional exposure requires an HTTPS reverse proxy, a strong local secret and an explicit `CORS_ORIGINS` allowlist.

## Surface

- 138 in-memory collection tables
- 12 singleton documents
- Generic CRUD and singleton GET/PUT
- Whole-state sync contract
- Workout, Forge and Health analytics mirrors
- Workout and Health CSV exports
- Public liveness endpoints

Domains:

```text
Core / Notifications
Forge
Career
Workout
Health
Entertainment
```

Complete contracts:

- [`../docs/reference/API.md`](../docs/reference/API.md)
- [`../docs/architecture/SYNC-CONTRACT.md`](../docs/architecture/SYNC-CONTRACT.md)
- [`../docs/reference/ALGORITHMS.md`](../docs/reference/ALGORITHMS.md)

## Security controls

- Loopback binding
- Optional API-key authentication
- Explicit CORS allowlist
- Helmet headers
- Read/write rate limits
- Strict bounded JSON
- Unsafe-key and ID rejection
- Table capacity limits
- Formula-safe CSV

Verification:

```bash
npm run build
KAIZEN_API_KEY=security-test-key npm start
# second terminal
KAIZEN_API_KEY=security-test-key npm run security:test
npm audit --omit=dev
```

See [`../docs/security/SECURITY.md`](../docs/security/SECURITY.md).
