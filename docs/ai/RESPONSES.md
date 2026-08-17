# Structured responses, evidence and freshness

## Rule

**LOCKED DECISION:** significant intelligence responses use a validated envelope. Model JSON is untrusted until schema validation and source verification succeed.

```ts
interface IntelligenceResponse {
  schemaVersion: "1.0";
  responseId: string;
  sessionId: string;
  type: "answer" | "brief" | "recommendation" | "plan" | "proposal";
  title: string;
  summary: string;
  rationale: RationaleItem[];
  confidence: number;            // 0..1, never shown without evidence
  uncertainty: string[];
  assumptions: string[];
  sources: SourceReference[];
  freshness: DataFreshness;
  deterministicFacts: DeterministicFactReference[];
  proposedActions: ProposedActionReference[];
  generatedAt: string;
  model: ModelReference;
  promptVersion: string;
  constitutionVersion: string;
}
```

## Evidence and freshness

```ts
interface SourceReference {
  sourceId: string;
  domain: DomainId;
  entityType: string;
  entityId: string;
  label: string;
  observedAt?: string;
  snapshotId: string;
  trust: "kaizen-derived" | "user-authored" | "externally-imported";
}

interface DataFreshness {
  generatedAt: string;
  snapshots: Array<{
    domain: DomainId;
    snapshotId: string;
    revision: number;
    capturedAt: string;
  }>;
  staleDomains: DomainId[];
  unavailableDomains: DomainId[];
}
```

The client verifies that referenced entity IDs existed in tool results for the session. Unsupported references invalidate the affected claim or whole response according to schema severity.

## Rationale, not chain-of-thought

A rationale item is concise evidence projection:

```ts
interface RationaleItem {
  claim: string;
  sourceIds: string[];
  kind: "fact" | "deterministic-result" | "inference" | "assumption";
}
```

The engine does not store, transmit or display private reasoning traces. Provider adapters must project only final answer fields, tool requests and bounded operational events.

## Confidence policy

- Confidence is not a substitute for sources.
- It must be finite and clamped to `0..1`.
- Missing/contradictory/stale evidence lowers confidence.
- Deterministic facts retain their algorithm provenance rather than receiving model confidence.
- UI language must not imply statistical calibration until evaluation proves it.

## Validation pipeline

```text
Model output
 → parse under byte/depth limits
 → JSON Schema validation
 → constitutional/policy checks
 → source-ID existence checks
 → action-reference checks
 → freshness calculation by trusted code
 → safe response projection
```

Freshness and authoritative model identity are appended by trusted code, not accepted from model output.

## Repair policy

**PROPOSED DECISION:** allow one bounded schema-repair attempt with only validation errors and the invalid structure, not additional private data. If repair fails, return a typed failure and deterministic fallback. Never heuristically execute partially parsed actions.

## First-slice response

`get_today` returns an `answer` or `recommendation` with at least one valid source, the deterministic Next Action provenance when present, current snapshot metadata, uncertainty, and no action proposals.