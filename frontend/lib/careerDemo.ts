"use client";
/**
 * Rich mock-data generator for the Career OS.
 * Populates skills, contacts, jobs, days, achievements, projects, bullets,
 * testimonials, timeline, burnout, sabbaticals, side-hustles, IP, speaking, vision.
 */
import type { CareerState, CareerSkill, NetworkContact, JobApplication, WorkDayEntry,
  PortfolioProject, Achievement, ResumeBullet, Testimonial, TimelineEvent,
  BurnoutCheck, SabbaticalPlan, SideHustle, IPItem, SpeakingEngagement, VisionBoardItem,
  MeetingEntry } from "./careerTypes";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const DAY = 86400000;
const A = Date.now();
const daysAgo = (n: number) => new Date(A - n * DAY).toISOString().slice(0, 10);

function makeSkill(name: string, prof: number, conf: number, interest: number, usage: CareerSkill["usage"], cat: string, desired?: number, mentor?: string): CareerSkill {
  return {
    id: uid(), name, category: cat, proficiency: prof, confidence: conf,
    interest, usage, lastUsedAt: A - (Math.random() * 30 * DAY),
    mentor, resources: [], growth: [
      { date: daysAgo(60), level: Math.max(1, prof - 2) },
      { date: daysAgo(30), level: Math.max(1, prof - 1) },
      { date: daysAgo(7), level: prof },
    ],
    portfolioLinks: [],
    desiredLevel: desired,
  };
}

function makeContact(name: string, rel: NetworkContact["relationship"], health: number, influence: number, daysSince: number, opts: Partial<NetworkContact> = {}): NetworkContact {
  return {
    id: uid(), name, relationship: rel, healthScore: health, influenceScore: influence,
    favorsGiven: 0, favorsReceived: 0, interactions: [],
    lastContactAt: A - daysSince * DAY,
    jobHistory: [], referralLog: [],
    ...opts,
  };
}

function makeMeeting(title: string, durationMin: number, date: string, roi: number, fuCount = 0): MeetingEntry {
  return {
    id: uid(), title, date, durationMin, roiScore: roi,
    followUps: Array.from({ length: fuCount }).map(() => ({
      id: uid(), text: `Follow up on ${title.split(" ")[0]} deliverables`, owner: "me", due: daysAgo(-2), done: Math.random() > 0.6,
    })),
  };
}

function makeDay(dateOffset: number, meetings: number, focusHrs: number, mood: number, stress: number, wins: string[] = []): WorkDayEntry {
  const date = daysAgo(dateOffset);
  return {
    date, standup: `Yesterday: pushed ${focusHrs}h focus\nToday: roadmap milestones + 1:1\nBlockers: none`,
    workLog: `Deep focus on ${["infra","pipeline","feature X","refactor","docs"][dateOffset%5]}. Made good progress.`,
    mood, stress, focusSessionsMinutes: focusHrs * 60,
    meetings: Array.from({ length: meetings }).map((_, i) => makeMeeting(
      ["1:1 with manager","Standup","PR Review","Sprint Retro","Design review","Interview debrief","Planning"][(dateOffset+i)%7],
      [30,15,30,60,30,20,60][(dateOffset+i)%7], date, 3 + (i%3), i === 0 ? 1 : 0,
    )),
    timeAllocation: { meetings: meetings*30, coding: focusHrs*60*0.6, writing: focusHrs*60*0.15, emails: 45, planning: 30, other: 15 },
    wins: wins.length ? wins : ["Closed 2 PRs", "Shipped pipeline fix"],
    learnings: ["Learned more about k8s probes"],
    challenges: meetings > 3 ? ["Meeting-heavy day" ] : [],
  };
}

function makeApp(role: string, stage: JobApplication["stage"], daysSince: number, co: string): JobApplication {
  return {
    id: uid(), role, companyId: undefined, appliedAt: daysAgo(daysSince), stage,
    lastContactAt: daysAgo(Math.max(0, daysSince - 5)),
    recruiter: ["Sarah Chen","Marcus Weller","Jordan Park","Alex Rivera"][Math.floor(Math.random()*4)],
    vibeScore: 3 + Math.floor(Math.random()*3),
    timeSpentMin: [30,60,120,180,240][["researching","applied","phone-screen","tech-interview","onsite","offer","accepted","rejected","ghosted"].indexOf(stage)] || 60,
    nextFollowUpAt: stage === "onsite" || stage === "tech-interview" ? daysAgo(-2) : undefined,
    decisionMatrix: stage === "offer" || stage === "onsite" ? {
      comp: 7+Math.floor(Math.random()*3), growth: 6+Math.floor(Math.random()*4), wlb: 5+Math.floor(Math.random()*5),
      team: 6+Math.floor(Math.random()*4), mission: 5+Math.floor(Math.random()*5), location: 7+Math.floor(Math.random()*3),
    } : undefined,
    notes: `${co} — strong team, interesting stack`,
  };
}

