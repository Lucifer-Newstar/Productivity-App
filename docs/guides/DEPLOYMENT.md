# Secure deployment

## Supported topology

```text
HTTPS reverse proxy
 ├── Next.js frontend (required)
 └── Express reference API (optional; private/service use only)
```

The normal frontend does not require Express. Entertainment provider adapters run inside Next.js and use same-origin browser requests.

## Frontend

1. Install with `npm ci`.
2. Configure provider environment values on the server.
3. Run all gates in [`TESTING.md`](TESTING.md).
4. Build with `npm run build`.
5. Serve with `npm run start` behind HTTPS.
6. Preserve headers from `next.config.js`; do not replace them with weaker proxy defaults.

Required headers include CSP, HSTS, frame denial, MIME denial, strict referrer policy, COOP, CORP, Origin-Agent-Cluster and Permissions Policy.

## Express

Do not expose Express without TLS, an API key and explicit origins:

```bash
HOST=0.0.0.0 \
KAIZEN_API_KEY='long-random-secret' \
CORS_ORIGINS='https://kaizen.example.com' \
npm start
```

The reverse proxy must overwrite—not append untrusted—`X-Real-IP` and `X-Forwarded-For`. Multi-instance deployments need shared rate limiting such as Redis or a WAF.

## Important limitations

- Express has no user accounts or row-level authorization.
- Express data is in-memory and disappears on restart.
- Browser state is not encrypted at rest.
- Provider session overrides are not a secrets vault.
- Valid local images can fill browser storage; IndexedDB is the future media-storage target.

## Commercial/provider compliance

- Display the approved local TMDB logo and required non-endorsement text.
- Comic Vine is configured for non-commercial use; review licensing before commercialization.
- Respect provider rate limits, attribution and caching terms.

## Release checklist

- [ ] Clean working tree and reviewed branch diff
- [ ] Correct commit identity
- [ ] Frontend/backend audits clean
- [ ] TypeScript, ESLint and builds pass
- [ ] All domain/security tests pass
- [ ] 39/39 route smoke
- [ ] Provider credentials present only in deployment secrets
- [ ] HTTPS and required headers confirmed externally
- [ ] Backup/restore tested with synthetic data
