# Documentation and source commentary polish — 2026-08-18

## Scope

Repository-wide maintenance pass covering active documentation, README files, source commentary and permanent QA. Historical dated reports and bug records were preserved.

## README alignment

Reworked:

- root repository README,
- frontend README,
- backend README,
- Intelligence Engine README.

Removed stale “coming soon”, old folder names, obsolete visual descriptions and speculative backend checklists. Added current architecture, workspace boundaries, setup, quality and security guidance.

## Documentation alignment

- Updated active synchronization dates and branch wording.
- Corrected Intelligence glossary/status from architecture-only to implemented deterministic/mock v0.1.
- Corrected AFTERGLOW API status from in-progress to shipped.
- Updated route, architecture, data-model and quality indexes.
- Replaced brittle emoji feature totals in the main docs index with links to authoritative per-space audits.
- Added mandatory source-comment and docs-closeout procedures.

## Source commentary

Audited 240 maintained source files across `frontend/`, `backend/` and `ai/` using TypeScript, TSX, JavaScript, Python, PowerShell, CSS and shell extensions. Added concise module-level comments to every file that had no explanatory comment.

The intent is not comment volume: comments should explain module purpose, invariants, security boundaries, algorithms, migrations and non-obvious transitions rather than narrating syntax.

## Permanent QA

Added `npm run qa:comments`, which fails when a maintained code file has no comment marker. Generated dependencies/build outputs are excluded.
