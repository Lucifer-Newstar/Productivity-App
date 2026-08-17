# Kaizen Feature Status

Last audited on the `entertainment` branch on 2026-08-16.
All five spaces now have dedicated implementations: **Workout** (battle-tested),
**Career** (Night HUD / Blueprint), **Projects / Forge** (full PM OS), **Health / VITAL-SIGN**
(v1.1 Waves 1–9), and **Entertainment / AFTERGLOW** (v1.0 Waves 0–9; 94 complete,
2 intentional partials, 0 missing from its approved 96-feature specification).

Per-space deep dives: [`spaces/workout`](spaces/workout/README.md) ·
[`spaces/career`](spaces/career/README.md) ·
[`spaces/projects`](spaces/projects/README.md) ·
[`spaces/health`](spaces/health/README.md) ·
[`spaces/entertainment`](spaces/entertainment/README.md). Bug log: [`bugs/BUGS.md`](bugs/BUGS.md).

Legend:

- ✅ Shipped, wired to the store, persists across refresh
- 🟡 Present in the UI but partial / MVP-only
- ❌ Not yet implemented

---

# Workout Feature Status

Audited against the 149-feature checklist (35 cali + 45 gym + 22 cardio + 47 global).
Workout ships fully on `main`; see prior doc revisions for the per-feature breakdown.

---

# Career Feature Status

The `/career` space ships **9 modules** (8 core + Projects Hub SECTOR::09) under a
cyber/HUD COMMAND shell with two fully distinct themes:

- **Night HUD (dark, default)** — deep navy→black radial, animated cyan grid, scanlines,
  sweep beam, vignette, neon cyan/violet/green/pink/orange/yellow accents, `> cmd_` terminal
  prompt with blinking caret, rotating dashed CPU icon, corner registration brackets,
  JetBrains Mono everywhere.
- **Blueprint schematic (light)** — cream engineering-paper (`#f5f1e6`), static two-layer
  blue grid (fine 20 px + major 100 px), paper-grain noise, deep cyan-blue (`#0c4a6e`)
  structural ink with burnt-orange (`#c2410c`) pencil-markup accents, registration-corner
  marks, Terminal icon in the brand tile, footer label `kaizen.career // v2.0 — blueprint`.

The floating `> cmd_` trigger opens an inline terminal-styled CommandCard that presents 9
modules as numbered 01–09 tiles (keyboard: arrows/jkhl to move, 1–9 to jump, Enter to pick,
Esc to close). A horizontal cyan HudFlash transitions between routes. Auto-seeded on
first visit: 5 roadmap templates (DevOps/Networking/Linux/MLOps/Cloud) cloned with full
phases, milestones, resources, projects, labs, and hours.

Routes: `/career` → redirect → `/career/projects` (the hub);
`/career/projects|roadmaps|skills|certs|network|jobs|portfolio|daily|command`.

## 0. Projects Hub (unified mission control) — SECTOR::09

| # | Feature | Status |
|---|---|---|
| 1 | Default landing for /career | ✅ |
| 2 | 6 stat tiles (roadmaps, milestones, hours, pipeline, shipped, network) | ✅ |
| 3 | Active tracks panel with mini donuts + progress bars | ✅ |
| 4 | In-flight projects from roadmap milestones (with tech tags + %) | ✅ |
| 5 | Shipped wins (recent portfolio) with results + tech tags | ✅ |
| 6 | Job pipeline sidebar with stage-colored dots | ✅ |
| 7 | 7-day follow-ups (jobs + network, overdue in red) | ✅ |
| 8 | Skill heat: HOT vs NEEDS LOVE with 10-bar levels | ✅ |
| 9 | Today panel (meetings + open follow-ups) | ✅ |
| 10 | Recent timeline events rail | ✅ |

## 1. Roadmaps (template forge + parallel trackers) — SECTOR::01

| # | Feature | Status |
|---|---|---|
| 1 | Template forge (5 curated templates) | ✅ DevOps 8/22, Networking 6/17, Linux 7/20, MLOps 8/18, Cloud 8/23 |
| 2 | Parallel roadmaps | ✅ |
| 3 | Weekly hours allocation donut | ✅ Multi-segment HoursDonut across active tracks |
| 4 | Priority 1–10 | ✅ +/- buttons on each card; cards auto-sort by priority desc |
| 5 | Phases | ✅ Collapsible chevron per phase, per-phase progress |
| 6 | Milestones | ✅ Title, est/actual hours, before/after self-rating, resources, projects, lab checklist, mastery quiz |
| 7 | Dependencies + locking | ✅ `dependsOn[]`; locked milestones render 🔒 with disabled checkbox + blocker chips listing prerequisite titles (first 3) |
| 8 | Dependency graph/edges (SVG lines) | 🟡 Lock chips + blocker chips communicate dependencies; SVG lines deferred (fragile on variable-height rows) |
| 9 | Resources toggle | ✅ Checkbox per resource |
| 10 | Projects toggle | ✅ Checkbox per project |
| 11 | Lab checklist | ✅ Per-item toggle |
| 12 | Mastery self-check (quiz) | ✅ Default 3-question yes/partial/no seeded; % color-coded |
| 13 | Log hours | ✅ Input + quick-add; persists to `hoursActual` |
| 14 | Before/after proficiency | ✅ Two 1–10 sliders |
| 15 | Estimated vs actual hours | ✅ |
| 16 | Donut progress ring per roadmap | ✅ |
| 17 | 4-tile stat header | ✅ ACTIVE / COMPLETE / TOTAL HRS / MILESTONES |
| 18 | Completion celebration | ✅ Fixed-overlay Celebration modal with trophy + "CLAIM VICTORY"; fires once per roadmap on 100% |
| 19 | Next Action button | ✅ Scrolls + auto-opens phase of first undone milestone |
| 20 | Archive / delete | ✅ |
| 21 | Skill-bump toast on milestone complete | ✅ Non-modal HUD toast bottom-right; fuzzy keyword matching against skill inventory; 1–3 level bump; auto-dismiss 10s; Bump/Later buttons |
| 22 | Custom-roadmap forge wizard | ✅ 3-step: identity (name/icon/color/hours/priority/levels) → phases + milestones inline editor → review with stats + FORGE |
| 23 | Drag-rank priority | 🟡 +/- buttons achieve reorder; true HTML5 DnD deferred |
| 24 | Global resources library | ❌ |

