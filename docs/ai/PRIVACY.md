# Privacy, consent and retention

## Defaults

**LOCKED DECISION**

- AI is off until local setup and consent are complete.
- Remote processing is off.
- Health context is off until separately enabled.
- No silent remote fallback.
- Raw prompts/responses are not permanently logged by default.
- Memory is visible and deletable.
- Secrets never enter normal frontend persistence or AI context.

## Consent model

Consent is explicit, revocable and scoped by:

- processing mode: local or remote
- domain: Core, Forge, Career, Workout, Health, Afterglow
- purpose: answer, retrieval, memory, evaluation, future action
- retention: session-only or configured period

Consent state is evaluated before tools, retrieval and memory—not merely displayed in UI. Revocation prevents new access and triggers required index/memory cleanup where applicable.

## AI Privacy Center

Planned controls:

```text
Processing mode
Domain access, with Health separate
Conversation retention
Memory creation by type/domain
View/edit/confirm/contest/delete memory
Export AI data
Wipe AI data and indexes
Model/runtime identity
Recent AI access and actions
```

## Data classes

| Data | Default handling |
|---|---|
| Domain snapshots | Session-scoped; structured metadata may persist |
| Raw prompts/responses | Not retained by default |
| Conversation history | **PROPOSED:** configurable, seven-day initial default subject to review |
| Confirmed memory | Persists until expiry/deletion |
| Candidate pattern memory | Shadow mode, inspectable, bounded retention |
| Embeddings | Local; deleted/rebuilt with source lifecycle |
| Telemetry | Structured and minimized; no raw sensitive text by default |
| Action audit | Persists as required for accountability |

## Local does not mean risk-free

Local processing still exposes data to the model process, local files/indexes, logs and anyone with device access. Documentation must not promise encryption or isolation that is not implemented.

## Remote mode

**DEFERRED DECISION:** no remote provider implementation initially. Future remote requests must show provider, domains, approximate payload category and retention boundary before transmission. Remote consent cannot be bundled with local AI consent.

## Export and deletion

AI export should include settings, consent, model/runtime metadata, memory, feedback and action audits while excluding secrets. Wipe must remove memory, conversations, embeddings/indexes, caches and non-required telemetry; required audit retention needs an explicit policy.

## Open privacy questions

Retention defaults, local encryption/key custody, evaluation-data opt-in, backup inclusion and action-audit retention remain architecture-review items listed in [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).