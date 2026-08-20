# Intelligence Engine Implementation Ledger

Living record of what is implemented, validated, measured, blocked and next. Update this file at the end of every AI step.

_Last updated: 2026-08-20_

## Current milestone

> **PR #4 is merged and main CI is green; desktop `kaizen://` is now session-bound; Windows host reinstall/verification remains the release gate.**

PR #4 merged as `06cf13c`; main run `32260387533` passed all four jobs. The single-file Windows installer bundles only the standalone frontend, deterministic engine and checksum-pinned Node runtime, with registered uninstall and branded shortcuts. Physical Windows verification remains pending. AI scope remains closed with no model/GPU work.

## Completed architecture and foundation

| Area | Status | Evidence |
|---|---|---|
| Canonical Master Specification | Complete | `MASTER-SPECIFICATION.md` |
| KAC-1 Constitution and precedence | Complete | Constitution + ADR register |
| Independent TypeScript engine | Complete | `ai/src/` build/typecheck |
| Provider/capability abstraction | Complete | llama.cpp + deterministic mock adapters |
| Structured/tool validation | Complete | AJV and executable tests |
| Bounded read-only orchestration | Complete | One `get_today@1.0` tool call maximum |
| Secure loopback gateway | Complete | Pairing, hashed sessions, Origin/Host/rate/body controls |
| SSE and cancellation | Complete for mock | Gateway integration tests |
| Browser Domain Bridge | Complete for v0.1 | `core.today@1.0`, revisions, redactions |
| Same-origin fixed proxy | Complete | `/api/ai/[...path]` |
| Home Intelligence UI | Complete | Local/read-only paired panel |
| Source/evidence/freshness envelope | Complete | Schema and source-ID verification |
| Privacy-safe observability | Complete | Aggregate in-memory `/v1/metrics` |
| Public vs LOCAL-ONLY boundary | Complete | Ignore rules, sanitizer, pre-commit scanner |

## v0.1.1 implementation and validation

