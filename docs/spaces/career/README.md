# Career Space — Data Model & Features

Last synchronized with the current route/state architecture: 2026-08-18.

## Overview

The **Career** space (`/career`) is a 9-module life-OS for professional
growth. All data is persisted to `localStorage` under the key `kaizen.career`
(the backend Express stub in `backend/` is not wired to the frontend, matching
the architecture used by the Workout space).

## Navigation pattern

- **No left rail / bottom tabs.** The entire space is wrapped in
  `CareerShell` — a single-page immersive chrome with obsidian/cyan palette
  (vs. workout's obsidian/red) and a floating **⚔ COMMAND ⚔** button in the
  top strip.
- Hitting COMMAND summons the `CommandCard` inline (not a modal), which
  renders the `GoldenDragon` SVG only while the card is mounted
  (`AnimatePresence`). The dragon animates path-length draw-in of its body,
  head/horns/crimson eye/whiskers, claws, tail, wisdom pearl with swirling
  flames, drifting embers, and a `改善` + `成長` kanji watermark.
- Two diagonal katana slashes (cyan + gold) slice across on card reveal.
- A `SectionSlash` overlay plays between sub-page navigations.
- Tiles are numbered with Roman sigils (I–VIII), colored left rails,
  staggered entrance, hover gold-shimmer sweep, active-dot with `layoutId`.
- Escape closes the card; clicking a tile routes instantly.

## Modules (9)

| Sigil | ID         | Label     | Color      | Domain                                                      |
|------:|------------|-----------|------------|-------------------------------------------------------------|
| I     | roadmaps   | Roadmaps  | gold       | Parallel learning tracks with phases, milestones, resources |
| II    | skills     | Skills    | crimson    | Skill inventory with 1-10 sliders, decay warning, radar     |
| III   | certs      | Certs     | cyan       | Courses & certifications with expiry countdown              |
| IV    | network    | Network   | magenta    | Contact Rolodex, health/influence scores, favor bank        |
| V     | jobs       | Jobs      | amber      | Application kanban (researching → ghosted), ghost timer    |
| VI    | portfolio  | Portfolio | lime       | Achievement vault + portfolio project builder               |
| VII   | daily      | Daily     | violet     | Standup, focus, meetings, mood/stress, W/L/C logs           |
| VIII  | global     | Command   | steel      | Timeline, satisfaction, burnout, vision, sabbatical, FIRE   |

## Data model (`frontend/lib/careerTypes.ts`)

```ts
CareerState {
  // New domain
  roadmaps:      CareerRoadmap[]
  skills:        CareerSkill[]
  courses:       CareerCourse[]
  contacts:      NetworkContact[]
  applications:  JobApplication[]
  companies:     CompanyDossier[]
  questions:     AppQuestion[]
  achievements:  Achievement[]
  projects:      PortfolioProject[]
  resumes:       ResumeVersion[]
  bullets:       ResumeBullet[]
  testimonials:  Testimonial[]
  days:          WorkDayEntry[]
  meetings:      MeetingEntry[]
  timeline:      TimelineEvent[]
  satisfaction:  WeekSatisfaction[]
  burnoutChecks: BurnoutCheck[]
  sabbaticals:   SabbaticalPlan[]
  retirement?:   RetirementPlan
  sideHustles:   SideHustle[]
  ip:            IPItem[]
  speaking:      SpeakingEngagement[]
  visionBoard:   VisionBoardItem[]

  // Legacy migration compatibility (not rendered by current routes)
  tracks:        LegacyTrack[]
  goals:         LegacyGoal[]
  notes:         LegacyNote[]
  linkedin?:     string
}
```

### Roadmaps (the "centerpiece")

```ts
CareerRoadmap {
  id, name, icon, color, description
  template: "devops"|"networking"|"linux"|"mlops"|"cloud"|"custom"
  weeklyHoursTarget, priority: 1-10, status
  startLevel, targetLevel      // 1-10 before/after
  phases: CareerPhase[]
  startedAt, completedAt, notes
}
CareerPhase { id, title, description, milestones: CareerMilestone[] }
CareerMilestone {
  id, title, description
  hoursEstimate, hoursActual
  targetProficiency: 1-10
  selfRatingBefore?, selfRatingAfter?   // 1-10
  resources:  CareerResource[]          // course/book/video/docs/lab/article
  projects:   CareerProject[]           // hands-on builds
  labChecklist: CareerLabItem[]         // boolean checklist
  quiz: CareerQuizItem[]                // yes/partial/no self-check
  notes?, done, completedAt?
  dependsOn?: string[]                  // milestone ids (prereqs)
  skillTags?: string[]                  // links to skill inventory
}
```

Five pre-built templates ship in `frontend/lib/careerRoadmaps.ts`:

| Template   | Phases | Milestones | Anchor technologies                         |
|------------|-------:|-----------:|---------------------------------------------|
| DevOps     | 8      | ~25        | Linux→bash→Docker→K8s→Terraform→CI/CD→Cloud→SRE |
| Networking | 6      | ~18        | OSI→subnetting→STP→OSPF→BGP→VPN→SD-WAN→cloud VPC |
| Linux      | 7      | ~20        | CLI→permissions→systemd→networking→hardening→perf→containers |
| MLOps      | 8      | ~20        | Python/Pandas→sklearn→PyTorch→MLflow→Airflow→serving→Kubeflow→LLMOps |
| Cloud      | 8      | ~22        | VPC→EC2/ASG→S3/RDS→IAM→ECS/EKS→Lambda→Terraform→Well-Architected |

Each milestone carries curated resources (books, courses, docs) and
hands-on project/lab prompts. Calling `cloneTemplate(id)` reifies a fresh
copy with re-generated ids so multiple roadmaps don't collide.

### Skill inventory

```ts
CareerSkill {
  id, name, category
  proficiency, confidence, interest   // 1-10
  usage: "daily"|"weekly"|"monthly"|"rarely"
  lastUsedAt                           // epoch ms for decay (90d stale / 180d rotten)
  certIds?, projectIds?, mentor?, resources?, portfolioLinks[]
  growth: {date, level}[]              // sparkline history
  desiredLevel?                        // gap analysis
}
```

### Certs & courses

```ts
CareerCourse {
  id, name, provider, startDate?, endDate?
  completed, certReceived, expiryDate?
  hoursInvested, rating?, notes?, keyTakeaways?, applicationNotes?, skillTags?
}
```
Expiry is auto-highlighted: `<30d` red, `<90d` amber, else cyan.

### Network

```ts
NetworkContact {
  id, name, company?, role?, email?, phone?, preferredChannel?
  relationship: "mentor"|"peer"|"report"|"client"|"prospect"|"recruiter"|"friend"
  healthScore, influenceScore           // 1-10
  birthday?, interests?
  lastContactAt, nextFollowUpAt?
  favorsGiven, favorsReceived           // imbalance highlighted when |Δ|≥3
  interactions: NetworkInteraction[]    // date, type, summary, goldNuggets
  jobHistory?, referredBy?, nextTalkPrep?
}
```
Staleness auto-computed: `>90d` amber, `>180d` red "COLD" badge.

### Jobs

```ts
JobApplication {
  id, companyId?, role, appliedAt, stage
  lastContactAt?, recruiter?, referral?, resumeVersionId?
  offerBase?, offerBonus?, offerEquity?, offerBenefits?, offerFinal?, counterOffer?
  rejectionFeedback?, vibeScore?, decisionWeight?, notes?
  followUpReminderAt?, timeSpentMin?
}
```
Kanban stages: `researching → applied → phone-screen → tech-interview → onsite → offer → rejected | ghosted | accepted`. Ghosting: 14 days without `lastContactAt` → auto moves to `ghosted`.

### Portfolio

```ts
Achievement      { id, title, date, category, description?, impact?, tags?, icon?, privateNote?, trackId? }
PortfolioProject { id, title, summary?, role?, technologies[], results?, challenges?, learnings?, url?, repoUrl?, heroImage?, private, relevanceTags?, skillTags?, caseStudy? }
ResumeVersion    { id, name, sentTo?, sentAt?, bullets[], atsKeywords[], tailoredChecklist[] }
Testimonial      { id, from, role?, quote, date? }
```
Categories: `technical | leadership | sales | product | process | personal | other`.

### Daily workflow

```ts
WorkDayEntry {
  date, standup?, meetings: MeetingEntry[]
  focusSessionsMinutes
  timeAllocation { meetings, coding, writing, emails, planning, other }
  workLog?, mood, stress              // 1-10
  wins[], learnings[], challenges[]
}
MeetingEntry {
  id, title, date, durationMin, attendees?, plannedAgenda?, actualDiscussion?,
  roiScore?, decisions?, actionItems?
}
```
Today's row is auto-created on load; streak counter tracks consecutive days
with content.

### Global / Command

```ts
TimelineEvent    { id, date, type, title, description?, icon?, refId? }
WeekSatisfaction { date, score }
BurnoutCheck     { date, workload, control, rewards, community, fairness, values, score }
SabbaticalPlan   { id, targetDate?, savingsTarget?, savingsCurrent?, durationWeeks?, notes? }
RetirementPlan   { currentSavings?, targetAnnual?, targetAge?, projectedAge?, notes? }
VisionBoardItem  { id, type: "quote"|"image"|"goal", content, imageUrl? }
```
Timeline is auto-composed from achievements + portfolio projects + manual
events. Burnout is the Maslach 6-subscale mini-check averaged into a
LOW/MILD/MODERATE/HIGH risk rating.

## Store actions (`frontend/lib/store.tsx`)

Legacy (tracks/concepts/goals/achievements/linkedin) are all preserved. New
actions:

- `updateCareer(updater)` — generic patch, used by every new section
- `addRoadmapFromTemplate(templateId, name?)` — clones a seed
- `toggleMilestoneDone(rmId, phId, msId)` — marks milestone complete,
  stamps `completedAt`, fills `hoursActual` from estimate if unset
- `updateMilestone(rmId, phId, msId, patch)` — generic milestone patch
- `archiveRoadmap(id)` / `deleteRoadmap(id)`

## Migration

`migrateCareer()` handles legacy `kaizen.career` blobs (which only had
`tracks/goals/achievements/linkedin`) on first load:

1. If `roadmaps` is missing/empty, seeds all 5 templates.
2. Legacy achievements get `category: "other"` merged in.
3. Resume bullets from legacy `tracks[].resumeBullets` are lifted into the
   new top-level `bullets[]` without duplicates.
4. Legacy tracks/goals/notes remain in the state contract so old browser data can
   migrate without loss; the removed pre-sector UI components no longer ship.

## Design palette

- Obsidian ink `#0a0709`, parchment `#f2e6c9`
- Royal crimson `#b91c1c`/`#7f1d1d` (skill accent)
- Emperor gold `#d4af37`/`#fde68a` (primary brand, headings, CTA)
- Steel cyan `#06b6d4`/`#67e8f9` (**career accent** — top strip, COMMAND button, progress)
- Dragon magenta `#ec4899` (network accent)
- Lime `#a3e635`, violet `#8b5cf6`, amber `#f59e0b`, steel `#cbd5e1`

Typography: Inter (UI), JetBrains Mono (data), Cinzel Decorative
(`.imperial-name`), Cinzel (`.emperor-title`), Cormorant Garamond
(`.serif-body`), Shippori Mincho/Noto Serif JP (`.font-jp`, for 改善/成長).

## Pre-built Roadmap dependency graph

Milestones within templates have implicit phase-gating (you shouldn't
attempt Kubernetes before Docker, etc.). The drilldown UI respects
`milestone.dependsOn[]` when present: locked milestones show a lock icon,
explain which prereqs block them, and their checkbox is disabled.

## Intentional next-up scope

The routed modules now include the previously planned radar/growth, interview bank,
decision matrix, resume/ATS, relationship graph and Global-domain UIs. Remaining
items from the current feature audit are:

- Roadmap dependency SVG edges (lock/blocker semantics already ship)
- True drag-ranking and a global learning-resource library
- Skill force/mind-map view and explicit decay recommendation copy
- Deep-link UI for skill cert/project references
- Automatic portfolio case-study generation and hero-image upload
- Per-session focus graph and agenda/time-block planner
- Vision-board image upload and one WLB aggregate score

See `docs/reference/FEATURES.md` for row-level status.
