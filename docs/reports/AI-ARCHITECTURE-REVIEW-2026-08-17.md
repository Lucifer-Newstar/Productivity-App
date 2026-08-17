# Intelligence Engine conditional architecture review — 2026-08-17

## Verdict

Architecture approved for Wave 0 preparation with production implementation blocked pending a reviewed selection report.

## Conditions resolved

1. Defined durable per-domain revision ownership, cross-domain semantics, reload behavior, single-writer scope and stable snapshot capture.
2. Promoted browser↔loopback pairing/authentication to a security blocker before real user data crosses the boundary.
3. Added evidence/source/freshness presentation contracts for consistent “Why am I seeing this?” interfaces.
4. Added normalized engine lifecycle and user-facing failure contracts.
5. Locked source-of-truth precedence from current domain records through AI recommendation.
6. Expanded memory-storage spikes to cover backup, deletion/vector deletion, corruption, recovery, Windows and independent wipes.
7. Explicitly prohibited `core.today@1.0` from becoming a god-contract.

## Wave 0 preparation

Created a spike plan, selection-report template and initial domain-revision source audit. No AI runtime, model, route, vector backend or production feature was introduced.

See [`../ai/wave-0/README.md`](../ai/wave-0/README.md).
