# Contributing

## Branches

- `main` is the stable integration branch.
- Build substantial spaces/waves on a dedicated branch.
- Current completed feature branch: `entertainment`.
- Rebase or merge only after release gates pass and documentation is synchronized.

## Commit identity

Use the repository-owner identity configured outside tracked files. Verify it before every commit; never document personal email addresses or credentials in this public repository.

## Commit style

Use focused conventional messages:

```text
feat(entertainment): ship wave 6 analytics suite
fix(health): preserve concurrent profile patches
security: harden full site after v1.0 audit
docs: synchronize architecture and operator guides
```

Keep feature, QA and docs changes together when they describe one coherent wave. Avoid mixing unrelated spaces in a feature commit.

## State-model changes

For every persisted field:

1. Update the domain type.
2. Add a migration default.
3. Preserve existing personal data.
4. Use functional store updates.
5. Add structural and, where practical, executable migration tests.
6. Update `DATA-MODEL.md`, per-space docs and backend mapping.

Never trust restored URLs, images or arbitrary object keys.

## Provider changes

- Use fixed server adapters; never accept an arbitrary upstream URL.
- Keep secrets server-side or explicit session-only headers.
- Validate query/type/locale.
- Apply route, cache, timeout and response-size limits.
- Revalidate every redirect.
- Document attribution and commercial terms.

## Source commentary

- Every maintained code file must contain at least one meaningful module, invariant or behavior comment.
- Prefer a concise file-level purpose comment plus targeted explanations for security, formulas, migrations and non-obvious state transitions.
- Do not add comments that merely restate syntax.
- Update comments when behavior changes; stale commentary is a defect.
- Run `npm run qa:comments` from `frontend/`.

## UI changes

- Preserve full-screen shell contracts.
- Verify desktop and mobile navigation.
- Add labels to icon-only controls.
- Honor reduced motion.
- Do not render user HTML.
- Avoid external fonts/scripts/CDNs unless the security policy and offline preview are deliberately updated.

## Public-repository privacy gate

Enable the tracked hook once per clone:

```bash
git config core.hooksPath .githooks
```

The hook runs the Wave 0 staged privacy/secret scanner. Raw AI hardware captures, benchmark logs, prompts/outputs, machine configuration and telemetry stay in ignored `ai/wave0/results-local/` or `*.local.json`. Only reviewed allowlist-sanitized aggregates may be staged from `results-public/`.

## Intelligence Engine step closeout

Every AI implementation, validation, benchmark intake, fix and selection step must end by updating:

1. `docs/ai/IMPLEMENTATION-LEDGER.md`;
2. the governing contract/architecture/security/evaluation document;
3. `docs/ai/WAVE-0-REPORT.md` or `V0.1-INTEGRATION-VALIDATION.md` when relevant;
4. a dated report for material milestones;
5. documentation indexes and QA expectations.

Run `npm run qa:docs` from `frontend/` before the documentation commit. Follow [`../ai/DELIVERY-PLAYBOOK.md`](../ai/DELIVERY-PLAYBOOK.md).

## Pull-request checklist

- [ ] Focused branch and commit history
- [ ] Correct author identity
- [ ] Clean working tree
- [ ] TypeScript/ESLint/build pass
- [ ] Dependency audits clean
- [ ] Relevant domain/security tests pass
- [ ] Persistence migration included
- [ ] Docs and route/reference indexes updated
- [ ] No credentials or real personal exports committed