| Deliverable | Status | Evidence |
|---|---|---|
| Deterministic-routing ADR | Complete / locked | `adrs/AI-ADR-019-DETERMINISTIC-CORE-TODAY-ROUTING.md` |
| Route and interpreter contract | Frozen `1.0` | `V0.1.1-DETERMINISTIC-ROUTING-CONTRACT.md`, `ai/src/contracts/interpreter.ts` |
| Interpreter-only evaluation gate | Frozen before implementation | `V011-INT-GATE-1`, `ai/evaluation/v0.1.1/gates.v0.1.1.json` |
| Public synthetic fixtures | Complete | `ai/test/fixtures/v0.1.1-interpreter.json` |
| Pre-implementation executable tests | Complete | valid, empty, injection-resistant and rejection mutants |
| Production router/interpreter wiring | Complete | fixed intent, one trusted tool, zero-tool provider request |
| Evidence validation | Complete | exact field/revision allowlists, 100-record and five-minute bounds |
| Response enforcement | Complete | schema, sources, precedence, uncertainty and command rejection |
| Browser verification/UI | Complete | exact route envelope, source/snapshot/revision checks, fixed-purpose action |
| Security/adversarial tests | PASS | `interpreterRuntime.test.ts` plus injection/gateway suites |
| Deterministic/mock evaluation | PASS | public `V011-INT-GATE-1` aggregate, 10/10 metrics |
| Live integration acceptance | PASS | actual engine + frontend proxy + pairing/SSE/tool callback |
| Interpreter-model candidate matrix | Frozen / disabled | `I1-CANDIDATES-1`: Qwen3 then Phi |
| Interpreter-model run protocol | Frozen / disabled | `I1-RUN-1`, unchanged `V011-INT-GATE-1` |
| `I1-SYNTHETIC-1` corpus | Complete / frozen | 50 cases, six strata, 100 planned attempts, SHA-256 manifest |
| Production-path runner | Complete / disabled | real router/orchestrator/provider, zero tools, local lifecycle/telemetry |
| Scorer and semantic review | Complete | exact attempt coverage, automatic metrics, two-reviewer adjudication |
| Allowlist sanitizer | Complete | aggregate-only output, no selection authority |
| Harness QA | PASS | disabled/no-spawn, loopback, corpus, failures, sanitizer boundary |
| Interpreter-model report format | Complete | sanitized aggregate template; no selection outcome |
| Preflight authorization | APPROVED / PENDING TARGET RUN | `I1-PREFLIGHT-AUTH-1`, Qwen3 then Phi only |
| Full/operations authorization | PROHIBITED | hard-blocked by machine authorization record |
| First Qwen intake | RUNNER DEFECT / NO INFERENCE | `readFileSync` exceeded Node 2 GiB buffer ceiling |
| Large-artifact hash correction | Complete | streaming SHA-256 for runtime/model files; harness regression |
| Qwen3 interpreter preflight | REJECTED | 10 retained; `PROVIDER_HTTP_400`; structured/source/resource gates failed |
| Phi interpreter preflight | REJECTED | 10 retained; `PROVIDER_HTTP_400`; structured/source/resource gates failed |
| Classified aggregate intake | PASS | exact protocol/matrix/gate/corpus and privacy contract verified |
| Model-stage authorization | CLOSED | preflight/full/operations all false in `authorization.v2.json` |
| Final model decision | NO MODEL SELECTED | deterministic/mock v0.1.1 remains baseline |
| Application provider composition | LOCKED / COMPLETE | deterministic only; no llama registry branch |
| Model environment handling | FAIL CLOSED | provider/model variables rejected at startup |
| Deterministic provider authority | PASS | no native tools; tool-bearing requests rejected |
| Home integration disclosure | PASS | deterministic/read-only/no-model copy |
| Live default-config integration | PASS | pair/status/route/tool/SSE/source/session flow |
| Frontend/backend regression review | PASS | all product, security, build and API suites |
| `ai`→`main` current diff | AUDITED / HOLD | 275 files; 20,158 additions; 496 deletions |
| Merge conflict precheck | PASS | `origin/main` is ancestor; merge-tree clean |
| Whole-product gap audit | COMPLETE | 39 routes, persistence, mocks, API consumption, states and integration traced |
| Product completion backlog | COMPLETE | P0/P1/P2, completed, rejected AI scope and CI plan |
| CI workflow | GREEN ON MAIN | run `32260387533`; all four jobs passed at merge `06cf13c` |
| Deterministic CI integration | PASS LOCALLY | actual engine + Next proxy + pairing/SSE/tool/source/session |
| Product P0/P1 completion | PASS LOCALLY | data, dates, habits, backup, security, resilience, placeholders |
| Continuity/release handoff | COMPLETE | blueprint + current release matrix + backlog |
| Model/GPU CI exclusion | ENFORCED | closed authorization; no execution commands or runner |
| GitHub PR #4 | MERGED | merge `06cf13c`; main CI green |
| Windows package foundation | IMPLEMENTED / HOST VERIFICATION PENDING | one setup executable + registered uninstaller/icons; ADR-014 |
| Packaged-runtime verifier | IMPLEMENTED | 39 routes + CSP + pairing/Core Today + shutdown; sanitized aggregate only |
| Windows build automation | RUN 3 FAILED / CORRECTED RERUN PENDING | Electron 43 installer binary invoked explicitly after locked npm install |
| Continuous delivery | IMPLEMENTED / RERUN PENDING | green main refreshes public continuous prerelease; stable tags remain gated |
| Installed update channel | IMPLEMENTED / RELEASE TEST PENDING | fixed GitHub release check + local notification/download + same-AppId setup |
| Native desktop shell | IMPLEMENTED / WINDOWS VERIFY PENDING | Electron 43.4.1, stable `kaizen://app`, dynamic loopback, close-to-stop |
| Desktop protocol session | IMPLEMENTED / HOST REINSTALL PENDING | `session.fromPartition("persist:kaizen").protocol.handle`; default-session handler caused Windows “no app can open this link” |
| Desktop visible startup | IMPLEMENTED / HOST REINSTALL PENDING | window `show:true` before services; `dialog.showErrorBox` and redacted `desktop-error.log` instead of silent quit |
| Merge action | COMPLETE | user merged PR #4 after green checks |

The new gate does not supersede or weaken `W0-GATE-2`. It evaluates a different, narrower provider role with no tools.

## v0.1 integration validation

| Gate | Status |
|---|---|
| Mock provider end-to-end | PASS for deterministic v0.1.1 route |
| Provider receives no tool definitions/round | PASS |
| llama.cpp HTTP/SSE adapter protocol mock | PASS |
| Task/notification/scheduled injection fixtures | PASS |
| Write/second-tool escalation rejection | PASS |
| `core.today@1.0` remains read-only/minimum-context | PASS |
| Real candidate through Wave 0 direct benchmark | One failed Qwen configuration received |
| Real candidate through production gateway/Domain Bridge | PENDING |

See [`V0.1-INTEGRATION-VALIDATION.md`](V0.1-INTEGRATION-VALIDATION.md).

## Wave 0 harness

| Area | Status |
|---|---|
| Hardware capture and public sanitizer | Complete |
| Frozen W0-GATE-2 scorer | Complete; thresholds unchanged |
| Five context sizes | Complete in harness |
| Three cold loads/context | Complete in harness |
| Native llama-bench requirement | Complete in harness |
| Full concurrency structured/tool scoring | Complete in harness |
| Server-observed request cancellation | Complete in harness |
| RAM/VRAM pre-request recovery comparison | Complete in harness |
| Windows/Linux process-tree checks | Complete in harness |
| Literal-loopback embedding endpoint security | Complete in harness |
| Schema/tool/GPU preflight | Complete in harness |
| Correct canonical response schema | Complete |
| Guaranteed `--jinja` tool template | Complete |
| `[N/A]`-tolerant NVIDIA sampling | Complete |

