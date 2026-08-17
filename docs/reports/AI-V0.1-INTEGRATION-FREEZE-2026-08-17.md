# AI v0.1 integration freeze — 2026-08-17

## Decision

Wave 1 v0.1 is accepted and frozen. The active milestone is the Wave 0 Selection Report plus real-model v0.1 integration validation. New domains, memory, Health context, write actions and automation are prohibited until review defines the next scope.

## Added validation

- Synthetic task-content injection remains inert data.
- Synthetic notification-content injection cannot alter answer/tool policy.
- Synthetic scheduled-item injection cannot alter answer/tool policy.
- A provider attempting a second/write tool call is rejected with `TOOL_LIMIT`.
- Mock-backed loopback gateway, SSE, browser tool result and source-linked response remain passing.
- Public/local privacy scan remains passing.

## Canonical source

[`../ai/MASTER-SPECIFICATION.md`](../ai/MASTER-SPECIFICATION.md) is now the canonical product/architecture/privacy/MLOps/phase specification together with KAC-1, locked ADRs, contracts and the current branch. Conflicts must be surfaced rather than silently implemented.

## Wave 0 amendment

`W0-GATE-2` supersedes `W0-GATE-1` before target model results solely to add measured 2K, 12K and 16K context points alongside 4K/8K. Other quality, safety, latency, resource and thermal thresholds are unchanged.
