# Master Specification — Kaizen Intelligence Engine

**Canonical status:** locked product and implementation north star<br>
**Applies with:** the KAC-1 Constitution, AI ADRs, versioned contracts and current `ai` branch<br>
**Conflict rule:** stop and surface conflicts with locked decisions; never silently redesign

## 1. Product vision

Kaizen is a personal productivity/life operating system. Its AI is an independent Intelligence Layer—not a generic chatbot or decoration on every card. It should progressively understand, remember, reason, connect, recommend, propose, act only with permission, verify and learn.

The end-state question is:

> Given everything I am trying to accomplish, what has happened, what constraints I face, and what matters most—what is the wisest next move?

## 2. Authoritative application

The browser application remains authoritative:

- **Core:** Tasks, Notes, Habits, Notifications
- **Forge:** Projects and project management
- **Career:** Roadmaps, skills, certifications, jobs, portfolio, resume and workflow
- **Workout:** Sessions, exercises, progression, PRs and deterministic analytics
- **Health / VITAL-SIGN:** Sleep, hydration, stress, vitals, recovery and deterministic analytics
- **Afterglow:** Queue, history, ratings, releases and deterministic recommendations

React Context plus local persistence remains the source of truth. The Intelligence Engine never becomes authoritative state ownership.

## 3. Existing v0.1 foundation

The `ai` branch already implements:

- independent TypeScript engine,
- provider abstraction, llama.cpp adapter and deterministic mock,
- capability, Constitution and prompt registries,
- AJV response/tool validation,
- bounded read-only orchestrator,
- `get_today@1.0`,
- browser Domain Bridge and revision vectors,
- loopback gateway, pairing/session authentication and SSE,
- fixed same-origin proxy,
- source verification, evidence/freshness response envelope,
- privacy-safe observability,
- Home Intelligence UI.

Do not discard or redesign this foundation without an ADR. Its frozen scope is READ / ANALYZE / SUGGEST, Core Today, local-first and provider-neutral.

## 4. Required architecture

```text
Browser-authoritative React state
  → domain adapters
  → client tool executor
  → typed/versioned Domain Bridge
  → independent Intelligence Engine
       gateway / context / agent / policy
       memory / retrieval / providers
       evaluation / observability
  → local inference runtime
  → llama.cpp candidate
```

Absolute rule: AI tools never import React Context, Next.js UI code or application components.

## 5. Constitution

All capabilities follow [KAC-1](CONSTITUTION.md): never invent facts; evidence outranks confidence; uncertainty is explicit; state and deterministic analytics outrank AI; retrieved/external content is untrusted data; no unauthorized state change; no diagnosis; inference never silently becomes memory; use minimum context; respect consent; prefer small useful interventions; optimize sustainable long-term progress; challenge contradictions; explain significant recommendations; admit when evidence is insufficient.

## 6. Source-of-truth precedence

```text
Authoritative Kaizen state
  > deterministic analytics
  > current user instruction/confirmation
  > confirmed AI memory
  > episodic memory
  > pattern memory
  > inference
  > recommendation
```

Memory never overwrites current records. Stale analytics never outrank newer records.

## 7. Domain Bridge

Every AI-accessible domain uses an explicit versioned contract such as `core.today@1.0`, future `forge.project@1.0` or `career.state@1.0`. A snapshot carries contract/version, domain, snapshot ID, revision vector, capture time, timezone, sensitivity, provenance, redactions and bounded data. Arbitrary raw React state is forbidden.

## 8. Revisions and staleness

The browser mutation/observation layer owns durable monotonic domain revisions. Cross-domain transactions increment each changed domain. Reload preserves epoch/counters; corrupt metadata rotates epoch. Stable capture detects concurrent changes. A future action based on an old revision is stale and must refresh/review rather than overwrite current state.

## 9. Global Intelligence destination

Global Intelligence should eventually provide a Daily Brief, Weekly Review, Next Action, momentum interpretation, goal alignment, neglected-goal detection and cross-domain conflicts. It considers only authorized minimum context from deadlines, dependencies, priorities, projects, career goals, available time, habits, workload, recovery and commitments.

Current v0.1 remains only `core.today@1.0` and must not become a god-contract.

## 10. Domain Intelligence destination

- **Forge:** risk, deterministic deadline interpretation, planning proposals, premortem, autopsy and Career evidence.
- **Career:** role/skill gaps, JD analysis, evidence-grounded resume/portfolio and interview preparation.
- **Workout:** interpretation of existing 1RM, volume, progression, readiness and PR calculations.
- **Health:** consented pattern interpretation only; never diagnosis.
- **Afterglow:** later, consented discovery, queue/release/history interpretation.

Project→Career claims distinguish recorded fact, user-confirmed fact, suggested wording and missing evidence. Metrics/achievements are never invented.

## 11. Memory destination

Semantic, episodic and pattern memory remain separate from authoritative state. Memory records evidence, origin, confidence, sensitivity, lifecycle and expiry. Pattern memory begins as a shadow candidate, can be confirmed/contested/expired/deleted, and cannot use a model statement as evidence for itself. Users eventually inspect/edit/forget/wipe memory.

**Current freeze:** no production memory until v0.1 integration and model selection are reviewed.

## 12. Retrieval destination

Use structured filters and relationships first, then FTS, optional semantic retrieval, recency and domain importance. Vector storage is not automatic. Wave 0 must prove the lexical semantic gap, embedding quality/resource cost and storage need before selection.

**Current freeze:** no production retrieval/vector store.

## 13. Agent and tools

