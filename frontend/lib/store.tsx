"use client";

/**
 * Global app store (React Context + localStorage persistence).
 *
 * Contains:
 *   - Core: tasks (scoped to spaces), notes
 *   - Career: tracks/concepts/sub-concepts/notes/resume/goals/achievements/linkedin
 *   - Workout: full domain — exercises, PRs, skills, routines, sessions (with rich
 *     per-set metadata: RPE/RIR, warmup/joker/drop/AMRAP flags, belt/sleeves, grip,
 *     feeling, speed, sticking point, asymmetry), readiness, badges, bodyweight,
 *     calisthenics (chains, cali-skills, flows, GtG, isometrics, intervals,
 *     mobility, planche), cardio logs, programs, goals, challenges, journal,
 *     motivation board, rest days.
 *
 * All actions are useCallback-wrapped. `useLocalState` is hydration-safe.
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
  import type {
  Task, Note, SpaceId,
  CareerState, CareerTrack, CareerConcept, CareerSubConcept,
  CareerNote, CareerBullet, CareerGoal, CareerAchievement,
  WorkoutState, WorkoutExercise, WorkoutPR, WorkoutPRAttempt, WorkoutSkill, WorkoutProgression,
  WorkoutRoutine, WorkoutBlock, WorkoutSession, WorkoutSetLog,
  WorkoutUnit, WorkoutReadiness, WorkoutBadge, WorkoutBodyweight,
  WorkoutSettings, Equipment, Level, BadgeId, TrainingPhase,
  CalisthenicsChain, CalisthenicsSkill, CalisthenicsFlow, GtGEntry, IsometricLog,
  IntervalLog, MobilityDrill, MobilitySession, PseudoPlancheEntry,
  CardioLog, Program, WorkoutGoal, CustomMetric, CustomMetricEntry,
  ChallengeEntry, MotivationBoardItem, RestDayEntry, CrowdLevel,
  KanbanCard, KanbanColumn, KanbanCardType,
  CareerRoadmap, CareerSkill, CareerCourse, NetworkContact, JobApplication,
  CompanyDossier, PortfolioProject, WorkDayEntry, TimelineEvent,
} from "./types";
import { SPACES } from "./types";
import { evaluateBadges, epley1RM, readinessScore as computeReadiness } from "./workoutAnalytics";
import { DEFAULT_EXERCISES } from "./exerciseLibrary";
import { TEMPLATE_LIST, cloneTemplate } from "./careerRoadmaps";
import type {
  ForgeState, ForgeProject, ProjectTask, ScratchNote, DecisionEntry,
  SwotRow, ProConItem, ScenarioEntry, FiveWhy, LessonEntry, Retrospective,
  ParkingLotItem, PomodoroSession, Persona, DecisionMatrixRow, Idea,
} from "./forgeTypes";

// Generate ids for runtime-created entities.
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const DAY = 86_400_000;
const todayIso = () => new Date().toISOString().slice(0, 10);

// ---------------- Seeds (module-level constants) ----------------
const A = Date.now();
const H = 3_600_000;

const seedTasks: Task[] = [
  { id: "t1",  title: "Design the landing page hero", completed: false, priority: "high",   space: "projects",      createdAt: A - 2 * DAY },
  { id: "t2",  title: "Set up CI/CD pipeline",       completed: false, priority: "medium", space: "projects",      createdAt: A - DAY },
  { id: "t3",  title: "Push day — chest & triceps",  completed: true,  priority: "medium", space: "workout",       createdAt: A - H },
  { id: "t4",  title: "Leg day session",            completed: false, priority: "high",   space: "workout",       createdAt: A - 2 * H },
  { id: "t5",  title: "Update resume & LinkedIn",   completed: false, priority: "medium", space: "career",        createdAt: A - 5 * H },
  { id: "t6",  title: "Schedule 1:1 with mentor",   completed: true,  priority: "low",    space: "career",        createdAt: A - DAY },
  { id: "t7",  title: "Watch Dune: Part Two",       completed: false, priority: "low",    space: "entertainment", createdAt: A - 3 * DAY },
  { id: "t8",  title: "Try the new ramen shop",     completed: false, priority: "low",    space: "entertainment", createdAt: A - 6 * DAY },
  { id: "t9",  title: "Drink 2L of water today",    completed: true,  priority: "medium", space: "health",        createdAt: A - H },
  { id: "t10", title: "7+ hours sleep",             completed: false, priority: "high",   space: "health",        createdAt: A - 2 * H },
];

const seedNotes: Note[] = [
  { id: "n1", title: "Product ideas",  content: "- AI writing assistant\n- Habit tracker with streaks\n- Minimal pomodoro that plays lo-fi", color: "#8b5cf6", pinned: true,  updatedAt: A - 100_000 },
  { id: "n2", title: "Books to read",  content: "1. Deep Work — Cal Newport\n2. Atomic Habits\n3. The Pragmatic Programmer", color: "#06b6d4", pinned: false, updatedAt: A - 500_000 },
  { id: "n3", title: "Sprint kickoff", content: "Sprint 24:\n- Auth refresh\n- Dashboard widgets\n- Performance budget", color: "#ec4899", pinned: false, updatedAt: A - 2_000_000 },
];

const SEED_CAREER: CareerState = (() => {
  // Legacy tracks — kept for backwards compatibility with old components.
  const devops = "c-devops", sre = "c-sre";
  const c = (title: string, subs: string[]): CareerConcept => ({
    id: uid(), title, subConcepts: subs.map((t) => ({ id: uid(), title: t, done: false })),
  });
  const legacyTracks: CareerTrack[] = [
    { id: devops, name: "DevOps", color: "#06b6d4",
      concepts: [
        { id: uid(), title: "Linux Fundamentals", subConcepts: [
          { id: uid(), title: "File system & permissions", done: true },
          { id: uid(), title: "Shell scripting (bash)", done: true },
          { id: uid(), title: "Process management & signals", done: false },
          { id: uid(), title: "Networking basics (TCP/UDP, DNS, HTTP)", done: false },
        ]},
        { id: uid(), title: "Containers (Docker)", subConcepts: [
          { id: uid(), title: "Images, layers, Dockerfile", done: true },
          { id: uid(), title: "Volumes & networking", done: true },
          { id: uid(), title: "Docker Compose for local dev", done: false },
        ]},
        c("Kubernetes (CKA)", ["Pods, deployments, services","ConfigMaps, Secrets, volumes","Helm charts"]),
        c("Infrastructure as Code (Terraform)", ["HCL basics, providers, state","Modules & workspaces"]),
      ],
      notes: [
        { id: uid(), title: "Useful commands", content: "kubectl get pods -A\nkubectl logs -f <pod>\nterraform plan -out=plan", updatedAt: A - 2 * DAY },
      ],
      resumeBullets: [
        { id: uid(), text: "Designed multi-env CI/CD pipelines reducing deploy time by 60%" },
        { id: uid(), text: "Containerized 12 microservices with Docker and Kubernetes" },
      ],
    },
    { id: sre, name: "SRE", color: "#8b5cf6",
      concepts: [
        c("Monitoring & Observability", ["Prometheus metrics","Grafana dashboards","Alertmanager & routing","Distributed tracing (Jaeger)"]),
        c("SLO / SLI / Error Budgets", ["Define SLIs per service","Set SLO targets & burn rates","Error budget policies"]),
        c("Incident Response", ["On-call rotations","Blameless postmortems","Retros & action items"]),
      ],
      notes: [{ id: uid(), title: "SRE reading list", content: "- Site Reliability Engineering book\n- Google SRE Workbook", updatedAt: A - 3 * DAY }],
      resumeBullets: [{ id: uid(), text: "Improved MTTR by 40% through better alert routing and on-call docs" }],
    },
  ];

  // Seed the 5 pre-built roadmap templates. cloneTemplate re-ids everything so
  // milestones don't collide between roadmaps.
  const seededRoadmaps: CareerRoadmap[] = TEMPLATE_LIST.map((tpl) => cloneTemplate(tpl.template!)!);

  return {
    roadmaps: seededRoadmaps,
    skills: [],
    courses: [],
    contacts: [],
    applications: [],
    companies: [],
    questions: [],
    achievements: [
      { id: uid(), title: "Completed Docker course", date: new Date(A - 30 * DAY).toISOString().slice(0,10), category: "technical", icon: "🐳" },
      { id: uid(), title: "Won internal hackathon",  date: new Date(A - 60 * DAY).toISOString().slice(0,10), category: "leadership", icon: "🏆" },
    ],
    projects: [],
    resumes: [],
    bullets: [
      { id: uid(), text: "Designed multi-env CI/CD pipelines reducing deploy time by 60%" },
      { id: uid(), text: "Containerized 12 microservices with Docker and Kubernetes" },
      { id: uid(), text: "Improved MTTR by 40% through better alert routing and on-call docs" },
    ],
    testimonials: [],
    days: [],
    meetings: [],
    timeline: [],
    satisfaction: [],
    burnoutChecks: [],
    sabbaticals: [],
    sideHustles: [],
    ip: [],
    speaking: [],
    visionBoard: [],
    // Legacy
    tracks: legacyTracks,
    goals: [
      { id: uid(), title: "Land a summer 2026 internship", done: false, deadline: "2026-06-01", trackId: devops },
      { id: uid(), title: "Earn CKA certification",       done: false, deadline: "2025-12-31", trackId: devops },
      { id: uid(), title: "Post 12 LinkedIn articles",    done: false },
    ],
    notes: [],
    linkedin: "",
  };
})();

// ---------------- Forge / Projects OS seed ----------------
const EMPTY_PROJECT_DEFAULTS = {
  budgetBenefit: {},
  stakeholders: [],
  milestones: [],
  premortem: [],
  risks: [],
  issues: [],
  qualityChecks: [],
  qualityMetrics: [],
  comms: [],
  changeRequests: [],
  resources: [],
  weeklyReports: [],
  fileLinks: [],
  links: [],
  tags: [],
  velocityPoints: [],
  timeline: [],
  regulatoryChecks: [],
  scopeHistory: [],
  goNoGos: [],
  satisfactionLog: [],
  sponsorLog: [],
  costBenefit: { oneTimeCost: 0, ongoingCost: 0, projectedBenefit: 0 },
};
const EMPTY_TASK_DEFAULTS = {
  comments: [],
  checkpoints: [],
  tags: [],
  subtaskIds: [],
  pomodoros: 0,
  energy: 3 as const,
  focus: 3 as const,
  effort: 3 as 1|2|3|4|5,
  impact: 3 as 1|2|3|4|5,
  importance: 5,
  urgency: 5,
};
function upgradeProject(p: any): any {
  return { ...EMPTY_PROJECT_DEFAULTS, ...p,
    stakeholders: p.stakeholders ?? [],
    milestones: p.milestones ?? [],
    premortem: p.premortem ?? [],
    risks: p.risks ?? [],
    issues: p.issues ?? [],
    qualityChecks: (p.qualityChecks ?? []).map((q:any)=>({category:"standards",...q})),
    comms: (p.comms ?? []).map((c:any)=>({type:"update",...c})),
    links: p.links ?? [],
    tags: p.tags ?? [],
    velocityPoints: p.velocityPoints ?? [],
    budget: { currency: "$", actual: 0, ...(p.budget ?? {}) },
  };
}
function upgradeTask(t: any): any {
  return { ...EMPTY_TASK_DEFAULTS, ...t };
}

const SEED_FORGE: ForgeState = (() => {
  const today = new Date().toISOString().slice(0,10);
  const pid = "p-forge-01";
  return {
    projects: [
      upgradeProject({
        id: pid,
        codename: "IRON-01",
        title: "Forge OS",
        brief: "Ship the Forge projects workspace — a heavy-industrial OS for all in-flight builds, with cross-links back to Career skills and Portfolio.",
        why: "Because every builder needs an anvil. A place to plan, strike metal, and ship — not just dream.",
        successMetrics: "All 4 core sections live (Foundry, Quarry, Smelter, Archive). Rich demo seeds 7 projects.",
        rejectionCriteria: "No commits for 14 days and no active tasks → melt it down in the Archive.",
        status: "on-track",
        priority: 9,
        energyDemand: 8,
        complexity: 7,
        color: "#f59e0b",
        icon: "⚒️",
        createdAt: today,
        startedAt: today,
        archived: false,
        checkinFreq: "daily",
        budget: { estimated: 0, actual: 0, currency: "$" },
        stakeholders: [],
        milestones: [
          { id: uid(), title: "Foundry shell & theme", date: today, done: true, doneAt: today, notes: "Dual theme locked." },
          { id: uid(), title: "Project cards + drilldown", date: today, done: true },
          { id: uid(), title: "Task Kanban + quarry", date: today, done: true },
          { id: uid(), title: "Smelter brainstorms & retro", date: today, done: true },
          { id: uid(), title: "Analytics (velocity/burndown)", date: today, done: false },
        ],
        premortem: [
          { id: uid(), failure: "Scope creeps into 189 features, never ships", mitigation: "Iterate; ship in waves", likelihood: "med" },
        ],
        risks: [
          { id: uid(), description: "Career/Forge cross-links feel bolted on", probability: "med", impact: "med", mitigation: "Surface skill-bump bridges natively", contingency: "Ship without cross-links, add in v1.1", status: "open" },
        ],
        issues: [],
        qualityChecks: [
          { id: uid(), label: "tsc --noEmit clean", category:"standards", done: true },
          { id: uid(), label: "Dual themes verified", category:"review", done: true },
          { id: uid(), label: "No imperial/katana/cyan bleed", category:"standards", done: true },
        ],
        comms: [],
        scope: "Full Forge OS.",
        tags: ["kaizen", "productivity"],
        links: [],
        velocityPoints: [8, 12, 15],
      }),
    ],
    tasks: [],
    scratch: [],
    decisions: [],
    swot: [],
    proscons: [],
    scenarios: [],
    fiveWhys: [],
    lessons: [],
    retors: [],
    parking: [],
    pomodoros: [],
    personas: [],
    decisionMatrix: [],
    ideas: [],
    settings: {
      workStartHour: 9,
      workEndHour: 18,
      defaultEnergyPeak: "morning",
      forgeName: "THE FORGE",
    },
  };
})();

function migrateForge(raw: any): ForgeState {
  if (!raw || typeof raw !== "object") return SEED_FORGE;
  return { ...SEED_FORGE, ...raw,
    projects: (raw.projects ?? SEED_FORGE.projects).map(upgradeProject),
    tasks: (raw.tasks ?? []).map(upgradeTask),
    scratch: raw.scratch ?? [],
    decisions: raw.decisions ?? [],
    swot: raw.swot ?? [],
    proscons: raw.proscons ?? [],
    scenarios: raw.scenarios ?? [],
    fiveWhys: raw.fiveWhys ?? [],
    lessons: raw.lessons ?? [],
    retors: raw.retors ?? [],
    parking: raw.parking ?? [],
    pomodoros: raw.pomodoros ?? [],
    personas: raw.personas ?? [],
    decisionMatrix: raw.decisionMatrix ?? [],
    ideas: raw.ideas ?? [],
    settings: { ...SEED_FORGE.settings, ...(raw.settings ?? {}) },
  };
}

// ---------------- Workout seed ----------------
const SEED_WORKOUT: WorkoutState = (() => {
  // Exercises come from the curated default library; stamp each with createdAt
  // so "new" sort works.  We keep refs by id so PR seeds below still link up.
  const seededExercises: WorkoutExercise[] = DEFAULT_EXERCISES.map((e) => ({
    ...e,
    createdAt: A,
  }));
  const byId = (id: string) => seededExercises.find((e) => e.id === id)!;
  const bench    = byId("w-bench");
  const squat    = byId("w-squat");
  const deadlift = byId("w-dead");
  const ohp      = byId("w-ohp");
  const pullup   = byId("w-pullup");
  const pushup   = byId("w-pushup");
  const plank    = byId("w-plank");
  const run5k    = byId("w-run5k");
  const row      = byId("w-row");
  const bicep    = byId("w-bicep");
  const tri      = byId("w-tbextend");
  const latRaise = byId("w-latraise");
  const legPress = byId("w-legpress");
  const calfRaise= byId("w-calf");
  const lSit     = byId("w-lsit");

  const daysAgo = (n: number) => new Date(A - n * DAY).toISOString().slice(0,10);
  const pr = (id: string, eid: string, v: number, reps: number | undefined, da: number): WorkoutPR => ({
    id, exerciseId: eid, value: v, reps, estimated1RM: reps ? epley1RM(v, reps) : v,
    date: daysAgo(da), history: [{ date: daysAgo(da), value: v, reps }],
  });
  const B = { bench1: uid(), ohp1: uid(), pushup1: uid(), rest1: uid(), plank1: uid() };
  const BL = { squat1: uid(), lunge1: uid(), calf1: uid() };

  const caliChains: CalisthenicsChain[] = [
    { id: "cc-push", name: "Push-up Progression", pattern: "Push", progressions: [
      { id: uid(), name: "Knee Push-up",       difficulty: 1, achieved: true,  bestReps: 20 },
      { id: uid(), name: "Push-up",            difficulty: 2, achieved: true,  bestReps: 15 },
      { id: uid(), name: "Diamond Push-up",    difficulty: 3, achieved: false },
      { id: uid(), name: "Wide Push-up",       difficulty: 3, achieved: false },
      { id: uid(), name: "Archer Push-up",     difficulty: 5, achieved: false },
      { id: uid(), name: "One-Arm Push-up",    difficulty: 9, achieved: false },
    ]},
    { id: "cc-pull", name: "Pull-up Progression", pattern: "Pull", progressions: [
      { id: uid(), name: "Dead Hang",                  difficulty: 1, achieved: true },
      { id: uid(), name: "Australian Pull-up",         difficulty: 2, achieved: true },
      { id: uid(), name: "Negative Pull-up",           difficulty: 3, achieved: true },
      { id: uid(), name: "Band-assisted Pull-up",      difficulty: 4, achieved: false },
      { id: uid(), name: "Strict Pull-up",             difficulty: 5, achieved: false },
      { id: uid(), name: "L-Sit Pull-up",              difficulty: 6, achieved: false },
      { id: uid(), name: "Muscle-up",                  difficulty: 9, achieved: false },
    ]},
    { id: "cc-squat", name: "Squat Progression", pattern: "Squat", progressions: [
      { id: uid(), name: "Assisted Squat",  difficulty: 1, achieved: true },
      { id: uid(), name: "Bodyweight Squat",difficulty: 2, achieved: true },
      { id: uid(), name: "Pistol (assisted)",difficulty:4, achieved: false },
      { id: uid(), name: "Shrimp Squat",    difficulty: 5, achieved: false },
      { id: uid(), name: "Pistol Squat",    difficulty: 8, achieved: false },
    ]},
    { id: "cc-hand", name: "Handstand Progression", pattern: "Isometric", progressions: [
      { id: uid(), name: "Wall hold 30s",       difficulty: 2, achieved: true },
      { id: uid(), name: "Chest-to-wall 20s",   difficulty: 4, achieved: false },
      { id: uid(), name: "Free-standing 10s",   difficulty: 6, achieved: false },
      { id: uid(), name: "Handstand Push-up",   difficulty: 8, achieved: false },
    ]},
  ];

  // Cali skills: researched baseline of the canonical bodyweight moves.
  // Ring heights are in cm measured from ground to ring bottom (for ring moves,
  // baseline ~180cm is rings-at-hips for most adults; false-grip muscle-up ~190;
  // ring dips ~150cm).
  const caliSkills: CalisthenicsSkill[] = [
    { id: "cs-lsit",       name: "L-sit",             pattern: "Isometric", difficulty: 5, unlocked: false,
      equipmentNeeded: ["parallettes"], accessoryIds: [], archived: false, attempts: [], failLog: [] },
    { id: "cs-pistol",     name: "Pistol Squat",      pattern: "Squat",     difficulty: 7, unlocked: false,
      equipmentNeeded: ["none"], accessoryIds: [], archived: false, attempts: [], failLog: [] },
    { id: "cs-muscleup",   name: "Muscle-up",         pattern: "Pull",      difficulty: 9, unlocked: false,
      equipmentNeeded: ["pull-up-bar"], ringHeightCm: undefined, accessoryIds: [], archived: false, attempts: [], failLog: [] },
    { id: "cs-ringmuscleup", name: "Ring Muscle-up",  pattern: "Pull",      difficulty: 10, unlocked: false,
      equipmentNeeded: ["rings"], ringHeightCm: 190, accessoryIds: [], archived: false, attempts: [], failLog: [] },
    { id: "cs-planche",    name: "Planche",           pattern: "Isometric", difficulty: 9, unlocked: false,
      equipmentNeeded: ["parallettes"], accessoryIds: [], archived: false, attempts: [], failLog: [] },
    { id: "cs-frontlever", name: "Front Lever",       pattern: "Pull",      difficulty: 8, unlocked: false,
      equipmentNeeded: ["pull-up-bar"], accessoryIds: [], archived: false, attempts: [], failLog: [] },
    { id: "cs-backlever",  name: "Back Lever",        pattern: "Pull",      difficulty: 7, unlocked: false,
      equipmentNeeded: ["pull-up-bar"], accessoryIds: [], archived: false, attempts: [], failLog: [] },
    { id: "cs-hspu",       name: "Handstand Push-up", pattern: "Push",      difficulty: 8, unlocked: false,
      equipmentNeeded: ["none"], accessoryIds: [], archived: false, attempts: [], failLog: [] },
    { id: "cs-hflag",      name: "Human Flag",        pattern: "Other",     difficulty: 10, unlocked: false,
      equipmentNeeded: ["pull-up-bar"], accessoryIds: [], archived: false, attempts: [], failLog: [] },
    { id: "cs-oap",        name: "One-Arm Pull-up",   pattern: "Pull",      difficulty: 10, unlocked: false,
      equipmentNeeded: ["pull-up-bar"], accessoryIds: [], archived: false, attempts: [], failLog: [] },
    { id: "cs-vsit",       name: "V-sit",             pattern: "Isometric", difficulty: 9, unlocked: false,
      equipmentNeeded: ["parallettes"], accessoryIds: [], archived: false, attempts: [], failLog: [] },
    { id: "cs-ringdip",    name: "Ring Dip",          pattern: "Push",      difficulty: 6, unlocked: false,
      equipmentNeeded: ["rings"], ringHeightCm: 150, accessoryIds: [], archived: false, attempts: [], failLog: [] },
    { id: "cs-nordic",     name: "Nordic Curl",       pattern: "Hinge",     difficulty: 8, unlocked: false,
      equipmentNeeded: ["none"], accessoryIds: [], archived: false, attempts: [], failLog: [] },
  ];

  const mobilityDrills: MobilityDrill[] = [
    { id: "m-wrist",  name: "Wrist circles",        durationSec: 30, tags:["wrists","upper"] },
    { id: "m-shdis",  name: "Shoulder dislocates",  durationSec: 60, tags:["shoulders"] },
    { id: "m-scap",   name: "Scapular push-ups",    durationSec: 45, tags:["scap","push"] },
    { id: "m-hollow", name: "Hollow body hold",     durationSec: 30, tags:["core"] },
    { id: "m-catcow", name: "Cat-cow",              durationSec: 45, tags:["spine"] },
    { id: "m-hip90",  name: "90/90 hip switches",   durationSec: 60, tags:["hips"] },
  ];

  const motivation: MotivationBoardItem[] = [
    { id: uid(), type: "quote", content: "\"The only bad workout is the one that didn't happen.\"", createdAt: A - DAY },
    { id: uid(), type: "pr",    content: "Bench 80 kg × 5 — new PR", createdAt: A - 5 * DAY },
    { id: uid(), type: "goal",  content: "First muscle-up this year", createdAt: A - 10 * DAY },
  ];

  // Kanban board (5 fixed columns; cards live inside their column's cards[]).
  const seedKanban: KanbanColumn[] = [
    { id: "backlog",     title: "Backlog",     cards: [
      { id: uid(), title: "Add handstand push-up negatives", type: "cali",      sets: 4, reps: 5,   tagColor: "#a3e635", createdAt: A - 2 * DAY },
      { id: uid(), title: "Long easy run (60 min Z2)",        type: "cardio",                       tagColor: "#06b6d4", createdAt: A - DAY },
    ]},
    { id: "this-week", title: "This Week", cards: [
      { id: uid(), title: "Push Day — hit 90 kg bench triple", type: "strength", sets: 5, reps: 3, weightKg: 90, tagColor: "#ec4899", createdAt: A - 3600_000 },
    ]},
    { id: "today",     title: "Today",     cards: [
      { id: uid(), title: "Warm-up band dislocates + cat-cow", type: "mobility",                    tagColor: "#8b5cf6", createdAt: A - 1800_000 },
    ]},
    { id: "in-progress", title: "In Progress", cards: [] },
    { id: "done",      title: "Done",      cards: [] },
  ];

  return {
    exercises: seededExercises,
    prs: [
      pr("p1", bench.id, 80, 5, 20),
      pr("p2", squat.id, 120, 3, 10),
      pr("p3", deadlift.id, 140, 1, 7),
      pr("p4", pullup.id, 12, undefined, 5),
      pr("p5", plank.id, 180, undefined, 3),
    ],
    skills: [
      { id: "sk-pullup", name: "Pull-up", createdAt: A,
        progressions: [
          { id: uid(), title: "Dead hangs (30s)",       target: 30, done: true,  currentBest: 35 },
          { id: uid(), title: "Australian pull-ups",    target: 15, done: true,  currentBest: 18 },
          { id: uid(), title: "Negative pull-ups",      target: 5,  done: true,  currentBest: 6 },
          { id: uid(), title: "Band-assisted pull-ups", target: 10, done: false, currentBest: 7 },
          { id: uid(), title: "Strict pull-ups",        target: 1,  done: false },
          { id: uid(), title: "10 strict pull-ups",     target: 10, done: false },
          { id: uid(), title: "L-sit pull-up",          target: 3,  done: false },
          { id: uid(), title: "Muscle-up",              target: 1,  done: false },
        ]},
      { id: "sk-handstand", name: "Handstand", createdAt: A,
        progressions: [
          { id: uid(), title: "Wall handstand (30s)",     target: 30, done: true,  currentBest: 45 },
          { id: uid(), title: "Chest-to-wall (20s)",      target: 20, done: false, currentBest: 12 },
          { id: uid(), title: "Free-standing hold",       target: 10, done: false },
          { id: uid(), title: "Handstand push-up (wall)", target: 5,  done: false },
          { id: uid(), title: "Free-standing HSPU",       target: 1,  done: false },
        ]},
      { id: "sk-squat", name: "Pistol Squat", createdAt: A,
        progressions: [
          { id: uid(), title: "Assisted box pistol",     target: 5, done: true,  currentBest: 8 },
          { id: uid(), title: "Negative pistol (3s)",    target: 5, done: false, currentBest: 4 },
          { id: uid(), title: "Pistol (assisted)",       target: 3, done: false },
          { id: uid(), title: "Full pistol each leg",    target: 5, done: false },
          { id: uid(), title: "Weighted pistol +16kg",   target: 3, done: false },
        ]},
      { id: "sk-planche", name: "Planche", createdAt: A,
        progressions: [
          { id: uid(), title: "Tuck planche (10s)",       target: 10, done: true,  currentBest: 12 },
          { id: uid(), title: "Advanced tuck (8s)",       target: 8,  done: false, currentBest: 5 },
          { id: uid(), title: "Straddle planche (5s)",    target: 5,  done: false },
          { id: uid(), title: "Full planche (3s)",        target: 3,  done: false },
          { id: uid(), title: "Planche push-ups",         target: 5,  done: false },
        ]},
      { id: "sk-frontlever", name: "Front Lever", createdAt: A,
        progressions: [
          { id: uid(), title: "Tuck front lever (10s)",   target: 10, done: false, currentBest: 6 },
          { id: uid(), title: "Advanced tuck (8s)",       target: 8,  done: false },
          { id: uid(), title: "Straddle FL (5s)",         target: 5,  done: false },
          { id: uid(), title: "Full front lever (3s)",    target: 3,  done: false },
          { id: uid(), title: "Front lever pull-ups",     target: 3,  done: false },
        ]},
      { id: "sk-dip", name: "Ring Dip", createdAt: A,
        progressions: [
          { id: uid(), title: "Box dips (15)",            target: 15, done: true },
          { id: uid(), title: "Assisted ring dips (8)",   target: 8,  done: false, currentBest: 5 },
          { id: uid(), title: "Strict ring dips (5)",     target: 5,  done: false },
          { id: uid(), title: "Ring dip support 30s",     target: 30, done: false },
          { id: uid(), title: "Weighted ring dips +16kg", target: 5,  done: false },
        ]},
    ],
    routines: [
      { id: uid(), name: "Push Day", dayOfWeek: 1, createdAt: A,
        blocks: [
          { id: B.bench1,  exerciseId: bench.id,  type: "strength", sets: 4, reps: 6,  restSeconds: 180 },
          { id: B.ohp1,    exerciseId: ohp.id,    type: "strength", sets: 3, reps: 8,  restSeconds: 120 },
          { id: B.pushup1, exerciseId: pushup.id, type: "strength", sets: 3, reps: 15, restSeconds: 60  },
          { id: B.rest1,   label: "Rest",          type: "rest",     sets: 1, reps: 60, restSeconds: 0   },
          { id: B.plank1,  exerciseId: plank.id,  type: "strength", sets: 3, reps: 60, restSeconds: 60  },
        ]},
      { id: uid(), name: "Leg Day", dayOfWeek: 3, createdAt: A,
        blocks: [
          { id: BL.squat1, exerciseId: squat.id,     type: "strength", sets: 5, reps: 5,  restSeconds: 180 },
          { id: BL.lunge1, label: "Walking Lunges",  type: "strength", sets: 3, reps: 10, restSeconds: 90  },
          { id: BL.calf1,  exerciseId: calfRaise.id, type: "strength", sets: 3, reps: 20, restSeconds: 60  },
        ]},
    ],
    sessions: [],
    readiness: [],
    badges: [],
    bodyweight: [],
    settings: {
      gloveMode: false, minimalMode: false, soundEnabled: true,
      restSecondsDefault: 90, streakFreezes: 2, units: "kg",
      phase: "maintenance", age: 25, gender: "male",
    },
    activeSessionId: undefined,
    lastWorkoutDate: undefined,
    currentStreak: 0, longestStreak: 0,
    // cali
    caliChains, caliSkills, caliFlows: [], gtg: [], isometricLogs: [],
    intervalLogs: [], mobilityDrills, mobilitySessions: [], plancheEntries: [],
    // cardio
    cardioLogs: [],
    // global
    programs: [], customMetrics: [], customMetricEntries: [],
    goals: [], challenges: [], journal: [], board: motivation, restDays: [],
    kanban: seedKanban,
  };
})();

// ---------------- Store interface ----------------
interface StoreState {
  // core
  tasks: Task[]; notes: Note[];
  addTask: (t: Omit<Task, "id" | "createdAt" | "completed">) => void;
  toggleTask: (id: string) => void; deleteTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  addNote: (n: Omit<Note, "id" | "updatedAt" | "pinned">) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void; togglePinNote: (id: string) => void;
  // career
  career: CareerState;
  // forge (projects OS)
  forge: ForgeState;
  updateForge: (updater: (f: ForgeState) => Partial<ForgeState> | ForgeState) => void;
  seedForgeDemo: () => void;
  addTrack: (name: string, color: string) => void;
  updateTrack: (id: string, patch: Partial<CareerTrack>) => void; deleteTrack: (id: string) => void;
  addConcept: (trackId: string, title: string) => void;
  updateConcept: (trackId: string, conceptId: string, patch: Partial<CareerConcept>) => void;
  deleteConcept: (trackId: string, conceptId: string) => void;
  addSubConcept: (trackId: string, conceptId: string, title: string) => void;
  toggleSubConcept: (trackId: string, conceptId: string, subId: string) => void;
  updateSubConcept: (trackId: string, conceptId: string, subId: string, patch: Partial<CareerSubConcept>) => void;
  deleteSubConcept: (trackId: string, conceptId: string, subId: string) => void;
  addCareerNote: (trackId: string, title: string, content?: string) => void;
  updateCareerNote: (trackId: string, id: string, patch: Partial<CareerNote>) => void;
  deleteCareerNote: (trackId: string, id: string) => void;
  addResumeBullet: (trackId: string, text: string) => void;
  updateResumeBullet: (trackId: string, id: string, text: string) => void;
  deleteResumeBullet: (trackId: string, id: string) => void;
  addGoal: (title: string) => void; toggleGoal: (id: string) => void;
  updateGoal: (id: string, patch: Partial<CareerGoal>) => void;
  deleteGoal: (id: string) => void;
  addAchievement: (a: Omit<CareerAchievement, "id">) => void; deleteAchievement: (id: string) => void;
  setLinkedin: (v: string) => void;
  // Generic mutator for new career domain (roadmaps/skills/courses/etc). Accepts
  // an updater that returns a patch to the CareerState (or the whole new state).
  updateCareer: (updater: (c: CareerState) => Partial<CareerState> | CareerState) => void;
  addRoadmapFromTemplate: (templateId: "devops"|"networking"|"linux"|"mlops"|"cloud"|"custom", name?: string) => void;
  toggleMilestoneDone: (roadmapId: string, phaseId: string, milestoneId: string) => void;
  updateMilestone: (roadmapId: string, phaseId: string, milestoneId: string, patch: Record<string, any>) => void;
  toggleLabItem: (roadmapId: string, phaseId: string, milestoneId: string, labId: string) => void;
  toggleResourceComplete: (roadmapId: string, phaseId: string, milestoneId: string, resId: string) => void;
  toggleProjectComplete: (roadmapId: string, phaseId: string, milestoneId: string, prjId: string) => void;
  setQuizAnswer: (roadmapId: string, phaseId: string, milestoneId: string, quizId: string, answer: "yes"|"partial"|"no") => void;
  logMilestoneHours: (roadmapId: string, phaseId: string, milestoneId: string, hours: number) => void;
  archiveRoadmap: (roadmapId: string) => void;
  deleteRoadmap: (roadmapId: string) => void;
  seedCareerDemo: () => void;
  // workout library
  workout: WorkoutState;
  addExercise: (e: Omit<WorkoutExercise, "id" | "createdAt">) => void;
  updateExercise: (id: string, patch: Partial<WorkoutExercise>) => void;
  deleteExercise: (id: string) => void;
  // PRs
  logPR: (exerciseId: string, value: number, reps?: number, rir?: number, rpe?: number, note?: string) => void;
  deletePR: (id: string) => void;
  // high-level skills (WorkoutSkill)
  addSkill: (name: string) => void; deleteSkill: (id: string) => void;
  addProgression: (skillId: string, title: string, target?: number) => void;
  toggleProgressionDone: (skillId: string, progId: string) => void;
  updateProgression: (skillId: string, progId: string, patch: Partial<WorkoutProgression>) => void;
  deleteProgression: (skillId: string, progId: string) => void;
  // routines
  addRoutine: (name: string, dayOfWeek?: number) => void;
  updateRoutine: (id: string, patch: Partial<WorkoutRoutine>) => void; deleteRoutine: (id: string) => void;
  addBlock: (routineId: string, block: Omit<WorkoutBlock, "id">) => void;
  updateBlock: (routineId: string, blockId: string, patch: Partial<WorkoutBlock>) => void;
  deleteBlock: (routineId: string, blockId: string) => void;
  reorderBlocks: (routineId: string, from: number, to: number) => void;
  // sessions
  startSession: (name: string, routineId?: string, readinessScore?: number) => string;
  logSet: (sessionId: string, entry: Omit<WorkoutSetLog, "completed"> & { completed?: boolean }) => void;
  addAdHocBlock: (sessionId: string, block: WorkoutBlock) => void;
  updateSession: (sessionId: string, patch: Partial<WorkoutSession>) => void;
  finishSession: (sessionId: string) => void; discardSession: (sessionId: string) => void;
  importSession: (session: Omit<WorkoutSession, "id"> & { id?: string }) => string;
  // wellness
  logReadiness: (r: Omit<WorkoutReadiness, "score" | "date">) => void;
  logBodyweight: (weightKg: number) => void;
  // settings
  updateWorkoutSettings: (patch: Partial<WorkoutSettings>) => void;
  exportWorkoutCSV: () => string;
  getExerciseForBlock: (blockId: string) => WorkoutExercise | undefined;
  // Demo data seeding (QA/demo). Replaces sessions, PRs, readiness, bodyweight,
  // goals, challenges, journal with rich mock data without touching the library
  // or routines. resetWorkoutData wipes logs back to seed (keeps exercises/routines).
  seedDemoData: () => void;
  resetWorkoutData: () => void;
  // calisthenics
  toggleChainProgression: (chainId: string, progId: string) => void;
  updateCaliChainProgression: (chainId: string, progId: string, patch: Partial<any>) => void;
  addCaliSkill: (s: Omit<CalisthenicsSkill, "id" | "attempts" | "failLog" | "archived" | "unlocked">) => void;
  logCaliAttempt: (skillId: string, a: Omit<import("./types").CaliAttempt, "id" | "date">) => void;
  logCaliFail: (skillId: string, reason: string) => void;
  toggleCaliSkillArchived: (skillId: string) => void;
  unlockCaliSkill: (skillId: string) => void;
  addFlow: (f: Omit<CalisthenicsFlow, "id" | "date">) => void; deleteFlow: (id: string) => void;
  toggleGtG: (date: string, hour: number, exerciseName: string, reps: number) => void;
  logIsometric: (name: string, seconds: number) => void;
  addIntervalLog: (i: Omit<IntervalLog, "id" | "date">) => void;
  logMobility: (drillIds: string[], note?: string) => void;
  addMobilityDrill: (name: string, durationSec: number, tags?: string[]) => void;
  logPlanche: (handDistanceCm: number, holdSec: number) => void;
  // cardio
  addCardioLog: (l: Omit<CardioLog, "id">) => void; deleteCardioLog: (id: string) => void;
  // global
  addProgram: (p: Omit<Program, "id">) => void; updateProgram: (id: string, patch: Partial<Program>) => void; deleteProgram: (id: string) => void;
  addWorkoutGoal: (g: Omit<WorkoutGoal, "id" | "achieved">) => void; updateWorkoutGoal: (id: string, patch: Partial<WorkoutGoal>) => void; deleteWorkoutGoal: (id: string) => void;
  addCustomMetric: (m: Omit<CustomMetric, "id">) => void; logCustomMetric: (metricId: string, sessionId: string, value: number) => void;
  addChallenge: (name: string, lengthDays?: number) => void; toggleChallengeDay: (challengeId: string, dayIndex: number) => void; deleteChallenge: (id: string) => void;
  addJournalEntry: (content: string, tags?: string[]) => void; deleteJournalEntry: (id: string) => void;
  addBoardItem: (b: Omit<MotivationBoardItem, "id" | "createdAt">) => void; deleteBoardItem: (id: string) => void;
  logRestDay: (reason: string) => void;
  // kanban
  addKanbanCard: (colId: KanbanColumn["id"], card: Omit<KanbanCard, "id" | "createdAt">) => void;
  updateKanbanCard: (id: string, patch: Partial<KanbanCard>) => void;
  deleteKanbanCard: (id: string) => void;
  moveKanbanCard: (id: string, toCol: KanbanColumn["id"], toIndex?: number) => void;
  clearKanbanDone: () => void;
}

const StoreContext = createContext<StoreState | null>(null);

/** Hydration-safe localStorage hook. */
function useLocalState<T>(key: string, seed: T, migrate?: (raw: any) => T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [v, setV] = useState<T>(seed);
  const hydrated = useRef(false);
  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw) { try { setV(migrate ? migrate(JSON.parse(raw)) : JSON.parse(raw)); } catch { /* ignore */ } }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => { if (hydrated.current) localStorage.setItem(key, JSON.stringify(v)); }, [key, v]);
  return [v, setV];
}

