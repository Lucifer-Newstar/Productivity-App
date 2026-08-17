# Wave 0 preparation package

**Status:** target validation active on persistent `ai` branch; candidate evaluation/prototyping only.<br>
**Production AI features and Wave 1:** prohibited pending reviewed final Selection Report.<br>
**Permanent model/vector/transport/runtime selection:** requires a reviewed selection report.

## Entry conditions

- Architecture package reviewed
- Six conditional findings documented
- Source-of-truth precedence locked
- Revision semantics defined
- Evidence and failure contracts defined
- Authentication and persistence requirements promoted to blocker spikes

## Spike sequence

1. Capture exact target hardware/OS/runtime baseline.
2. Prototype secure loopback pairing and transport without a model.
3. Prototype Domain Bridge snapshot/revision fixtures without React coupling.
4. Compare engine process lifecycle strategies with a tiny/mock runtime.
5. Benchmark candidate local generation models through a common harness.
6. Benchmark embedding and hybrid retrieval candidates independently.
7. Run schema/tool/context/adversarial evaluations.
8. Produce selection report with explicit rejected alternatives.

## Current progress

- W0-01 initial mutation-path audit: [`DOMAIN-REVISION-AUDIT.md`](DOMAIN-REVISION-AUDIT.md)
- Synthetic revision, pairing, retrieval and transport prototypes are available under `ai/wave0/`.
- Sandbox measurements and unresolved target gates: [`../WAVE-0-REPORT.md`](../WAVE-0-REPORT.md)
- Target capture status: [`TARGET-HARDWARE-CAPTURE.md`](TARGET-HARDWARE-CAPTURE.md)
- Frozen pass/fail gates: [`PASS-FAIL-CRITERIA.md`](PASS-FAIL-CRITERIA.md)
- Frozen candidate inventory: [`CANDIDATE-MATRIX.md`](CANDIDATE-MATRIX.md)
- Target Windows execution steps: [`TARGET-RUNBOOK.md`](TARGET-RUNBOOK.md)
- Public/local boundary: [`../PRIVACY.md`](../PRIVACY.md#public-repository-vs-local-only-boundary)
- No model download, permanent candidate selection or production AI service has started.

## Artifacts required

- [`SPIKE-PLAN.md`](SPIKE-PLAN.md)
- [`SELECTION-REPORT-TEMPLATE.md`](SELECTION-REPORT-TEMPLATE.md)
- Reproducible commands and environment manifest
- LOCAL-ONLY raw machine-readable benchmark results retained by the owner
- Public allowlist-sanitized aggregate for review
- Human-readable comparison
- Security review of pairing/transport
- Storage lifecycle test results
- Architecture updates/ADRs for any selected candidate

## Stop conditions

Stop if a prototype modifies production Kaizen state, exposes unauthenticated loopback endpoints beyond isolated tests, silently downloads a model, sends data remotely, requires weakening CSP, or treats a benchmark candidate as a locked product dependency.

## Hardware dependency

The sandbox cannot validate the user's RTX 3050 laptop performance. Final runtime/model results must be executed on the target laptop with exact GPU model/VRAM, OS, driver, power mode and thermal conditions recorded.