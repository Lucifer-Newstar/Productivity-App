# Domain Bridge contract

## Decision

**LOCKED DECISION:** V1 uses a client-mediated Domain Bridge because current authoritative state is browser-owned.

```text
React state/local persistence
        ↓
Domain Adapter (plain data projection)
        ↓
Versioned Domain Contract
        ↓
Client Tool Executor + policy
        ↓
Intelligence Engine
```

Tools do not import React Context. Adapters may read current application state but output plain, immutable, JSON-safe contracts.

## Contract envelope

```ts
interface DomainSnapshot<T> {
  contract: string;            // e.g. "core.today"
  contractVersion: "1.0";
  domain: DomainId;
  snapshotId: string;
  domainRevision: number;
  capturedAt: string;          // ISO-8601
  timezone: string;
  sensitivity: "normal" | "personal" | "health" | "restricted";
  trust: "kaizen-derived";
  data: T;
  analytics: AnalyticsFact[];
  redactions: RedactionNotice[];
}

interface AnalyticsFact {
  id: string;
  label: string;
  value: unknown;
  algorithm: string;
  algorithmVersion: string;
  computedAt: string;
}
```

## Snapshot and version contract

**LOCKED DECISION**

- `contractVersion` versions the wire shape.
- `domainRevision` increments when relevant authoritative state changes.
- `snapshotId` uniquely identifies a captured projection and its revisions.
- `capturedAt` and per-record timestamps establish freshness.
- A response records every snapshot it used.
- Future action proposals record `basedOnSnapshots` and expire.
- An action is stale when a relevant current revision differs from its proposal revision.
- Read-only answers may still render when stale, but must display a freshness warning.

**REQUIRES TECHNICAL SPIKE:** whether `snapshotId` should be a canonical-content hash, a revision vector, or a generated ID plus revision map. Hashing must not block the UI on large states.

## Adapter responsibilities

1. Select only fields required by the contract.
2. Normalize dates, IDs and optional values.
3. Exclude secrets, raw unsafe media and unrelated records.
4. Include deterministic analytics with provenance rather than asking the model to recalculate.
5. Apply domain consent and redaction.
6. Freeze or clone output so tool execution cannot mutate React state.
7. Reject unsupported contract versions.

## Initial `core.today@1.0` contract

```ts
interface TodayContextV1 {
  localDate: string;
  availableFocusMinutes?: number;
  tasks: Array<{
    id: string;
    title: string;
    space: DomainId;
    priority: "low" | "medium" | "high";
    dueDate?: string;
    completed: boolean;
  }>;
  scheduled: Array<{
    id: string;
    source: DomainId;
    title: string;
    startsAt?: string;
    estimateMinutes?: number;
  }>;
  deterministicNextAction?: {
    sourceId: string;
    title: string;
    reason: string;
    estimateMinutes?: number;
    algorithmVersion: string;
  };
  attention: Array<{
    notificationId: string;
    section: DomainId | "global";
    priority: "high" | "critical";
    title: string;
  }>;
}
```

## Tool request/response

```ts
interface BridgeToolRequest {
  requestId: string;
  sessionId: string;
  tool: string;
  toolVersion: string;
  arguments: unknown;
  expectedContract: string;
  expectedContractVersion: string;
}

interface BridgeToolResult {
  requestId: string;
  status: "ok" | "denied" | "invalid" | "stale" | "error";
  snapshot?: DomainSnapshot<unknown>;
  error?: { code: string; message: string; retryable: boolean };
}
```

## Compatibility

- Additive optional fields may remain within a minor contract version.
- Removing/changing semantics requires a major contract version.
- Engine and browser negotiate supported versions at session start.
- Unknown fields are ignored; unknown required versions fail closed.
- Adapters require fixture tests that prove redaction, analytics provenance and stable serialization.

## Domain rollout

`core.today` is first. Core productivity, Forge and Career follow; Workout, Health and Afterglow require their own contracts and consent/sensitivity reviews. Full-state dump contracts are prohibited.