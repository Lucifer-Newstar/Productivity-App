# W0-01 domain revision source audit

**Status:** initial source audit complete; prototype not yet implemented.  
**Repository baseline:** `fd0cdff` parent architecture review commit.

## Current persistence topology

`frontend/lib/store.tsx` owns eight persisted values through one `useLocalState` hook:

| Key | Revision domain |
|---|---|
| `kaizen.tasks` | `core` |
| `kaizen.notes` | `core` |
| `kaizen.career` | `career` |
| `kaizen.workout` | `workout` |
| `kaizen.forge` | `forge` |
| `kaizen.health` | `health` |
| `kaizen.entertainment` | `entertainment` |
| `kaizen.notifications` | `notifications` |

`kaizen.habits` persists directly from `components/Habits.tsx` and belongs to `core`. Theme, bodyweight-prompt acknowledgement and Afterglow notification deduplication are operational/UI metadata and do not increment AI domain revisions.

## Mutation-path findings

1. The eight root values converge on `useLocalState`, which is the best persistence-observation point.
2. Domain setters are internal to `StoreProvider`, but many named actions use them. Workout has the largest named action surface.
3. Generic update functions are used extensively: the source scan found 328 references across 32 UI files for Career, Forge, Health, Entertainment and Notifications updates.
4. Habits bypass the root store and require migration into the revision-aware commit layer or a dedicated Core adapter hook before `core` snapshots can be action-safe.
5. `seedForgeDemo` mutates asynchronously through a direct Forge setter but still passes the root setter boundary.
6. Restore/import/demo/reset flows need explicit transaction labels so one logical replacement increments once.
7. The current Forge ship flow in `ProjectDrill.tsx` performs up to two Career updates followed by a Forge update. This is a cross-domain logical operation but not an atomic transaction. It must be represented as one revision transaction before future AI writes or snapshot-bound evidence generation rely on it.
8. Current persistence occurs in a React effect after state changes. A quota failure leaves current in-memory state ahead of durable state. The bridge must mark persistence unhealthy and refuse action-safe snapshots until reconciled; it must not publish a falsely durable revision.
9. Current multi-tab state is not conflict-safe. V1 must enforce one active bridge writer and invalidate other sessions.

## Proposed revision coordinator boundary

**PROPOSED FOR PROTOTYPE, NOT PRODUCTION:** introduce a framework-neutral revision coordinator consumed by persistence adapters:

```ts
interface RevisionVector {
  installationEpoch: string;
  domains: Record<RevisionDomain, number>;
}

interface MutationDescriptor {
  transactionId: string;
  domains: RevisionDomain[];
  reason: string;
}

interface RevisionCoordinator {
  begin(descriptor: MutationDescriptor): MutationToken;
  commit(token: MutationToken): RevisionVector;
  fail(token: MutationToken, error: unknown): void;
  current(domains: RevisionDomain[]): RevisionVector;
}
```

The coordinator must remain independent from the AI engine and React components. The Domain Bridge reads it; the model never writes it.

## Logical transaction examples

| Operation | Increment |
|---|---|
| Add/toggle/delete Core task | `core +1` |
| Edit Note | `core +1` |
| Mark Habit | `core +1` |
| Update Forge task | `forge +1` |
| Update Career milestone | `career +1` |
| Ship Forge without portfolio/skill change | `forge +1` |
| Ship Forge with Career portfolio/skill changes | `forge +1`, `career +1`, same transaction ID |
| Add Health sleep row | `health +1` |
| Workout completion that also writes Health check-in | each changed domain +1 |
| Notification read state | `notifications +1` |
| Theme or prompt acknowledgement | no domain increment |
| Recompute unchanged analytics | no increment |
| Restore three changed domains | each changed domain +1; never import counters |

## Prototype tests required

- consecutive mutation monotonicity
- no-op update does not increment
- one logical batch increments once
- Forge→Career transaction increments both with one transaction ID
- reload preserves epoch/counters
- corrupt/missing metadata rotates epoch and invalidates snapshots
- stable double-read retries during mutation
- quota/persistence failure blocks action-safe snapshot
- restore bumps only changed domains
- second tab cannot become simultaneous writer
- storage/broadcast event invalidates an existing snapshot
- Habits participates in `core`

## Blockers before implementation

- Decide metadata representation after prototype.
- Define persistence-health state and recovery UX.
- Refactor Forge ship into an explicit cross-domain transaction boundary.
- Bring Habits under revision-aware persistence.
- Audit any future direct browser-storage domain writes.

No runtime source was modified during this audit.