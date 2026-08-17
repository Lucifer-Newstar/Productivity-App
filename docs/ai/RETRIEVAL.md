# Hybrid retrieval

## Decision

**LOCKED DECISION:** retrieval is hybrid, local-first and replaceable behind an interface. Vector similarity is one signal, not the entire retrieval system.

```text
Structured domain filters
 + lexical/full-text match
 + vector similarity
 + recency
 + domain importance
 + relationship expansion
 → reranking
 → bounded source-linked context
```

## Retrieval contract

```ts
interface RetrievalQuery {
  query: string;
  domains: DomainId[];
  entityTypes?: string[];
  filters?: Record<string, unknown>;
  timeRange?: { from?: string; to?: string };
  maximumResults: number;
  allowedSensitivity: string[];
}

interface RetrievalResult {
  resultId: string;
  source: SourceReference;
  excerpt: string;
  scores: {
    structured?: number;
    lexical?: number;
    semantic?: number;
    recency?: number;
    importance?: number;
    final: number;
  };
  trust: ContentTrust;
}
```

## Retrieval order

1. Prefer exact IDs and structured relationships when known.
2. Apply domain, entity, consent, sensitivity and time filters.
3. Use full-text for exact concepts/names.
4. Use embeddings for semantic similarity where useful.
5. Expand explicit relationships such as Forge project → Career milestone.
6. Rerank with recency and domain importance.
7. Return bounded excerpts and source references.

## Indexing

Indexable initial sources may include notes, reflections, events, memories, project text, Career material and approved documents. Structured records remain queryable through tools even when not embedded.

Each index entry requires:

- stable source ID and revision
- domain/entity type
- sensitivity and trust labels
- chunk/version metadata
- source timestamp
- embedding model identity/dimensions
- deletion tombstone handling

## Local storage

**REQUIRES TECHNICAL SPIKE:** evaluate SQLite + FTS5 and replaceable vector options. Measure installation, native packaging, Windows support, metadata filters, index size, latency, backup/migration and guaranteed deletion.

No vector backend is selected at this gate.

## Embedding changes

Changing model or dimensions cannot mix incomparable vectors silently. Use a new index version, rebuild from authoritative text and atomically switch when ready.

## Security

- Indexed text remains subject to consent and sensitivity.
- Retrieval results are untrusted instructions.
- Imported documents are `externally-imported`.
- Result excerpts are size-limited and escaped.
- Deleted sources and revoked consent trigger index deletion.
- Retrieval cannot expand into unapproved domains.

## Evaluation

Test precision, recall, exact-record retrieval, relationship expansion, stale-index behavior, deletion, consent filtering, injection resistance and latency on realistic corpus sizes.