Synthetic harness status: **38/38 passed** before the first target result intake; Wave 0 later closed with no selection.

## Received target evidence

### Qwen3 4B Instruct 2507 Q4_K_M — AC balanced

Status: **REJECTED; corrected preflight also failed**

Measured strengths:

- 41.62–51.51 median output tokens/sec
- 55–67 ms median TTFT
- 2.36–3.37 s cold-load p95
- cold-load, native-bench, cancellation, lifecycle and soak operational checks passed
- 1,093/1,093 soak requests with 97.68% throughput retention

Measured blockers:

- structured output 0% versus 98% threshold,
- tool reliability 85.71% versus 95%,
- grounding/source precedence/uncertainty/injection gates failed,
- system headroom below 3 GiB at every context,
- NVIDIA model/soak telemetry absent,
- embeddings absent,
- AC performance absent.

Verified harness defects were subsequently fixed: canonical schema wrapper, guaranteed `--jinja`, and NVIDIA `[N/A]` handling. Corrected AC-balanced preflight/rerun is next.

### Latest attachment intake — no new result

A later attachment batch contained raw hardware/model/score/soak/lifecycle/server-log files plus a public aggregate. The public aggregate was JSON-equivalent to the already recorded pre-fix run (same capture timestamp and measurements; only whitespace padding differed) and contained no preflight section. It was not added as new evidence and milestone status did not change. Raw attachments were not inspected beyond minimum metadata/aggregate comparison and were deleted from the public workspace after validation.

### Corrected Qwen preflight

The corrected 4K preflight is now measured:

```text
Jinja:                 enabled
Structured:            100%
Tools:                 50%
Metrics/NVIDIA:        available
Cleanup:               passed
Failure:               expected get_today, got no tool call
passedForFullRun:       false
```

The schema and telemetry defects are fixed, but the model still fails the required tool behavior. Qwen is rejected for this selection cycle; no corrected full or AC-performance run should be performed.

### Gemma 3 4B preflight

```text
Jinja:                 enabled
Structured:            0%
Tools:                 0%
Metrics/NVIDIA:        available
Cleanup:               passed
Failures:              HTTP 400; get_project/get_today not called
passedForFullRun:       false
```

Gemma is rejected for this selection cycle. The exact HTTP 400 cause is unavailable in the public-safe summary and is not guessed. No full/performance run should be performed.

### Phi-4 Mini preflight

```text
Jinja:                 enabled
Structured:            100%
Tools:                 0%
Metrics/NVIDIA:        available
Cleanup:               passed
Failures:              get_project/get_today not called
passedForFullRun:       false
```

Phi is rejected. All three compact candidates failed the frozen tool/schema compatibility gate; no full or performance run is authorized.

### Qwen2.5 7B control preflight

```text
Jinja:                 enabled
Structured:            50%
Tools:                 50%
Metrics/NVIDIA:        available
Cleanup:               passed
Failures:              confidence above maximum;
                       wrong entertainment tool selected
passedForFullRun:       false
```

The larger control is rejected. Wave 0 is complete with no model selected. No more candidate downloads/runs are authorized under this cycle.

## Next review

Reinstall a build that includes the persist:kaizen protocol binding and visible-startup/error-dialog changes. Confirm the shortcut opens a native window, or an explicit **Kaizen failed to start** dialog with a redacted `%LOCALAPPDATA%\\Kaizen\\desktop-error.log`. Then execute the remaining physical Windows install/update/uninstall matrix. Do not release before that matrix passes.

Do not re-enable model providers, rerun candidates, add AI domains, memory, retrieval, Health, writes, automation, remote processing or v0.2 work.

## Documentation and repository maintenance

Latest maintenance pass:

- Root, frontend, backend and Intelligence README files aligned with the current architecture and no-model Wave 0 outcome.
- Stale “coming soon”, placeholder/in-progress and architecture-only Intelligence descriptions removed from active docs.
- Documentation indexes, route metadata, setup commands and quality gates synchronized.
- All 282 maintained application and packaging source files now include explanatory commentary.
- `qa:comments` permanently enforces source-comment coverage.
- Historical reports/bug entries remain intact and are explicitly treated as dated evidence rather than current status.

## Deferred by freeze

- additional domain tools,
- production memory,
- Health access,
- production hybrid/vector retrieval,
- cross-domain reasoning expansion,
- write/action proposals,
- automation,
- v0.2 and later capabilities.

## Latest relevant commits

```text
0c2c2d8 docs(ai): freeze v0.1.1 routing architecture
2a08bd7 chore(quality): enforce source commentary coverage
cd015bb docs(ai): close Wave 0 with no model selected
```
