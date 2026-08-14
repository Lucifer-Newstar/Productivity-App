/**
 * buildForgeDemo — rich mock data for the FORGE projects OS.
 * Returns a fully-hydrated ForgeState with 5 active projects, dead/vaulted
 * projects, tasks across all statuses, decisions, SWOT, lessons, pomodoros.
 */
import type { ForgeState, ForgeProject, ProjectTask } from "./forgeTypes";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const daysFrom = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const makeProject = (p: Partial<ForgeProject> & Pick<ForgeProject, "codename"|"title"|"color"|"icon">): ForgeProject => ({
  id: uid(),
  brief: "",
  why: "",
  successMetrics: "",
  rejectionCriteria: "",
  status: "on-track",
  priority: 5,
  energyDemand: 5,
  complexity: 5,
  createdAt: today(),
  archived: false,
  checkinFreq: "weekly",
  budget: { actual: 0, currency: "$" },
  stakeholders: [],
  milestones: [],
  premortem: [],
  risks: [],
  issues: [],
  qualityChecks: [],
  comms: [],
  links: [],
  scope: "",
  tags: [],
  velocityPoints: [],
  ...p,
});

const makeTask = (t: Partial<ProjectTask> & Pick<ProjectTask, "projectId"|"title"|"status">): ProjectTask => ({
  id: uid(),
  priority: "P2",
  pomodoros: 0,
  energy: 3,
  focus: 3,
  tags: [],
  subtaskIds: [],
  comments: [],
  createdAt: today(),
  effort: 3,
  impact: 3,
  ...t,
});

