# Kaizen Intelligence Engine

Independent local-first Intelligence foundation on the persistent `ai` branch.

## Current status

v0.1 is implemented and frozen:

- Versioned Constitution, provider, tool, snapshot and response contracts
- Provider registry with llama.cpp and deterministic mock adapters
- Structured-response and tool-argument validation
- Bounded read-only orchestration
- One registered `get_today@1.0` tool
- One-time pairing and expiring sessions
- Loopback gateway, authenticated SSE and fixed same-origin proxy
- Browser Domain Bridge with revision vectors and minimum context
- Source verification, evidence/freshness envelope and Home UI
- Privacy-safe aggregate observability

Wave 0 is complete with **no local model selected**. Qwen3 4B, Gemma3 4B, Phi-4 Mini and Qwen2.5 7B all failed frozen preflight requirements. The production-quality path therefore remains deterministic/mock-backed until a separate scope/ADR decides otherwise.

Not implemented or authorized:

- Additional domains or read tools
- Memory or vector storage
- Health context
- State-changing actions or automation
- Remote providers
- v0.2 functionality

## Workspace

```text
src/       engine contracts, gateway, providers, runtime and security
 test/      unit, integration and adversarial tests
wave0/     frozen model-selection harness and public/local result boundary
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
npm run build
npm audit --omit=dev

cd wave0
python scripts/qa_wave0.py
```

## Canonical documentation

- [`../docs/ai/MASTER-SPECIFICATION.md`](../docs/ai/MASTER-SPECIFICATION.md)
- [`../docs/ai/IMPLEMENTATION-LEDGER.md`](../docs/ai/IMPLEMENTATION-LEDGER.md)
- [`../docs/ai/DELIVERY-PLAYBOOK.md`](../docs/ai/DELIVERY-PLAYBOOK.md)
- [`../docs/ai/WAVE-0-REPORT.md`](../docs/ai/WAVE-0-REPORT.md)
- [`../docs/ai/PRIVACY.md`](../docs/ai/PRIVACY.md)
