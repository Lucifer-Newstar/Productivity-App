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

### Agent

Runs a bounded observe/reason/tool/observe loop. It cannot execute arbitrary code or access Kaizen state except through registered tools.

### Policy layer

Checks tool permission, consent, domain sensitivity, argument schema, source existence and future action authorization. Hard policy outranks prompts.

### Memory/retrieval

Stores AI-specific memories separately from Kaizen domain state. Retrieval combines structured, lexical, semantic, recency and relationship signals.

### Provider registry

Selects generation and embedding providers by configuration and declared capabilities. LOCAL is initial; HYBRID and REMOTE remain architectural modes only.

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