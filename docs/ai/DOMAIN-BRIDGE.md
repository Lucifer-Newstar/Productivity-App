# Domain Bridge contract

## Decision

**LOCKED DECISION:** V1 uses a client-mediated Domain Bridge because current authoritative state is owned by the renderer client (the final Windows build uses the sandboxed Electron profile).

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
- `domainRevision` is a durable, monotonically increasing integer owned by the browser mutation commit layer—not by React components, adapters or the AI engine.
- Revisions are maintained per authoritative domain: `core`, `forge`, `career`, `workout`, `health`, `entertainment`, and `notifications`. Home views derived from several domains carry a revision vector rather than a synthetic global revision.
- Every successful persisted mutation increments each domain whose authoritative records changed exactly once per logical transaction. UI-only state, reads and recomputation of unchanged analytics do not increment revisions.
- A Forge-only mutation increments Forge. A Career-only mutation increments Career. A transaction that ships a Forge project and creates Career evidence increments both. A Career change does not increment Forge merely because a derived evidence view may read both; that view records both revisions.
- Restore/import increments every domain whose accepted authoritative state changed. Imported revision numbers are never trusted or copied.
- Failed/rejected mutations do not increment. The commit layer publishes the new state and revision as one logical result; a snapshot cannot report success for state that failed persistence.
- Revision counters persist in dedicated bridge metadata separate from domain payloads so they survive reload. They never become AI memory or authoritative user data.
- V1 uses one active browser writer/bridge owner. Additional tabs are read-only for AI sessions or must transfer ownership; cross-tab changes invalidate snapshots through storage/broadcast events. True multi-writer conflict resolution is deferred.
- On missing/corrupt revision metadata, the bridge creates a new installation epoch and invalidates prior snapshots/proposals rather than resetting into the same revision namespace.
- `snapshotId` uniquely identifies a captured projection and includes the installation epoch plus its domain revision vector.
- Snapshot capture uses a stable double-read: read revisions, project state, then re-read revisions; retry if any relevant revision changed.
- `capturedAt` and per-record timestamps establish freshness.
- A response records every snapshot it used.
- Future action proposals record `basedOnSnapshots` and expire.
- An action is stale when any relevant current revision/epoch differs from its proposal snapshot.
- Read-only answers may still render when stale, but must display a freshness warning.

### Revision ownership audit

Wave 0 must inventory every existing mutation path—including functional store updaters, component-owned Habits persistence, imports/restores, cross-space bridges and storage-event reconciliation—and prove it passes through the mutation commit layer before AI actions are enabled. Direct `localStorage` writes outside audited persistence paths cannot produce AI-action-safe revisions.

**REQUIRES TECHNICAL SPIKE:** exact bridge-metadata representation and whether `snapshotId` uses a canonical hash or generated ID plus epoch/revision vector. Hashing must not block the UI on large states.

## Adapter responsibilities

1. Select only fields required by the contract.
2. Normalize dates, IDs and optional values.
3. Exclude secrets, raw unsafe media and unrelated records.
4. Include deterministic analytics with provenance rather than asking the model to recalculate.
5. Apply domain consent and redaction.
6. Freeze or clone output so tool execution cannot mutate React state.
7. Reject unsupported contract versions.

## Initial `core.today@1.0` contract

**LOCKED DECISION:** this remains a narrow vertical-slice projection. It must not grow into a general-purpose or full-database context contract. New questions use separate contracts/tools and revision vectors; additive fields are accepted only when they directly serve the “What should I focus on?” use case.

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