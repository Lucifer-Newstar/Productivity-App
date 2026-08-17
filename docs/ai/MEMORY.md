# AI memory

## Separation

**LOCKED DECISION:** AI memory is persistent but separate from authoritative Kaizen domain state. A memory can guide retrieval/recommendations; it cannot overwrite a task, health record, project or user preference in its source domain.

## Types

- **Semantic:** stable user-stated facts/preferences.
- **Episodic:** meaningful historical events and decisions.
- **Pattern:** repeated behavior inferred from multiple observations.

## Contract

```ts
interface AIMemory {
  id: string;
  schemaVersion: "1.0";
  type: "semantic" | "episodic" | "pattern";
  content: string;
  confidence: number;
  evidence: SourceReference[];
  status: "candidate" | "confirmed" | "contested" | "expired" | "deleted";
  sensitivity: "normal" | "personal" | "health" | "restricted";
  origin: "user-stated" | "system-event" | "inferred-pattern";
  createdAt: string;
  updatedAt: string;
  lastValidatedAt?: string;
  expiresAt?: string;
  model?: ModelReference;
  promptVersion?: string;
}
```

## Lifecycle

```text
Observation
 → candidate memory
 → evidence/contradiction evaluation
 → user confirmation or policy threshold
 → confirmed
 → periodic validation
 → confirmed / contested / expired
 → deleted (including retrieval index deletion)
```

### Rules

- User-stated memories may be confirmed after an explicit save/confirmation flow.
- System events may create factual episodic candidates linked to records.
- Pattern memory always starts as `candidate` in shadow mode.
- Candidate patterns cannot drive high-impact recommendations.
- A model statement is never evidence for itself.
- Contradictory evidence marks a memory contested; it is not silently rewritten.
- Health memory requires health-context consent and stricter retention.
- Deleted memory is excluded immediately and its vectors are removed.

## Pattern promotion

**PROPOSED DECISION:** require multiple independent observations across time, a minimum confidence threshold and either user confirmation or a policy-approved low-impact promotion threshold. Exact thresholds require evaluation and product review.

Until v1.0 learning work, pattern candidates remain inspectable shadow data and do not become authoritative personalization.

## User controls

The AI Privacy Center should support:

- View memories by type/status/sensitivity
- See evidence and last validation
- Confirm, contest, edit or delete
- Export AI memory
- Wipe all AI memory and vectors
- Disable new memory creation by type/domain

Editing creates an audit event and preserves origin metadata; it does not falsify source records.

## Retention

**PROPOSED DECISION:** explicit expiry defaults by memory type and sensitivity. No retention duration is locked yet. Raw conversations are not memories and are governed separately by [PRIVACY.md](PRIVACY.md).

## Storage

**REQUIRES TECHNICAL SPIKE:** local memory store and vector-index technology. Requirements: transactions, schema migrations, deletion guarantees, metadata filtering, export/wipe, backup behavior and Windows compatibility.