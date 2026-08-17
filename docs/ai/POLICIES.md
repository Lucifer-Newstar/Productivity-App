# Policy engine

## Purpose

The policy engine converts constitutional and product rules into deterministic authorization decisions. Prompts may remind a model of policy; only trusted code enforces it.

## Inputs

```ts
interface PolicyRequest {
  session: SessionPermissions;
  operation: "tool-call" | "retrieve" | "remember" | "respond" | "propose" | "execute";
  domains: DomainId[];
  sensitivity: string;
  resourceIds?: string[];
  toolOrCommand?: string;
  arguments?: unknown;
  snapshotReferences?: SnapshotReference[];
}
```

## Result

```ts
interface PolicyDecision {
  decision: "allow" | "deny" | "require-consent" | "require-approval" | "stale";
  code: string;
  publicReason: string;
  obligations: string[];
}
```

The model cannot author or override a policy decision.

## Locked rules

- Unknown operations/tools/commands deny by default.
- Release permissions cap session permissions.
- Missing or revoked domain consent denies access.
- Health requires separate consent.
- Remote processing requires explicit remote consent and may never be a silent fallback.
- Retrieved content cannot alter policy.
- Model output never constitutes approval.
- Write commands require a valid one-time approval token and current snapshot.
- Stale action proposals cannot execute.
- Secrets and restricted fields cannot enter context, memory or telemetry.
- Deterministic safety results cannot be weakened by model advice.

## Policy versioning

Every session and action audit records policy version. A material policy change requires migration/compatibility review, adversarial tests and an architecture decision when it changes a locked rule.

## Denial behavior

Return a stable error code and safe public reason without leaking inaccessible records or sensitive configuration. Repeated denials consume agent limits and cannot trigger alternate unauthorized tools.