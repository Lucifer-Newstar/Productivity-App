# Kaizen Feature Status

Last audited against code on `projects` branch (session: 2026-08-14, wave 2 forge pass). Three independent spaces ship today:
**Workout** (battle-tested on `main`, imperial Japanese/obsidian theme), **Career**
(Night HUD / Blueprint dual themes), and **Forge** (Foundry / Drafting-Room dual themes —
industrial project/task OS).

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
| 3 | 3 quick-stat plates (ACTIVE / COLD / SHIPPED) + HOURS + ON TRACK | ✅ 5-stat row w/ rivets |
| 4 | Anvil.today panel (today-due tasks per project with quick-toggle) | ✅ |
| 5 | Active heats grid with color heat-stripe + health status chip | ✅ 6 health states (ON TRACK/BLOCKED/OFF TRACK/PAUSED/SHIPPED/DEAD) w/ icons |
| 6 | Progress bars (milestones %) per project | ✅ Animated on mount |
| 7 | Next-task preview per project card | ✅ |
| 8 | Metadata row (priority, energy/complexity, deadline) | ✅ |
| 9 | Cold Metal section (blocked/off-track/paused) with issue preview | ✅ |
| 10 | Career bridge callout → /career | ✅ |
| 11 | STOKE FURNACE demo-seed button (empty-state only) | ✅ Seeds 7 projects + tasks + SWOT via seedForgeDemo() |
| 12 | Direct drilldown → /projects/p/[id] | ✅ Cards clickable |

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
| 13 | Stakeholder crew (name/role/power/interest/stance/notes) | ✅ Crew plate (MVP add/delete) |
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
| 14 | Task energy/focus ratings + pomodoro quick-log + stuck toggle | ✅ Per-card +🍅 button, JAM toggle, TODAY toggle, aging color (10d amber / 21d red) |
| 15 | Dependency blocker chips (shows if dependsOn[] are open/done, red/green) | ✅ Per-card; UI for setting dependsOn not yet shipped (type supports it) |
| 16 | Batch-add (one task per line, Ctrl/Cmd+Enter to strike, project picker) | ✅ |
| 17 | Recurring task templates | ❌ Type supports recurrence field; UI deferred |
| 18 | Archive search | ❌ |

## 4. Smelter (brainstorms & retros) — §03

| # | Feature | Status |
|---|---|---|
| 1 | 8-tab system: SCRATCH / DECISIONS / SWOT / **PROS-CONS** / **SCENARIOS** / 5 WHYS / LESSONS / RETRO | ✅ |
| 2 | Project-scoping dropdown (all heats or single project) | ✅ |
| 3 | Scratchpad — free-text notes pinned to a project (or global), pencil-font rendering, sorted newest-first | ✅ Inline add + delete |
| 4 | Decision log — date/decision/alternatives/why/approvals stamp | ✅ APPROVED rubber-stamp when checkboxed |
| 5 | SWOT matrix (Strengths/Weaknesses/Opportunities/Threats quadrants) — add/delete entries | ✅ 4 colored quadrants + add inputs |
| 6 | 5-whys root-cause drill (problem + 5 why slots) | ✅ Add/delete; styled as numbered drill bits |
| 7 | Lessons ledger — quick-Log entry at top with date stamp, feed of all lessons w/ category color | ✅ well/poorly/improve/general |
| 8 | Start/Stop/Continue retro template (one per date, 3 columns, append) | ✅ |
| 9 | Pros/Cons with ×1–×5 weighting sliders, weighted verdict bar (GO/NO-GO/TOSS-UP stamp) | ✅ |
| 10 | Future scenario planner (if/then trigger → response playbook) | ✅ |
| 11 | Reverse-brainstorm / worst-idea / SCAMPER / Porter / PEST / BMC | ❌ |

## 5. Vault (archive/graveyard) — §04

| # | Feature | Status |
|---|---|---|
| 1 | 3-tab filter: SHIPPED / DEAD / COLD (archived non-terminal) | ✅ |
| 2 | Shipped project cards w/ completion date | ✅ Green |
| 3 | Dead project cards w/ full obituary (why/learned/start-again) displayed inline | ✅ Blood red + SKULL stamp |
| 4 | Cold-storage archived projects | ✅ Steel |
| 5 | REHEAT button to restore to Foundry (clears archived, sets status back to paused) | ✅ |
| 6 | One-click JSON export of entire Forge state | ✅ EXPORT button, downloads `kaizen-forge-YYYY-MM-DD.json` |
| 7 | File reference links editor | ✅ In project BRIEF tab |

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
| Keyboard shortcuts | ❌ v1.x relies on button clicks; G?/hotkeys to come |
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
Smelter: scratch dividers, personas, screenshot timeline, mind-map, reverse brainstorm, SCAMPER, Porter/PEST/BMC/VPC/Lean/user-story/event-storming/journey-map/service-blueprint/prototype/wireframe/storyboard, Buy-a-Feature, Kano, product backlog, sprint planning, fishbone, decision matrix, paired comparison, six hats, design thinking, canvas, mood boards, audio/voice, timer, voting/affinity grouping, scorecards, mind-map animation.
Review: velocity projection lines, effort/impact variance report, skills-gained sync → career, network-from-project sync.
Global: daily pulse to dashboard, project comparison, backlog/idea bin, template library, energy/time balance dial.
