# Kaizen Intelligence v0.1 Foundation — 2026-08-17

## Authorization and boundary

The user explicitly authorized full Wave 1 provider-neutral implementation while target model selection remains incomplete. v0.1 is READ / ANALYZE / SUGGEST only. It adds no write tool, automation, Health context, memory/vector store or remote provider.

## Engine

New independent TypeScript workspace under `ai/`:

- Versioned provider/domain/tool/response/protocol contracts
- KAC-1 Constitution and prompt registry
- AJV structured-response/tool-argument validation
- llama.cpp local provider and deterministic test provider
- Capability registry
- Bounded two-pass orchestrator with one `get_today@1.0` call
- Source-ID verification and trusted response projection
- Loopback HTTP gateway and authenticated SSE
- Request cancellation and active-request limits
- One-time pairing, hashed expiring sessions, Origin/Host checks
- Rate/body/depth/unsafe-key controls

## Browser

- Revision-vector tracker with non-reversible fingerprints and short writer lease
- Minimum-context `core.today@1.0` adapter
- Session-only AI token
- Streaming client and fixed same-origin Next.js proxy
- Theme-aware, accessible Home Intelligence panel
- Verified evidence and confidence presentation

## Quality

- Engine: 10 executable tests
- Frontend AI foundation: 11 checks
- Existing CSP/UI/Home suites unchanged and passing
- AI and frontend TypeScript clean
- AI build and frontend production build pass
- Dependency audits report zero known vulnerabilities

## Limitations

The local model remains unselected. The end-to-end release is proven with a deterministic provider; llama.cpp output quality, latency, thermals and target resource limits remain subject to the incomplete Wave 0 report. The first local model should not be presented as selected architecture until that review completes.
