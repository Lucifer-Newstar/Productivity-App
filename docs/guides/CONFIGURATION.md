# Configuration reference

## Frontend server environment

Create `frontend/.env.local` from `frontend/.env.example`. Never commit real values and never prefix secrets with `NEXT_PUBLIC_`.

| Variable | Required for | Notes |
|---|---|---|
| `MAL_CLIENT_ID` | Anime search, ranking and refresh | MyAnimeList application client ID |
| `TMDB_ACCESS_TOKEN` | Movie/TV search, trending and refresh | Read-access bearer token |
| `GOOGLE_BOOKS_API_KEY` | Primary book search | Open Library is the no-key fallback |
| `COMICVINE_API_KEY` | Western comic search/discovery | Non-commercial terms and strict quotas |
| `NYT_BOOKS_API_KEY` | Book bestseller discovery | Not used for general search |

AFTERGLOW also supports temporary tab-session overrides in Providers & Credits. They are sent as same-origin headers and are not exported, but server variables remain safer.

## Express environment

| Variable | Default | Purpose |
|---|---:|---|
| `HOST` | `127.0.0.1` | Bind interface |
| `PORT` | `4000` | HTTP port |
| `KAIZEN_API_KEY` | unset | Protect all non-liveness routes; required when `HOST` is non-loopback |
| `CORS_ORIGINS` | localhost origins | Comma-separated browser allowlist |
| `JSON_LIMIT` | `5mb` | Strict JSON body limit |
| `RATE_LIMIT` | `300` / 15 min | General API limit |
| `WRITE_RATE_LIMIT` | `120` / 15 min | Mutation limit |
| `MAX_ROWS_PER_TABLE` | `20000` | Per-table in-memory capacity |

## Intelligence Engine v0.1.1 deterministic baseline

Engine environment (`ai/`):

| Variable | Default | Purpose |
|---|---|---|
| `KAIZEN_AI_HOST` | `127.0.0.1` | Loopback bind; non-loopback values are rejected |
| `KAIZEN_AI_PORT` | `4317` | Local engine port |
| `KAIZEN_AI_ORIGINS` | localhost frontend origins | Exact comma-separated browser origins |
| `KAIZEN_AI_PROVIDER` | `mock` | Optional explicit value; any model provider value is rejected |
| `KAIZEN_AI_PAIRING_TTL_MS` | 5 minutes | One-time code validity |
| `KAIZEN_AI_SESSION_TTL_MS` | 30 minutes | Browser session-token validity |
| `KAIZEN_AI_REQUEST_TIMEOUT_MS` | 120 seconds | Engine generation/tool deadline |
| `KAIZEN_AI_MAX_BODY_BYTES` | 1,000,000 | Gateway request ceiling |
| `KAIZEN_AI_MAX_ACTIVE_REQUESTS` | `1` | Bounded local concurrency |

Frontend server environment:

| Variable | Default | Purpose |
|---|---|---|
| `KAIZEN_AI_GATEWAY_URL` | `http://127.0.0.1:4317` | Server-side fixed proxy target; loopback HTTP only |
| `KAIZEN_AI_PROXY_ORIGIN` | `http://localhost:3000` | Fixed trusted origin forwarded after same-host browser validation; include it in engine origin allowlist |
| `NEXT_PUBLIC_KAIZEN_AI_URL` | `/api/ai` | Optional browser base override; keep same-origin in production |

Application runtime is locked to the deterministic provider. `KAIZEN_AI_PROVIDER=llama` and all `KAIZEN_LLAMA_*` variables fail closed because no model is approved. The llama.cpp adapter remains protocol-test/evaluation code only and is unreachable through `ProviderRegistry`. Never put pairing codes/session tokens into environment files, URLs or documentation.

## Browser preferences

- `kaizen.theme` — dark/light global preference.
- `EntertainmentState.settings.language` — `en`, `ta` or `hi`.
- Health, Workout and Forge settings live inside their own persisted slices.

## Provider locale behavior

- English → `en-US` for TMDB, `en` for Google Books.
- Tamil → `ta-IN` / `ta`.
- Hindi → `hi-IN` / `hi`.
- Invalid locale values fall back to English.
- Provider caches include language in their keys.

## Secrets policy

- Never add credentials to source, docs, fixtures, screenshots or exports.
- Never expose secrets through `NEXT_PUBLIC_*`.
- Prefer restricted provider keys and rotate leaked values.
- API errors must not echo keys or complete upstream URLs.
