# AI v0.1.1 deterministic routing architecture report

**Date:** 2026-08-19
**Branch:** `ai`
**Scope:** architecture, contracts, frozen evaluation gates and synthetic tests only
**Production implementation:** not started

## Approval

The approved phase authorizes read-only Core Today interpretation only. Trusted Kaizen code selects `get_today@1.0`; a future model may interpret validated `core.today@1.0` evidence but receives no tool definitions and has no authority to request another tool.

Explicitly excluded: memory, retrieval, Health, additional domains, writes, proposals, automation, background operation, remote processing and v0.2.

## Architecture decision

[AI-ADR-019](../ai/adrs/AI-ADR-019-DETERMINISTIC-CORE-TODAY-ROUTING.md) is locked. It responds to the Wave 0 no-model outcome without weakening `W0-GATE-2`: tool selection moves into trusted deterministic code, while provider responsibility narrows to one structured interpretation pass.

The fixed flow is:

```text
focus-today
  → trusted deterministic router
  → get_today@1.0
  → validated core.today@1.0
  → interpreter request with zero tools
  → schema/source/precedence validation
  → verified rendering
```

Unsupported intents fail closed and do not become generic chat.

## Contracts

Created:

- `docs/ai/V0.1.1-DETERMINISTIC-ROUTING-CONTRACT.md`
- `ai/src/contracts/interpreter.ts`

The frozen `1.0` contract fixes:

- capability `core.today.interpret`;
- intent `focus-today`;
- trusted selector `kaizen-deterministic-router`;
- exactly `get_today@1.0`;
- exactly `core.today@1.0` evidence;
- Core-only route scope;
- `modelToolAccess: "none"`;
- interpreter policy forbidding tools, retrieval, memory and writes;
- a bounded recommendation response with no command/action extension point.

## Evaluation gate

Created:

- `docs/ai/V0.1.1-INTERPRETER-EVALUATION.md`
- `ai/evaluation/v0.1.1/gates.v0.1.1.json`

`V011-INT-GATE-1` was frozen before implementation. Zero-tolerance metrics cover model tool calls, invalid sources, unsupported claims, injection failures, forbidden-scope references and write/automation proposals. Route/source/precedence and required-uncertainty metrics require 100%; structured output requires at least 98%.

This is a separate narrower-role gate. It does not supersede, amend or reinterpret Wave 0.

## Synthetic pre-implementation tests

Created:

- `ai/test/fixtures/v0.1.1-interpreter.json`
- `ai/test/interpreterArchitecture.test.ts`
- `npm run qa:v0.1.1`

Public synthetic cases cover a deterministic Next Action, empty evidence, untrusted instructional text and rejection mutants for a provider tool call, fabricated source ID, extra Health route and command-shaped output. The fixtures contain no personal Kaizen or raw benchmark data.

## Documentation synchronization

Updated the decision register, architecture, tools, security, evaluation, Master Specification, roadmap, v0.1 validation note, implementation ledger, README files, testing guide, report indexes and executable documentation QA expectations.

## Validation

Completed during this phase:

```text
AI TypeScript: passed
AI tests: 19/19 passed
AI build: passed
v0.1.1 focused synthetic suite: 5/5 passed
Documentation QA: 40/40 passed
Source commentary QA: 242/242 passed
Tracked-file privacy scan: passed
Git diff check: passed
```

## Stop condition

Stop after this architecture package for review. No production router, interpreter orchestration, prompt or UI wiring is included. If implementation is approved, it must follow the frozen contract exactly and stop again after security/adversarial and evaluation evidence.