## 2. Skills inventory — SECTOR::02

| # | Feature | Status |
|---|---|---|
| 1 | 1–10 proficiency slider | ✅ |
| 2 | Confidence slider | ✅ |
| 3 | Interest slider | ✅ |
| 4 | Usage frequency | ✅ daily/weekly/monthly/rarely dropdown |
| 5 | Category grouping | ✅ |
| 6 | "Used today" touch | ✅ Button stamps `lastUsedAt = now` |
| 7 | Decay warnings | ✅ STALE >90d amber; ROTTING >180d red |
| 8 | Radar/spider chart | ✅ SkillRadar SVG, dashed confidence overlay, hover tooltips |
| 9 | Mind-map / force graph | ❌ Radar serves as viz; graph deferred |
| 10 | Growth chart | ✅ 21-day sparkline with peak/avg/low |
| 11 | Top skills leaderboard | ✅ Top-5 with ▲/▼ delta |
| 12 | Mentor field + UI | ✅ Expandable card |
| 13 | Portfolio links editor (label+url) | ✅ |
| 14 | Gap analysis (desiredLevel) with orange marker | ✅ Bar shows current vs desired; gap badge |
| 15 | Resources editor (title+optional url) | ✅ |
| 16 | Cert/project links | 🟡 Fields exist on type; no deep-link UI |
| 17 | Decay recommendation text | ❌ Stale/rotting badges only |

## 3. Certs & Courses — SECTOR::03

| # | Feature | Status |
|---|---|---|
| 1 | Add/edit/delete | ✅ |
| 2 | Provider | ✅ |
| 3 | Start/end date | ✅ |
| 4 | Cert-received toggle | ✅ |
| 5 | Expiry date | ✅ |
| 6 | Expiry countdown <90d / <30d / expired | ✅ Color-coded visual bar (2yr window, red/amber/green, striped when expired) |
| 7 | Expiry warning stat chip | ✅ |
| 8 | Hours invested | ✅ |
| 9 | Rating 1–10 | ✅ Stars shown |
| 10 | Key takeaways / notes | ✅ |
| 11 | Course-in-progress bar | ✅ Visual progress bar |
| 12 | 6th stat chip (active courses) | ✅ |

## 4. Network — SECTOR::04