const migrateCareer = (raw: any): CareerState => {
  // Normalize legacy tracks (concepts/subConcepts).
  const tracks = (raw.tracks ?? []).map((t: any) => {
    if (Array.isArray(t.concepts)) return t;
    const ms: any[] = Array.isArray(t.milestones) ? t.milestones : [];
    return { ...t, concepts: ms.map((m: any) => ({ id: m.id ?? uid(), title: m.title ?? "Untitled",
      subConcepts: m.description ? [{ id: uid(), title: m.description, done: !!m.done }] : [] })) };
  });

  // Roadmaps: if none exist, seed all 5 templates from scratch.
  const roadmaps: CareerRoadmap[] = Array.isArray(raw.roadmaps) && raw.roadmaps.length
    ? raw.roadmaps
    : TEMPLATE_LIST.map((tpl) => cloneTemplate(tpl.template!)!);

  // Normalize achievements (new shape uses category; old shape only had trackId/icon).
  const achievements = (raw.achievements ?? []).map((a: any) => ({
    category: "other", ...a,
  }));

  // Extract bullets from legacy tracks' resumeBullets into the new top-level bullets[]
  const existingBullets = Array.isArray(raw.bullets) ? raw.bullets : [];
  const legacyBullets = tracks.flatMap((t: any) => t.resumeBullets ?? []);
  const seenBulletIds = new Set(existingBullets.map((b: any) => b.id));
  const bullets = [...existingBullets, ...legacyBullets.filter((b: any) => !seenBulletIds.has(b.id))];

  return {
    roadmaps,
    skills: raw.skills ?? [],
    courses: raw.courses ?? [],
    contacts: raw.contacts ?? [],
    applications: raw.applications ?? [],
    companies: raw.companies ?? [],
    questions: raw.questions ?? [],
    achievements,
    projects: raw.projects ?? [],
    resumes: raw.resumes ?? [],
    bullets,
    testimonials: raw.testimonials ?? [],
    days: raw.days ?? [],
    meetings: raw.meetings ?? [],
    timeline: raw.timeline ?? [],
    satisfaction: raw.satisfaction ?? [],
    burnoutChecks: raw.burnoutChecks ?? [],
    sabbaticals: raw.sabbaticals ?? [],
    retirement: raw.retirement,
    sideHustles: raw.sideHustles ?? [],
    ip: raw.ip ?? [],
    speaking: raw.speaking ?? [],
    visionBoard: raw.visionBoard ?? [],
    tracks,
    goals: raw.goals ?? [],
    notes: raw.notes ?? [],
    linkedin: raw.linkedin ?? "",
  };
};

