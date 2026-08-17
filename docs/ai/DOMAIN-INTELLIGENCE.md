# Domain intelligence

Domain modules share one Constitution, evidence model, tool boundary and policy layer. They differ by contracts, expertise, permissions and evaluation fixtures.

## Global Intelligence

Priority capabilities: Daily Brief, Next Action, Weekly Review, Momentum interpretation, conflict detection and goal alignment. The first experience is a grounded `get_today` slice, followed by cross-domain read-only reasoning.

## Forge Intelligence

- Project risk analyst
- Deterministic deadline forecast interpretation
- Proposed project plan and premortem
- Completion/cancellation autopsy
- Evidence-grounded case-study drafting

Models do not replace velocity, dependency or risk calculations already implemented in Forge.

## Career Intelligence

Highest-priority domain module with:

- target-role gap analysis
- job-description extraction/comparison
- evidence-grounded resume tailoring
- roadmap proposals
- project-specific interview preparation

Imported job descriptions are untrusted content and cannot activate tools or policy.

## Career–Forge evidence graph

**LOCKED DECISION:** this is a formal cross-domain contract.

```text
Forge Project
 ├── technologies
 ├── decisions
 ├── problems solved
 ├── recorded outcomes
 ├── skills demonstrated
 └── lessons
          ↓
Career Evidence
 ├── portfolio case study
 ├── resume bullet
 ├── interview story
 ├── skill validation
 └── job-match evidence
```

Every claim is classified:

```ts
type EvidenceClaimKind =
  | "recorded-fact"
  | "user-confirmed-fact"
  | "ai-suggested-wording"
  | "missing-evidence";
```

Suggested wording cannot be promoted to recorded fact. Missing metrics trigger a clarification, not invention. Generated Career artifacts retain links to Forge source records and snapshot revisions.

## Workout Intelligence

Interpret deterministic readiness, 1RM, volume, progression and PR data for training review, plateau analysis, session suggestions and debriefs. It cannot diagnose or override Health safety warnings.

## Health Intelligence

Pattern interpretation only: sleep, recovery, hydration, stress, habits and personal experiments. Health requires separate consent, cites trends, states uncertainty and never diagnoses. High-risk input routes to existing safety guidance/real-world support.

## Afterglow Intelligence

Lower priority: personalized recommendations, mood discovery, queue optimization, release digest and history analysis. Existing deterministic recommendation logic remains available and should supply grounding.

## Module acceptance

Each module needs domain contracts, read tools, consent review, source-linked responses, deterministic conflict policy, adversarial fixtures, empty-state behavior and explicit non-goals before implementation.