# QA

Cross-space QA reports live here. Per-space QA lives with its space in
`docs/spaces/<space>/QA.md`.

| Report | Date | Scope |
|---|---|---|
| [`TEST-REPORT.md`](TEST-REPORT.md) | 2026-08-13 | Workout (post-feature smoke test for superset/GtG/unilateral/reorder) |

## How to run QA locally

```bash
cd frontend
npx tsc --noEmit      # must be clean
npx next build        # every page should be ○ (static prerender)
npx next start -p 3999
# then hit each route and assert HTTP 200 + no error-boundary markers
```

See `/tmp/smoke.sh` (created during the 2026-08-14 QA sweep) for a repeatable
HTTP smoke script.

## Last full-pass summary (2026-08-14, v1.0)

- **29/29 routes return HTTP 200** on production build (`next start`).
- **Zero Application error / Unhandled Runtime Error / Internal Server Error** markers in any rendered HTML.
- **Zero TypeScript errors** (`tsc --noEmit`).
- **33/33 routes ○ static** in `next build`.
- **Bugs found & fixed:** BUG-001 (custom columns broke shipped semantics — see `docs/bugs/BUGS.md`), BUG-002 (malplaced import from scripted edit).