Agent loop is bounded: observe → select a registered tool → observe result → answer/propose. Hard caps apply to iterations, tool calls, context, output, time, cancellation and concurrency. Every tool is registered, versioned, schema-validated, permission-checked, domain-scoped and auditable.

Current production tool: `get_today@1.0` only. AI-ADR-019 freezes a v0.1.1 path where trusted code selects that tool for `focus-today` and the provider only interprets validated Core Today evidence with zero tool access. Future read tools require contract+evaluation+privacy review. No writes until action architecture approval.

## 14. Future action system

Writes must follow proposal → schema → policy → snapshot check → dry run → explicit selection/approval → idempotent execution → verification → audit → undo where supported. There is never an LLM→database/store path.

**Current freeze:** no proposals, write tools, automation or actions.

## 15. Evidence and prompt-injection defense

Significant responses include evidence, confidence, uncertainty, assumptions, freshness, source references and deterministic algorithm provenance. UI exposes concise rationale, never private chain-of-thought.

Trust order is Constitution > authorization > contracts > session instructions > Kaizen-derived data > user-authored content > external content > inference. A task/note/JD saying “ignore policy” is data. Retrieved text cannot grant permission, tools, limits, provider choice or memory promotion.

## 16. Privacy and public repository

Public repository contains code, architecture, schemas, synthetic fixtures, methodology and sanitized aggregates only. Never commit secrets, credentials, `.env`, personal Kaizen data, exports, AI conversations/memory, embeddings, health/career data, raw prompts, raw hardware/thermal/model logs, machine identifiers, model files or local paths.

Raw local artifacts use ignored `ai/wave0/results-local/` and `*.local.json`. Only allowlist sanitizer output may enter `results-public/`. The public Arena workspace is limited (~128 MB) and is never a model, data or runtime store. Never ask the user to paste a secret/private artifact into public chat/workspace.

## 17. Local model strategy and Wave 0

Target class is Ryzen 7 7435HS / RTX 3050 Laptop 4 GB / 16 GB RAM, but actual local capture is authoritative. Measure model/quantization, runtime build, context, load/TTFT/tokens/sec, RAM/VRAM, tool/schema/grounding quality, concurrency, cancellation, thermals and recovery. Select best intelligence-per-resource, not biggest model.

Context is provisional. Screen 2K/4K/8K and test 12K/16K where resource gates permit. No context/model/runtime value becomes architecture before the Selection Report and ADR.

## 18. MLOps and reproducibility

Version model, quantization, runtime, prompt, tool schemas, evaluation data, embedding model, retrieval policy and Constitution. Build ModelOps, PromptOps, EvaluationOps, RetrievalOps and safe observability only as measured need appears. Model weights never enter Git.

Cloud CI validates code, schema, orchestration, security and synthetic behavior. Local GPU validation measures VRAM/offload/tokens/latency/thermal/concurrency. Do not expose a personal laptop as a public runner without a separate security decision.

## 19. Observability and failures

Production-safe metrics may include request lifecycle, latency, tool counts, model/prompt/Constitution/schema versions, validation failures and aggregate resources—never raw personal prompt/response content by default.

UI handles offline/starting/loading/unavailable, timeout/cancel, tool denied, stale snapshot, invalid response, retrieval unavailable, missing consent, expired auth and rate limiting with mature user-facing messages rather than raw stacks.

## 20. Native UX

Global UI offers purposeful workflows (plan today, needs attention, review week, optimize goals, ask Kaizen) rather than generic chat. Future spaces get contextual Intelligence surfaces under their own visual systems. Context is automatic but still consented and minimum necessary.

## 21. Phases

- **v0.1 Foundation:** implemented and validated with deterministic/mock provider.
- **v0.1.1 Deterministic Core Today interpretation:** architecture, contracts, interpreter-only gates and synthetic tests frozen before production implementation.
- **v0.2 Understands:** more read tools, orchestration, retrieval/memory foundation, cross-domain context and consent—still frozen.
- **v0.3 Reasons:** Daily/Weekly intelligence, momentum/conflicts/alignment, Forge/Career reasoning.
- **v0.4 Acts:** proposals, approval, dry run, stale checks, idempotency, verification, audit and undo.
- **v0.5 Domain Intelligence:** specialized Forge/Career/Workout/Health/Afterglow.
- **v1.0 Learns:** feedback, validated patterns, outcomes and long-term personalization. Fine-tuning only if evaluation demonstrates need.

## 22. True v1 definition

“What should I do today?” eventually determines domains, retrieves minimum authorized context/memory, runs deterministic analytics, reasons, returns a structured/evidenced/fresh/uncertain recommendation, proposes safe actions, requests permission, executes selected actions, verifies outcome and learns from explicit feedback—while staying local-first, auditable, bounded, replaceable and user-subordinate.

## 23. Absolute non-goals

No ChatGPT clone, AI-everywhere decoration, full-database prompt dumps, AI source-of-truth, direct database access, autonomous writes, unbenchmarked model selection, unjustified vector DB, evidence-free fine-tuning, diagnosis, chain-of-thought exposure, weights/secrets/personal data in Git, or overengineering ahead of measured need.

## 24. Implementation rule

Every major capability follows:

```text
architecture → contract → implementation → test → security test → evaluation → documentation
```

Every architecture change gets an ADR. Every capability gets a synthetic evaluation. Every write gets authorization policy. Every external-data path gets a trust boundary. At the end of every step, update the governing docs and [`IMPLEMENTATION-LEDGER.md`](IMPLEMENTATION-LEDGER.md), run documentation QA and commit the synchronized documentation. Each milestone is independently testable/reviewable on the persistent `ai` branch while `main` remains stable.
