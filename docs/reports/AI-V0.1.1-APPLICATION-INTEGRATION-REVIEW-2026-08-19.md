# AI v0.1.1 deterministic application integration review

**Date:** 2026-08-19
**Decision:** deterministic Core Today is the authoritative application AI path
**Governing decision:** AI-ADR-020
**Scope expansion:** none

## Review objective

After Wave 0 and I1 both closed with no selected model, review the actual application composition—not only evaluation documents—and ensure a model cannot remain an accidental default or environment-enabled path.

## Findings before correction

- `loadConfig()` defaulted to `llama` unless `KAIZEN_AI_PROVIDER=mock` was explicitly supplied.
- Application `ProviderRegistry` still had a live llama.cpp branch.
- Legacy `KAIZEN_LLAMA_*` variables remained documented as normal application configuration.
- The deterministic provider advertised native tool calling and retained a legacy model-style tool-call branch even though v0.1.1 routing is trusted code.
- Home copy described an interpreter but did not explicitly disclose that no model was active.

These behaviors conflicted with the accepted no-model baseline even though tests and recommended launch commands used the mock provider.

## Application corrections

### Composition root

`loadConfig()` now:

- defaults to deterministic `mock` with no environment variable;
- accepts only `KAIZEN_AI_PROVIDER=mock` when explicitly provided;
- rejects `KAIZEN_AI_PROVIDER=llama`;
- rejects every legacy `KAIZEN_LLAMA_*` application variable;
- preserves loopback, origin, body, session and concurrency bounds.

`ProviderRegistry` now resolves only `MockGenerationProvider`. It imports no model adapter and has no environment-selected branch.

### Deterministic provider

The accepted provider now:

- advertises `nativeToolCalling: false`;
- rejects requests containing tool definitions, tool-role messages or assistant tool calls;
- consumes only the validated interpreter evidence envelope;
- emits the existing bounded recommendation schema;
- remains local, session-only and non-persistent.

The llama.cpp adapter remains isolated protocol-test/evaluation code. It is not reachable from `server.ts`, `gateway.ts` or the application provider registry.

### Home integration

Home now labels the surface:

```text
DETERMINISTIC · READ ONLY
```

The action is “Review today's focus.” Scope copy states that Core Today and Kaizen's deterministic ranking are used, with no model, remote provider or write path active. The response identifies the deterministic baseline rather than exposing the internal mock provider ID.

## Live default-config acceptance

The engine and frontend were started without `KAIZEN_AI_PROVIDER` or llama settings.

The actual fixed-proxy flow passed:

1. engine startup reported deterministic Core Today mode and model providers disabled;
2. one-time pairing succeeded;
3. `/v1/status` reported `kaizen-mock` with `nativeToolCalling: false`;
4. fixed `focus-today` request succeeded;
5. trusted `get_today@1.0` routing and exact arguments were preserved;
6. deterministic Next Action, source and freshness verification passed;
7. session revocation and clean process shutdown succeeded.

No model runtime, external network request or write path was used.

## Implementation review decision

| Boundary | Result |
|---|---|
| Default application provider | Deterministic |
| Model provider via environment | Rejected |
| Legacy llama environment | Rejected |
| Model adapter in application registry | Absent |
| Provider-native tools | Disabled/rejected |
| Trusted route and browser verification | Preserved |
| Home scope disclosure | Explicit |
| Model/evaluation stages | Closed |
| Additional AI capability | None |

> **APPLICATION INTEGRATION PASS — DETERMINISTIC v0.1.1 IS AUTHORITATIVE.**

## Preserved freezes

- no model evaluation or integration;
- no additional tools/domains;
- no memory or retrieval;
- no Health context;
- no writes or automation;
- no remote provider;
- no v0.2 work.

## Validation summary

```text
AI TypeScript: PASS
AI tests: 24/24 PASS
AI build: PASS
Frontend TypeScript: PASS
Frontend ESLint: PASS
Frontend AI QA: 15/15 PASS
Frontend production build: PASS — 42 generated routes
Live default-config integration: PASS
Live model-provider rejection: PASS
Documentation QA: 48/48 PASS
Source commentary QA: 255/255 PASS
Git diff check: PASS
Staged privacy scan: PASS
```

## Next work

AI capability scope is closed. Continue normal application priorities outside AI scope. Maintenance may improve defects, accessibility, UX clarity, reliability or documentation without introducing new AI authority.