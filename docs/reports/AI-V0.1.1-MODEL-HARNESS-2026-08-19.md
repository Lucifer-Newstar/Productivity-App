# AI v0.1.1 interpreter-model corpus and harness implementation

**Date:** 2026-08-19
**Branch:** `ai`
**Protocol:** `I1-RUN-1`
**Corpus:** `I1-SYNTHETIC-1`
**Model execution:** none

## Outcome

The frozen interpreter-only evaluation design is now implemented as a disabled, production-path harness. Both candidates and the public local-config template remain disabled. No model process was started, no model output was generated and no public candidate result exists.

## Frozen corpus

`corpus.v1.json` contains exactly 50 public synthetic Core Today scenarios:

| Stratum | Cases |
|---|---:|
| Deterministic clear | 10 |
| Empty/insufficient/contradictory | 8 |
| Multiple priorities | 8 |
| Schedule/attention | 8 |
| Untrusted instruction | 8 |
| Forbidden-scope/action language | 8 |

Two repetitions produce 100 planned scored attempts per candidate. Every case includes available source IDs, deterministic-precedence applicability, uncertainty applicability, injection applicability and forbidden-scope applicability.

The deterministic builder writes the corpus, SHA-256 manifest and blank semantic-review worksheet. Current corpus SHA-256:

```text
081a7f21a95727e2bb41f73bae639709aea7f083e41824298077d5e4910a6588
```

The worksheet contains exactly 100 blind attempt rows with independent reviewer A/B fields and adjudicated unsupported-claim, injection, forbidden-scope, write/automation and precedence judgments.

## Production-path runner

`runner.ts` uses the real:

- `IntelligenceOrchestrator`;
- deterministic `focus-today → get_today@1.0` route;
- synthetic browser tool executor;
- `core.today@1.0` validation;
- `LlamaCppProvider`;
- interpreter schema, source, precedence and uncertainty enforcement.

The capture wrapper rejects provider tool definitions, checks candidate tokenization before generation, retains raw text/tool-call/usage data locally and records automatic gate observations.

Every attempt is appended immediately to ignored `attempts.local.jsonl`, including failures. Server output, run identity, lifecycle and per-attempt telemetry remain LOCAL-ONLY.

### Execution gates

A process can start only when all of the following are true:

1. configuration filename ends in ignored `.local.json`;
2. protocol/candidate order and literal `127.0.0.1` endpoint validate;
3. top-level `executionEnabled` is true;
4. the selected candidate's `enabled` is true;
5. CLI includes `--execute`;
6. environment acknowledgement exactly equals `I1-RUN-1`;
7. runtime/model paths and SHA-256 values match;
8. license is explicitly verified;
9. NVIDIA telemetry executable is available;
10. frozen corpus hash matches.

The public template fails gates 3 and 4. Harness QA proves the runner exits with `I1_EXECUTION_DISABLED` before path checks or process spawn and rejects remote endpoints.

### Stage controls

- Preflight uses ten frozen cross-stratum scenarios, one attempt each.
- Full uses all 50 scenarios twice.
- Full execution additionally requires a passing local preflight score for the same candidate.
- Candidate order remains Qwen3 then Phi.

## Scorer

The scorer requires exact attempt cardinality and unique IDs. It rejects dropped/duplicate attempts and incomplete review worksheets. Invalid structured responses remain failures for semantic metrics that cannot be assessed safely.

Automatic metrics cover route, schema, provider tool calls, source validity, precedence structure and required uncertainty. Human-adjudicated metrics cover unsupported claims, injection, forbidden scope, write/automation and semantic precedence.

Preflight scoring also requires tokenizer budget, telemetry availability, unchanged resource ceilings, shutdown and port release.

## Sanitizer

The sanitizer:

- accepts only typed LOCAL-ONLY run/score/lifecycle inputs;
- writes only directly under `model-phase/results-public/`;
- allowlists aggregate identity, counts, metrics, lifecycle and operation fields;
- excludes raw prompts, output text, responses, paths, logs and per-sample telemetry;
- always emits `modelSelected: false` and `wave0Reopened: false`;
- cannot produce `PASS-FOR-SELECTION-REVIEW` until quality and operations both pass.

No public candidate aggregate exists yet.

## Harness QA

Harness QA verifies:

- deterministic corpus rebuild and hash;
- exact case/stratum/worksheet counts;
- conservative public character budget;
- disabled runner cannot spawn a sentinel runtime;
- remote endpoints fail before execution;
- known-pass scoring;
- failed attempts remain counted as failures;
- dropped attempts invalidate scoring;
- sanitizer output is non-selecting and strips injected raw/path fields;
- temporary LOCAL/PUBLIC QA artifacts are removed.

## Validation summary

```text
Interpreter-model design QA: 15/15 passed
Interpreter-model harness QA: 15/15 passed
AI TypeScript: passed
AI tests: 24/24 passed
AI build: passed
Frontend ESLint: passed
Documentation QA: 42/42 passed
Source commentary QA: 252/252 passed
No model process started: confirmed
Public candidate result files: none
Git diff check: passed
Staged privacy scan: passed
```

## Scope confirmation

Not added or authorized:

- model execution or downloads;
- any model selection;
- Wave 0 reopening or gate changes;
- full/operations run authorization;
- memory, retrieval or Health;
- additional domain tools;
- writes or automation;
- remote providers;
- v0.2.

## Review stop

Stop after the corpus/harness implementation commit. The next review may authorize target-laptop preflight execution in frozen candidate order, request bounded harness corrections or defer model work.