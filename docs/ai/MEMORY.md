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

## Storage and independent lifecycle

**LOCKED DECISION:** Kaizen state and AI state have deliberately independent lifecycles.

- Wiping AI state removes memories, conversations, embeddings and AI caches without modifying authoritative Kaizen records.
- Wiping/resetting Kaizen state does not preserve derived AI claims as substitute truth; source-dependent memories become orphaned and must expire, be contested or be explicitly re-grounded.
- AI backup inclusion is explicit and separately labeled. Restoring an AI backup never restores/overwrites authoritative Kaizen records.
- Memory deletion must remove the record, retrieval chunks and every vector/index reference; tombstones may persist only as non-content audit metadata under the retention policy.
- Corrupt AI storage fails closed and can be rebuilt from retained authoritative sources only with consent. It cannot block deterministic Kaizen startup.

**REQUIRES TECHNICAL SPIKE:** local memory store and vector-index technology. The evaluation must cover:

- transactions and crash consistency,
- schema migrations and downgrade behavior,
- backup exclusion/inclusion, restore and version mismatch,
- record deletion and verifiable vector deletion,
- corruption detection, quarantine and recovery/rebuild,
- Windows path, locking, antivirus and packaging behavior,
- independent Kaizen wipe and AI wipe scenarios,
- source deletion/ID change and orphan handling,
- consent revocation cleanup,
- metadata filtering, export and full wipe,
- index-model migration when embedding dimensions change.

No storage backend is selected at the architecture gate.