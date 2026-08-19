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

## ADR-010 — Intelligence architecture gate

**Decision:** The proposed Kaizen Intelligence Engine remains an independently runnable subsystem and uses a client-mediated Domain Bridge while browser state is authoritative. Documentation must distinguish locked, proposed, spike-required and deferred choices before implementation.

**Why:** An AI service cannot safely infer current browser-owned state, and premature model/vector/runtime choices would create accidental coupling. Tools use versioned plain contracts rather than React imports; deterministic analytics remain the source of truth.

**Status:** Architecture documentation approved; Wave 0 preparation is authorized but production AI feature implementation is not. Detailed AI decisions live in [`../ai/DECISION-REGISTER.md`](../ai/DECISION-REGISTER.md).

## ADR-011 — Intelligence source-of-truth precedence

**Decision:** Current authoritative domain records outrank deterministic derived analytics, which outrank confirmed memory, episodic/pattern memory, inference and recommendations. Stale analytics never outrank newer records.

**Why:** AI memory and generated interpretations are contextual aids, not competing databases. Conflicts trigger memory validation and user-visible disclosure rather than silent state override.

## ADR-012 — Browser-only authority for the local v1 release

**Decision:** The packaged local v1 application uses browser-owned React state and versioned local persistence as its sole product-data authority. The Express service is excluded from the release runtime and remains a development/reference API only.

**Why:** The frontend currently consumes zero Express data endpoints, while Express is in-memory and loses data on restart. Wiring it now would reduce durability rather than improve it. The approved release is offline/local with no cloud deployment.

**Required consequences:**

- product copy and deployment docs must not promise server sync;
- a complete browser backup/restore and corruption-recovery contract is required before release;
- sensitive localStorage risk requires explicit release acceptance;
- Express must stay loopback or require a service key for network binding;
- any future durable backend, account identity or synchronization requires a new ADR, migrations and conflict tests.

## ADR-013 — Trusted local profile is the v1 at-rest security boundary

**Decision:** v1 accepts unencrypted browser persistence for a single-user local installation, with the operating-system account and trusted browser profile as the at-rest security boundary.

**Why:** Client-side encryption without an independently protected key would only obscure data, while passphrase/key custody and encrypted storage would materially expand packaging/auth scope. The release is local/offline and has no cloud account.

**Required disclosure and controls:**

- do not use Kaizen in an untrusted/shared browser profile;
- protect the Windows/OS account and device storage;
- store exported backups in an encrypted user-controlled location;
- never claim browser records are encrypted;
- whole-product backup, corruption recovery and local packaging verification remain mandatory;
- a future encrypted store/key-custody design requires a new ADR and migration.
