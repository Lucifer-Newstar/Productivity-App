# AI-ADR-020 — Deterministic-only application provider after no-model closure

**Status:** LOCKED DECISION
**Approved:** 2026-08-19
**Applies to:** v0.1.1 application composition
**Supersedes:** configurable model selection in the current application composition root; provider interfaces remain

## Context

Wave 0 closed with no selected model. The narrower I1 interpreter cycle then rejected Qwen3 and Phi at preflight and closed every model stage. The user accepted deterministic/mock v0.1.1 as the authoritative AI path and prohibited further model evaluation or scope expansion.

Despite that decision, application configuration still defaulted to llama.cpp unless `KAIZEN_AI_PROVIDER=mock` was supplied. `ProviderRegistry` retained a live model branch, legacy llama environment variables were documented, and the deterministic provider advertised native tool calling. This left an accidental runtime path inconsistent with the reviewed model decisions.

## Alternatives considered

1. **Keep llama.cpp configurable but document that it is unsupported.** Rejected because an environment variable would still bypass the accepted application boundary.
2. **Delete all provider/model adapter contracts.** Rejected because protocol tests and historical evaluation reproducibility remain useful, and provider neutrality should not be discarded.
3. **Lock application composition to deterministic while retaining isolated adapter/evaluation code.** Selected.
4. **Start another local or remote model phase.** Rejected as outside the explicitly closed scope.

## Decision

The v0.1.1 application composition root resolves only the deterministic Core Today provider.

- No environment variable selects a model provider.
- `KAIZEN_AI_PROVIDER` defaults to `mock` and rejects every other value.
- All `KAIZEN_LLAMA_*` application variables fail startup validation.
- Application `ProviderRegistry` imports and constructs only `MockGenerationProvider`.
- The deterministic provider advertises no native tool calling and rejects tool-bearing requests.
- Home identifies the experience as deterministic, read-only and no-model.
- `LlamaCppProvider` remains isolated protocol-test/evaluation code and cannot be reached from server/gateway composition.

This decision does not add capability. It makes the runtime match the accepted no-model evidence.

## Security and privacy effect

The decision removes an unapproved model execution path and prevents stale local environment settings from silently activating a provider. It preserves loopback, pairing, minimum-context, source, freshness and no-persistence controls. No new data class, network destination or consent boundary is introduced.

## Migration and compatibility

- Existing deterministic launch commands no longer require `KAIZEN_AI_PROVIDER=mock`.
- A stale `KAIZEN_AI_PROVIDER=llama` or `KAIZEN_LLAMA_*` setting now causes an explicit startup error and must be removed.
- Gateway, frontend proxy, pairing protocol, Domain Bridge and response contracts are unchanged.
- Historical model harnesses remain reproducible but all execution stages are authorization-closed.

## Evaluation and acceptance

Required regression evidence:

- configuration defaults to deterministic;
- model and legacy llama settings fail closed;
- registry has no model adapter branch;
- deterministic provider has zero tool authority;
- frontend discloses deterministic/read-only/no-model scope;
- default-config live proxy/SSE/source flow passes;
- model-provider startup rejection passes;
- existing contract, adversarial, documentation and privacy suites remain green.

Evidence is recorded in [`../../reports/AI-V0.1.1-APPLICATION-INTEGRATION-REVIEW-2026-08-19.md`](../../reports/AI-V0.1.1-APPLICATION-INTEGRATION-REVIEW-2026-08-19.md).

## Change rule

Reintroducing any model provider, model-selecting configuration or remote provider requires a new ADR and explicit authorization. It cannot be achieved through local environment changes alone.