export function buildForgeDemo(): ForgeState {
  const p1 = makeProject({
    codename: "ANVIL",
    title: "Forge OS v1",
    brief: "The heavy-industrial project/task/retros OS you're looking at right now. Industrial foundry dark theme + vellum drafting light.",
    why: "You need a dedicated anvil. Career is about the map; Forge is about the hammer.",
    successMetrics: "4 sections live, 10 demo tasks across the Kanban, SWOT + 5-whys + retrospective working, cross-links to career skills.",
    rejectionCriteria: "If no progress in 14 days, archive.",
    status: "on-track", priority: 10, energyDemand: 8, complexity: 8,
    color: "#f59e0b", icon: "⚒️",
    createdAt: daysAgo(3), startedAt: daysAgo(3), deadline: daysFrom(14),
    milestones: [
      { id: uid(), title: "Foundry shell (dual theme)", date: daysAgo(3), done: true, doneAt: daysAgo(3), celebration: "cold beer" },
      { id: uid(), title: "Drilldown + tasks", date: daysFrom(3), done: false },
      { id: uid(), title: "Smelter retrospect", date: daysFrom(9), done: false },
      { id: uid(), title: "Ship v1.0", date: daysFrom(14), done: false },
    ],
    tags: ["kaizen","meta","ui"],
    qualityChecks: [
      { id: uid(), label: "tsc clean", category:"standards", done: true },
      { id: uid(), label: "Dual themes verified", category:"review", done: true },
      { id: uid(), label: "No theme bleed from Workout/Career", category:"standards", done: true },
      { id: uid(), label: "Static prerender all routes", category:"testing", done: true },
    ],
    qualityMetrics: [
      { id: uid(), label: "Lighthouse perf", target: 95, actual: 92, unit: "score" },
      { id: uid(), label: "CSS bundle", target: 16, actual: 14.5, unit: "kB" },
    ],
    stakeholders: [
      { id: uid(), name: "Me (Builder)", role: "Owner/Dev/Design", power:"high", interest:"high", stance:"champion" },
      { id: uid(), name: "Future me", role: "End user", power:"high", interest:"med", stance:"decision-maker" },
    ],
    resources: [
      { id: uid(), name: "Dev time", kind:"people", allocated: 80, used: 42, unit:"hrs" },
      { id: uid(), name: "Hosting", kind:"software", allocated: 20, used: 0, unit:"$/mo" },
    ],
    changeRequests: [
      { id: uid(), date: daysAgo(1), description:"Add Power/Interest matrix", reason:"PM spec gap", impact:"+2h", approved:"approved" },
    ],
    weeklyReports: [
      { id: uid(), weekOf: daysAgo(7), accomplishments: "- Foundry shell\n- 5 routes prerendered\n- Dual themes locked", nextWeek: "- Drilldown CRUD\n- Quarry kanban", blockers: "", risks: "Theme bleed possible", decisionsNeeded: "", mood: 5, hoursLogged: 18 },
      { id: uid(), weekOf: today(), accomplishments: "- Beefed task editor\n- Velocity plate\n- Stakeholder matrix", nextWeek: "- Drag-drop\n- Career bridge", blockers: "", risks: "Scope creep", decisionsNeeded: "", mood: 4, hoursLogged: 12 },
    ],
    regulatoryChecks: [
      { label: "LocalStorage only (no server data)", checked: true },
      { label: "No third-party trackers", checked: true },
    ],
    goNoGos: [
      { id: uid(), date: daysAgo(5), decision:"go", rationale:"Theme direction locked, demo data working.", nextReview: daysFrom(10) },
    ],
    costBenefit: { oneTimeCost: 0, ongoingCost: 0, projectedBenefit: 9999 },
    fileLinks: [
      { label: "spec", path: "docs/FEATURES.md" },
      { label: "figma", path: "local://forge-board" },
    ],
    risks: [
      { id: uid(), description: "Feature creep into PM-software territory", probability:"med", impact:"high", mitigation:"Lock v1 scope", contingency:"Archive extras to backlog", status:"open" },
      { id: uid(), description: "User forgets to back up localStorage", probability:"med", impact:"med", mitigation:"Add JSON export reminder", contingency:"Implement export-on-update", status:"open" },
    ],
    premortem: [
      { id: uid(), failure:"Burns out mid-build and ships half-broken", mitigation:"Daily 15-min pulse, celebrate small wins", likelihood:"med"},
    ],
    satisfactionLog: [
      { id: uid(), date: daysAgo(10), score: 4 },
      { id: uid(), date: daysAgo(7), score: 7 },
      { id: uid(), date: daysAgo(3), score: 9 },
      { id: uid(), date: today(), score: 8 },
    ],
    scope: "Forge v1: 4 sectors, dual themes, kanban, retro, demo data.",
    goalAlignment: "Build a productivity OS that sparks joy every time I open it.",
    handoverDoc: "npm install; npm run dev. Routes under /projects/*. localStorage key kaizen.forge.",
    continuityPlan: "If offline for >2 weeks, export JSON before stepping away.",
  });
  const p2 = makeProject({
    codename: "KILN",
    title: "Career → Portfolio bridge",
    brief: "Auto-sync shipped Forge projects into the Career portfolio vault with problem/solution/results case-study stubs.",
    why: "Shipped work should write your resume for you.",
    successMetrics: "Clicking 'ship' on a Forge project offers to push a portfolio entry.",
    rejectionCriteria: "If 3 projects ship without using the bridge, kill it.",
    status: "blocked", priority: 7, energyDemand: 5, complexity: 5,
    color: "#ea580c", icon: "🔥",
    createdAt: daysAgo(10), startedAt: daysAgo(8), deadline: daysFrom(30),
    tags: ["kaizen","cross-link"],
    milestones: [
      { id: uid(), title: "Define sync schema", date: daysAgo(7), done: true, doneAt: daysAgo(7) },
      { id: uid(), title: "Build push button UI", date: daysFrom(10), done: false },
    ],
    issues: [
      { id: uid(), description: "Waiting on Forge OS drilldown to land first", impact: "Blocks UI work", priority: "high", owner: "self", status: "open", createdAt: today() },
    ],
    stakeholders: [
      { id: uid(), name: "Career space", role: "Consumer", power:"high", interest:"high", stance:"ally" },
    ],
    costBenefit: { oneTimeCost: 8, ongoingCost: 0, projectedBenefit: 100 },
    goNoGos: [{ id: uid(), date: daysFrom(10), decision:"hold", rationale:"Blocked on ANVIL", nextReview: daysFrom(20) }],
  });
  const p3 = makeProject({
    codename: "CRUCIBLE",
    title: "Side Hustle: Indie SaaS Landing",
    brief: "Ship a single-page landing for a developer tool. Validate with 10 interviews.",
    why: "Revenue escape velocity.",
    successMetrics: "500 visits, 25 emails, 5 paid pre-orders.",
    rejectionCriteria: "0 emails in 2 weeks → pivot.",
    status: "off-track", priority: 6, energyDemand: 7, complexity: 4,
    color: "#ef4444", icon: "🧪",
    createdAt: daysAgo(21), startedAt: daysAgo(18), deadline: daysFrom(21),
    tags: ["revenue","build"],
    budget: { estimated: 120, actual: 42, currency: "$" },
    milestones: [
      { id: uid(), title: "Hero + copy", date: daysAgo(10), done: true, doneAt: daysAgo(9) },
      { id: uid(), title: "Interviews", date: daysAgo(2), done: false },
      { id: uid(), title: "Launch", date: daysFrom(21), done: false },
    ],
    risks: [
      { id: uid(), description:"No validated problem before building", probability:"high", impact:"high", mitigation:"Run 10 interviews this week", contingency:"Pivot to narrower audience", status:"open" },
    ],
    changeRequests: [
      { id: uid(), date: daysAgo(5), description:"Add free PDF lead magnet", reason:"Low email capture rate", impact:"+1 day design work", approved:"approved" },
    ],
    weeklyReports: [
      { id: uid(), weekOf: daysAgo(7), accomplishments: "- Hero drafted\n- Domain bought", nextWeek: "- 10 interviews", blockers: "No warm intro list", risks: "Spinning wheels on copy", decisionsNeeded: "Target audience narrowed?", mood: 3, hoursLogged: 6 },
    ],
    costBenefit: { oneTimeCost: 120, ongoingCost: 30, projectedBenefit: 500 },
    stakeholders: [
      { id: uid(), name: "Early adopters", role: "Users", power:"high", interest:"med", stance:"neutral" },
      { id: uid(), name: "Me", role: "Founder", power:"high", interest:"high", stance:"champion" },
    ],
  });
  const p4 = makeProject({
    codename: "QUENCH",
    title: "Health: Run a 5k under 25min",
    brief: "Couch-to-5k plan, 3 runs/week. Paired with a running playlist.",
    why: "Cardio baseline is collapsing. Foundry work needs a quenched blade.",
    successMetrics: "5k @ <25min, measured on a certified route.",
    rejectionCriteria: "2 weeks skipped running → reassess.",
    status: "on-track", priority: 5, energyDemand: 4, complexity: 2,
    color: "#06b6d4", icon: "💨",
    createdAt: daysAgo(14), startedAt: daysAgo(14), deadline: daysFrom(45),
    tags: ["health"],
    milestones: [
      { id: uid(), title: "Run 1k non-stop", date: daysAgo(5), done: true, doneAt: daysAgo(5) },
      { id: uid(), title: "Run 3k", date: daysFrom(14), done: false },
      { id: uid(), title: "5k @ 25min", date: daysFrom(45), done: false },
    ],
  });
  const p5 = makeProject({
    codename: "TEMPER",
    title: "Reading: Deep Work Book",
    brief: "Finish Deep Work by Cal Newport. Take notes; implement 1 ritual.",
    why: "Focus is the raw material of the forge.",
    successMetrics: "Book finished + 1 ritual active for 2 weeks.",
    status: "paused", priority: 3, energyDemand: 2, complexity: 1,
    color: "#a78bfa", icon: "📖",
    createdAt: daysAgo(40), startedAt: daysAgo(40),
    tags: ["learning"],
  });
  const dead = makeProject({
    codename: "RUST-01",
    title: "Rust CLI todo rewrite",
    brief: "Rewrite kaizen backend in Rust. Was a fun weekend idea.",
    why: "Curiosity.",
    successMetrics: "n/a",
    rejectionCriteria: "",
    status: "dead", priority: 2, energyDemand: 9, complexity: 9,
    color: "#64748b", icon: "⚰️",
    createdAt: daysAgo(90), archived: true,
    obituary: { whyStopped: "Opportunity cost — Node backend is fine.", learned: "Rust async is not a weekend project.", startAgain: "maybe", date: daysAgo(20) },
    tags: ["code"],
  });
  const shipped = makeProject({
    codename: "SPARK",
    title: "Forge OS design doc",
    brief: "Two-page brief on theme direction + section list.",
    why: "Ship the blueprint before the steel.",
    successMetrics: "Doc written and used as spec.",
    status: "done", priority: 5, energyDemand: 2, complexity: 2,
    color: "#22c55e", icon: "✨",
    createdAt: daysAgo(4), startedAt: daysAgo(4), completedAt: daysAgo(2), archived: true,
    tags: ["kaizen","meta"],
  });

  const projects = [p1,p2,p3,p4,p5,dead,shipped];

  const tasks: ProjectTask[] = [
    // p1 — active
    makeTask({ projectId: p1.id, title: "Wire ForgeShell rivets + hazard stripes", status:"done", priority:"P1", doneAt:daysAgo(2), completedAt:daysAgo(2), pomodoros:3, estimateMins:75, actualMins:82, energy:4, focus:5, effort:3, impact:4, tags:["ui"] }),
    makeTask({ projectId: p1.id, title: "Build ProjectCard grid", status:"doing", priority:"P0", dueDate:today(), today:true, estimateMins:60, energy:5, focus:5, effort:4, impact:5, tags:["ui","foundry"] }),
    makeTask({ projectId: p1.id, title: "Project drilldown (brief/why/budget/stakeholders)", status:"doing", priority:"P0", dueDate:tomorrow(), today:true, estimateMins:90, energy:5, focus:5, effort:4, impact:5, tags:["ui"] }),
    makeTask({ projectId: p1.id, title: "Kanban swimlanes + drag", status:"todo", priority:"P1", dueDate:daysFrom(3), estimateMins:120, energy:4, focus:5, effort:5, impact:4, tags:["ui","quarry"] }),
    makeTask({ projectId: p1.id, title: "Smelter retrospective page", status:"todo", priority:"P2", dueDate:daysFrom(9), effort:3, impact:4, energy:3, focus:4, tags:["ui","smelter"] }),
    makeTask({ projectId: p1.id, title: "Career skill-bump bridge", status:"blocked", priority:"P2", dueDate:daysFrom(14), effort:5, impact:4, stuck:true, stuckNote:"Waiting on KILN schema.", energy:3, focus:4, tags:["cross-link"] }),
    makeTask({ projectId: p1.id, title: "Polish sparks/ember particles", status:"todo", priority:"P3", effort:2, impact:2, energy:2, focus:3, tags:["joy"] }),
    // p2 — blocked
    makeTask({ projectId: p2.id, title: "Design sync payload schema", status:"done", priority:"P1", doneAt:daysAgo(7), completedAt:daysAgo(7), effort:2, impact:5, tags:["schema"] }),
    makeTask({ projectId: p2.id, title: "Build 'Push to Portfolio' button", status:"blocked", priority:"P1", stuck:true, stuckNote:"Blocked by ANVIL drilldown.", tags:["ui"] }),
    makeTask({ projectId: p2.id, title: "Auto-fill case study from milestones", status:"todo", priority:"P2", effort:4, impact:4, tags:["ai"] }),
    // p3 — off-track
    makeTask({ projectId: p3.id, title: "Write landing hero copy", status:"done", doneAt:daysAgo(9), completedAt:daysAgo(9), priority:"P1", tags:["copy"] }),
    makeTask({ projectId: p3.id, title: "Draft cold outreach list (25 names)", status:"doing", priority:"P0", dueDate:today(), today:true, effort:3, impact:5, tags:["sales"] }),
    makeTask({ projectId: p3.id, title: "Run 5 customer interviews", status:"todo", priority:"P0", dueDate:daysFrom(7), effort:4, impact:5, tags:["research"] }),
    makeTask({ projectId: p3.id, title: "Hook up Stripe pre-order", status:"todo", priority:"P2", dueDate:daysFrom(21), effort:3, impact:3, tags:["biz"],
      dependsOn:[], nextAction:true }),
    // p4 — running
    makeTask({ projectId: p4.id, title: "Run 3k this Saturday", status:"todo", priority:"P2", dueDate:daysFrom(2), context:["outdoor"], effort:2, impact:3, tags:["cardio"] }),
    makeTask({ projectId: p4.id, title: "Buy new running socks", status:"todo", priority:"P3", effort:1, impact:1, tags:["errand"], context:["errand"] }),
    // p5 — paused
    makeTask({ projectId: p5.id, title: "Read chapters 3-4", status:"todo", priority:"P3", tags:["reading"] }),
    // parking
  ];

  return {
    projects,
    tasks,
    scratch: [
      { id: uid(), projectId: p1.id, text: "// forge.today() — strike the hottest metal first\n// rule #1: one codename per project\n// rule #2: heat-cyan = quenching (health = on-track). amber = forging. red = failing weld.", createdAt: Date.now() - 86400000*3, pinned: true },
      { id: uid(), projectId: p3.id, text: "Idea: offer a free 1-pager PDF to capture emails. Title: \"Shipping a SaaS in 30 Days Without Losing Your Mind.\"", createdAt: Date.now() - 86400000*2 },
    ],
    decisions: [
      { id: uid(), projectId: p1.id, date: today(), decision: "Use heavy-industrial foundry theme for Forge dark mode", alternatives: "Workshop (too warm), Blueprint (used by career), Neon cyberpunk (used by career)", why: "Unique, matches the 'forge/hammer' metaphor, differentiates from both other spaces." },
    ],
    swot: [
      { id: uid(), projectId: p3.id, quadrant: "S", text: "Can ship landing in a weekend" },
      { id: uid(), projectId: p3.id, quadrant: "W", text: "Weak at outbound sales copy" },
      { id: uid(), projectId: p3.id, quadrant: "O", text: "Trending topic on HN this week" },
      { id: uid(), projectId: p3.id, quadrant: "T", text: "Two competitors just launched similar tools" },
    ],
    proscons: [
      { id: uid(), projectId: p4.id, side: "pro", text: "Improves sleep + mood", weight: 5 },
      { id: uid(), projectId: p4.id, side: "pro", text: "Counteracts 8h of desk work", weight: 4 },
      { id: uid(), projectId: p4.id, side: "con", text: "Eats 40 mins/day", weight: 2 },
      { id: uid(), projectId: p4.id, side: "con", text: "Knees might complain", weight: 3 },
    ],
    scenarios: [
      { id: uid(), projectId: p3.id, title: "Zero traction", trigger: "0 emails after 2 weeks", response: "Pivot to narrower audience; rewrite hero; interview 10 devs who said no." },
      { id: uid(), projectId: p3.id, title: "Viral hit", trigger: ">500 signups in 1 day", response: "Turn on Stripe, add waitlist queue, delay launch to stabilize." },
    ],
    fiveWhys: [
      { id: uid(), projectId: p3.id, problem: "Landing page conversion < 1%", whys: ["Headline is generic", "Didn't A/B test", "No urgency", "Weak CTA", "Haven't done user research yet"] },
    ],
    lessons: [
      { id: uid(), projectId: shipped.id, date: daysAgo(2), category: "well", text: "Writing the spec FIRST saved hours of rework on the theme tokens.", tags:["process"] },
      { id: uid(), projectId: p3.id, date: today(), category: "poorly", text: "Skipped customer interviews before writing copy. Waste of time rewriting.", tags:["research"] },
      { id: uid(), category: "general", date: today(), text: "Dual themes are cheaper when you commit to CSS var tokens from day one.", tags:["ui","lesson"], projectId: undefined },
    ],
    retors: [
      { id: uid(), date: daysAgo(7), start:["Daily 15-min forge pulse"], stop:["Afternoon phone checks"], continue:["Morning deep-work blocks 9-11"] },
    ],
    parking: [
      { id: uid(), text: "GANTT chart view for project milestones", projectId: p1.id, createdAt: today() },
      { id: uid(), text: "Keyboard shortcuts for Quarry Kanban", projectId: p1.id, createdAt: today() },
      { id: uid(), text: "Ember ambient soundscape toggle", projectId: p1.id, createdAt: today() },
      { id: uid(), text: "Voice-to-scratchpad (record raw thoughts)", createdAt: today() },
    ],
    pomodoros: [
      { id: uid(), taskId: tasks[0].id, projectId: p1.id, startedAt: Date.now()-86400000*2, durationMin:25, completed:true },
      { id: uid(), taskId: tasks[0].id, projectId: p1.id, startedAt: Date.now()-86400000*2+1000*60*30, durationMin:25, completed:true },
      { id: uid(), taskId: tasks[0].id, projectId: p1.id, startedAt: Date.now()-86400000*2+1000*60*60, durationMin:25, completed:true },
    ],
    personas: [
      { id: uid(), projectId: p3.id, name: "Overworked Owen", role: "Senior dev, 30-45, tired of yak-shaving", goal: "Ship side project in 30 days", pain: "Can't focus after 6pm, lands in tutorial hell" },
    ],
    decisionMatrix: [
      { id: uid(), projectId: p1.id, title: "Pick Forge light-mode palette",
        criteria: [
          { label: "Differentiation from Career/Workout", weight:5, score:9 },
          { label: "Readability after 2h", weight:4, score:8 },
          { label: "Pencil/industrial vibe", weight:5, score:9 },
        ]},
    ],
    ideas: [
      { id: uid(), projectId: p1.id, text: "Heat-crackle sound on hammer strike", kind:"idea", votes:3, createdAt: Date.now()-86400000 },
      { id: uid(), projectId: p3.id, text: "Hide pricing behind email capture", kind:"reverse", votes:1, createdAt: Date.now()-86400000*2 },
      { id: uid(), text: "Kaizen OS boot chime — anvil clang + katana unsheathe + HUD whine", kind:"mood", votes:5, createdAt: Date.now()-86400000*3 },
      { id: uid(), projectId: p3.id, text: "One-click deploy to Vercel (delight)", kind:"kano", kanoCat:"delight", votes:4, createdAt: Date.now()-86400000 },
      { id: uid(), projectId: p3.id, text: "Make the page load SLOWER and require login to see pricing", kind:"worst", votes:0, createdAt: Date.now()-86400000 },
    ],
    settings: {
      workStartHour: 9,
      workEndHour: 18,
      defaultEnergyPeak: "morning",
      forgeName: "THE FORGE",
    },
  };
}

function tomorrow() { return daysFrom(1); }
