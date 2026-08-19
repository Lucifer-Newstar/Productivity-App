# Intelligence Engine Delivery Playbook

This is the mandatory operating procedure for every AI milestone on the persistent `ai` branch. It complements the [Master Specification](MASTER-SPECIFICATION.md), KAC-1, ADRs and versioned contracts.

## 1. Start-of-step procedure

Every new implementation step begins with:

```bash
git switch ai
git pull --rebase
```

Then verify:

```bash
git status --short --branch
```

If the tree is unexpectedly dirty, stop and identify whether the changes are intentional before pulling, editing or staging.

## 2. Scope gate

Before writing code:

1. Identify the currently approved milestone.
2. Read the governing Master Specification sections.
3. Identify affected ADRs, contracts, policies, Domain Bridge rules, evaluation fixtures and privacy boundaries.
4. Confirm the request does not silently expand into an unapproved phase.
5. Surface conflicts with locked decisions instead of guessing.

Current freeze: v0.1.1 deterministic/mock integration is accepted. The interpreter-model corpus/harness is implemented, but all candidate and execution gates remain disabled; target preflights are not authorized. Wave 0 remains closed. No v0.2 tools, memory, retrieval, Health, writes, automation or additional domains.

## 3. Required implementation sequence

```text
architecture
  → contract
  → implementation
  → unit/integration test
  → adversarial/security test
  → evaluation
  → documentation
  → focused commit
```

A feature is not complete when code passes. It is complete only after the governing documentation and living ledger are synchronized.

## 4. Git and commit procedure

- Continue on the persistent `ai` branch; do not create one branch per wave.
- Use focused conventional commits.
- Separate coherent implementation/test and documentation commits when that improves auditability.
- Configure and verify repository-owner commit identity locally; never place personal email in tracked docs.
- Run `git diff --check` and privacy scanning before every commit.
- Never stage unrelated files.
- Finish with a clean working tree.

Typical sequence:

```bash
git diff --check
python ai/wave0/scripts/privacy_scan.py --mode staged
git commit -m "type(ai): focused description"
git status --short --branch
```

## 5. Public repository / LOCAL-ONLY procedure

Public Git may contain code, schemas, synthetic fixtures, methodology and reviewed sanitized aggregates.

LOCAL-ONLY:

```text
ai/wave0/results-local/
ai/wave0/config/*.local.json
model weights and runtimes
raw prompts/responses
raw hardware/thermal/server logs
personal Kaizen state
credentials and machine identifiers
```

Before accepting a result:

1. Confirm `classification = PUBLIC-SANITIZED-AGGREGATE`.
2. Parse as JSON.
3. Scan for secrets, home paths, hostnames, serials, MAC/GPU UUIDs and raw payload keys.
4. Copy only to `results-public/` after review.
5. Rebuild the public review bundle.
6. Update the Selection Report using **MEASURED FACT → INTERPRETATION → RECOMMENDATION**.

When uncertain, keep the file local.

## 6. Verification procedure

### Engine foundation

```bash
cd ai
npm ci
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

### Wave 0 harness

```bash
cd ai/wave0
python scripts/qa_wave0.py
```

### Frontend integration

```bash
cd frontend
npm ci
npx tsc --noEmit
npm run lint
npm run qa:ai
npm run qa:docs
npm run build
npm audit --omit=dev
```

Run relevant existing CSP/UI/Home/security suites whenever those surfaces change.

## 7. Documentation closeout procedure

At the end of **every** implementation, validation, benchmark intake, fix or selection step:

1. Update [`IMPLEMENTATION-LEDGER.md`](IMPLEMENTATION-LEDGER.md).
2. Update the governing technical document or contract.
3. Update [`WAVE-0-REPORT.md`](WAVE-0-REPORT.md) when measured evidence changes.
4. Update [`V0.1-INTEGRATION-VALIDATION.md`](V0.1-INTEGRATION-VALIDATION.md) when integration gates change.
5. Update [`ROADMAP.md`](ROADMAP.md) when milestone status changes.
6. Add or update a dated report under `docs/reports/` for material milestones.
7. Update indexes and executable QA expectations.
8. Run documentation QA before committing.

Documentation must distinguish:

- implemented and tested,
- measured fact,
- interpretation,
- recommendation,
- pending evidence,
- rejected decision,
- deferred capability.

Never rewrite a pending item as complete because scaffolding exists.

## 8. Benchmark procedure

- Pull the latest `ai` branch before local runs.
- Use ignored local hardware/candidate configuration.
- Enable exactly one candidate.
- Use the authoritative machine capture and fixed W0-GATE-2 thresholds.
- Run schema/tool/GPU preflight first.
- Do not run the full benchmark if preflight fails.
- Keep raw output local.
- Share only sanitized aggregate and review bundle.
- Do not select a model from incomplete or failed evidence.

## 9. Stop conditions

Stop and report rather than continue when:

- a locked decision conflicts with the requested change,
- required consent is absent,
- a public/private boundary is uncertain,
- model/runtime evidence is incomplete,
- a critical safety/grounding/tool gate fails,
- a benchmark lacks required telemetry,
- implementation would enter an unapproved phase,
- the working tree contains unexplained changes.

## 10. Step completion report

Every final response should state:

- scope completed,
- files/areas changed,
- tests and exact results,
- security/privacy outcome,
- remaining blockers,
- commit IDs,
- branch and working-tree state,
- next authorized step.