const migrateWorkout = (raw: any): WorkoutState => ({
  ...SEED_WORKOUT, ...raw,
  exercises:    raw.exercises    ?? SEED_WORKOUT.exercises,
  prs:          raw.prs          ?? SEED_WORKOUT.prs,
  skills:       raw.skills       ?? SEED_WORKOUT.skills,
  routines:     raw.routines     ?? SEED_WORKOUT.routines,
  sessions:     raw.sessions     ?? SEED_WORKOUT.sessions,
  readiness:    raw.readiness    ?? [],
  badges:       raw.badges       ?? [],
  bodyweight:   raw.bodyweight   ?? [],
  settings:     { ...SEED_WORKOUT.settings, ...(raw.settings ?? {}) },
  caliChains:   raw.caliChains   ?? SEED_WORKOUT.caliChains,
  caliSkills:   raw.caliSkills   ?? SEED_WORKOUT.caliSkills,
  caliFlows:    raw.caliFlows    ?? [],
  gtg:          raw.gtg          ?? [],
  isometricLogs:raw.isometricLogs ?? [],
  intervalLogs: raw.intervalLogs ?? [],
  mobilityDrills: raw.mobilityDrills ?? SEED_WORKOUT.mobilityDrills,
  mobilitySessions: raw.mobilitySessions ?? [],
  plancheEntries: raw.plancheEntries ?? [],
  cardioLogs:   raw.cardioLogs   ?? [],
  programs:     raw.programs     ?? [],
  customMetrics:raw.customMetrics ?? [],
  customMetricEntries: raw.customMetricEntries ?? [],
  goals:        raw.goals        ?? [],
  challenges:   raw.challenges   ?? [],
  journal:      raw.journal      ?? [],
  board:        raw.board        ?? SEED_WORKOUT.board,
  restDays:     raw.restDays     ?? [],
  kanban:       raw.kanban       ?? SEED_WORKOUT.kanban,
  lastWorkoutDate: raw.lastWorkoutDate,
  currentStreak: raw.currentStreak ?? 0,
  longestStreak: raw.longestStreak ?? 0,
  activeSessionId: raw.activeSessionId,
});

