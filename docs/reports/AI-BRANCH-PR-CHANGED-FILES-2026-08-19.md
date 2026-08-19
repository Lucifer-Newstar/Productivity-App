# Complete `ai` → `main` changed-file summary

**Generated:** 2026-08-19
**Base:** `origin/main` (`cc8155d265f8752e20c294f4a6fd51f36d5ea291`)
**Head:** `ai` pre-merge review

## Aggregate diff

```text
Files changed: 228
Additions: 18018
Deletions: 245
```

Line counts are Git numstat values. Added documentation/source files count every line; generated dependency/build directories are excluded.

## Top-level summary

| Area | Files | Additions | Deletions |
|---|---:|---:|---:|
| `.githooks` | 1 | 3 | 0 |
| `.gitignore` | 1 | 19 | 0 |
| `README.md` | 1 | 108 | 39 |
| `ai` | 96 | 12500 | 0 |
| `backend` | 2 | 79 | 65 |
| `docs` | 76 | 5001 | 80 |
| `frontend` | 51 | 308 | 61 |

## Complete file list

| Status | File | + | − |
|---|---|---:|---:|
| Added | `.githooks/pre-commit` | 3 | 0 |
| Modified | `.gitignore` | 19 | 0 |
| Modified | `README.md` | 108 | 39 |
| Added | `ai/README.md` | 80 | 0 |
| Added | `ai/evaluation/v0.1.1/evaluate.ts` | 81 | 0 |
| Added | `ai/evaluation/v0.1.1/gates.v0.1.1.json` | 28 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/authorization.v1.json` | 24 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/authorization.v2.json` | 28 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/build_corpus.py` | 128 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/candidates.v1.json` | 54 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/config/candidates.local.example.json` | 37 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/corpus.manifest.json` | 9 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/corpus.v1.json` | 2083 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/fileHash.ts` | 12 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/protocol.v1.json` | 111 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/qa_design.py` | 55 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/qa_harness.py` | 127 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/reclassify_target_preflights.ps1` | 47 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/results-public/README.md` | 12 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/results-public/phi-4-mini-instruct-q4km-preflight.json` | 46 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/results-public/qwen3-4b-instruct-2507-q4km-preflight.json` | 46 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/run_target_preflights.ps1` | 64 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/runner.ts` | 116 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/sanitizer.py` | 139 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/scorer.py` | 148 | 0 |
| Added | `ai/evaluation/v0.1.1/model-phase/semantic-review-template.csv` | 101 | 0 |
| Added | `ai/evaluation/v0.1.1/results-public/README.md` | 11 | 0 |
| Added | `ai/evaluation/v0.1.1/results-public/deterministic-mock-implementation.json` | 109 | 0 |
| Added | `ai/package-lock.json` | 625 | 0 |
| Added | `ai/package.json` | 36 | 0 |
| Added | `ai/src/config.ts` | 52 | 0 |
| Added | `ai/src/contracts/domain.ts` | 71 | 0 |
| Added | `ai/src/contracts/index.ts` | 7 | 0 |
| Added | `ai/src/contracts/interpreter.ts` | 128 | 0 |
| Added | `ai/src/contracts/protocol.ts` | 37 | 0 |
| Added | `ai/src/contracts/provider.ts` | 115 | 0 |
| Added | `ai/src/contracts/responses.ts` | 75 | 0 |
| Added | `ai/src/contracts/tools.ts` | 69 | 0 |
| Added | `ai/src/gateway.ts` | 135 | 0 |
| Added | `ai/src/index.ts` | 16 | 0 |
| Added | `ai/src/observability/telemetry.ts` | 23 | 0 |
| Added | `ai/src/prompts/constitution.ts` | 16 | 0 |
| Added | `ai/src/prompts/registry.ts` | 39 | 0 |
| Added | `ai/src/providers/llamaCpp.ts` | 101 | 0 |
| Added | `ai/src/providers/mock.ts` | 43 | 0 |
| Added | `ai/src/providers/registry.ts` | 12 | 0 |
| Added | `ai/src/runtime/deterministicRouter.ts` | 38 | 0 |
| Added | `ai/src/runtime/errors.ts` | 4 | 0 |
| Added | `ai/src/runtime/orchestrator.ts` | 148 | 0 |
| Added | `ai/src/runtime/requestManager.ts` | 63 | 0 |
| Added | `ai/src/security/json.ts` | 17 | 0 |
| Added | `ai/src/security/pairing.ts` | 38 | 0 |
| Added | `ai/src/security/rateLimit.ts` | 16 | 0 |
| Added | `ai/src/server.ts` | 18 | 0 |
| Added | `ai/src/validation/schema.ts` | 54 | 0 |
| Added | `ai/test/adversarial.test.ts` | 16 | 0 |
| Added | `ai/test/contracts.test.ts` | 27 | 0 |
| Added | `ai/test/fixtures/v0.1.1-interpreter.json` | 231 | 0 |
| Added | `ai/test/gateway.test.ts` | 61 | 0 |
| Added | `ai/test/interpreterArchitecture.test.ts` | 96 | 0 |
| Added | `ai/test/interpreterRuntime.test.ts` | 32 | 0 |
| Added | `ai/test/llamaAdapter.test.ts` | 19 | 0 |
| Added | `ai/test/orchestrator.test.ts` | 25 | 0 |
| Added | `ai/test/provider.test.ts` | 28 | 0 |
| Added | `ai/test/security.test.ts` | 26 | 0 |
| Added | `ai/tsconfig.json` | 19 | 0 |
| Added | `ai/wave0/README.md` | 82 | 0 |
| Added | `ai/wave0/config/candidates.example.json` | 67 | 0 |
| Added | `ai/wave0/config/candidates.local.example.json` | 89 | 0 |
| Added | `ai/wave0/config/gates.w0.json` | 53 | 0 |
| Added | `ai/wave0/config/hardware.local.example.json` | 37 | 0 |
| Added | `ai/wave0/prototypes/mock_llama_server.py` | 50 | 0 |
| Added | `ai/wave0/prototypes/pairing_server.py` | 75 | 0 |
| Added | `ai/wave0/prototypes/revision-coordinator.mjs` | 44 | 0 |
| Added | `ai/wave0/results-public/README.md` | 7 | 0 |
| Added | `ai/wave0/results-public/phi4-mini-preflight.json` | 32 | 0 |
| Added | `ai/wave0/results-public/qwen25-7b-control-preflight.json` | 33 | 0 |
| Added | `ai/wave0/results-public/qwen3-4b-instruct-2507-q4km-AC-balanced.json` | 3455 | 0 |
| Added | `ai/wave0/results-public/qwen3-fixed-preflight.json` | 31 | 0 |
| Added | `ai/wave0/results-public/sandbox-retrieval-aggregate.json` | 82 | 0 |
| Added | `ai/wave0/results-public/wave0-review-bundle.json` | 613 | 0 |
| Added | `ai/wave0/run_target_wave0.ps1` | 132 | 0 |
| Added | `ai/wave0/scenarios/harness-smoke.json` | 92 | 0 |
| Added | `ai/wave0/scenarios/kaizen-eval.json` | 113 | 0 |
| Added | `ai/wave0/scripts/benchmark_embeddings.py` | 47 | 0 |
| Added | `ai/wave0/scripts/benchmark_retrieval.py` | 53 | 0 |
| Added | `ai/wave0/scripts/build_review_bundle.py` | 42 | 0 |
| Added | `ai/wave0/scripts/capture_hardware.py` | 104 | 0 |
| Added | `ai/wave0/scripts/monitor_nvidia.py` | 23 | 0 |
| Added | `ai/wave0/scripts/preflight_candidate.py` | 30 | 0 |
| Added | `ai/wave0/scripts/privacy_scan.py` | 41 | 0 |
| Added | `ai/wave0/scripts/probe_lifecycle.py` | 37 | 0 |
| Added | `ai/wave0/scripts/process_inspection.py` | 44 | 0 |
| Added | `ai/wave0/scripts/qa_wave0.py` | 82 | 0 |
| Added | `ai/wave0/scripts/run_benchmarks.py` | 375 | 0 |
| Added | `ai/wave0/scripts/sanitize_results.py` | 107 | 0 |
| Added | `ai/wave0/scripts/score_results.py` | 43 | 0 |
| Added | `ai/wave0/scripts/soak_model.py` | 28 | 0 |
| Added | `ai/wave0/scripts/transport_probe.py` | 85 | 0 |
| Modified | `backend/README.md` | 78 | 65 |
| Modified | `backend/scripts/security-smoke.mjs` | 1 | 0 |
| Modified | `docs/README.md` | 39 | 13 |
| Modified | `docs/ai/ARCHITECTURE.md` | 4 | 2 |
| Modified | `docs/ai/DECISION-REGISTER.md` | 3 | 0 |
| Added | `docs/ai/DELIVERY-PLAYBOOK.md` | 191 | 0 |
| Modified | `docs/ai/EVALUATION.md` | 12 | 0 |
| Added | `docs/ai/IMPLEMENTATION-LEDGER.md` | 237 | 0 |
| Added | `docs/ai/MASTER-SPECIFICATION.md` | 191 | 0 |
| Modified | `docs/ai/OBSERVABILITY.md` | 4 | 0 |
| Modified | `docs/ai/PRIVACY.md` | 51 | 0 |
| Modified | `docs/ai/PROVIDERS.md` | 6 | 0 |
| Modified | `docs/ai/README.md` | 31 | 5 |
| Modified | `docs/ai/ROADMAP.md` | 43 | 13 |
| Modified | `docs/ai/SECURITY.md` | 47 | 0 |
| Modified | `docs/ai/TOOLS.md` | 4 | 0 |
| Added | `docs/ai/V0.1-INTEGRATION-VALIDATION.md` | 63 | 0 |
| Added | `docs/ai/V0.1.1-DETERMINISTIC-ROUTING-CONTRACT.md` | 123 | 0 |
| Added | `docs/ai/V0.1.1-INTERPRETER-EVALUATION.md` | 133 | 0 |
| Added | `docs/ai/WAVE-0-REPORT.md` | 371 | 0 |
| Added | `docs/ai/adrs/AI-ADR-019-DETERMINISTIC-CORE-TODAY-ROUTING.md` | 97 | 0 |
| Added | `docs/ai/adrs/AI-ADR-020-DETERMINISTIC-APPLICATION-PROVIDER.md` | 63 | 0 |
| Added | `docs/ai/v0.1.1-model-evaluation/CANDIDATE-MATRIX.md` | 69 | 0 |
| Added | `docs/ai/v0.1.1-model-evaluation/README.md` | 37 | 0 |
| Added | `docs/ai/v0.1.1-model-evaluation/REPORT-TEMPLATE.md` | 131 | 0 |
| Added | `docs/ai/v0.1.1-model-evaluation/RUN-PROTOCOL.md` | 200 | 0 |
| Added | `docs/ai/v0.1.1-model-evaluation/TARGET-PREFLIGHT-RUNBOOK.md` | 135 | 0 |
| Added | `docs/ai/wave-0/CANDIDATE-MATRIX.md` | 92 | 0 |
| Modified | `docs/ai/wave-0/DOMAIN-REVISION-AUDIT.md` | 1 | 1 |
| Added | `docs/ai/wave-0/PASS-FAIL-CRITERIA.md` | 115 | 0 |
| Modified | `docs/ai/wave-0/README.md` | 12 | 4 |
| Added | `docs/ai/wave-0/TARGET-HARDWARE-CAPTURE.md` | 64 | 0 |
| Added | `docs/ai/wave-0/TARGET-RUNBOOK.md` | 189 | 0 |
| Modified | `docs/architecture/ARCHITECTURE.md` | 10 | 5 |
| Modified | `docs/architecture/DATA-MODEL.md` | 4 | 4 |
| Modified | `docs/architecture/README.md` | 1 | 1 |
| Modified | `docs/guides/CONFIGURATION.md` | 26 | 0 |
| Modified | `docs/guides/CONTRIBUTING.md` | 31 | 6 |
| Modified | `docs/guides/LOCAL-DEVELOPMENT.md` | 13 | 8 |
| Modified | `docs/guides/TESTING.md` | 41 | 3 |
| Modified | `docs/quality/qa/README.md` | 1 | 1 |
| Modified | `docs/reference/API.md` | 16 | 2 |
| Modified | `docs/reference/FEATURES.md` | 1 | 1 |
| Modified | `docs/reference/GLOSSARY.md` | 1 | 1 |
| Modified | `docs/reference/PERSISTENCE-KEYS.md` | 9 | 2 |
| Modified | `docs/reference/README.md` | 1 | 1 |
| Modified | `docs/reference/ROUTES.md` | 7 | 1 |
| Added | `docs/reports/AI-BRANCH-PR-CHANGED-FILES-2026-08-19.md` | 268 | 0 |
| Added | `docs/reports/AI-BRANCH-PR-INTEGRATION-REVIEW-2026-08-19.md` | 234 | 0 |
| Added | `docs/reports/AI-DOCUMENTATION-PROCESS-2026-08-18.md` | 22 | 0 |
| Added | `docs/reports/AI-V0.1-INTEGRATION-FREEZE-2026-08-17.md` | 22 | 0 |
| Added | `docs/reports/AI-V0.1.1-ACCEPTANCE-AND-MODEL-EVAL-DESIGN-2026-08-19.md` | 148 | 0 |
| Added | `docs/reports/AI-V0.1.1-APPLICATION-INTEGRATION-REVIEW-2026-08-19.md` | 120 | 0 |
| Added | `docs/reports/AI-V0.1.1-ARCHITECTURE-2026-08-19.md` | 93 | 0 |
| Added | `docs/reports/AI-V0.1.1-IMPLEMENTATION-2026-08-19.md` | 165 | 0 |
| Added | `docs/reports/AI-V0.1.1-MODEL-HARNESS-2026-08-19.md` | 144 | 0 |
| Added | `docs/reports/AI-V0.1.1-PREFLIGHT-ATTACHMENT-MISMATCH-2026-08-19.md` | 86 | 0 |
| Added | `docs/reports/AI-V0.1.1-PREFLIGHT-AUTHORIZATION-2026-08-19.md` | 98 | 0 |
| Added | `docs/reports/AI-V0.1.1-PREFLIGHT-FINAL-2026-08-19.md` | 150 | 0 |
| Added | `docs/reports/AI-V0.1.1-PREFLIGHT-INTAKE-HASH-FIX-2026-08-19.md` | 81 | 0 |
| Added | `docs/reports/AI-WAVE-0-ATTACHMENT-INTAKE-2026-08-18.md` | 30 | 0 |
| Added | `docs/reports/AI-WAVE-0-FINAL-CLOSURE-2026-08-18.md` | 51 | 0 |
| Added | `docs/reports/AI-WAVE-0-GEMMA-PREFLIGHT-2026-08-18.md` | 34 | 0 |
| Added | `docs/reports/AI-WAVE-0-HARNESS-2026-08-17.md` | 37 | 0 |
| Added | `docs/reports/AI-WAVE-0-HARNESS-FIX-2026-08-17.md` | 51 | 0 |
| Added | `docs/reports/AI-WAVE-0-LARGER-CONTROL-DECISION-2026-08-18.md` | 30 | 0 |
| Added | `docs/reports/AI-WAVE-0-PHI-PREFLIGHT-2026-08-18.md` | 33 | 0 |
| Added | `docs/reports/AI-WAVE-0-QWEN-PREFLIGHT-2026-08-18.md` | 29 | 0 |
| Added | `docs/reports/AI-WAVE-0-TARGET-RESULT-1-2026-08-18.md` | 47 | 0 |
| Added | `docs/reports/AI-WAVE-1-FOUNDATION-2026-08-17.md` | 43 | 0 |
| Added | `docs/reports/DOCS-AND-COMMENTARY-POLISH-2026-08-18.md` | 35 | 0 |
| Modified | `docs/reports/README.md` | 24 | 0 |
| Modified | `docs/spaces/career/QA.md` | 1 | 1 |
| Modified | `docs/spaces/career/README.md` | 1 | 1 |
| Modified | `docs/spaces/entertainment/APIS.md` | 1 | 1 |
| Modified | `docs/spaces/home/QA.md` | 1 | 1 |
| Modified | `docs/spaces/projects/QA.md` | 1 | 1 |
| Modified | `docs/spaces/workout/QA.md` | 1 | 1 |
| Modified | `frontend/README.md` | 73 | 54 |
| Modified | `frontend/app/AppShell.tsx` | 1 | 0 |
| Added | `frontend/app/api/ai/[...path]/route.ts` | 9 | 0 |
| Modified | `frontend/app/api/entertainment/details/route.ts` | 1 | 0 |
| Modified | `frontend/app/api/entertainment/image/route.ts` | 1 | 0 |
| Modified | `frontend/app/api/entertainment/providers/route.ts` | 1 | 0 |
| Modified | `frontend/app/api/entertainment/search/route.ts` | 1 | 0 |
| Modified | `frontend/app/api/entertainment/trending/route.ts` | 1 | 0 |
| Modified | `frontend/app/globals.css` | 4 | 0 |
| Modified | `frontend/components/Dashboard.tsx` | 22 | 1 |
| Modified | `frontend/components/HomeSectionHeader.tsx` | 1 | 0 |
| Added | `frontend/components/IntelligencePanel.tsx` | 24 | 0 |
| Modified | `frontend/components/NotificationButton.tsx` | 1 | 0 |
| Modified | `frontend/components/NotificationCenter.tsx` | 1 | 0 |
| Modified | `frontend/components/Pomodoro.tsx` | 1 | 0 |
| Modified | `frontend/components/SideNav.tsx` | 1 | 0 |
| Modified | `frontend/components/SpaceIcon.tsx` | 1 | 0 |
| Modified | `frontend/components/StorageErrorBanner.tsx` | 1 | 0 |
| Modified | `frontend/components/Tasks.tsx` | 1 | 0 |
| Modified | `frontend/components/TopNav.tsx` | 1 | 0 |
| Modified | `frontend/components/entertainment/EntertainmentIntelligence.tsx` | 1 | 0 |
| Modified | `frontend/components/entertainment/EntertainmentMediaDetails.tsx` | 1 | 0 |
| Modified | `frontend/components/entertainment/EntertainmentOrganize.tsx` | 1 | 0 |
| Modified | `frontend/components/entertainment/EntertainmentPage.tsx` | 1 | 0 |
| Modified | `frontend/components/entertainment/EntertainmentSocial.tsx` | 1 | 0 |
| Modified | `frontend/components/entertainment/EntertainmentStats.tsx` | 1 | 0 |
| Modified | `frontend/components/entertainment/EntertainmentStudio.tsx` | 1 | 0 |
| Added | `frontend/lib/ai/client.ts` | 24 | 0 |
| Added | `frontend/lib/ai/domainBridge.ts` | 25 | 0 |
| Added | `frontend/lib/ai/revisions.ts` | 25 | 0 |
| Modified | `frontend/lib/entertainmentAnalytics.ts` | 1 | 0 |
| Modified | `frontend/lib/entertainmentI18n.ts` | 1 | 0 |
| Modified | `frontend/lib/entertainmentImport.ts` | 1 | 0 |
| Modified | `frontend/lib/entertainmentProviders.ts` | 1 | 0 |
| Modified | `frontend/lib/entertainmentReports.ts` | 1 | 0 |
| Modified | `frontend/lib/entertainmentSocial.ts` | 1 | 0 |
| Modified | `frontend/lib/notificationTypes.ts` | 1 | 0 |
| Modified | `frontend/package.json` | 3 | 1 |
| Added | `frontend/scripts/qa-ai-foundation.ts` | 19 | 0 |
| Added | `frontend/scripts/qa-comments.js` | 7 | 0 |
| Modified | `frontend/scripts/qa-csp.js` | 1 | 0 |
| Modified | `frontend/scripts/qa-docs.js` | 34 | 5 |
| Modified | `frontend/scripts/qa-entertainment-intelligence.ts` | 1 | 0 |
| Modified | `frontend/scripts/qa-entertainment-migration.ts` | 1 | 0 |
| Modified | `frontend/scripts/qa-entertainment-reports.ts` | 1 | 0 |
| Modified | `frontend/scripts/qa-entertainment-social.ts` | 1 | 0 |
| Modified | `frontend/scripts/qa-entertainment.js` | 1 | 0 |
| Modified | `frontend/scripts/qa-home-intelligence.ts` | 1 | 0 |
| Modified | `frontend/scripts/qa-notifications.ts` | 1 | 0 |
| Modified | `frontend/scripts/qa-security.ts` | 1 | 0 |
| Modified | `frontend/scripts/qa-ui.js` | 1 | 0 |

## Review notes

- The dominant additions are the independent `ai/` engine, frozen evaluation evidence/harnesses and synchronized documentation.
- Frontend changes are bounded to the fixed AI proxy, Home Core Today integration, revision/snapshot verification and repository QA/commentary touchups.
- Backend executable behavior is unchanged except commentary; backend README/API documentation is synchronized and the full build/security smoke passed.
- No model weights, local configuration, raw private outputs, secrets, memory, embeddings or user data are included.
- No merge is performed by this review.
