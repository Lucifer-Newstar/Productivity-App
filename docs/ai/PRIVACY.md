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

## Public repository vs LOCAL-ONLY boundary

**LOCKED DECISION:** the `ai` branch and repository are public. AI evaluation uses an allowlist publication model: raw artifacts are private unless an approved process projects public synthetic fixtures or sanitized aggregate fields.

### Public repository may contain

- architecture, interfaces, schemas and source code,
- synthetic evaluation fixtures containing no real user records,
- benchmark methodology and placeholder configuration examples,
- sanitized aggregate measurements,
- sanitized recommendations and rejected-candidate reasoning.

### LOCAL-ONLY — never commit

- personal identity/contact/education identifiers,
- secrets, tokens, passwords, credentials and private keys,
- usernames, home paths, hostnames, serials, MAC addresses, GPU UUIDs, BIOS/device/license identifiers,
- raw hardware captures, per-sample telemetry, thermal CSVs, server logs and machine-specific configuration,
- model files,
- Kaizen state exports or real tasks, notes, habits, career/resume, health/workout, calendar or entertainment data,
- AI conversations, memory, embeddings/vector indexes and personal documents,
- personal benchmark prompts or raw model outputs.

### Wave 0 filesystem contract

```text
ai/wave0/results-local/   LOCAL-ONLY, gitignored; raw captures and outputs
ai/wave0/config/*.local.json  LOCAL-ONLY, gitignored machine configuration
ai/wave0/results-public/  PUBLIC only after allowlist sanitization and review
ai/evaluation/v0.1.1/results-public/  PUBLIC synthetic aggregates only
```

Every v0.1.1 public aggregate declares `"classification": "PUBLIC-SANITIZED-AGGREGATE"` and excludes raw prompts, responses and machine data. The deterministic/mock evaluator uses repository-owned synthetic records only.

`sanitize_results.py` copies only approved aggregate fields; it never copies raw prompts/responses, paths, IDs or sample logs. `privacy_scan.py` blocks sensitive staged paths and common secret/identifier patterns. The tracked pre-commit hook invokes the staged scan. Contributors enable it with:

```bash
git config core.hooksPath .githooks
```

The hook is defense in depth, not permission to commit questionable data. If uncertain, keep the file under `results-local/`.

## v0.1.1 data handling

The active `core.today@1.0` adapter sends at most 100 projected records: bounded active task metadata, derived scheduled-item labels, high/critical attention labels, deterministic Next Action provenance, timestamps and revision metadata. It explicitly excludes Note content and all Health state. Tool snapshots, interpreter envelopes and responses remain in process/session memory only. The browser stores only a session bearer token and non-reversible revision fingerprints.

The configured local provider receives the permitted interpreter envelope during inference; local processing is not encryption. No language model is currently selected. Disconnecting removes the browser token, while restarting the engine invalidates its in-memory sessions.

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