function applyStreak(state: WorkoutState, sessionDate: string): WorkoutState {
  const last = state.lastWorkoutDate;
  let current = state.currentStreak ?? 0, longest = state.longestStreak ?? 0;
  if (last) {
    const diff = Math.round((new Date(sessionDate).getTime() - new Date(last).getTime()) / DAY);
    if (diff === 0) { /* same day */ }
    else if (diff === 1) current = current + 1;
    else current = 1;
  } else current = 1;
  if (current > longest) longest = current;
  return { ...state, lastWorkoutDate: sessionDate, currentStreak: current, longestStreak: longest };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks]     = useLocalState<Task[]>("kaizen.tasks", seedTasks);
  const [notes, setNotes]     = useLocalState<Note[]>("kaizen.notes", seedNotes);
  const [career, setCareer]   = useLocalState<CareerState>("kaizen.career", SEED_CAREER, migrateCareer);
  const [workout, setWorkout] = useLocalState<WorkoutState>("kaizen.workout", SEED_WORKOUT, migrateWorkout);
  const [forge, setForge]     = useLocalState<ForgeState>("kaizen.forge", SEED_FORGE, migrateForge);

  useEffect(() => {
    ["prod.tasks","prod.notes","prod.projects","prod.habits"].forEach((k) => localStorage.removeItem(k));
  }, []);

  // ---- Tasks ----
  const addTask = useCallback<StoreState["addTask"]>((t) =>
    setTasks((p) => [{ ...t, id: uid(), completed: false, createdAt: Date.now() }, ...p]), [setTasks]);
  const toggleTask = useCallback((id: string) =>
    setTasks((p) => p.map((t) => t.id === id ? { ...t, completed: !t.completed } : t)), [setTasks]);
  const deleteTask = useCallback((id: string) => setTasks((p) => p.filter((t) => t.id !== id)), [setTasks]);
  const updateTask = useCallback((id: string, patch: Partial<Task>) =>
    setTasks((p) => p.map((t) => t.id === id ? { ...t, ...patch } : t)), [setTasks]);

  // ---- Notes ----
  const addNote = useCallback<StoreState["addNote"]>((n) =>
    setNotes((p) => [{ ...n, id: uid(), pinned: false, updatedAt: Date.now() }, ...p]), [setNotes]);
  const updateNote = useCallback((id: string, patch: Partial<Note>) =>
    setNotes((p) => p.map((n) => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)), [setNotes]);
  const deleteNote = useCallback((id: string) => setNotes((p) => p.filter((n) => n.id !== id)), [setNotes]);
  const togglePinNote = useCallback((id: string) =>
    setNotes((p) => p.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n)), [setNotes]);

  // ---- Career ----
  const addTrack: StoreState["addTrack"] = useCallback((name, color) =>
    setCareer((c) => ({ ...c, tracks: [...c.tracks, { id: uid(), name, color, concepts: [], notes: [], resumeBullets: [] }] })), [setCareer]);
  const updateTrack = useCallback((id: string, patch: Partial<CareerTrack>) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === id ? { ...t, ...patch } : t) })), [setCareer]);
  const deleteTrack = useCallback((id: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.filter((t) => t.id !== id),
      goals: c.goals.map((g) => g.trackId === id ? { ...g, trackId: undefined } : g),
      achievements: c.achievements.map((a) => a.trackId === id ? { ...a, trackId: undefined } : a) })), [setCareer]);
  const addConcept = useCallback((tid: string, title: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, concepts: [...t.concepts, { id: uid(), title, subConcepts: [] }] } : t) })), [setCareer]);
  const updateConcept = useCallback((tid: string, cid: string, patch: Partial<CareerConcept>) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, concepts: t.concepts.map((cc) => cc.id === cid ? { ...cc, ...patch } : cc) } : t) })), [setCareer]);
  const deleteConcept = useCallback((tid: string, cid: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, concepts: t.concepts.filter((cc) => cc.id !== cid) } : t) })), [setCareer]);
  const addSubConcept = useCallback((tid: string, cid: string, title: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, concepts: t.concepts.map((cc) => cc.id === cid ? { ...cc, subConcepts: [...cc.subConcepts, { id: uid(), title, done: false }] } : cc) } : t) })), [setCareer]);
  const toggleSubConcept = useCallback((tid: string, cid: string, sid: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, concepts: t.concepts.map((cc) => cc.id === cid ? { ...cc, subConcepts: cc.subConcepts.map((sc) => sc.id === sid ? { ...sc, done: !sc.done } : sc) } : cc) } : t) })), [setCareer]);
  const updateSubConcept = useCallback((tid: string, cid: string, sid: string, patch: Partial<CareerSubConcept>) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, concepts: t.concepts.map((cc) => cc.id === cid ? { ...cc, subConcepts: cc.subConcepts.map((sc) => sc.id === sid ? { ...sc, ...patch } : sc) } : cc) } : t) })), [setCareer]);
  const deleteSubConcept = useCallback((tid: string, cid: string, sid: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, concepts: t.concepts.map((cc) => cc.id === cid ? { ...cc, subConcepts: cc.subConcepts.filter((sc) => sc.id !== sid) } : cc) } : t) })), [setCareer]);
  const addCareerNote = useCallback((tid: string, title: string, content = "") =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, notes: [{ id: uid(), title, content, updatedAt: Date.now() }, ...t.notes] } : t) })), [setCareer]);
  const updateCareerNote = useCallback((tid: string, id: string, patch: Partial<CareerNote>) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, notes: t.notes.map((n) => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n) } : t) })), [setCareer]);
  const deleteCareerNote = useCallback((tid: string, id: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, notes: t.notes.filter((n) => n.id !== id) } : t) })), [setCareer]);
  const addResumeBullet = useCallback((tid: string, text: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, resumeBullets: [...t.resumeBullets, { id: uid(), text }] } : t) })), [setCareer]);
  const updateResumeBullet = useCallback((tid: string, id: string, text: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, resumeBullets: t.resumeBullets.map((b) => b.id === id ? { ...b, text } : b) } : t) })), [setCareer]);
  const deleteResumeBullet = useCallback((tid: string, id: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, resumeBullets: t.resumeBullets.filter((b) => b.id !== id) } : t) })), [setCareer]);
  const addGoal = useCallback((title: string) =>
    setCareer((c) => ({ ...c, goals: [{ id: uid(), title, done: false }, ...c.goals] })), [setCareer]);
  const toggleGoal = useCallback((id: string) =>
    setCareer((c) => ({ ...c, goals: c.goals.map((g) => g.id === id ? { ...g, done: !g.done } : g) })), [setCareer]);
  const updateGoal = useCallback((id: string, patch: Partial<CareerGoal>) =>
    setCareer((c) => ({ ...c, goals: c.goals.map((g) => g.id === id ? { ...g, ...patch } : g) })), [setCareer]);
  const deleteGoal = useCallback((id: string) =>
    setCareer((c) => ({ ...c, goals: c.goals.filter((g) => g.id !== id) })), [setCareer]);
  const addAchievement = useCallback((a: Omit<CareerAchievement, "id">) =>
    setCareer((c) => ({ ...c, achievements: [{
      id: uid(),
      title: a.title,
      date: a.date ?? new Date().toISOString().slice(0,10),
      category: "other" as const,
      description: a.description,
      icon: a.icon,
      trackId: a.trackId,
    }, ...c.achievements] })), [setCareer]);
  const deleteAchievement = useCallback((id: string) =>
    setCareer((c) => ({ ...c, achievements: c.achievements.filter((a) => a.id !== id) })), [setCareer]);
  const setLinkedin = useCallback((v: string) => setCareer((c) => ({ ...c, linkedin: v })), [setCareer]);

  // ---- New career domain ----
  const updateCareer = useCallback<StoreState["updateCareer"]>((updater) =>
    setCareer((c) => {
      const patch = updater(c);
      return { ...c, ...patch };
    }), [setCareer]);

  const updateForge = useCallback<StoreState["updateForge"]>((updater) =>
    setForge((f) => {
      const patch = updater(f);
      return { ...f, ...patch };
    }), [setForge]);

  const seedForgeDemo = useCallback<StoreState["seedForgeDemo"]>(() => {
    import("./forgeDemo").then(({ buildForgeDemo }) => setForge(buildForgeDemo()));
  }, [setForge]);

  const addRoadmapFromTemplate = useCallback<StoreState["addRoadmapFromTemplate"]>((templateId, name) => {
    setCareer((c) => {
      let rm: CareerRoadmap;
      if (templateId === "custom") {
        rm = {
          id: uid(), name: name ?? "Custom Roadmap", icon: "🗺️", color: "#06b6d4", template: "custom",
          description: "Your custom roadmap — add phases and milestones.",
          weeklyHoursTarget: 5, priority: 7, status: "active",
          startLevel: 1, targetLevel: 8, startedAt: Date.now(),
          phases: [{ id: uid(), title: "Phase I · Foundations", milestones: [] }],
        };
      } else {
        const cloned = cloneTemplate(templateId);
        if (!cloned) return c;
        if (name) cloned.name = name;
        rm = cloned;
      }
      return { ...c, roadmaps: [...c.roadmaps, rm] };
    });
  }, [setCareer]);

  const _mapRoadmap = (c: CareerState, rmId: string, fn: (r: CareerRoadmap) => CareerRoadmap): CareerState =>
    ({ ...c, roadmaps: c.roadmaps.map((r) => r.id === rmId ? fn(r) : r) });

  const toggleMilestoneDone = useCallback<StoreState["toggleMilestoneDone"]>((rmId, phId, msId) => {
    setCareer((c) => _mapRoadmap(c, rmId, (r) => ({
      ...r,
      phases: r.phases.map((ph) => ph.id !== phId ? ph : {
        ...ph,
        milestones: ph.milestones.map((ms) => ms.id !== msId ? ms : {
          ...ms,
          done: !ms.done,
          completedAt: !ms.done ? Date.now() : undefined,
          hoursActual: !ms.done ? (ms.hoursActual || ms.hoursEstimate) : ms.hoursActual,
        }),
      }),
    })));
  }, [setCareer]);

  const updateMilestone = useCallback<StoreState["updateMilestone"]>((rmId, phId, msId, patch) => {
    setCareer((c) => _mapRoadmap(c, rmId, (r) => ({
      ...r,
      phases: r.phases.map((ph) => ph.id !== phId ? ph : {
        ...ph,
        milestones: ph.milestones.map((ms) => ms.id !== msId ? ms : { ...ms, ...patch }),
      }),
    })));
  }, [setCareer]);

  const archiveRoadmap = useCallback<StoreState["archiveRoadmap"]>((rmId) => {
    setCareer((c) => _mapRoadmap(c, rmId, (r) => ({ ...r, status: r.status === "archived" ? "active" : "archived" })));
  }, [setCareer]);

  const deleteRoadmap = useCallback<StoreState["deleteRoadmap"]>((rmId) => {
    setCareer((c) => ({ ...c, roadmaps: c.roadmaps.filter((r) => r.id !== rmId) }));
  }, [setCareer]);

  // seedCareerDemo: populate every career module with rich mock data (QA/demo).
  const seedCareerDemo = useCallback(() => {
    import("./careerDemo").then(({ buildCareerDemo }) => {
      const demo = buildCareerDemo();
      // Reseed templates
      const { TEMPLATE_LIST, cloneTemplate } = require("./careerRoadmaps");
      demo.roadmaps = TEMPLATE_LIST.map((t: any) => cloneTemplate(t.template));
      setCareer(demo as any);
    });
  }, [setCareer]);

  // Helpers for drilling into milestones
  const _mapMilestone = (
    rmId: string, phId: string, msId: string,
    fn: (m: any) => any,
  ) => (c: CareerState) => _mapRoadmap(c, rmId, (r) => ({
    ...r,
    phases: r.phases.map((ph) => ph.id !== phId ? ph : {
      ...ph,
      milestones: ph.milestones.map((ms) => ms.id !== msId ? ms : fn(ms)),
    }),
  }));

  const toggleLabItem = useCallback<StoreState["toggleLabItem"]>((rmId, phId, msId, labId) => {
    setCareer((c) => _mapMilestone(rmId, phId, msId, (ms) => ({
      ...ms, labChecklist: ms.labChecklist.map((l: any) => l.id === labId ? { ...l, done: !l.done } : l),
    }))(c));
  }, [setCareer]);

  const toggleResourceComplete = useCallback<StoreState["toggleResourceComplete"]>((rmId, phId, msId, resId) => {
    setCareer((c) => _mapMilestone(rmId, phId, msId, (ms) => ({
      ...ms, resources: ms.resources.map((r: any) => r.id === resId ? { ...r, completed: !r.completed } : r),
    }))(c));
  }, [setCareer]);

  const toggleProjectComplete = useCallback<StoreState["toggleProjectComplete"]>((rmId, phId, msId, prjId) => {
    setCareer((c) => _mapMilestone(rmId, phId, msId, (ms) => ({
      ...ms, projects: ms.projects.map((p: any) => p.id === prjId ? { ...p, completed: !p.completed } : p),
    }))(c));
  }, [setCareer]);

  const setQuizAnswer = useCallback<StoreState["setQuizAnswer"]>((rmId, phId, msId, qzId, answer) => {
    setCareer((c) => _mapMilestone(rmId, phId, msId, (ms) => ({
      ...ms,
      quiz: ms.quiz.length ? ms.quiz.map((q: any) => q.id === qzId ? { ...q, selfRating: answer } : q)
        : [{ id: qzId, question: "Do you understand this milestone?", selfRating: answer }],
    }))(c));
  }, [setCareer]);

  const logMilestoneHours = useCallback<StoreState["logMilestoneHours"]>((rmId, phId, msId, hours) => {
    setCareer((c) => _mapMilestone(rmId, phId, msId, (ms) => ({
      ...ms, hoursActual: Math.max(0, (ms.hoursActual || 0) + hours),
    }))(c));
  }, [setCareer]);

  // ---- Workout: exercises ----
  const addExercise = useCallback<StoreState["addExercise"]>((e) =>
    setWorkout((w) => ({ ...w, exercises: [{ ...e, id: uid(), createdAt: Date.now() }, ...w.exercises] })), [setWorkout]);
  const updateExercise = useCallback((id: string, patch: Partial<WorkoutExercise>) =>
    setWorkout((w) => ({ ...w, exercises: w.exercises.map((e) => e.id === id ? { ...e, ...patch } : e) })), [setWorkout]);
  const deleteExercise = useCallback((id: string) =>
    setWorkout((w) => ({ ...w,
      exercises: w.exercises.filter((e) => e.id !== id),
      prs: w.prs.filter((p) => p.exerciseId !== id),
      routines: w.routines.map((r) => ({ ...r, blocks: r.blocks.map((b) => b.exerciseId === id ? { ...b, exerciseId: undefined } : b) })),
    })), [setWorkout]);

  // ---- PRs ----
  const logPR = useCallback<StoreState["logPR"]>((exerciseId, value, reps, rir, rpe, note) => {
    const today = todayIso();
    setWorkout((w) => {
      const existing = w.prs.find((p) => p.exerciseId === exerciseId);
      const ex = w.exercises.find((e) => e.id === exerciseId);
      const est1rm = reps ? epley1RM(value, reps) : value;
      const candidate = ex?.unit === "kg" ? est1rm : value;
      const prev = existing ? (ex?.unit === "kg" ? (existing.estimated1RM ?? existing.value) : existing.value) : 0;
      const isBetter = candidate > prev;
      const attempt: WorkoutPRAttempt = { date: today, value, reps, rir, rpe };
      if (existing) {
        return { ...w, prs: w.prs.map((p) => p.id === existing.id ? {
          ...p,
          value: isBetter ? value : p.value,
          reps:  isBetter ? (reps ?? p.reps) : p.reps,
          estimated1RM: isBetter ? est1rm : p.estimated1RM,
          date:  isBetter ? today : p.date,
          note:  isBetter ? (note ?? p.note) : p.note,
          history: [...p.history, attempt].sort((a,b)=>a.date.localeCompare(b.date)),
        } : p) };
      }
      return { ...w, prs: [...w.prs, { id: uid(), exerciseId, value, reps, estimated1RM: est1rm,
        date: today, note, history: [attempt] }] };
    });
  }, [setWorkout]);
  const deletePR = useCallback((id: string) =>
    setWorkout((w) => ({ ...w, prs: w.prs.filter((p) => p.id !== id) })), [setWorkout]);

  // ---- Workout skills (high-level) ----
  const addSkill = useCallback((name: string) =>
    setWorkout((w) => ({ ...w, skills: [...w.skills, { id: uid(), name, progressions: [], createdAt: Date.now() }] })), [setWorkout]);
  const deleteSkill = useCallback((id: string) =>
    setWorkout((w) => ({ ...w, skills: w.skills.filter((s) => s.id !== id) })), [setWorkout]);
  const addProgression = useCallback((sid: string, title: string, target?: number) =>
    setWorkout((w) => ({ ...w, skills: w.skills.map((s) => s.id === sid ? { ...s, progressions: [...s.progressions, { id: uid(), title, target, done: false }] } : s) })), [setWorkout]);
  const toggleProgressionDone = useCallback((sid: string, pid: string) =>
    setWorkout((w) => ({ ...w, skills: w.skills.map((s) => s.id === sid ? { ...s, progressions: s.progressions.map((p) => p.id === pid ? { ...p, done: !p.done } : p) } : s) })), [setWorkout]);
  const updateProgression = useCallback((sid: string, pid: string, patch: Partial<WorkoutProgression>) =>
    setWorkout((w) => ({ ...w, skills: w.skills.map((s) => s.id === sid ? { ...s, progressions: s.progressions.map((p) => p.id === pid ? { ...p, ...patch } : p) } : s) })), [setWorkout]);
  const deleteProgression = useCallback((sid: string, pid: string) =>
    setWorkout((w) => ({ ...w, skills: w.skills.map((s) => s.id === sid ? { ...s, progressions: s.progressions.filter((p) => p.id !== pid) } : s) })), [setWorkout]);

  // ---- Routines ----
  const addRoutine = useCallback((name: string, dayOfWeek?: number) =>
    setWorkout((w) => ({ ...w, routines: [...w.routines, { id: uid(), name, dayOfWeek, blocks: [], createdAt: Date.now() }] })), [setWorkout]);
  const updateRoutine = useCallback((id: string, patch: Partial<WorkoutRoutine>) =>
    setWorkout((w) => ({ ...w, routines: w.routines.map((r) => r.id === id ? { ...r, ...patch } : r) })), [setWorkout]);
  const deleteRoutine = useCallback((id: string) =>
    setWorkout((w) => ({ ...w, routines: w.routines.filter((r) => r.id !== id) })), [setWorkout]);
  const addBlock = useCallback((rid: string, block: Omit<WorkoutBlock, "id">) =>
    setWorkout((w) => ({ ...w, routines: w.routines.map((r) => r.id === rid ? { ...r, blocks: [...r.blocks, { ...block, id: uid() }] } : r) })), [setWorkout]);
  const updateBlock = useCallback((rid: string, bid: string, patch: Partial<WorkoutBlock>) =>
    setWorkout((w) => ({ ...w, routines: w.routines.map((r) => r.id === rid ? { ...r, blocks: r.blocks.map((b) => b.id === bid ? { ...b, ...patch } : b) } : r) })), [setWorkout]);
  const deleteBlock = useCallback((rid: string, bid: string) =>
    setWorkout((w) => ({ ...w, routines: w.routines.map((r) => r.id === rid ? { ...r, blocks: r.blocks.filter((b) => b.id !== bid) } : r) })), [setWorkout]);

  const reorderBlocks = useCallback<StoreState["reorderBlocks"]>((rid, from, to) => {
    setWorkout((w) => ({ ...w, routines: w.routines.map((r) => {
      if (r.id !== rid) return r;
      const blocks = [...r.blocks];
      if (from < 0 || from >= blocks.length || to < 0 || to >= blocks.length) return r;
      const [moved] = blocks.splice(from, 1);
      blocks.splice(to, 0, moved);
      return { ...r, blocks };
    }) }));
  }, [setWorkout]);

  // ---- Sessions ----
  const getExerciseForBlock = useCallback((blockId: string): WorkoutExercise | undefined => {
    for (const r of workout.routines) {
      const b = r.blocks.find((bb) => bb.id === blockId);
      if (b?.exerciseId) return workout.exercises.find((e) => e.id === b.exerciseId);
    }
    // Fall back to ad-hoc blocks attached to sessions (freestyle/quick-start).
    for (const s of workout.sessions) {
      const b = s.adHocBlocks?.find((bb) => bb.id === blockId);
      if (b?.exerciseId) return workout.exercises.find((e) => e.id === b.exerciseId);
    }
    return undefined;
  }, [workout]);

  const startSession = useCallback<StoreState["startSession"]>((name, routineId, readinessScore) => {
    const id = uid();
    setWorkout((w) => ({ ...w, activeSessionId: id,
      sessions: [{ id, name, routineId, date: todayIso(), startedAt: Date.now(), sets: [], readinessScore, totalVolumeKg: 0 }, ...w.sessions].slice(0, 200) }));
    return id;
  }, [setWorkout]);

  const logSet = useCallback<StoreState["logSet"]>((sid, entry) => {
    setWorkout((w) => ({ ...w, sessions: w.sessions.map((s) => {
      if (s.id !== sid) return s;
      const logged: WorkoutSetLog = { completed: true, ...entry };
      const existingIdx = s.sets.findIndex((x) => x.blockId === entry.blockId && x.setIndex === entry.setIndex);
      const sets = existingIdx >= 0 ? s.sets.map((x,i) => i===existingIdx ? logged : x) : [...s.sets, logged];
      const totalVolumeKg = sets.reduce((n, set) => n + ((set.weight ?? 0) * set.value), 0);
      return { ...s, sets, totalVolumeKg };
    }) }));
  }, [setWorkout]);

  /** Persist an ad-hoc block on a session (freestyle/quick-start). */
  const addAdHocBlock = useCallback<StoreState["addAdHocBlock"]>((sid, block) => {
    setWorkout((w) => ({ ...w, sessions: w.sessions.map((s) => {
      if (s.id !== sid) return s;
      if (s.adHocBlocks?.find((b) => b.id === block.id)) return s; // already added
      return { ...s, adHocBlocks: [...(s.adHocBlocks ?? []), block] };
    }) }));
  }, [setWorkout]);

  const updateSession = useCallback<StoreState["updateSession"]>((sid, patch) =>
    setWorkout((w) => ({ ...w, sessions: w.sessions.map((s) => s.id === sid ? { ...s, ...patch } : s) })), [setWorkout]);

  const finishSession = useCallback<StoreState["finishSession"]>((sid) => {
    setWorkout((w) => {
      let next = { ...w };
      const sessions = w.sessions.map((s) => s.id === sid ? { ...s, endedAt: Date.now(),
        durationSeconds: Math.round((Date.now() - s.startedAt)/1000) } : s);
      next = { ...next, sessions, activeSessionId: undefined };
      const finished = sessions.find((s) => s.id === sid);
      if (finished) next = applyStreak(next, finished.date);
      const existingIds = new Set(next.badges.map((b) => b.id));
      const earnedNow = evaluateBadges({
        sessions: next.sessions, prs: next.prs, currentStreak: next.currentStreak ?? 0,
        exercises: next.exercises, goalsAchieved: next.goals.filter(g=>g.achieved).length,
      }).filter((id) => !existingIds.has(id));
      if (earnedNow.length) next = { ...next,
        badges: [...next.badges, ...earnedNow.map((id: BadgeId) => ({ id, earnedAt: Date.now() }))] };
      return next;
    });
  }, [setWorkout]);

  const discardSession = useCallback((sid: string) =>
    setWorkout((w) => ({ ...w, sessions: w.sessions.filter((s) => s.id !== sid),
      activeSessionId: w.activeSessionId === sid ? undefined : w.activeSessionId })), [setWorkout]);

  /** Import an externally-constructed session (e.g. from CSV) — id is auto-assigned unless supplied. */
  const importSession = useCallback<StoreState["importSession"]>((sess) => {
    const id = sess.id ?? uid();
    const incoming: WorkoutSession = { ...sess, id };
    const totalVolumeKg = incoming.totalVolumeKg
      ?? incoming.sets.reduce((n, set) => n + ((set.weight ?? 0) * set.value), 0);
    setWorkout((w) => {
      let next = { ...w, sessions: [{ ...incoming, totalVolumeKg }, ...w.sessions].slice(0, 300) };
      // Recompute streaks if imported session's date is newer than last
      const finished = next.sessions.filter((s) => s.endedAt);
      if (finished[0] && (!w.lastWorkoutDate || finished[0].date >= w.lastWorkoutDate)) {
        next = applyStreak(next, finished[0].date);
      }
      return next;
    });
    return id;
  }, [setWorkout]);

  // ---- Wellness ----
  const logReadiness = useCallback<StoreState["logReadiness"]>((r) => {
    const today = todayIso();
    const entry: WorkoutReadiness = { date: today, ...r, score: computeReadiness(r) };
    setWorkout((w) => ({ ...w, readiness: [entry, ...w.readiness.filter(x=>x.date!==today)].slice(0, 60) }));
  }, [setWorkout]);
  const logBodyweight = useCallback<StoreState["logBodyweight"]>((weightKg) => {
    const today = todayIso();
    setWorkout((w) => ({ ...w, bodyweight: [{ date: today, weightKg }, ...w.bodyweight.filter(x=>x.date!==today)].slice(0, 200) }));
  }, [setWorkout]);

  const updateWorkoutSettings = useCallback((patch: Partial<WorkoutSettings>) =>
    setWorkout((w) => ({ ...w, settings: { ...w.settings, ...patch } })), [setWorkout]);

  const exportWorkoutCSV = useCallback(() => {
    const rows = [["type","date","name","set","value","unit","weight_kg","rir","rpe","duration_s","volume_kg","notes"]];
    for (const s of workout.sessions.filter((x) => x.endedAt)) {
      for (const set of s.sets) {
        const ex = getExerciseForBlock(set.blockId);
        rows.push(["strength", s.date, ex?.name ?? s.name, String(set.setIndex), String(set.value),
          ex?.unit ?? "reps", set.weight != null ? String(set.weight) : "",
          set.rir != null ? String(set.rir) : "", set.rpe != null ? String(set.rpe) : "",
          set.durationSeconds != null ? String(set.durationSeconds) : "",
          set.weight ? String(set.weight * set.value) : "", set.notes ?? ""]);
      }
    }
    for (const c of workout.cardioLogs) {
      rows.push(["cardio", c.date, c.type, "", c.distanceMeters != null ? String(c.distanceMeters) : "", "m",
        "", "", "", String(c.durationSec), "", c.notes ?? ""]);
    }
    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  }, [workout, getExerciseForBlock]);

  // ---- Calisthenics ----
  const toggleChainProgression = useCallback<StoreState["toggleChainProgression"]>((cid, pid) => {
    setWorkout((w) => {
      return { ...w, caliChains: w.caliChains.map((c) => {
        if (c.id !== cid) return c;
        return { ...c, progressions: c.progressions.map((p) => {
          if (p.id !== pid) return p;
          return { ...p, achieved: !p.achieved, achievedDate: !p.achieved ? todayIso() : undefined };
        }) };
      }) };
    });
  }, [setWorkout]);

  const updateCaliChainProgression = useCallback<StoreState["updateCaliChainProgression"]>((cid, pid, patch) => {
    setWorkout((w) => {
      return { ...w, caliChains: w.caliChains.map((c) => {
        if (c.id !== cid) return c;
        return { ...c, progressions: c.progressions.map((p) => p.id !== pid ? p : { ...p, ...patch }) };
      }) };
    });
  }, [setWorkout]);

  const addCaliSkill = useCallback<StoreState["addCaliSkill"]>((s) => {
    setWorkout((w) => {
      return { ...w, caliSkills: [...w.caliSkills, {
        ...s, id: uid(), unlocked: false, archived: false,
        equipmentNeeded: s.equipmentNeeded ?? [], accessoryIds: s.accessoryIds ?? [],
        attempts: [], failLog: [],
      }] };
    });
  }, [setWorkout]);

  const logCaliAttempt = useCallback<StoreState["logCaliAttempt"]>((sid, a) => {
    setWorkout((w) => {
      const today = todayIso();
      return { ...w, caliSkills: w.caliSkills.map((s) => {
        if (s.id !== sid) return s;
        const score = (a.reps ?? 0) + (a.holdSec ?? 0);
        const prevScore = s.bestAttempt
          ? ((s.bestAttempt.reps ?? 0) + (s.bestAttempt.holdSec ?? 0))
          : -1;
        const best = score > prevScore
          ? { reps: a.reps, holdSec: a.holdSec, ringHeightCm: a.ringHeightCm, date: today }
          : s.bestAttempt;
        return {
          ...s,
          attempts: [...s.attempts, { id: uid(), date: today, ...a }],
          firstAttemptDate: s.firstAttemptDate ?? today,
          bestAttempt: best,
        };
      }) };
    });
  }, [setWorkout]);

  const logCaliFail = useCallback<StoreState["logCaliFail"]>((sid, reason) => {
    setWorkout((w) => {
      return { ...w, caliSkills: w.caliSkills.map((s) => {
        if (s.id !== sid) return s;
        return { ...s, failLog: [...s.failLog, { id: uid(), date: todayIso(), reason }] };
      }) };
    });
  }, [setWorkout]);

  const toggleCaliSkillArchived = useCallback((sid: string) => {
    setWorkout((w) => ({ ...w, caliSkills: w.caliSkills.map((s) => s.id !== sid ? s : { ...s, archived: !s.archived }) }));
  }, [setWorkout]);

  const unlockCaliSkill = useCallback((sid: string) => {
    setWorkout((w) => ({ ...w, caliSkills: w.caliSkills.map((s) => s.id !== sid ? s : { ...s, unlocked: true, unlockedAt: todayIso() }) }));
  }, [setWorkout]);
  const addFlow = useCallback<StoreState["addFlow"]>((f) =>
    setWorkout((w) => ({ ...w, caliFlows: [{ ...f, id: uid(), date: todayIso() }, ...w.caliFlows] })), [setWorkout]);
  const deleteFlow = useCallback((id: string) =>
    setWorkout((w) => ({ ...w, caliFlows: w.caliFlows.filter(f => f.id !== id) })), [setWorkout]);
  const toggleGtG = useCallback<StoreState["toggleGtG"]>((date, hour, exerciseName, reps) =>
    setWorkout((w) => {
      // Match by date+hour only — exercise name is for display; toggling the
      // same hour slot always removes the previous entry (regardless of name
      // or reps value) so the hourly grid behaves like a true toggle.
      const existing = w.gtg.find(g => g.date === date && g.hour === hour);
      if (existing) {
        // If we're toggling off (reps=0) OR the user clicked the same slot,
        // remove the entry. If they're changing reps/name, overwrite.
        if (reps <= 0) return { ...w, gtg: w.gtg.filter(g => g.id !== existing.id) };
        return { ...w, gtg: w.gtg.map(g => g.id === existing.id ? { ...g, reps, exerciseName } : g) };
      }
      if (reps <= 0) return w;
      return { ...w, gtg: [...w.gtg, { id: uid(), date, hour, exerciseName, reps }] };
    }), [setWorkout]);
  const logIsometric = useCallback<StoreState["logIsometric"]>((name, seconds) =>
    setWorkout((w) => ({ ...w, isometricLogs: [{ id: uid(), date: todayIso(), name, seconds }, ...w.isometricLogs] })), [setWorkout]);
  const addIntervalLog = useCallback<StoreState["addIntervalLog"]>((i) =>
    setWorkout((w) => ({ ...w, intervalLogs: [{ ...i, id: uid(), date: todayIso() }, ...w.intervalLogs] })), [setWorkout]);
  const logMobility = useCallback<StoreState["logMobility"]>((drillIds, note) =>
    setWorkout((w) => {
      const dur = drillIds.reduce((n,id) => n + (w.mobilityDrills.find(d=>d.id===id)?.durationSec ?? 0), 0);
      return { ...w, mobilitySessions: [{ id: uid(), date: todayIso(), drillIds, durationSec: dur, notes:note }, ...w.mobilitySessions] };
    }), [setWorkout]);
  const addMobilityDrill = useCallback<StoreState["addMobilityDrill"]>((name, durationSec, tags=[]) =>
    setWorkout((w) => ({ ...w, mobilityDrills: [...w.mobilityDrills, { id: uid(), name, durationSec, tags }] })), [setWorkout]);
  const logPlanche = useCallback<StoreState["logPlanche"]>((handDistanceCm, holdSec) =>
    setWorkout((w) => ({ ...w, plancheEntries: [{ id: uid(), date: todayIso(), handDistanceCm, holdSec }, ...w.plancheEntries] })), [setWorkout]);

  // ---- Cardio ----
  const addCardioLog = useCallback<StoreState["addCardioLog"]>((l) =>
    setWorkout((w) => ({ ...w, cardioLogs: [{ ...l, id: uid() }, ...w.cardioLogs] })), [setWorkout]);
  const deleteCardioLog = useCallback((id: string) =>
    setWorkout((w) => ({ ...w, cardioLogs: w.cardioLogs.filter(c => c.id !== id) })), [setWorkout]);

  // ---- Global ----
  const addProgram = useCallback<StoreState["addProgram"]>((p) =>
    setWorkout((w) => ({ ...w, programs: [...w.programs, { ...p, id: uid() }] })), [setWorkout]);
  const updateProgram = useCallback((id: string, patch: Partial<Program>) =>
    setWorkout((w) => ({ ...w, programs: w.programs.map(p => p.id===id ? { ...p, ...patch } : p) })), [setWorkout]);
  const deleteProgram = useCallback((id: string) =>
    setWorkout((w) => ({ ...w, programs: w.programs.filter(p => p.id!==id) })), [setWorkout]);
  const addWorkoutGoal = useCallback<StoreState["addWorkoutGoal"]>((g) =>
    setWorkout((w) => ({ ...w, goals: [...w.goals, { ...g, id: uid(), achieved:false }] })), [setWorkout]);
  const updateWorkoutGoal = useCallback((id: string, patch: Partial<WorkoutGoal>) =>
    setWorkout((w) => ({ ...w, goals: w.goals.map(g => g.id===id ? { ...g, ...patch } : g) })), [setWorkout]);
  const deleteWorkoutGoal = useCallback((id: string) =>
    setWorkout((w) => ({ ...w, goals: w.goals.filter(g => g.id!==id) })), [setWorkout]);
  const addCustomMetric = useCallback<StoreState["addCustomMetric"]>((m) =>
    setWorkout((w) => ({ ...w, customMetrics: [...w.customMetrics, { ...m, id: uid() }] })), [setWorkout]);
  const logCustomMetric = useCallback<StoreState["logCustomMetric"]>((mid, sid, value) =>
    setWorkout((w) => ({ ...w, customMetricEntries: [...w.customMetricEntries, { id: uid(), metricId:mid, sessionId:sid, value }] })), [setWorkout]);
  const addChallenge = useCallback<StoreState["addChallenge"]>((name, lengthDays=30) => {
    const start = todayIso();
    const perDay = Array.from({length: lengthDays}, (_,i) => {
      const d = new Date(); d.setDate(d.getDate()+i);
      return { date: d.toISOString().slice(0,10), done:false };
    });
    setWorkout((w) => ({ ...w, challenges: [...w.challenges, { id: uid(), name, startDate:start, lengthDays, perDay }] }));
  }, [setWorkout]);
  const toggleChallengeDay = useCallback<StoreState["toggleChallengeDay"]>((cid, idx) =>
    setWorkout((w) => ({ ...w, challenges: w.challenges.map(c => c.id!==cid ? c : { ...c,
      perDay: c.perDay.map((d,i) => i===idx ? { ...d, done:!d.done } : d) }) })), [setWorkout]);
  const deleteChallenge = useCallback((id: string) =>
    setWorkout((w) => ({ ...w, challenges: w.challenges.filter(c => c.id!==id) })), [setWorkout]);
  const addJournalEntry = useCallback<StoreState["addJournalEntry"]>((content, tags=[]) =>
    setWorkout((w) => ({ ...w, journal: [{ id: uid(), date: todayIso(), content, tags }, ...w.journal] })), [setWorkout]);
  const deleteJournalEntry = useCallback((id: string) =>
    setWorkout((w) => ({ ...w, journal: w.journal.filter(j => j.id!==id) })), [setWorkout]);
  const addBoardItem = useCallback<StoreState["addBoardItem"]>((b) =>
    setWorkout((w) => ({ ...w, board: [{ ...b, id: uid(), createdAt: Date.now() }, ...w.board] })), [setWorkout]);
  const deleteBoardItem = useCallback((id: string) =>
    setWorkout((w) => ({ ...w, board: w.board.filter(b => b.id!==id) })), [setWorkout]);
  const logRestDay = useCallback<StoreState["logRestDay"]>((reason) =>
    setWorkout((w) => ({ ...w, restDays: [{ date: todayIso(), reason }, ...w.restDays.filter(r=>r.date!==todayIso())] })), [setWorkout]);

  // ----- Kanban actions -----
  // Find which column a card currently lives in, by id.
  function findKanban(w: any, id: string): { colIdx: number; cardIdx: number } | null {
    for (let ci = 0; ci < w.kanban.length; ci++) {
      const ci2 = w.kanban[ci].cards.findIndex((c: KanbanCard) => c.id === id);
      if (ci2 >= 0) return { colIdx: ci, cardIdx: ci2 };
    }
    return null;
  }
  const addKanbanCard = useCallback<StoreState["addKanbanCard"]>((colId, card) => {
    setWorkout((w) => {
      const cols = w.kanban.map((c) => c.id === colId
        ? { ...c, cards: [...c.cards, { ...card, id: uid(), createdAt: Date.now() }] }
        : c);
      return { ...w, kanban: cols };
    });
  }, [setWorkout]);
  const updateKanbanCard = useCallback<StoreState["updateKanbanCard"]>((id, patch) => {
    setWorkout((w) => {
      const loc = findKanban(w, id);
      if (!loc) return w;
      const cols = w.kanban.slice();
      const col = { ...cols[loc.colIdx], cards: cols[loc.colIdx].cards.slice() };
      col.cards[loc.cardIdx] = { ...col.cards[loc.cardIdx], ...patch };
      cols[loc.colIdx] = col;
      return { ...w, kanban: cols };
    });
  }, [setWorkout]);
  const deleteKanbanCard = useCallback<StoreState["deleteKanbanCard"]>((id) => {
    setWorkout((w) => ({ ...w, kanban: w.kanban.map((c) =>
      ({ ...c, cards: c.cards.filter((x) => x.id !== id) })) }));
  }, [setWorkout]);
  const moveKanbanCard = useCallback<StoreState["moveKanbanCard"]>((id, toColId, toIndex) => {
    setWorkout((w) => {
      const loc = findKanban(w, id);
      if (!loc) return w;
      const cols = w.kanban.map((c) => ({ ...c, cards: c.cards.slice() }));
      const card = cols[loc.colIdx].cards[loc.cardIdx];
      cols[loc.colIdx].cards.splice(loc.cardIdx, 1);
      const target = cols.find((c) => c.id === toColId);
      if (!target) return w;
      const insertAt = toIndex == null || toIndex < 0 || toIndex > target.cards.length ? target.cards.length : toIndex;
      target.cards.splice(insertAt, 0, card);
      return { ...w, kanban: cols };
    });
  }, [setWorkout]);
  const clearKanbanDone = useCallback<StoreState["clearKanbanDone"]>(() => {
    setWorkout((w) => ({ ...w, kanban: w.kanban.map((c) =>
      c.id === "done" ? { ...c, cards: [] } : c) }));
  }, [setWorkout]);

  // seedDemoData: lazy-imports the mock generator and overwrites logs (keeps
  // library / routines / settings) with ~12 weeks of realistic history for QA.
  const seedDemoData = useCallback<StoreState["seedDemoData"]>(() => {
    import("./mockData").then(({ generateSeedData }) => {
      setWorkout((w) => {
        const data = generateSeedData({ exercises: w.exercises, routines: w.routines });
        const finished = [...data.sessions].filter((s) => s.endedAt).sort(
          (a, b) => a.date.localeCompare(b.date),
        );
        let currentStreak = 0, longestStreak = 0, prev: string | undefined;
        for (const s of finished) {
          if (prev === undefined) currentStreak = 1;
          else {
            const diff = Math.round((new Date(s.date).getTime() - new Date(prev).getTime()) / DAY);
            currentStreak = diff === 1 ? currentStreak + 1 : 1;
          }
          longestStreak = Math.max(longestStreak, currentStreak);
          prev = s.date;
        }
        return {
          ...w,
          sessions: data.sessions,
          prs: data.prs,
          readiness: data.readiness,
          bodyweight: data.bodyweight,
          goals: data.goals,
          challenges: data.challenges,
          journal: data.journal,
          cardioLogs: data.cardioLogs ?? [],
          currentStreak,
          longestStreak: Math.max(longestStreak, w.longestStreak ?? 0),
          lastWorkoutDate: finished[finished.length - 1]?.date,
          activeSessionId: undefined,
        };
      });
    });
  }, [setWorkout]);

  // resetWorkoutData: clears logs back to a pristine state; keeps library,
  // routines, skills, settings intact.
  const resetWorkoutData = useCallback<StoreState["resetWorkoutData"]>(() => {
    setWorkout((w) => ({
      ...w,
      sessions: SEED_WORKOUT.sessions,
      prs: SEED_WORKOUT.prs,
      readiness: SEED_WORKOUT.readiness,
      bodyweight: SEED_WORKOUT.bodyweight,
      goals: SEED_WORKOUT.goals,
      challenges: SEED_WORKOUT.challenges,
      journal: SEED_WORKOUT.journal,
      cardioLogs: SEED_WORKOUT.cardioLogs,
      restDays: SEED_WORKOUT.restDays,
      kanban: SEED_WORKOUT.kanban,
      gtg: SEED_WORKOUT.gtg,
      isometricLogs: SEED_WORKOUT.isometricLogs,
      intervalLogs: SEED_WORKOUT.intervalLogs,
      caliFlows: SEED_WORKOUT.caliFlows,
      mobilitySessions: SEED_WORKOUT.mobilitySessions,
      plancheEntries: SEED_WORKOUT.plancheEntries,
      currentStreak: 0,
      longestStreak: 0,
      lastWorkoutDate: undefined,
      activeSessionId: undefined,
    }));
  }, [setWorkout]);

  const value: StoreState = {
    tasks, notes, addTask, toggleTask, deleteTask, updateTask,
    addNote, updateNote, deleteNote, togglePinNote,
    career, addTrack, updateTrack, deleteTrack, addConcept, updateConcept, deleteConcept,
    addSubConcept, toggleSubConcept, updateSubConcept, deleteSubConcept,
    addCareerNote, updateCareerNote, deleteCareerNote, addResumeBullet, updateResumeBullet, deleteResumeBullet,
    addGoal, toggleGoal, updateGoal, deleteGoal,
    addAchievement, deleteAchievement, setLinkedin,
    updateCareer, addRoadmapFromTemplate, toggleMilestoneDone, updateMilestone,
    toggleLabItem, toggleResourceComplete, toggleProjectComplete, setQuizAnswer, logMilestoneHours,
    archiveRoadmap, deleteRoadmap, seedCareerDemo,
    forge, updateForge, seedForgeDemo,
    workout, addExercise, updateExercise, deleteExercise,
    logPR, deletePR, addSkill, deleteSkill, addProgression, toggleProgressionDone, updateProgression, deleteProgression,
    addRoutine, updateRoutine, deleteRoutine, addBlock, updateBlock, deleteBlock, reorderBlocks,
    startSession, logSet, addAdHocBlock, updateSession, finishSession, discardSession, importSession,
    logReadiness, logBodyweight, updateWorkoutSettings, exportWorkoutCSV, getExerciseForBlock,
    seedDemoData, resetWorkoutData,
    toggleChainProgression, updateCaliChainProgression, addCaliSkill, logCaliAttempt, logCaliFail,
    toggleCaliSkillArchived, unlockCaliSkill, addFlow, deleteFlow, toggleGtG, logIsometric,
    addIntervalLog, logMobility, addMobilityDrill, logPlanche,
    addCardioLog, deleteCardioLog,
    addProgram, updateProgram, deleteProgram,
    addWorkoutGoal, updateWorkoutGoal, deleteWorkoutGoal,
    addCustomMetric, logCustomMetric,
    addChallenge, toggleChallengeDay, deleteChallenge,
    addJournalEntry, deleteJournalEntry, addBoardItem, deleteBoardItem, logRestDay,
    addKanbanCard, updateKanbanCard, deleteKanbanCard, moveKanbanCard, clearKanbanDone,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useSpace(spaceId: SpaceId) {
  return SPACES.find((s) => s.id === spaceId)!;
}