export function buildCareerDemo(): CareerState {
  const skills: CareerSkill[] = [
    makeSkill("TypeScript", 8, 8, 8, "daily", "Technical", 10, "Priya (staff eng)"),
    makeSkill("React/Next.js", 8, 7, 7, "daily", "Technical", 9),
    makeSkill("Kubernetes", 5, 4, 8, "weekly", "Technical", 8, "Marcus (SRE lead)"),
    makeSkill("Docker", 7, 7, 6, "daily", "Technical", 8),
    makeSkill("Terraform", 5, 5, 7, "weekly", "Technical", 8),
    makeSkill("Python", 7, 6, 6, "weekly", "Technical"),
    makeSkill("System Design", 4, 4, 9, "weekly", "Technical", 8),
    makeSkill("PostgreSQL", 6, 5, 5, "weekly", "Technical", 7),
    makeSkill("AWS", 6, 5, 7, "weekly", "Technical", 8),
    makeSkill("CI/CD", 7, 6, 5, "daily", "Technical"),
    makeSkill("Technical Writing", 6, 5, 7, "weekly", "Leadership", 8),
    makeSkill("Mentoring", 5, 6, 8, "weekly", "Leadership"),
    makeSkill("Public Speaking", 3, 3, 7, "monthly", "Leadership", 7),
  ];

  const contacts: NetworkContact[] = [
    makeContact("Priya Raman", "mentor", 9, 9, 5, { company: "Stripe", role: "Staff Engineer",
      birthday: "1990-09-15", preferredChannel: "coffee", interests: ["distributed systems","rock climbing","jazz"],
      nextFollowUpAt: A + 4*DAY,
      interactions: [
        { id: uid(), date: daysAgo(5), type: "coffee", summary: "Career chat — suggested going deep on one infra skill vs breadth" },
        { id: uid(), date: daysAgo(25), type: "call", summary: "CKA study plan review" },
      ],
      referralLog: [{ date: daysAgo(60), direction:"received", company:"Stripe", role:"SWE", outcome:"rejected at onsite" }],
    }),
    makeContact("Marcus Weller", "mentor", 8, 8, 12, { company: "Datadog", role: "SRE Lead",
      preferredChannel: "call", interests: ["SRE","home roasting coffee"] }),
    makeContact("Sarah Chen", "peer", 9, 6, 3, { company: "Vercel", role: "SWE",
      interests: ["Next.js","photography"],
      referralLog: [{ date: daysAgo(14), direction:"sent", company:"Vercel", role:"SWE II", outcome:"waiting" }] }),
    makeContact("Jordan Park", "peer", 7, 5, 45, { company: "Airbnb", role: "EM",
      interests: ["management theory","surfing"] }),
    makeContact("Alex Rivera", "recruiter", 6, 7, 10, { company: "Figma" }),
    makeContact("Naomi Klein", "friend", 10, 4, 60, { interests: ["writing","hiking"] }),
    makeContact("David Okonkwo", "peer", 8, 6, 20, { company: "Cloudflare", role: "SRE", interests: ["Rust","chess"] }),
    makeContact("Kira Tanaka", "client", 7, 8, 8, { company: "Shopify", role: "PM" }),
    makeContact("Tomás García", "report", 6, 5, 4, { company: "current", role: "Junior SWE",
      jobHistory: [{ company: "current", role: "Junior SWE", startedAt: daysAgo(120) }] }),
    makeContact("Hannah Bright", "peer", 8, 6, 95, { company: "Netflix", role: "SWE",
      interests: ["distributed systems","scuba"] }),
    makeContact("Leo Fernandez", "prospect", 5, 6, 25, { company: "OpenAI", role: "Recruiter" }),
    makeContact("Uma Bhatt", "mentor", 9, 9, 20, { company: "retired FAANG", preferredChannel: "email" }),
  ];

  const achievements: Achievement[] = [
    { id: uid(), title: "Reduced deploy time by 60%", date: daysAgo(3), category:"technical", icon:"⚡",
      impact: "CI/CD pipeline from 22min → 9min avg for 12 microservices", tags:["cicd","devops"] },
    { id: uid(), title: "Led postmortem for prod outage", date: daysAgo(7), category:"leadership", icon:"🛡️",
      impact: "Identified missing readiness probe; drove 5 action items closed in a week", tags:["sre","incident"] },
    { id: uid(), title: "CKA exam passed (94/100)", date: daysAgo(14), category:"personal", icon:"🎓",
      impact: "Certified Kubernetes Administrator", tags:["k8s","certs"] },
    { id: uid(), title: "Talk: Terraform at Scale @ internal meetup", date: daysAgo(21), category:"personal", icon:"🎤",
      impact: "~40 attendees, recording circulated company-wide", tags:["terraform","talk"] },
    { id: uid(), title: "Mentored intern through shipped project", date: daysAgo(30), category:"leadership", icon:"🌱",
      impact: "Tomás shipped log-search UI in 8 weeks, received return offer", tags:["mentorship"] },
    { id: uid(), title: "On-call hero award", date: daysAgo(45), category:"leadership", icon:"🏆", impact:"Nominated by team for calm incident handling" },
    { id: uid(), title: "Open-source PR merged (next.js)", date: daysAgo(60), category:"technical", icon:"✨",
      impact: "Fixed edge-case in incremental cache revalidation", tags:["oss","nextjs"] },
    { id: uid(), title: "Docker course completed", date: daysAgo(75), category:"technical", icon:"🐳" },
    { id: uid(), title: "Won internal hackathon", date: daysAgo(90), category:"personal", icon:"🥇",
      impact: "AI-assisted PR reviewer built in 36h" },
  ];

  const projects: PortfolioProject[] = [
    { id: uid(), title: "Kaizen Life OS", role: "Creator & maintainer",
      summary: "Offline-first productivity OS with workout + career modules.",
      technologies: ["Next.js","TypeScript","Tailwind","framer-motion"],
      results: "Shipped v1 · 9 modules · dual themes",
      challenges: "Hydration safety, state migration across versions, theming CSS vars without per-file rewrites",
      learnings: "Dual themes are easier with a token system vs conditional styles",
      url: "https://kaizen.app", repoUrl: "https://github.com/user/kaizen", private: false,
      category: "web",
      caseStudy: { problem: "Needed one system for all productivity data", solution: "Built monorepo with shared store + pluggable sections", results: "Replaced 4 separate apps" } },
    { id: uid(), title: "K8s Cost Optimizer", role: "Tech lead",
      summary: "Right-sizer for K8s workloads based on historical CPU/mem utilization.",
      technologies: ["Go","Kubernetes","Prometheus"],
      results: "35% cluster spend reduction in 2 months · ~$48k/mo saved",
      challenges: "Convincing teams to set requests correctly; production risk of throttling",
      learnings: "Start with reporting & recommendations, never auto-enforce in v1",
      url: "https://github.com/user/k8s-rightsize", private: false, category: "infra" },
    { id: uid(), title: "ML Pipelines Platform", role: "Senior IC",
      summary: "Self-serve ML training/serving pipelines on top of Argo + K8s.",
      technologies: ["Python","Argo","PyTorch","Kubernetes"],
      results: "Time-to-train down 70% for 8 DS teams", private: false,
      category: "ml" },
    { id: uid(), title: "dotfiles", role: "Personal", summary: "Opinionated zsh + nvim + tmux + wezterm setup.",
      technologies: ["Lua","Shell"], private: false, category: "tool", url: "https://github.com/user/dotfiles" },
    { id: uid(), title: "Readme-TUI", role: "Maintainer", summary: "Terminal README renderer with live TOC.",
      technologies: ["Rust"], results: "2.1k GitHub stars",
      category: "opensource", private: false, url: "https://github.com/user/readme-tui" },
  ];

  const bullets: ResumeBullet[] = [
    { id: uid(), text: "Designed multi-env CI/CD pipelines reducing deploy time by 60% (22→9 min) across 12 microservices", tags:["devops","cicd"] },
    { id: uid(), text: "Led Kubernetes cost-optimization initiative cutting cloud spend 35% ($48k/mo) via right-sizing + spot instances", tags:["k8s","cost"] },
    { id: uid(), text: "Built self-serve ML platform on Argo + Kubernetes cutting time-to-train 70% for 8 data-science teams", tags:["ml","k8s","platform"] },
    { id: uid(), text: "Mentored 2 juniors + 1 intern through full project lifecycle to shipped production work", tags:["leadership","mentorship"] },
    { id: uid(), text: "Owned incident response for Tier-1 services; reduced MTTR 40% via alert routing overhaul", tags:["sre","oncall"] },
  ];

  const testimonials: Testimonial[] = [
    { id: uid(), from: "Priya Raman", role: "Staff Engineer @ Stripe", quote: "One of the sharpest SREs I've mentored. Takes blameless postmortems to heart and ships the actual fixes.", date: daysAgo(30) },
    { id: uid(), from: "Tomás García", role: "Junior SWE", quote: "Best mentor I've had. Pair sessions were always patient, and I learned more in 3 months than the prior year.", date: daysAgo(60) },
    { id: uid(), from: "Marcus Weller", role: "SRE Lead @ Datadog", quote: "Systems thinker. The cost-opt work he did was the kind of thing nobody else wanted to touch and it moved the needle huge.", date: daysAgo(90) },
  ];

  const companies = [{ id: "co-figma", name: "Figma", cultureChecks:[
    {label:"Remote-friendly",value:"✓"},{label:"Fast pace",value:"✓"},{label:"Mentorship",value:"✓"},
    {label:"Strong eng bar",value:"✓"},{label:"Good WLB",value:"?"},{label:"Mission fit",value:"✓"},
    {label:"Comp fair",value:"✓"},{label:"Diverse team",value:"✓"}] },
    { id: "co-vercel", name: "Vercel" },
    { id: "co-cf", name: "Cloudflare", cultureChecks:[{label:"Remote-friendly",value:"✓"},{label:"Good WLB",value:"✗"}] },
  ];

  const applications: JobApplication[] = [
    (() => { const a = makeApp("Senior SRE", "onsite", 18, "Figma"); a.companyId = "co-figma"; return a; })(),
    (() => { const a = makeApp("Senior Platform Engineer", "tech-interview", 10, "Vercel"); a.companyId = "co-vercel"; return a; })(),
    (() => { const a = makeApp("Staff Engineer", "phone-screen", 5, "Cloudflare"); a.companyId = "co-cf"; return a; })(),
    makeApp("Senior Backend Engineer", "offer", 25, "Linear"),
    makeApp("Infrastructure Lead", "applied", 4, "Notion"),
    makeApp("Principal SRE", "rejected", 40, "Stripe"),
    makeApp("Senior SWE", "ghosted", 30, "Airbnb"),
    makeApp("SRE II", "accepted", 120, "current job (reference)"),
  ];

  const days: WorkDayEntry[] = Array.from({ length: 14 }, (_, i) => makeDay(i, i === 3 ? 4 : i % 3, Math.max(1, 4 - (i%3)), 5 + (i%4) - 1, 4 + (i%3) - 1));
  // Today
  days.unshift({
    date: daysAgo(0), standup: "", workLog: "", mood: 7, stress: 4, focusSessionsMinutes: 90,
    meetings: [
      makeMeeting("1:1 with manager", 30, daysAgo(0), 4, 1),
      makeMeeting("Standup", 15, daysAgo(0), 3),
      makeMeeting("PR Review", 30, daysAgo(0), 4),
    ],
    timeAllocation: { meetings: 75, coding: 90, writing: 0, emails: 20, planning: 15, other: 10 },
    wins: [], learnings: [], challenges: [],
  });

  const timeline: TimelineEvent[] = [
    { id: uid(), date: daysAgo(0), type: "milestone", title: "Closed 60% deploy-time reduction milestone on DevOps roadmap" },
    { id: uid(), date: daysAgo(3), type: "project", title: "CI/CD pipeline PR merged" },
    { id: uid(), date: daysAgo(7), type: "milestone", title: "Led prod outage postmortem" },
    { id: uid(), date: daysAgo(14), type: "cert", title: "CKA exam passed (94/100)" },
    { id: uid(), date: daysAgo(21), type: "speaking", title: "Talk: Terraform at Scale" },
    { id: uid(), date: daysAgo(30), type: "project", title: "Mentored intern project shipped" },
    { id: uid(), date: daysAgo(45), type: "promotion", title: "On-call hero award" },
    { id: uid(), date: daysAgo(60), type: "project", title: "OSS PR merged to next.js" },
    { id: uid(), date: daysAgo(90), type: "other", title: "Won internal hackathon" },
  ];

  const burnoutChecks: BurnoutCheck[] = [
    { date: daysAgo(56), workload:4, control:7, rewards:7, community:7, fairness:8, values:7, score:6.7 },
    { date: daysAgo(42), workload:5, control:7, rewards:7, community:7, fairness:7, values:7, score:6.7 },
    { date: daysAgo(28), workload:6, control:6, rewards:6, community:7, fairness:7, values:7, score:6.5 },
    { date: daysAgo(14), workload:7, control:5, rewards:6, community:7, fairness:6, values:7, score:6.3 },
    { date: daysAgo(7), workload:5, control:6, rewards:7, community:7, fairness:7, values:8, score:6.7 },
    { date: daysAgo(0), workload:4, control:7, rewards:8, community:8, fairness:8, values:8, score:7.2 },
  ];

  const sabbaticals: SabbaticalPlan[] = [
    { id: uid(), targetDate: daysAgo(-240), savingsTarget: 15000, savingsCurrent: 9200, durationWeeks: 6 },
  ];

  const sideHustles: SideHustle[] = [
    { id: uid(), name: "Teach me DevOps (newsletter)", hoursPerWeek: 4, monthlyIncome: 850, notes: "1.2k subs, growing 8%/mo" },
    { id: uid(), name: "Freelance platform consulting", hoursPerWeek: 2, monthlyIncome: 600, notes: "1 client / quarter" },
  ];

  const ip: IPItem[] = [
    { id: uid(), type: "idea", title: "Career OS as PWA", date: daysAgo(14), notes: "Kaizen could be a PWA w/ offline sync" },
    { id: uid(), type: "copyright", title: "Kaizen font stack + HUD CSS", date: daysAgo(30), notes: "Open-source under MIT" },
  ];

  const speaking: SpeakingEngagement[] = [
    { id: uid(), title: "Terraform at Scale", event: "Internal Eng Meetup", date: daysAgo(21), notes: "40 attendees" },
    { id: uid(), title: "From Zero to CKA in 3 Months", event: "DevOps Days NYC", date: daysAgo(-60), notes: "CFP accepted" },
  ];

  const visionBoard: VisionBoardItem[] = [
    { id: uid(), type: "quote", content: "\"You don't have to be great to start, but you have to start to be great.\" — Zig Ziglar" },
    { id: uid(), type: "goal", content: "Staff+ role at company with strong mission by end of year" },
    { id: uid(), type: "goal", content: "Speak at 2 conferences in 2026" },
    { id: uid(), type: "goal", content: "Write a book on SRE career paths" },
  ];

  return {
    roadmaps: [], // filled in by caller from template clone
    skills, courses: [
      { id: uid(), name: "Certified Kubernetes Administrator (CKA)", provider: "CNCF",
        startDate: daysAgo(90), endDate: daysAgo(14), completed: true, certReceived: true, hoursInvested: 80, rating: 5,
        keyTakeaways: "Deep understanding of scheduling, networking, storage, troubleshooting", applicationNotes: "Added to resume & LinkedIn" },
      { id: uid(), name: "Advanced System Design", provider: "Educative",
        startDate: daysAgo(40), completed: false, certReceived: false, hoursInvested: 20, rating: 4 },
      { id: uid(), name: "Rust for Systems Programmers", provider: "No Starch Press",
        startDate: daysAgo(20), completed: false, certReceived: false, hoursInvested: 10, rating: 4 },
    ],
    contacts, applications, companies, questions: [], achievements, projects, resumes: [
      { id: uid(), name: "SRE v3 (general)", sentAt: A - 60*DAY, bullets: bullets.map(b => ({...b, id: uid()})), atsKeywords: ["kubernetes","sre","ci/cd","terraform","aws"], tailoredChecklist: [] },
      { id: uid(), name: "Platform Eng @ Vercel", sentAt: A - 10*DAY, bullets: bullets.slice(0,4).map(b => ({...b, id: uid()})), atsKeywords: ["next.js","react","typescript","platform"], tailoredChecklist: [] },
    ], bullets, testimonials, days, meetings: [], timeline, satisfaction: [
      { date: daysAgo(21), score: 7 }, { date: daysAgo(14), score: 6 },
      { date: daysAgo(7), score: 7 }, { date: daysAgo(0), score: 8 },
    ], burnoutChecks, sabbaticals, retirement: {
      currentSavings: 78000, targetAnnual: 55000, targetAge: 55, projectedAge: 51,
      notes: "25% contribution rate; paid off student loans Q1",
    }, sideHustles, ip, speaking, visionBoard,
    tracks: [], goals: [], notes: [], linkedin: "",
  };
}
