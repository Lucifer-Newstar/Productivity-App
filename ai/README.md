# Kaizen Intelligence Engine

Independent local-first Intelligence foundation on the persistent `ai` branch.

## Current status

v0.1.1 deterministic Core Today interpretation is implemented and frozen for review:

- Versioned Constitution, provider, tool, snapshot and response contracts
- Provider registry with llama.cpp and deterministic mock adapters
- Structured-response and tool-argument validation
- Trusted fixed-intent `focus-today → get_today@1.0` routing
- Zero-tool provider interpretation of validated `core.today@1.0`
- Bounded snapshot, source, precedence, uncertainty and freshness validation
- One-time pairing and expiring sessions
- Loopback gateway, authenticated SSE and fixed same-origin proxy
- Browser Domain Bridge with revision vectors and minimum context
- Source verification, evidence/freshness envelope and Home UI
- Privacy-safe aggregate observability

Wave 0 is complete with **no local model selected**. AI-ADR-019 is implemented and live-accepted for the deterministic/mock path. `V011-INT-GATE-1` passes on the public synthetic deterministic-mock aggregate. `I1-PREFLIGHT-AUTH-1` now permits target preflight for Qwen3 then Phi only; results are pending and full/operations remain blocked.

Not implemented or authorized:

- Additional domains or read tools
- Memory or vector storage
- Health context
- State-changing actions or automation
- Remote providers
- v0.2 functionality

## Workspace

```text
src/         engine contracts, gateway, providers, runtime and security
test/        unit, integration and adversarial tests
evaluation/  frozen v0.1.1 gate, evaluator and public synthetic aggregate
wave0/       frozen model-selection harness and public/local result boundary
```

## Run the deterministic provider

```bash
cd ai
npm ci
KAIZEN_AI_PROVIDER=mock npm run dev
```

The engine prints a one-time local pairing code. Enter it only in the Home Intelligence panel.

## llama.cpp adapter

The adapter remains implemented and tested at protocol level, but no model is approved. A local candidate may be configured only under a future explicit scope decision; Kaizen never downloads model weights.

## Quality gates

```bash
npm run typecheck
npm test
npm run qa:v0.1.1
npm run eval:v0.1.1
npm run qa:v0.1.1:model-design
npm run qa:v0.1.1:model-harness
npm run build
npm audit --omit=dev

cd wave0
python scripts/qa_wave0.py
```

## Canonical documentation

- [`../docs/ai/MASTER-SPECIFICATION.md`](../docs/ai/MASTER-SPECIFICATION.md)
- [`../docs/ai/IMPLEMENTATION-LEDGER.md`](../docs/ai/IMPLEMENTATION-LEDGER.md)
- [`../docs/ai/DELIVERY-PLAYBOOK.md`](../docs/ai/DELIVERY-PLAYBOOK.md)
- [`../docs/ai/adrs/AI-ADR-019-DETERMINISTIC-CORE-TODAY-ROUTING.md`](../docs/ai/adrs/AI-ADR-019-DETERMINISTIC-CORE-TODAY-ROUTING.md)
- [`../docs/ai/V0.1.1-DETERMINISTIC-ROUTING-CONTRACT.md`](../docs/ai/V0.1.1-DETERMINISTIC-ROUTING-CONTRACT.md)
- [`../docs/ai/V0.1.1-INTERPRETER-EVALUATION.md`](../docs/ai/V0.1.1-INTERPRETER-EVALUATION.md)
- [`../docs/ai/WAVE-0-REPORT.md`](../docs/ai/WAVE-0-REPORT.md)
- [`../docs/ai/PRIVACY.md`](../docs/ai/PRIVACY.md)
