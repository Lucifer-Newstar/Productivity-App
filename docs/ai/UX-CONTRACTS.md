# Intelligence presentation and failure-state contracts

These are data/presentation contracts, not final visual design.

## Intelligence response presentation

**LOCKED DECISION:** every significant response exposes a consistent “Why am I seeing this?” projection derived from validated evidence—not model-generated UI markup.

```ts
interface IntelligencePresentation {
  responseId: string;
  headline: string;
  summary: string;
  status: "current" | "partially-stale" | "stale" | "limited";
  confidence?: ConfidencePresentation;
  evidence: EvidencePresentation[];
  uncertainty: NoticePresentation[];
  assumptions: NoticePresentation[];
  actions: ResponseActionPresentation[];
}

interface EvidencePresentation {
  evidenceId: string;
  label: string;
  value?: string;
  explanation: string;
  kind: "record" | "deterministic-analytic" | "confirmed-memory" | "inference";
  sourceLinks: SourceLinkPresentation[];
  provenance?: {
    algorithm: string;
    algorithmVersion: string;
    computedAt: string;
  };
  freshness: FreshnessPresentation;
}

interface SourceLinkPresentation {
  sourceId: string;
  label: string;
  domain: DomainId;
  entityType: string;
  entityId: string;
  href?: string;              // resolved by trusted client route map
}

interface FreshnessPresentation {
  state: "fresh" | "aging" | "stale" | "unavailable";
  observedAt?: string;
  capturedAt: string;
  ageSeconds: number;         // calculated by trusted client code
  message: string;
}
```

The model supplies claims and source IDs. Trusted code verifies IDs, calculates age/status, resolves internal links, and appends algorithm/model metadata. Models cannot generate arbitrary `href` values.

## Evidence ordering

1. Authoritative records
2. Deterministic analytics
3. User-confirmed memory
4. System episodic memory
5. Explicitly labeled inference/assumption

The UI must visually distinguish inference from recorded fact and group duplicate references. Confidence is omitted when it cannot be meaningfully supported or calibrated.

## User-facing failure contract

```ts
interface IntelligenceFailure {
  code: IntelligenceFailureCode;
  title: string;
  message: string;
  severity: "info" | "warning" | "error";
  retryable: boolean;
  recoveryActions: Array<
    "retry" | "refresh-data" | "open-setup" | "review-consent" |
    "restart-engine" | "use-deterministic-view" | "dismiss"
  >;
  technicalReference?: string; // correlation ID, never raw stack trace
}
```

| Code | User-facing title | Required behavior |
|---|---|---|
| `ENGINE_OFFLINE` | Kaizen Intelligence is offline | Offer setup/restart; deterministic Kaizen remains available. |
| `ENGINE_STARTING` | Intelligence is starting | Show model/runtime status and allow cancellation. |
| `ENGINE_BUSY` | Intelligence is busy | Show bounded wait state; do not spawn duplicate model processes. |
| `MODEL_LOADING` | Loading the local model | Show progress if trustworthy; explain first-run delay. |
| `MODEL_TIMEOUT` | Intelligence took too long | Offer retry or deterministic view; cancel underlying work. |
| `STALE_SNAPSHOT` | This answer is based on older data | Show capture age and refresh action. |
| `TOOL_DENIED` | Some data was not available | State the affected domain without leaking protected records. |
| `CONSENT_REQUIRED` | Permission is needed | Link to scoped consent; never enable automatically. |
| `INVALID_RESPONSE` | Intelligence could not produce a reliable answer | Do not render partial unvalidated claims. |
| `RETRIEVAL_UNAVAILABLE` | Search memory is unavailable | Continue only with direct grounded tools and disclose limitation. |
| `ENGINE_FAILED` | Intelligence encountered a local error | Show correlation ID and restart/deterministic options. |
| `CANCELLED` | Request cancelled | Confirm resources are being released. |

## Engine lifecycle presentation

The UI consumes a normalized state:

```ts
type EngineStatus =
  | { state: "offline" }
  | { state: "starting"; startedAt: string }
  | { state: "loading-model"; modelLabel: string; progress?: number }
  | { state: "ready"; modelLabel: string }
  | { state: "busy"; sessionId: string; cancellable: boolean }
  | { state: "failed"; failure: IntelligenceFailure };
```

Closing the UI must not claim the engine stopped unless shutdown was acknowledged. Lifecycle behavior itself remains a Wave 0 runtime spike.

## Accessibility and safety

- Status is conveyed by text, not color alone.
- Evidence panels are keyboard navigable.
- Streaming output uses restrained live-region updates.
- Reduced-motion preference applies to loading/streaming effects.
- Technical errors and private payloads are never shown directly.
- A failed AI surface never blocks access to deterministic features.