| # | Feature | Status |
|---|---|---|
| 1 | Add/edit/delete contacts | ✅ |
| 2 | Relationship group filter | ✅ Mentor/Peer/Report/Client/Prospect/Recruiter/Friend + All |
| 3 | Health score 1–10 | ✅ Slider + pill |
| 4 | Influence score 1–10 | ✅ |
| 5 | Last-contact staleness | ✅ STALE/COLD badges, days-ago |
| 6 | Favor bank | ✅ +Given/+Received buttons, imbalance ≥3 highlighted |
| 7 | Interaction log | ✅ Date/type/summary/gold-nuggets; last 5 shown |
| 8 | Gold nuggets | ✅ Quoted italic |
| 9 | Company/role fields | ✅ Inline-editable |
| 10 | Touch-base quick button | ✅ Stamps lastContactAt |
| 11 | Reach-out priority queue | ✅ Top-5 by staleness − health |
| 12 | Birthday + 30-day warning badge | ✅ |
| 13 | Preferred channel (message/email/call/coffee/meeting/event) | ✅ |
| 14 | Interests | ✅ |
| 15 | Follow-up reminders + FOLLOW UP badge | ✅ nextFollowUpAt + overdue detection |
| 16 | Referral log (sent/received + company/role/outcome/notes) | ✅ 4-tab card: Details/Log/Referrals/History |
| 17 | Job-history tracker per contact | ✅ company/role/start/left |
| 18 | Network radial graph (SVG) | ✅ YOU center; ring radius = health; angle = relationship group; hot=green/stale=orange/selected=pink |
| 19 | Next-talk prep notes | ✅ |
| 20 | 6 stat chips (contacts/stale/cold/imbalance/b'days/referrals) | ✅ |

## 5. Jobs campaign — SECTOR::05

| # | Feature | Status |
|---|---|---|
| 1 | 8-stage kanban | ✅ Researching/Applied/Phone-screen/Tech-interview/Onsite/Offer/Accepted/Rejected + auto-ghost visual column |
| 2 | Auto-ghost 14d | ✅ Visual move to ghost column after 14 days |
| 3 | Stage chips | ✅ Advance/retreat + "Heard back" button |
| 4 | Notes | ✅ |
| 5 | Salary tracker (base/bonus/equity/benefits/counter/final TC) | ✅ 3-column INITIAL/COUNTER/FINAL |
| 6 | Vibe score 1–5 stars | ✅ |
| 7 | Ghost badge | ✅ Days-since shown |
| 8 | Recruiter field | ✅ |
| 9 | Days-since contact | ✅ |
| 10 | Interview Q bank | ✅ Dedicated tab: Q with tags, search, frequency, answer, green-check when answered; +Question on app card auto-pre-tags |
| 11 | Company dossiers | ✅ Products, funding, recent news, competitors, interview notes, pros/cons |
| 12 | Stats (active/offers/ghosted/conv/best offer) | ✅ 5-chip row |
| 13 | Offer/negotiation log (counter + rejection post-mortem) | ✅ Reason + learnings textareas when stage=rejected |
| 14 | Weighted decision matrix (6-dim: comp/growth/wlb/team/mission/location) | ✅ Sliders → 0–10 color-coded chip |
| 15 | Culture-check (8-dim: remote/pace/mentorship/bar/WLB/mission/comp/diversity) | ✅ Ternary ✓/?/✗ chips in dossier; match score /8 |
| 16 | Time-spent tracker | ✅ Manual +15/+30/+60m quick adds + reset; shown on card |
| 17 | Follow-up reminders | ✅ nextFollowUpAt date + FOLLOW UP badge |
| 18 | Vibe score stars | ✅ |

## 6. Portfolio — SECTOR::06

| # | Feature | Status |
|---|---|---|
| 1 | Achievement vault timeline | ✅ Vertical rail with colored dot + icon + impact + category chip |
| 2 | 7 achievement categories with filter chips | ✅ Technical/Leadership/Sales/Product/Process/Personal/Other |
| 3 | Icon picker (14 icons) | ✅ Palette in add form |
| 4 | Impact metric field | ✅ ⚡ accent-colored per achievement |
| 5 | Project categories (Web/Mobile/Infra/ML/Tool/OSS/Other) + filter chips | ✅ |
| 6 | Projects grid | ✅ Title, role, URL, summary, results, challenges, learnings, tech tags, private toggle, category badge |
| 7 | Project case-study fields (problem/solution/results) | ✅ Inputs in add form + rendered on card in labeled case-study block |
| 8 | Project tech-tag chips | ✅ Inline add with Enter |
| 9 | Resume bullet vault | ✅ Inline-edit textareas, tags, COPY button (COPIED confirmation), delete |
| 10 | ATS keyword scanner | ✅ Sticky panel: comma JD keywords → % match with color gradient; missing-keyword chips; glowing score |
| 11 | Testimonials | ✅ Pink quote cards with from/role/date |
| 12 | Resume version snapshots (Save/Load/Copy/Delete named sets) | ✅ Side panel w/ list, bullet count + date; Load confirms replace; Copy copies bulleted text |
| 13 | Challenges/learnings surfaced on cards | ✅ Labeled CHALLENGE / LEARNED rows |
| 14 | Auto case-study builder | ❌ Fields present; auto-generation would need LLM |
| 15 | Hero image upload | ❌ Text/repoUrl only; no file upload (offline-first) |

## 7. Daily workflow — SECTOR::07

| # | Feature | Status |
|---|---|---|
| 1 | Auto-create today | ✅ useEffect seeds empty day |
| 2 | Day navigator (date picker) | ✅ Timer disabled on past days |
| 3 | Streak counter | ✅ Flame badge, consecutive days with content |
| 4 | Standup (Y/T/B) | ✅ Textarea + AUTO-GEN (synthesizes yesterday's meetings+focus, today's meetings+FUs, blockers) + COPY |
| 5 | Deep-work live timer | ✅ MM:SS monospaced, Play/Pause/Reset, glow while running, auto-persist; disabled past days |
| 6 | Focus minutes manual + quick-add (+15/30/60/90) | ✅ |
| 7 | Meeting entries | ✅ Title, duration, attendees, agenda, discussion, decisions, ROI 1–5 |
| 8 | Meeting follow-up checklists | ✅ Add/toggle/delete per meeting; OPEN FU badges |
| 9 | Meeting templates (1:1/Standup/PR Review/Retro/Sprint Plan/Blank) | ✅ Pre-fill title + duration + agenda skeleton |
| 10 | Time-allocation donut | ✅ 6-segment (meetings/focus/coding/writing/emails/planning/other) inline editors |
| 11 | Mood 1–10 slider | ✅ |
| 12 | Stress 1–10 slider | ✅ |
| 13 | Wins / Learnings / Challenges quick-lists | ✅ |
| 14 | Work log free-text | ✅ |
| 15 | 14-day focus-history bar chart | ✅ Green ≥2h / orange ≥1h / red <1h bars with hover tooltips |
| 16 | Avg mood/stress stats | ✅ Across all days |
| 17 | Meeting ROI stat chip in header | ✅ Count + avg ROI stars |
| 18 | Open follow-ups stat chip | ✅ |
| 19 | Per-session focus graph | 🟡 14-day aggregate bar chart shipped |
| 20 | Focus-block planner / agenda time-blocking | ❌ |

## 8. Global command — SECTOR::08

| # | Feature | Status |
|---|---|---|
| 1 | Timeline | ✅ Auto-aggregates achievements/projects/jobs/certs/skills/milestones + manual events; 9 event kinds |
| 2 | Weekly satisfaction | ✅ WeekSatisfaction[] + UI |
| 3 | Maslach burnout (6 subscales) | ✅ 6 sliders → LOW/MILD/MOD/HIGH color-coded |
| 4 | Burnout history sparkline (30-check SVG area chart) | ✅ Gradient fill + dot on latest + dashed gridlines |
| 5 | Sabbatical planner | ✅ Target date + savings target/current + duration weeks per sabbatical |
| 6 | Retirement planner | ✅ Current savings, target annual spend, target/projected age, notes |
| 7 | Vision board | ✅ Text quote/goal/idea items, add/delete |
| 8 | Hustle / side-hustles tab | ✅ Name, stage (idea/building/launched/scaling), $/mo, hrs/wk, goal; cards show effective $/hr; totals footer |
| 9 | IP registry | ✅ Patent/copyright/trademark/idea log with date + notes |
| 10 | Speaking events log | ✅ Title/event/date/notes, sorted reverse-date |
| 11 | Vision board image upload | ❌ Text only (offline-first; no file backend) |
| 12 | WLB aggregate | 🟡 Daily stress/mood visible; no single aggregate number |

## Cross-cutting

| Area | Status |
|---|---|
| Themes — two unique modes | ✅ Night HUD (default) + Blueprint schematic (light). All new panels use `var(--cr-*)` CSS vars (bg/fg/border/card/accent/violet/pink/yellow/red) so blueprint auto-themes via the `[data-lt="1"]` override in CareerShell |
| Theme toggle | ✅ Sun/Moon in header, persists to `kaizen.theme`; footer labels active mode |
| LocalStorage persistence | ✅ `useLocalState` in StoreProvider, `kaizen.*` keys |
| Hydration safety | ✅ Mounted guard in CareerPage HOC; boot splash pre-mount |
| Migration `migrateCareer` | ✅ Seeds 5 roadmap templates on first visit; lifts legacy fields |
| Section transitions | ✅ HudFlash horizontal cyan scan-sweep on route change |
| COMMAND button + card | ✅ Terminal `> cmd_` prompt with blinking caret; inline card with 01–09 tiles |
| Typography | ✅ JetBrains Mono enforced across career via `.career-root`; `.career-root .imperial-name/emperor-title/serif-body/font-jp` overridden to mono; zero workout imperial classes used in career |
| Keyboard nav | ✅ ↑↓/jk/hl moves, 1–9 jumps, Enter picks, Esc closes; focus ring + footer hints |
| Dual theme on every panel | ✅ All 9 sections + wizard + toasts use CSS vars; zero hardcoded dark-only palette (`#f3e9d2`, `#d4af37`, `#1a0f0a`) remain in career sections |
| Backend CRUD routes | ✅ `/api/career/*` prefixed in Express (untested); frontend offline-first |
| All routes static-prerendered | ✅ Next `next build` shows ○ for every /career/* route |
| tsc --noEmit clean | ✅ Zero type errors |

---

# Forge (Projects OS) Feature Status

The `/projects` space ships **4 sectors** under an industrial anvil shell with two
fully distinct themes that are unique from both Workout's imperial Japanese and Career's
cyber/blueprint systems:

- **Foundry (dark, default)** — deep iron/charcoal black (`#0f0d0b` → `#080706` → `#000`)
  radial, riveted steel-plate cards, hazard stripes, molten amber (`#f59e0b`) primary,
  hot-orange (`#ea580c`), quench-cyan (`#06b6d4`), blood-red (`#ef4444`), steel-grey
  (`#94a3b8`), pulsing heat rivets, hammer-strike vertical transition (molten line + glow),
  heavy Oswald condensed headers + JetBrains Mono metrics + Special Elite pencil text
  (in light mode).
- **Drafting Room (light)** — yellowed vellum/tracing paper (`#f3ecdd` → `#e8dec4` →
  `#d9cba9`), graphite (`#1f2937`) structural ink, brass (`#92400e`) rivets/grommets,
  burnt-orange (`#c2410c`) pencil annotations, fine 20/100-px graphite grid with no
  animation (paper doesn't move), rubber-stamped APPROVED marks, Special Elite font for
  pencil comments, Joswald for headers. No parchment/gold/kanji (Workout) and no cream
  blueprint/cyan (Career) — vellum + brass + pencil is the signature.

The floating `STRIKE` anvil-button opens an inline ActionPanel with 4 sector plates
(§01–§04) plus a quick-forge input. A vertical molten HammerStrike transitions between
routes with a radial heat bloom. SPACES[] rebranded projects → **Forge** (⚒️ #f59e0b).

Routes: `/projects` (Foundry, default), `/projects/quarry` (tasks), `/projects/smelter`
(brainstorms/retro), `/projects/vault` (archive/obits), `/projects/p/[id]` (project
drilldown). Cross-links back to `/career` via a bridge callout on Foundry.

## 1. Foundry (active projects dashboard) — §01

| # | Feature | Status |
|---|---|---|
| 1 | Furnace header with title + "LIGHT FORGE" button | ✅ |
| 2 | Quick-forge inline form (title/codename/color-swatch/icon) | ✅ 6 colors, 8 icons, strike button, on-success confetti burst + toast |
| 3 | **Daily forge pulse** — 1–10 satisfaction score per active heat, tracked daily | ✅ Quick-log bar under header, toasts on log |
| 4 | 5 stat plates (ACTIVE / ON TRACK / COLD / SHIPPED / HOURS) | ✅ Riveted steel plates |
| 5 | Anvil.today panel (today-due tasks per project with quick-toggle) | ✅ |
| 6 | Active heats grid with color heat-stripe + health status chip | ✅ 6 health states (ON TRACK/BLOCKED/OFF TRACK/PAUSED/SHIPPED/DEAD) w/ icons |
| 7 | Progress bars (milestones %) per project | ✅ Animated on mount |
| 8 | Next-task preview per project card | ✅ |
| 9 | Metadata row (priority, energy/complexity, deadline) | ✅ |
| 10 | Cold Metal section (blocked/off-track/paused) with issue preview | ✅ |
| 11 | Career bridge callout → /career | ✅ |
| 12 | STOKE FURNACE demo-seed button (empty-state only) | ✅ Seeds 7 projects + tasks + SWOT + 5 frameworks via seedForgeDemo() |
| 13 | Direct drilldown → /projects/p/[id] | ✅ Cards clickable |
| 14 | Parking Lot panel — top ideas, one-click ▲TASK promote to Quarry | ✅ Top 8 parked ideas visible, X delete |
| 15 | Velocity plate (8-wk bars + pulse/burndown) | ✅ |

## 2. Project drilldown — `/projects/p/[id]`

| # | Feature | Status |
|---|---|---|
| 1 | Hero plate w/ large icon, codename, health stamp, action buttons (SHIP / KILL / REHEAT) | ✅ |
| 2 | Project brief (title, rich brief, why-this-matters manifesto, success metrics, rejection criteria) | ✅ |
| 3 | Deadline + check-in frequency (daily/weekly/biweekly/monthly) | ✅ |
| 4 | Priority / Energy / Complexity 1-10 sliders | ✅ |
| 5 | Heat status 6-state picker | ✅ |
| 6 | Budget tracker (estimated vs actual + +$50 quick-add, over-budget red) | ✅ |
| 7 | Scope baseline textarea | ✅ |
| 8 | Milestones (add/toggle/delete/date/title) | ✅ |
| 9 | Premortem 5-failure-mode table (failure/mitigation/likelihood) | ✅ Enforces ≤5 rows |
| 10 | Risk register (description/probability/impact/mitigation/contingency/status) | ✅ |
| 11 | Issue log (description/impact/priority/status) | ✅ |
| 12 | Quality checklist (toggle/rename/delete) | ✅ |
| 13 | Stakeholder crew (name/role/power/interest/stance/notes) | ✅ Inline-editable (name/role/power/interest/stance dropdowns) |
| 14 | Stakeholder comms log (date/person/channel/topic/summary/action-items) | ✅ |
| 15 | Post-mortem / obituary editor (why-stopped/learned/start-again yes/maybe/no) | ✅ Auto-created when KILL is pressed |
| 16 | Project archive toggle (archive unarchives via REHEAT) | ✅ Shipped/dead auto-archived |
| 17 | SHIP button → marks complete + archived + completion date + celebration burst | ✅ |
| 18 | KILL button → prompts for reason + creates obituary, moves to vault | ✅ |
| 19 | 3 gauge readouts (progress %, budget spent, tasks done/total) | ✅ Animated |
| 20 | **Gantt mini-chart** (SVG) for dated milestones, auto-scaled timeline with connecting lines, done-state colored | ✅ Auto-renders when ≥2 dated milestones |
| 21 | File links editor (label + path/URL, add/delete) in brief tab | ✅ |
| 22 | Goal alignment field (ties heat to life/career goals) | ✅ |
| 23 | Handover doc + Continuity plan fields (resilience planning) | ✅ |
| 24 | **OPS tab** (new 7th plate): Change Requests, Resources w/ utilization bars, Quality Metrics, Cost/Benefit calculator (payback months), Social impact, Regulatory/Compliance checklist, Go/No-Go logger, Satisfaction pulse 1–10 w/ sparkline | ✅ |
| 25 | **Weekly status report generator** — GENERATE THIS WEEK auto-builds from completed tasks, mood, hours; collapsible editor | ✅ |
| 26 | **Power × Interest stakeholder matrix** (SVG quadrant map: Manage closely / Keep satisfied / Keep informed / Monitor) with stance-colored initials | ✅ Crew tab now shows full editing + matrix |
| 27 | Stakeholder stance selector (champion/ally/decider/influencer/neutral/opponent) w/ color coding | ✅ |
| 28 | **SHIP → Portfolio bridge** — confirm dialog pushes a case-study stub (problem/solution/results) to career.projects portfolio | ✅ |

## 3. Quarry (task kanban) — §02

| # | Feature | Status |
|---|---|---|
| 1 | 5-column kanban: TO DO / FORGING / QUENCH / JAMMED / SHIPPED | ✅ |
| 2 | Inline per-column +ADD BLOCK entry with Enter-save | ✅ |
| 3 | One-click move buttons (→col label) per card | ✅ |
| 4 | Toggle-done checkbox → SHIPPED column, reverse-toggle to restore | ✅ Celebration burst + toast on ship |
| 5 | Per-task priority chip | ✅ |
| 6 | Project filter dropdown → only that heat's tasks | ✅ |
| 7 | TODAY filter toggle | ✅ |
| 8 | Toggle-today button per card | ✅ |
| 9 | Eisenhower matrix view (auto-buckets by importance/urgency 1-10 sliders) | ✅ |
| 10 | Effort × Impact scatter-plot SVG (Quick Wins / Big Bets / Fillers / Thankless quadrants, colored circles w/ project icon, dropshadow) | ✅ |
| 11 | Matrix mode switcher (KANBAN / EISENHOWER / EFFORT) | ✅ |
| 12 | Subtasks (expandable) | ✅ Expandable TaskEditor per card: add/delete/toggle subtasks, title edit, notes, due date, est/actual mins, priority, EFFORT/IMPACT/ENERGY/FOCUS/IMPORTANCE/URGENCY sliders, tags, stuck notes |
| 13 | Drag-and-drop between columns | ✅ HTML5 draggable on cards, onDragOver/onDrop on columns, live ghosting while dragging |
| 14 | Task energy/focus ratings + pomodoro quick-log + stuck toggle | ✅ Per-card +🍅 button, JAM toggle, TODAY/NEXT toggles, aging color (10d amber / 21d red), Clone button |
| 15 | Dependency blocker chips + dependency editor | ✅ Chips show ⛔BLOCKED/✓UNBLOCKED with colored blocker pills; expand TaskEditor → DependsOn checklist editor wires dependsOn[] |
| 16 | Batch-add (one task per line, Ctrl/Cmd+Enter to strike, project picker) | ✅ |
| 17 | Clone task + Next-action flag + NEXT filter | ✅ Copy-icon clone; ▶ NEXT per-task; NEXT filter alongside TODAY |
| 18 | Recurring task templates | ❌ Type supports recurrence field; UI deferred |
| 19 | Archive search | ❌ |

## 4. Smelter (brainstorms & retros) — §03

| # | Feature | Status |
|---|---|---|
| 1 | **13-tab system**: SCRATCH / IDEAS / PERSONAS / DECISIONS / DEC-MATRIX / FISHBONE / 6 HATS / SCAMPER / SWOT / PRO/CON / SCENARIOS / 5 WHYS / LESSONS / RETRO | ✅ |
| 2 | Project-scoping dropdown (all heats or single project) | ✅ |
| 3 | Scratchpad — free-text notes pinned to a project (or global), pencil-font rendering, sorted newest-first | ✅ Inline add + delete |
| 4 | Decision log — date/decision/alternatives/why/approvals stamp | ✅ APPROVED rubber-stamp when checkboxed |
| 5 | SWOT matrix (Strengths/Weaknesses/Opportunities/Threats quadrants) — add/delete entries | ✅ 4 colored quadrants + add inputs |
| 6 | 5-whys root-cause drill (problem + 5 why slots) | ✅ Add/delete; styled as numbered drill bits |
| 7 | Lessons ledger — quick-Log entry at top with date stamp, feed of all lessons w/ category color | ✅ well/poorly/improve/general |
| 8 | Start/Stop/Continue retro template (one per date, 3 columns, append) | ✅ |
| 9 | Pros/Cons with ×1–×5 weighting sliders, weighted verdict bar (GO/NO-GO/TOSS-UP stamp) | ✅ |
| 10 | Future scenario planner (if/then trigger → response playbook) | ✅ |
| 11 | **Ideas board** — normal/worst/reverse/mood/kano modes, ▲/▼ votes, random word-seed button | ✅ |
| 12 | **Persona forge** — name/role/goal/pain with avatar tile, per-project | ✅ |
| 13 | **Weighted decision matrix** — addable criteria w/ weight (1–5) + score (0–10) sliders, total score + progress bar | ✅ |
| 14 | **Fishbone (Ishikawa)** — 6M categories (People/Process/Tools/Materials/Environment/Measurement) with quick-add causes per bone | ✅ |
| 15 | **Six Thinking Hats (de Bono)** — white/red/black/yellow/green/blue textareas, color-coded borders | ✅ |
| 16 | **SCAMPER** — Substitute/Combine/Adapt/Modify/Put-to-use/Eliminate/Rearrange prompts with inline textareas | ✅ |
| 17 | Live smelter timer (GO/STOP/RESET MM:SS) in header | ✅ |
| 18 | Porter / PEST / BMC / VPC / Lean / User story / Event storming / Journey map / Service blueprint / Prototype / Wireframe / Storyboard | ❌ |

## 5. Vault (archive/graveyard) — §04

| # | Feature | Status |
|---|---|---|
| 1 | 3-tab filter: SHIPPED / DEAD / COLD (archived non-terminal) | ✅ |
| 2 | Shipped project cards w/ completion date | ✅ Green |
| 3 | Dead project cards w/ full obituary (why/learned/start-again) displayed inline | ✅ Blood red + SKULL stamp |
| 4 | Cold-storage archived projects | ✅ Steel |
| 5 | REHEAT button to restore to Foundry (clears archived, sets status back to paused) | ✅ |
| 6 | JSON backup export + RESTORE (file picker, confirm replace) | ✅ BACKUP + RESTORE buttons, success/error toasts |
| 7 | **CSV export** of tasks (id/title/project/status/priority/dates/est/actual/poms/E/I/e/f/tags) | ✅ CSV↓ button |
| 7b | **CSV import** of tasks (RFC-4180 parser, codename→projectId resolution, ID de-dupe, bool/number coercion, clamped 1–5/1–10 ranges, confirm prompt, cyan burst on success) | ✅ CSV↑ button, pairs with export |
| 8 | File reference links editor | ✅ In project BRIEF tab |

## Cross-cutting (Forge)

| Area | Status |
|---|---|
| Dual unique themes | ✅ Foundry dark (molten iron/amber/rivets) + Drafting Room light (vellum/brass/graphite/pencil). Entirely distinct from Career's cyan-grid/blueprint and Workout's obsidian/gold/kanji |
| Typography | ✅ Oswald heavy condensed headers + JetBrains Mono metrics + Special Elite pencil annotations; imperial/emperor/serif classes nuked via .forge-root overrides |
| Theme toggle | ✅ Reuses global useTheme() (Sun/Moon); footer reads `kaizen.forge // v1.0 — foundry` / `vellum` |
| LocalStorage persistence | ✅ `kaizen.forge` key, `migrateForge()` defensive seed |
| Velocity plate on Foundry | ✅ 8-week bar chart (steel/amber = created/shipped) + pulse grid (BACKLOG/SHIPPED/PROJECTS/AT RISK), avg velocity, burndown % |
| Career cross-link | ✅ Bridge plate in Foundry links to /career |
| Section transitions | ✅ HammerStrike: vertical molten amber line slam + radial heat bloom (unique from HudFlash and SectionSlash) |
| Particles / celebration | ✅ Shared career:burst event used for amber sparks on forge, green confetti on task/project ship, pink for seed |
| Rubber-stamp animations | ✅ `.forge-stamp` keyframe: scale 1.8→1 rotate -12°→-8° for APPROVED/DEAD/SHIPPED tags |
| Rivet corner markers (four-dot) on every steel-plate | ✅ Reusable class `.riv-tl/tr/bl/br` positioned absolute negative-offset |
| Keyboard shortcuts | ✅ `?` help overlay, `g`-chord nav (`g f/q/s/v/h` or `g 1-4`), `n`/`/` open STRIKE panel, `t` toggle theme, `Esc` closes. Armed-chord indicator in corner, `?` hotkey chip in footer. Ignored while typing/with meta held. |
| STRIKE button sparks | ✅ 14-particle amber spray on click, hammer-rotate animation, global burst fired, `N` hint chip |
| Career-skill alignment check | 🟡 Callout links to /career; auto-skill-bump on project SHIP deferred |
| Portfolio builder bridge on SHIP | ✅ Confirm-push on SHIP creates PortfolioProject in career state with case-study stub |
| Gantt / timeline viz | ✅ Mini-Gantt SVG renders when ≥2 dated milestones |
| Stakeholder satisfaction tracking over time | ✅ Satisfaction pulse (1–10) with sparkline in OPS tab |
| Change requests / Resources / Quality metrics / Regulatory / Go-NoGo / Cost-benefit / Weekly reports | ✅ All in OPS tab |
| Backend CRUD `/api/forge/*` | ❌ Frontend offline-first only |
| All routes static-prerendered | ✅ Next build shows ○ for `/projects`, `/projects/quarry`, `/projects/smelter`, `/projects/vault`, `/projects/p/[id]` |
| tsc --noEmit clean | ✅ Zero type errors |

## Career ↔ Forge bridge roadmap

- [x] "Push to Portfolio" on SHIP: auto-creates a PortfolioProject in career state with title, summary, skills used, and completion date
- [ ] Skill gap alert: when a forged project references a skill with proficiency <4, surface a "level this first" nudge linking to Roadmaps
- [ ] Stakeholder ↔ NetworkContact sync (picker to link a stakeholder to a career.contacts entry)
- [ ] Side-hustle ↔ project cross-pollination (revenue/hours roll-up from Forge)
- [ ] Auto-skill-bump on milestone SHIP (match fuzzy tags → career skills)

## Remaining from the 189-feature PM spec (v1.2+ backlog)

Project mgmt: HTML5 drag-drop across columns ✅ done this wave · Gantt ✅ · remaining: calendar view, swimlanes, custom statuses, critical path, float/slack, resource workload heatmap, CSV import/export, print view, weekly review mode, audit trail.
Tasks: subtask indentation in kanban, recurring templates UI, batch edit, cloning, task-dependency editor UI, completion streak.
Smelter: scratch dividers, screenshot timeline, mind-map, Kano categories surfaced on idea board (must/performance/delight/indifferent/reverse), Porter/PEST/BMC/VPC/Lean/user-story/event-storming/journey-map/service-blueprint/prototype/wireframe/storyboard, Buy-a-Feature, product backlog, sprint planning, paired comparison, design thinking, drawing canvas, mood boards, audio/voice notes, affinity grouping, scorecards, mind-map animation/export, voting (thumbs up/down exist), reverse/worst-idea brainstorm (modes exist on IDEAS tab).
Review: velocity projection lines, effort/impact variance report, skills-gained sync → career, network-from-project sync.
Global: project comparison, template library, energy/time balance dial, CSV import for tasks.

## Wave 7 (post-MVP hardening)

| Area | Feature | Status |
|---|---|---|
| Foundry | Forge calendar 14-day heat grid (dues/milestones/ships, today marker, heat coloring, legend) | ✅ |
| Foundry | Weekly review launcher + steel-plate modal (wins/learnings/next/distractions/mood/rating/hours, auto-logged ships, re-stampable) | ✅ |
| Foundry | StreakStrip 84-day heat strip (current/longest, green cells turn red ≥7d streak) | ✅ |
| Foundry | Cross-project workload heatmap (active heats × 12 weeks, amber intensity) | ✅ |
| Foundry | Velocity projection bar (hatched cyan, linear regression over last 8 weeks) | ✅ |
| Foundry | Project templates (BLANK/SAAS/CONTENT/RESEARCH/BUILD) w/ boilerplate milestones/risks/premortem/QA | ✅ |
| Foundry | Quick actions row: PRINT FORGE / SMELTER/SPRINTS / STAMP WEEK / QUARRY | ✅ |
| Cross-cutting | Print stylesheet (strips chrome/orbs/animations, white bg, black ink, plate borders, break-inside avoid) | ✅ |
| Smelter | SPRINTS tab (create/start/close/delete, ideal-burndown red line, velocity target, task checklist across projects, status pills) | ✅ |
| Quarry | Batch mode (BATCH toggle, checkboxes on cards, orange toolbar: move-to-col/P0-P3/TODAY/NEXT/MELT/CLEAR) | ✅ |
| Drilldown | Resource summary gauges (avg util %, over-budget count, total) with color thresholds | ✅ |
| Store | Streak auto-increment in updateForge (yesterday continuity, 365-day history cap) | ✅ |
| Demo | Seeded sprints S1/S2, 2 weekly reviews, streak history (5 days) | ✅ |
| Shell v2 | LEFT I-BEAM RAIL (anvil brand, stenciled §numerals, vertical writing-mode sector labels, counter-rotating gears, HEAT plate, layoutId active bar) | ✅ |
| Shell v2 | Top beam: THE FORGE Bebas Neue wordmark + molten text-shadow, sprint line, 4 stat chips, semicircle SVG temp gauge, UTC clock, STRIKE, theme | ✅ |
| Shell v2 | Diamond-plate exhaust footer (chevron texture) | ✅ |
| Shell v2 | Chamfered steel-plate clip-path corners + weld-seam ::before | ✅ |
| Shell v2 | All 5 project pages set Page.fullScreen = true (edge-to-edge paint, no TopNav) | ✅ |
| Shell v2 | Typography switched to Bebas Neue for headings (distinct from Career Oswald / Workout Cinzel) | ✅ |

## Wave 8 (subtasks / burndown / skill-bump)

| Area | Feature | Status |
|---|---|---|
| Quarry | Subtask indent rendering in kanban (parent card shows +n subtasks, expander drills inline) | ✅ |
| Quarry | Task recurrence UI (daily/weekly/biweekly/monthly select in TaskEditor) | ✅ |
| Quarry | spawnRecurrence() clones task with offset due date on SHIP | ✅ |
| Quarry | Satisfaction picker (1–5) + Difficulty slider (1–10) per task | ✅ |
| Smelter | Sprint burndown SVG (actual line vs ideal dashed red, remaining count) | ✅ |
| Drilldown | Skill-bump on SHIP: fuzzy tag-match → career skills +0.5 prof (cap 10), adds growth point, links projectId | ✅ |
| Shell | Settings ⚙ modal: forgeName / sprintLengthDays / workStartHour / workEndHour | ✅ |

## Wave 9 (swimlanes / recurrence / difficulty)

| Area | Feature | Status |
|---|---|---|
| Quarry | Swimlanes mode (rows per project × columns per status) | ✅ |
| Foundry | Resource gauges (people / budget / equipment / software) with util % bars | ✅ |
| Drilldown | Critical-path slip gauge (per-task late-day delta; CPM float calc still stubbed) | ✅ |
| Store | logForgeAction(action, target?, detail?) helper exposed on StoreState; capped at 500 entries | ✅ |

## Wave 10 (canvas launch / custom cols / heatmaps / CSV / ember audio)

| Area | Feature | Status |
|---|---|---|
| Smelter | 16 new canvas tabs registered in TABS array (BMC/VPC/Lean/Porter/PESTEL/Stories/Affinity/BuyAFeature/Paired + 7 scaffolded) | ✅ |
| Canvases | Canvases.tsx module introduced (~203 lines) with BMCTab, VPCTab, LeanTab, PorterTab, PestelTab, StoriesTab, AffinityTab, BuyAFeatureTab, PairedTab working | ✅ |
| Quarry | COLUMNS manager (add/rename/remove/reset), COLUMN_COLORS palette, isDoneStatus() = last col id | ✅ |
| Quarry | moveTask/toggleTask/batchOp/addTasksFromBatch all accept string status ids | ✅ |
| Foundry | ResourceHeatmap (projects × people/budget/equipment/software % util, over-budget red) | ✅ |
| Foundry | SkillGapAlerts panel (fuzzy tag→career skills <4/10, untracked-tag warning) | ✅ |
| Vault | Project CSV export (projectsToCSV) + import (csvToProjects), PROJ↓/PROJ↑ buttons | ✅ |
| Shell | Ember soundscape 🔊 toggle (WebAudio brown-noise + random crackle pops; no assets) | ✅ |
| Shell | --fr-violet:#818cf8; --fr-pink:#f472b6 CSS tokens added | ✅ |
| Demo | forgeDemo updated with new collection defaults + 3 seed auditLog entries | ✅ |

## Wave 11 (remaining 7 canvases + docblock sweep)

| Area | Feature | Status |
|---|---|---|
| Canvases | JourneyTab: 5 default stages (AWARE/CONSIDER/DECIDE/USE/RETAIN), per-stage actions/thoughts/pains/opps, 1–10 satisfaction slider, SVG polyline curve | ✅ |
| Canvases | BlueprintTab: 5 swimlanes (CUSTOMER/ONSTAGE/BACKSTAGE/SUPPORT/EVIDENCE) with inline +add | ✅ |
| Canvases | EventStormTab: 4 sticky kinds (event amber/command cyan/aggregate violet/policy green) on 3 dashed swimlanes, staggered auto-place, removable | ✅ |
| Canvases | MindmapTab: radial tree (root violet, larger), + per node adds child at +180px/+36px, inline rename, recursive delete, dashed SVG connectors, 40px grid | ✅ |
| Canvases | CanvasTab (free): tool picker (sticky/box/dot/note) × 4 colors, click-to-place on 24px grid, hover-✕ delete, sticky rotation+shadow | ✅ |
| Canvases | WireframeTab: per-screen cards with sketch nav/hero/CTA/button placeholders + Figma notes, +SCREEN | ✅ |
| Canvases | VoiceTab: MediaRecorder getUserMedia, mm:ss+timer+pulsing dot, Blob URLs on window.__forgeVoice, <audio controls>, transcript textarea, delete revokes URL | ✅ |
| Codebase | Docblock/comment pass across all Forge files (forgeTypes, forgeUtils, pages/projects/*, ActionNav, ForgeShell, Foundry/Quarry/Smelter/Vault/Drill/Canvases/Demo/Store) | ✅ |
| Build | Current Next 16 production build clean; TypeScript/ESLint pass; Projects routes prerender static | ✅ |

## Forge v1.0 status (post wave 11)

Forge is feature-complete against the committed v1 scope (waves 1–11):
- 5 routes (Foundry / Quarry / Smelter / Vault / ProjectDrill), all FULLSCREEN, all static
- 4 Quarry modes (KANBAN / SWIMLANES / EISENHOWER / EFFORT) + runtime custom columns
- 31 Smelter tabs (15 core + 16 canvases)
- Full offline-first state: 40+ collections in ForgeState with migrateForge + buildForgeDemo
- Audit log (capped 500), daily streak tracking, skill-bump into Career, project CSV I/O,
  cross-project resource heatmap, skill-gap alerts, ember soundscape, settings modal,
  ⌘K hotkeys, STRIKE sparks, HammerStrike transitions, Foundry/Drafting dual themes
- Detailed docs: `docs/spaces/projects/README.md`, `CANVASES.md` and `QA.md`

Known v1.2+ backlog (intentional deferral): storyboard canvas, full CPM float calc,
project comparison view, effort variance report, auto-Eisenhower filing, stakeholder↔
NetworkContact picker, drag-to-reposition in Mindmap/Canvas, drag-reorder of custom
columns, HTML5-dnd polish on Kanban cards.

---

# Health (VITAL-SIGN) Feature Status

Health v1.1 is merged into the stable baseline and completed Waves 1–9. The authoritative 281-row audit lives in [`spaces/health/FEATURES.md`](spaces/health/FEATURES.md).

- ✅ Complete: **216**
- 🟡 Partial: **2**
- ❌ Deferred from v1.1 scope: **63**
- Automated Health assertions: **458/458**
- Routes: 10 full-screen pages under `/health/*`
- Workout bridge: shipped for readiness, hydration, injury/burnout advice, recovery and body-composition correlations

# Entertainment (AFTERGLOW) Feature Status

AFTERGLOW v1.0 completed Waves 0–9 on the `entertainment` branch. The authoritative 96-feature audit lives in [`spaces/entertainment/FEATURES.md`](spaces/entertainment/FEATURES.md).

- ✅ Complete: **94**
- 🟡 Intentional partials: **2** — public sharing mode and full deep-form translation
- ❌ Missing: **0**
- Structural/security assertions: **168/168**
- Executable domain/security tests: **42/42** (9 intelligence, 11 reports, 5 social, 9 migration, 8 frontend security)
- Route: `/entertainment` plus five same-origin provider API routes
