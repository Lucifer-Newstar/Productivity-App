# Action proposals, approval and execution

## Availability

**DEFERRED DECISION:** write execution begins no earlier than v0.4 after read-only reliability is approved. This document defines the required contract now; it does not authorize implementation.

## No direct mutation

**LOCKED DECISION**

```text
AI recommendation
 → proposed actions
 → schema validation
 → policy validation
 → snapshot/freshness validation
 → dry run
 → explicit user selection and approval
 → idempotent command execution
 → result verification
 → audit
 → undo where supported
```

There is no `model → React store` path.

## Proposal contract

```ts
interface ActionProposal {
  proposalId: string;
  schemaVersion: "1.0";
  title: string;
  summary: string;
  actions: ProposedAction[];
  basedOnSnapshots: SnapshotReference[];
  createdAt: string;
  expiresAt: string;
  sourceResponseId: string;
}

interface ProposedAction {
  actionId: string;
  command: string;
  commandVersion: string;
  arguments: unknown;
  reason: string;
  sourceIds: string[];
  idempotencyKey: string;
  risk: "low" | "medium" | "high";
  selectedByDefault: boolean;
}
```

Destructive actions must never be selected by default. Some classes may remain prohibited even with approval.

## Staleness

Before approval and immediately before execution, compare every relevant current domain revision with `basedOnSnapshots`. Changed state makes the proposal stale. The UI must require revalidation/regeneration; it cannot silently overwrite newer user decisions.

## Dry run

Dry run resolves IDs, validates arguments and permissions, detects conflicts/duplicates, predicts mutations and returns a human-readable diff. It performs no state change.

## Approval token

Approval must bind:

- user/session
- proposal ID
- exact selected action IDs
- current snapshot revisions
- expiration
- one-time nonce

Editing an action invalidates the prior approval and requires a new dry run.

## Execution

- Commands are registered separately from model-facing read tools.
- Each command is schema-validated and idempotent.
- Multi-action execution validates the full set before starting.
- Partial failure is reported per action.
- Rollback is attempted only where a tested inverse exists.
- Retries use the same idempotency key.

## Audit, verification and undo

```ts
interface AIActionAudit {
  auditId: string;
  proposalId: string;
  actionId: string;
  command: string;
  beforeRevision: number;
  afterRevision?: number;
  status: "applied" | "failed" | "rolled-back" | "undone";
  approvedAt: string;
  executedAt?: string;
  verification?: object;
  inverseCommand?: object;
}
```

Verification rereads affected records and confirms expected state. Undo is a new authorized command, not deletion of audit history.

## Action Center UX

The unified proposal interface shows evidence, selected changes, risk, stale status and exact effect. Users can accept individual actions, edit, reject or apply selected changes. The UI must never use manipulative consent or conceal deselected actions.

## Security tests

Test stale proposals, replay, duplicate execution, tampered arguments, partial failure, unauthorized domain, revoked consent, invalid IDs, expired approval, destructive defaults, verification mismatch and undo.