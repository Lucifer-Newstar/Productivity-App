# Controlled agent loop

## Loop

**LOCKED DECISION**

```text
OBSERVE request and available context
 → SELECT next operation
 → CALL one permitted tool when required
 → OBSERVE validated result
 → repeat within hard limits
 → ANSWER or PROPOSE
```

“Reason” is internal provider work. The system persists operational decisions and concise rationale, not private chain-of-thought.

## Session state

```ts
interface AgentSession {
  sessionId: string;
  intent: string;
  phase: "planning" | "tooling" | "generating" | "validating" | "complete" | "failed";
  iteration: number;
  toolCallCount: number;
  contextTokensEstimated: number;
  startedAt: string;
  deadlineAt: string;
  snapshots: SnapshotReference[];
  permissions: SessionPermissions;
}
```

## Hard limits

Every session enforces:

- maximum iterations
- maximum total and per-tool calls
- maximum wall time
- maximum context and output tokens
- maximum records/bytes from tools
- cancellation signal
- one active execution per session

**REQUIRES TECHNICAL SPIKE:** exact defaults based on local-model latency and reliability. Limits are trusted-code configuration and cannot be increased by the model or retrieved content.

## Agent permissions

- Initial releases expose read/analyze/suggest only.
- A tool request outside the registry is rejected.
- Repeated denied calls consume the limit.
- The agent cannot browse files, execute shell commands, fetch arbitrary URLs or inspect storage directly.
- Future action proposals are data; action execution is outside the reasoning loop.

## Termination

Terminate when:

- a grounded response is available,
- a required domain is denied/unavailable,
- limits are reached,
- model output repeatedly fails validation,
- user cancels,
- provider/runtime fails,
- policy identifies unsafe intent.

A limit failure returns a bounded status and any safe deterministic fallback. It does not recursively start another agent.

## Tool strategy

Use direct tools before retrieval when an entity or domain is explicit. Avoid calling tools whose answer is already present and fresh. Tool results are immutable observations tied to snapshots.

## Observability

Record session ID, phase timings, model identity, prompt/schema versions, tools and statuses, token estimates, source IDs, policy decisions and final status. Do not log hidden reasoning or raw sensitive prompts by default.

## Evaluation

Agent tests cover correct tool selection, correct arguments, unnecessary-tool rate, multi-step completion, limit enforcement, denial handling, cancellation, timeout, malformed output and injection attempts.