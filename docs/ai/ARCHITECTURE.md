# Intelligence Engine architecture

## System boundary

**LOCKED DECISION**

```text
Kaizen Web (browser authority)
  ├── React Context + local persistence
  ├── Domain Adapters
  ├── Client Tool Executor
  ├── Consent/approval UI
  └── Intelligence UI
          │ loopback session transport
          ▼
Kaizen Intelligence Engine (independent process)
  ├── Gateway and session controller
  ├── Context Orchestrator
  ├── Agent and tool planner
  ├── Policy/response validation
  ├── Memory and retrieval abstractions
  ├── Provider registry
  └── Evaluation/telemetry hooks
          │
          ▼
Local inference runtime (initially evaluated with llama.cpp)
  ├── generation model
  └── embedding model/runtime (may differ)
```

The existing Express service remains a reference API. It does not become authoritative merely because the Intelligence Engine exists.

## Independence requirements

- Independently runnable and testable process
- No import from React components, React Context or Next.js server internals
- Stable versioned wire contracts
- Provider/runtime replaceable behind interfaces
- Loopback binding by default
- Frontend remains fully functional without the engine
- Engine failure never corrupts Kaizen state

## Major components

### Gateway

Authenticates the local client session, validates request envelopes, applies rate/context/output budgets, starts or cancels sessions and normalizes errors.

### Context Orchestrator

Routes intent to domains, requests relevant tool data, retrieves memories/documents, includes deterministic analytics, applies consent and token budgets, and serializes trust-labeled context.

For the implemented v0.1.1 slice, [AI-ADR-019](adrs/AI-ADR-019-DETERMINISTIC-CORE-TODAY-ROUTING.md) narrows this general architecture: trusted code recognizes only `focus-today`, selects `get_today@1.0`, validates bounded/fresh `core.today@1.0`, and sends the provider evidence without tool definitions. The browser independently verifies tool arguments, sources and revision freshness. Memory, retrieval and additional domains remain unavailable.

### Agent

Runs a bounded observe/reason/tool/observe loop. It cannot execute arbitrary code or access Kaizen state except through registered tools. This general loop is not active for v0.1.1 interpreter requests: the provider receives one validated evidence envelope, emits one structured recommendation, and has zero tool rounds.

### Policy layer

Checks tool permission, consent, domain sensitivity, argument schema, source existence and future action authorization. Hard policy outranks prompts.

### Memory/retrieval

Stores AI-specific memories separately from Kaizen domain state. Retrieval combines structured, lexical, semantic, recency and relationship signals.

### Provider registry

The provider contract remains replaceable, but the current application composition root resolves only the accepted deterministic provider. Model configuration fails closed after both local evaluation cycles selected no model. The llama.cpp adapter remains test/evaluation-only code; LOCAL model, HYBRID and REMOTE application modes require future explicit review.

## Transport and session flow

**PROPOSED DECISION:** loopback HTTP for setup/requests and Server-Sent Events for streamed model/session events. Bidirectional tool requests can use correlated HTTP callbacks from the browser client. A Wave 0 spike must compare this with WebSocket.

```text
1. Browser opens authenticated local session.
2. Browser submits intent plus allowed-domain manifest; not full state.
3. Engine requests typed tools as needed.
4. Browser validates and executes reads against a snapshot.
5. Engine returns progress events and final validated response.
6. Browser verifies source references and renders result.
```

Suggested event families:

```text
session.started
context.requested
tool.requested
tool.completed
generation.delta
response.completed
session.failed
session.cancelled
```

Private model reasoning is never transported. Progress events describe operations, not chain-of-thought.

## Local process lifecycle

**REQUIRES TECHNICAL SPIKE:** compare an independently launched service with an app-managed child process on the target Windows laptop.

Regardless of selection, the lifecycle contract must provide explicit `offline`, `starting`, `loading-model`, `ready`, `busy` and `failed` states; prevent duplicate engines; support cancellation; detect crashes; define idle unload/shutdown; and prevent orphan model processes. Closing a browser tab must have documented behavior and must not imply shutdown unless acknowledged by the engine. The spike records RAM/VRAM release after cancel, unload, tab close and process exit.

User-facing state is defined in [UX-CONTRACTS.md](UX-CONTRACTS.md#engine-lifecycle-presentation).

## Failure behavior

| Failure | Required behavior |
|---|---|
| Engine unavailable | Deterministic UI remains operational; show setup/status state. |
| Model timeout | Cancel runtime request; return bounded error and fallback option. |
| Tool rejected | Agent receives typed denial; cannot retry outside policy. |
| Stale snapshot | Mark response stale or request refresh; future actions cannot execute. |
| Invalid model output | Reject, optionally retry once with schema repair, then fail safely. |
| Retrieval unavailable | Continue only if answer can be grounded through direct tools; disclose limitation. |
| Consent missing | Exclude domain and report it unavailable, never infer permission. |

## Deployment modes

| Mode | Status | Meaning |
|---|---|---|
| LOCAL | Initial target | Generation, embeddings, retrieval and memory stay on device. |
| HYBRID | Deferred | Explicit per-request split between local and approved remote processing. |
| REMOTE | Deferred | Approved remote provider with a changed privacy boundary. |

No remote fallback may occur silently.