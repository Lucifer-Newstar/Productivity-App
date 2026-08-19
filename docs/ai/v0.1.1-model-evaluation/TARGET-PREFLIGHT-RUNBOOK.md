# I1 target-laptop preflight runbook

**Historical authorization:** `I1-PREFLIGHT-AUTH-1` — completed and superseded
**Current authorization:** `I1-PREFLIGHT-CLOSURE-1`
**Allowed:** no model stage
**Prohibited:** preflight rerun, full corpus, operations/soak, model integration

This runbook is retained as historical procedure. Both preflights are complete and rejected; do not execute these commands again. Do not upload or paste local configuration, paths, hashes, raw attempts, server logs or telemetry.

## 1. Synchronize and validate

```powershell
git switch ai
git pull --rebase
cd ai
npm ci
npm run qa:v0.1.1:model-design
npm run qa:v0.1.1:model-harness
```

Both suites must pass before configuring execution. They start no model. Harness QA must include `streaming artifact hash matches SHA-256`; otherwise the checkout predates the >2 GiB GGUF intake fix.

## 2. Create ignored local configuration

```powershell
Copy-Item `
  .\evaluation\v0.1.1\model-phase\config\candidates.local.example.json `
  .\evaluation\v0.1.1\model-phase\config\target-preflight.local.json
```

Fill only the ignored `.local.json` with:

- exact `llama-server.exe` path, version and SHA-256;
- exact `nvidia-smi.exe` path;
- literal endpoint `http://127.0.0.1:18080`;
- Qwen3 and Phi GGUF paths and SHA-256 values;
- verified license names and `licenseVerified: true`;
- reviewed GPU layers, threads and batch settings.

Generate hashes locally:

```powershell
(Get-FileHash -Algorithm SHA256 'C:\path\to\llama-server.exe').Hash.ToLower()
(Get-FileHash -Algorithm SHA256 'C:\path\to\candidate.gguf').Hash.ToLower()
```

Leave top-level `executionEnabled` and both candidate `enabled` values as `false`. The authorized wrapper creates a transient ignored configuration that enables exactly one candidate at a time.

Do not add the local configuration to Git.

## 3. Confirm AC-balanced conditions

- Connect the approved power adapter.
- Select the same AC-balanced profile used for prior public evidence.
- Close games, model runtimes and unrelated GPU-heavy applications.
- Confirm no service is already listening on port 18080.
- Do not expose the target laptop as a network runner.

## 4. Run both preflights in frozen order

```powershell
powershell -ExecutionPolicy Bypass -File `
  .\evaluation\v0.1.1\model-phase\run_target_preflights.ps1 `
  -Config .\evaluation\v0.1.1\model-phase\config\target-preflight.local.json `
  -ConfirmExecution
```

The wrapper:

1. reruns design and harness QA;
2. activates Qwen3 only;
3. runs ten retained production-path attempts;
4. scores and sanitizes Qwen3 preflight;
5. deactivates Qwen3 and activates Phi only;
6. runs, scores and sanitizes Phi preflight;
7. clears the execution acknowledgement and transient configs.

If runtime identity, corpus integrity, telemetry, endpoint security or lifecycle handling fails, the wrapper stops the intake. Do not infer a candidate decision.

A candidate-level scored failure still produces a sanitized rejection aggregate and permits the next frozen candidate.

## 5. Expected public files

Only these sanitizer-produced files may become public:

```text
evaluation/v0.1.1/model-phase/results-public/
  qwen3-4b-instruct-2507-q4km-preflight.json
  phi-4-mini-instruct-q4km-preflight.json
```

Each must declare:

```json
"classification": "PUBLIC-SANITIZED-AGGREGATE"
```

Expected outcomes are:

- `REJECTED-PREFLIGHT`, or
- `PASS-PREFLIGHT-AWAITING-FULL`.

Neither outcome selects a model or authorizes another stage.

## 6. Keep raw evidence local

Never commit or share:

```text
evaluation/v0.1.1/model-phase/results-local/
evaluation/v0.1.1/model-phase/config/*.local.json
```

That includes attempts, raw outputs, logs, paths, review working files, telemetry and lifecycle details. Do not paste them into chat.

## 7. Reclassify generic failure codes without inference

If a sanitizer-produced aggregate contains only `UNCLASSIFIED`, do not share raw attempts or rerun inference. Pull the latest scorer and run:

```powershell
npm run reclassify:v0.1.1:model:target
```

This command reads retained LOCAL-ONLY error messages, maps known transport/HTTP/timeout/tokenizer/stream failures to safe public codes, re-scores the same attempts and verifies that outcome, counts and requirements did not change. It refuses to publish when a safe classification is unavailable.

## 8. Return for review

After both public aggregates exist with classified failure codes:

1. inspect only the sanitized JSON files;
2. run `npm run qa:v0.1.1:model-harness` again;
3. do not run `full` or operations;
4. provide or commit only the two sanitized aggregates for documentation intake.

The review step will record both decisions, update the ledger/evaluation report and commit synchronized documentation. Missing measurements will not be inferred.