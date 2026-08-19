# AI-ADR-019 — Deterministic Core Today routing with interpreter-only generation

**Status:** LOCKED DECISION
**Approved:** 2026-08-19
**Applies to:** v0.1.1 architecture phase
**Supersedes:** no prior ADR

## Context

Wave 0 closed after every tested local candidate failed frozen `W0-GATE-2`. The provider-neutral v0.1 foundation remains valid, but model-selected tool calls are not reliable enough to grant a local model routing authority. The approved v0.1.1 scope is read-only Core Today interpretation only.

Kaizen already computes a deterministic Next Action and exposes a bounded `get_today@1.0` snapshot. Asking a model to rediscover which tool to call adds failure modes without adding product authority. A model may still be useful as an interpreter of already-selected, schema-valid evidence, provided trusted Kaizen code retains routing, tool execution, source validation and final policy control.

## Alternatives considered

1. **Keep model-selected tools.** Rejected for v0.1.1 because Wave 0 measured unreliable or incorrect tool selection; frozen gates will not be weakened.
2. **Remain deterministic/mock-only.** Safe and still available as fallback, but it does not evaluate the narrower interpreter role.
3. **Add more tools/domains.** Rejected because it expands authority before the first bounded interpretation path is validated.
4. **Use a remote provider.** Deferred; remote processing changes the privacy boundary and requires a separate consent/security ADR.
5. **Deterministically select `get_today`, then allow the model to interpret validated evidence.** Selected.

## Decision

For v0.1.1, trusted Kaizen code—not the model—recognizes the fixed `focus-today` intent and selects exactly `get_today@1.0`. The browser Domain Bridge executes that existing read-only tool. The Intelligence Engine validates `core.today@1.0` before creating an interpreter request.

The generation provider receives:

- one fixed capability: `core.today.interpret`;
- validated and bounded `core.today@1.0` evidence;
- KAC-1 and the interpreter prompt/response schema;
- no provider tool definitions;
- no memory, retrieval, Health, write, action or automation context.

The provider may interpret, summarize uncertainty and recommend a focus. It may not select tools, request more context, emit commands, mutate state, replace deterministic analytics or cite IDs absent from the supplied snapshot.

```text
fixed Home focus intent
  → trusted deterministic router
  → get_today@1.0 selected by Kaizen
  → authenticated browser executes bounded read
  → engine validates core.today@1.0
  → provider interprets evidence with zero tools
  → engine validates schema, sources and precedence
  → browser verifies sources and renders
```

Unsupported intents fail closed to deterministic UI behavior. They do not become generic chat and do not trigger a model request.

## Scope lock

Authorized:

- read-only `get_today@1.0`;
- `core.today@1.0` evidence;
- fixed `focus-today` intent;
- interpreter-only structured recommendation;
- deterministic/mock fallback;
- synthetic, adversarial and later candidate evaluation against `V011-INT-GATE-1`.

Not authorized:

- model-selected or model-requested tools;
- additional domain tools or arbitrary questions;
- Health context;
- memory or retrieval;
- writes, proposals, commands or automation;
- background operation;
- remote processing;
- v0.2 capability work.

The existing `get_today` snapshot may contain its already-bounded attention projection. This does not authorize a separate Notifications route or tool; the only evidence contract remains `core.today@1.0`.

## Security and privacy effect

This decision removes model authority from routing and narrows prompt data to one validated snapshot. User-authored titles remain untrusted data and cannot alter route selection or provider policy. Source IDs must be a subset of supplied evidence. Response objects reject additional command/action properties. Prompts, responses and snapshots retain v0.1's no-persistence/no-raw-logging rule.

No remote transfer is authorized. No secret, Health, memory, raw storage, private benchmark artifact or machine identifier enters the request.

## Migration and compatibility

- KAC-1 remains unchanged.
- `get_today@1.0` and `core.today@1.0` remain unchanged.
- Existing gateway, pairing, Domain Bridge and source-verification boundaries remain authoritative.
- The v0.1 model-driven tool round is removed from production orchestration. Provider adapters retain protocol-level compatibility tests, but v0.1.1 cannot silently fall back to model-selected tools.
- W0-GATE-2 remains frozen historical selection evidence and is not replaced or reinterpreted.

The architecture commit contained no runtime change. The subsequent reviewed implementation follows this decision without changing its scope.

## Contract and evaluation updates

- Normative contract: [`../V0.1.1-DETERMINISTIC-ROUTING-CONTRACT.md`](../V0.1.1-DETERMINISTIC-ROUTING-CONTRACT.md)
- Machine-readable types/schemas: `ai/src/contracts/interpreter.ts`
- Frozen gate: [`../V0.1.1-INTERPRETER-EVALUATION.md`](../V0.1.1-INTERPRETER-EVALUATION.md) and `ai/evaluation/v0.1.1/gates.v0.1.1.json`
- Synthetic fixtures: `ai/test/fixtures/v0.1.1-interpreter.json`
- Executable pre-implementation tests: `ai/test/interpreterArchitecture.test.ts`

Implementation may begin only after this architecture/contract/gate/test package is reviewed. Any scope expansion requires a new ADR and new pre-implementation gates.
