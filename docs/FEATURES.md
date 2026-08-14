# Kaizen Feature Status

Last audited against code on `career` branch (session: 2026-08-14). Two independent spaces ship today:
**Workout** (battle-tested on `main`, imperial Japanese/obsidian theme) and **Career**
(active on `career`, Night HUD / Blueprint dual themes).

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
