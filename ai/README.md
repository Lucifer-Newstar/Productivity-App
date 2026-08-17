# Kaizen Intelligence Engine

Independent local-first Intelligence Engine on the persistent `ai` branch.

## Current release — v0.1 foundation

Implemented:

- Versioned Constitution, provider, tool, snapshot and response contracts
- Separate provider registry with `llama.cpp` and deterministic test adapters
- Structured-output and tool-argument validation
- Bounded two-pass read-only orchestration
- One registered `get_today@1.0` tool
- One-time pairing and expiring session authentication
- Loopback-only HTTP gateway with streamed SSE events
- Origin/host/rate/body/unsafe-JSON controls
- Same-origin fixed Next.js proxy
- Browser Domain Bridge with revision vectors and minimum-context projection
- Main Dashboard Intelligence panel
- Source verification, evidence, confidence, uncertainty and freshness envelope

Not implemented:

- State-changing AI tools or automation
- Memory, vector storage or semantic retrieval in production
- Health access
- Remote providers
- A permanently selected local model

## Workspaces

```text
ai/src/       production engine contracts, providers, gateway and runtime
ai/test/      executable engine tests
ai/wave0/     benchmark/selection harness and LOCAL-ONLY tooling
```

## Run with deterministic mock

```bash
cd ai
npm ci
KAIZEN_AI_PROVIDER=mock npm run dev
```

The engine prints a one-time pairing code to the local console. Open the Kaizen Home dashboard and enter that code in **Kaizen Intelligence**.

## Run with llama.cpp candidate

Start a verified `llama-server` on loopback, then:

```bash
KAIZEN_AI_PROVIDER=llama \
KAIZEN_LLAMA_BASE_URL=http://127.0.0.1:8080 \
KAIZEN_LLAMA_MODEL_ID=local-candidate \
npm run dev
```

No model is downloaded by Kaizen. A configured model remains a candidate until Wave 0 selection is complete.

Architecture and security documentation: [`../docs/ai/`](../docs/ai/README.md).
