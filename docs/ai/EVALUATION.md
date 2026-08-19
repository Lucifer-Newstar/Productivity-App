# Evaluation and local-model benchmark

## Rule

**LOCKED DECISION:** no permanent model, quantization, context budget or tool strategy is selected by popularity. Changes to models, prompts, context logic, tools or memory require regression evaluation.

## Reproducibility record

Every run records:

- model artifact, family, parameter count, source, license and SHA-256
- quantization and context size
- embedding identity/dimensions where relevant
- llama.cpp/runtime version
- GPU layers, threads, batch settings and flags
- driver/CUDA/runtime environment
- hardware and power mode
- prompt, Constitution, contract and tool-schema versions
- warm/cold run, timestamp and corpus/evaluation dataset version

Results will live under `ai/evaluation/results/` only after Wave 0 creates the independent subsystem. Documentation does not create runtime directories now.

## Runtime benchmark

Measure:

- model load time
- time to first token
- prompt ingestion time
- output tokens/sec
- peak RAM and VRAM
- context-size degradation
- cancellation latency
- repeated-run thermal throttling
- process recovery
- concurrent-session behavior (initial target may remain one)

Target hardware baseline: Ryzen 7 laptop, NVIDIA RTX 3050 laptop GPU, 16 GB RAM. Exact CPU/GPU model, VRAM and power profile must be captured during the spike.

## Capability evaluation

- JSON/schema compliance
- native/fallback tool selection
- argument correctness and fabricated-ID rate
- multi-step tool completion
- context precision and recall
- source/citation accuracy
- hallucination and unsupported-claim rate
- uncertainty behavior
- instruction hierarchy and prompt-injection resistance
- constitutional compliance

## Product scenarios

Maintain versioned fixtures for:

- empty/new account
- overloaded week
- overdue critical project
- Kubernetes deadline forecast
- career transition and skill gaps
- poor recovery versus planned workout
- missing/disabled Health context
- conflicting deadlines and commitments
- Career–Forge evidence conversion
- stale snapshots and contradictory memories

## Metrics

Evaluation reports separate:

1. **Correctness:** facts, IDs, calculations, source support.
2. **Context:** relevant included, irrelevant excluded, consent respected.
3. **Tools:** selection, arguments, efficiency, limit behavior.
4. **Safety:** injection, privacy, health, unauthorized actions.
5. **Usefulness:** expert rubric and later user feedback/outcome.
6. **Performance:** latency, throughput and resources.

“Feels good” is not a pass criterion.

## Thresholds

**PROPOSED DECISION:** each feature has hard safety/correctness thresholds and comparative usefulness/performance thresholds. Native tool calling remains disabled for a model if tool accuracy is below threshold even when advertised.

Exact thresholds are an architecture-review/Wave 0 deliverable and must be set before model selection.

## Benchmark stages

1. Synthetic contract tests without a model.
2. Small model smoke for transport/streaming.
3. Candidate runtime benchmark.
4. Capability dataset.
5. Product scenario evaluation.
6. Adversarial evaluation.
7. Hardware soak.
8. Selection report with trade-offs and no hidden manual overrides.

## v0.1.1 interpreter-only gate

`V011-INT-GATE-1` is frozen before implementation for the narrower role defined by [AI-ADR-019](adrs/AI-ADR-019-DETERMINISTIC-CORE-TODAY-ROUTING.md). It measures interpretation of already-selected `core.today@1.0` evidence with zero provider tools. It does not modify or supersede `W0-GATE-2`.

The normative thresholds, dataset strata, scoring rules and stop conditions are in [V0.1.1-INTERPRETER-EVALUATION.md](V0.1.1-INTERPRETER-EVALUATION.md). Machine-readable gates and public synthetic fixtures live under `ai/evaluation/v0.1.1/` and `ai/test/fixtures/`.

### Frozen interpreter-model design

`I1-CANDIDATES-1` and `I1-RUN-1` define a future local-model evaluation through the production deterministic route. The matrix includes Qwen3 4B Instruct 2507 Q4_K_M and Phi-4 Mini Instruct Q4_K_M only. The design fixes 50 scenarios, two repetitions, a 4K context, zero provider tools, blinded semantic review, unchanged `V011-INT-GATE-1` thresholds and unchanged W0 resource/safety ceilings where applicable.

The package is documented under [`v0.1.1-model-evaluation/`](v0.1.1-model-evaluation/README.md). `I1-SYNTHETIC-1`, the disabled production-path runner, scorer, sanitizer, semantic worksheet and harness QA are implemented. Execution remains disabled, no model result exists, Wave 0 remains closed and a later review is required before any target run.

## Feedback and future learning

Significant recommendations may later store model/prompt/context references, user feedback, action and outcome. This supports evaluation and only later a fine-tuning feasibility review. Fine-tuning is deferred until evidence shows prompting, tools, retrieval and memory are insufficient.