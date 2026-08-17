# Architecture decisions

Concise records of decisions that affect multiple spaces.

## ADR-001 — One application, branded spaces

**Decision:** Workout, Projects/Forge, Career, Health/VITAL-SIGN and Entertainment/AFTERGLOW remain one Next.js application.

**Why:** Shared theme, root state, cross-space bridges and static deployment are simpler than five applications. Brand names describe UI domains, not deployables.

## ADR-002 — Mixed routers

**Decision:** Keep App Router for `/` and same-origin server routes; keep Pages Router for existing space pages.

**Why:** The mature spaces already use Pages Router full-screen static flags. Migrating solely for uniformity would create risk without current user value.

## ADR-003 — React Context local-first state

**Decision:** Use typed React Context slices with functional updates and per-slice localStorage keys.

**Why:** The application is single-user/offline-first and does not need a client state dependency. Functional mutators support cross-space actions.

**Trade-off:** localStorage is synchronous, finite and unencrypted. Media should eventually move to IndexedDB; cloud sync requires identity and durable storage.

## ADR-004 — Express is optional reference API

**Decision:** Do not make the normal frontend depend on Express yet.

**Why:** The current app must remain functional offline. Express documents a future sync contract and provides analytics mirrors without pretending to be production persistence.

## ADR-005 — Same-origin provider BFF

**Decision:** External Entertainment catalogues are called only through fixed Next.js server routes.

**Why:** Credentials stay off browser bundles, CORS is controlled, upstream hosts cannot be user-selected, and time/rate/body limits are centralized.

## ADR-006 — Metadata and personal state are separate

**Decision:** Provider refresh may update catalogue fields but never personal progress, ratings, reviews, dates, tags, favorites or history.

**Why:** External metadata is replaceable; personal records are the source of truth.

## ADR-007 — Security-first imports

**Decision:** Treat every backup/import as untrusted.

**Controls:** file/expanded-size limits, record caps, prototype-key removal, XML DTD/entity rejection, formula-safe CSV, raster-only images and migration-time revalidation.

## ADR-008 — Pragmatic CSP

**Decision:** Keep `script-src 'unsafe-inline'` while Next.js App Router emits inline bootstrap scripts; forbid eval and every external script source.

**Trade-off:** A nonce-based middleware CSP is stronger and remains a future hardening task.

## ADR-009 — Space-specific visual systems

**Decision:** Each full-screen space owns visual variables, motion and navigation while sharing base utilities and the global theme preference.

**Why:** Product identity matters, but common providers/security/persistence must remain centralized.
