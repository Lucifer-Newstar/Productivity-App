# Context orchestration

## Goal

Select the smallest sufficient, consented and fresh context for the current question. Full-state prompt dumps are prohibited.

```text
User request
 → intent classification
 → required domains and sensitivity
 → consent check
 → direct structured tools
 → optional retrieval
 → deterministic analytics
 → relevant memories
 → relationship expansion
 → rerank and compress
 → trust-labeled prompt context
```

## Context plan

```ts
interface ContextPlan {
  intent: string;
  domains: Array<{
    id: DomainId;
    required: boolean;
    purpose: string;
    sensitivity: string;
  }>;
  tools: Array<{ name: string; arguments: unknown; reason: string }>;
  retrievalQueries: RetrievalQuery[];
  memoryTypes: Array<"semantic" | "episodic" | "pattern">;
  budgets: ContextBudget;
}
```

The plan is generated or selected before accessing domain data and is policy-validated. Intent classification cannot grant permissions.

## Budgets

**LOCKED DECISION:** every session has hard maximums for context tokens, records per tool, retrieved chunks, tool calls, output tokens and wall time. Exact values require model/runtime evaluation.

Recommended allocation order:

1. Constitution and task contract
2. Current direct domain facts
3. Deterministic analytics
4. Explicit user-confirmed memory
5. Relevant recent events
6. Retrieved notes/documents
7. Candidate pattern memory only when policy allows

Low-priority context is dropped rather than silently exceeding the model window.

## Routing example

Question: “Can I finish my Kubernetes project by Friday?”

Include:

- Exact Forge project and current tasks
- Milestones, dependencies, blockers and deadline
- Deterministic velocity/forecast
- Available focus commitments through Friday
- Linked Career milestone
- Confirmed relevant planning preferences

Exclude:

- Afterglow history
- Unrelated projects and old notes
- Health records unless separately consented and directly relevant
- Raw application state

## Compression

Compression must preserve source IDs, dates, quantities, status, uncertainty and deterministic provenance. Generated summaries are labeled as derived context and never replace originals for high-impact claims.

**PROPOSED DECISION:** use trusted deterministic projection first; use model compression only for long user-authored documents after evaluation, with source chunk references retained.

## Data freshness

The orchestrator records snapshot revisions and captured times. If a required domain is unavailable/stale, it can:

- refresh via a tool,
- answer with an explicit limitation,
- or decline when grounding would be unsafe.

It cannot ask the model to guess missing state.

## Context observability

Store structured metadata by default: domains requested, tools used, counts, token estimates, redactions, snapshot IDs and timings. Do not retain raw prompt text by default.

## QA

Fixtures must test domain precision/recall, minimum-context selection, consent exclusion, stale data, conflicting analytics, prompt injection in retrieved content, oversized context and empty-state behavior.