# Observability and feedback records

## Principle

Collect enough structured evidence to debug reliability, cost and safety without retaining private text by default.

## v0.1 implementation

The engine maintains in-memory aggregate counters for requests started/completed/failed/cancelled, tool calls, total/maximum duration and error-code counts. Authenticated `GET /v1/metrics` exposes only those aggregates. It contains no prompt, response, source label, tool payload, token or user record and resets when the engine restarts. Completed request event buffers are pruned after one hour.

## Session telemetry

Recommended fields:

- session/request IDs and status
- timestamps and phase latency
- processing mode and provider/model identity
- Constitution, prompt, policy and schema versions
- domain/tool names, statuses and record counts
- snapshot IDs/revisions
- estimated input/output tokens
- context redaction/drop counts
- validation and policy error codes
- memory/retrieval counts, not raw contents
- cancellation/timeout/resource metrics

Raw prompts, tool payload text and responses are excluded by default.

## Recommendation feedback

Future significant responses can record:

```ts
interface RecommendationFeedback {
  feedbackId: string;
  responseId: string;
  model: ModelReference;
  promptVersion: string;
  contextSnapshotIds: string[];
  rating: "useful" | "not-useful";
  action?: "accepted" | "edited" | "rejected" | "ignored";
  outcome?: { recordedAt: string; kind: string; value: unknown };
  createdAt: string;
}
```

Feedback does not directly retrain a model or become memory. It feeds evaluation and later, policy-controlled learning.

## Local operations

The future Privacy Center should expose recent AI access, provider identity, memory changes and approved actions. Operational logs require size/age caps and a wipe path consistent with privacy policy.

## Evaluation boundary

Using personal production interactions as evaluation data requires explicit opt-in. Synthetic/versioned fixtures remain the default regression dataset.