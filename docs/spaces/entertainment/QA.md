# Entertainment space — QA

_Last updated: 2026-08-16, Wave 0 + Wave 1 core._

## Automated gates

- [x] `npm audit` — zero vulnerabilities in both workspaces
- [x] `npm run lint`
- [x] `npx tsc --noEmit`
- [x] `npm run build` — `/entertainment` statically prerendered
- [x] Production HTTP smoke — `/entertainment` returns 200 and AFTERGLOW marker
- [x] `node scripts/qa-entertainment.js` — 29/29 assertions

## Wave 1 functional checklist

- [x] Full-screen route opts out of shared TopNav
- [x] Dark/light AFTERGLOW shell
- [x] First-run state seeds and persists to `kaizen.entertainment`
- [x] Defensive migration fills arrays/progress/default fields
- [x] Dashboard KPIs derive from state
- [x] Continue row and priority queue derive from status
- [x] Manual add supports six media types
- [x] Status, rating, dates, repeats and priority are editable
- [x] Progress labels/counters vary by media type
- [x] Notes, reviews and tags persist
- [x] Favorite, archive and delete actions work
- [x] Search covers title, description, creators, genres, tags, notes and review
- [x] Type/status filters and sorting work
- [x] Empty result states are bounded

## Security checklist

- [x] No provider credentials in frontend code or Entertainment state
- [x] No raw HTML rendering
- [x] No arbitrary remote cover URL is accepted in Wave 1
- [x] Delete requires confirmation
- [x] Persisted state has an explicit schema version and migration
- [x] Provider integration is blocked on same-origin adapters (Wave 2)
