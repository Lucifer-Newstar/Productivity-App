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
} from "./types";
import { SPACES } from "./types";
import { evaluateBadges, epley1RM, readinessScore as computeReadiness } from "./workoutAnalytics";
import { DEFAULT_EXERCISES } from "./exerciseLibrary";

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
  const devops = "c-devops", sre = "c-sre";
  const c = (title: string, subs: string[]): CareerConcept => ({
    id: uid(), title, subConcepts: subs.map((t) => ({ id: uid(), title: t, done: false })),
  });
  return {
    tracks: [
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
    ],
    goals: [
      { id: uid(), title: "Land a summer 2026 internship", done: false, deadline: "2026-06-01", trackId: devops },
      { id: uid(), title: "Earn CKA certification",       done: false, deadline: "2025-12-31", trackId: devops },
      { id: uid(), title: "Post 12 LinkedIn articles",    done: false },
    ],
    achievements: [
      { id: uid(), title: "Completed Docker course", date: new Date(A - 30 * DAY).toISOString().slice(0,10), icon: "🐳", trackId: devops },
      { id: uid(), title: "Won internal hackathon",  date: new Date(A - 60 * DAY).toISOString().slice(0,10), icon: "🏆" },
    ],
    linkedin: "",
  };
})();

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

  const caliSkills: CalisthenicsSkill[] = [
    { id: "cs-planche", name: "Planche", pattern: "Isometric", difficulty: 9, unlocked: false,
      equipmentNeeded: ["parallettes"], accessoryIds: [], archived: false, attempts: [], failLog: [] },
    { id: "cs-frontlever", name: "Front Lever", pattern: "Pull", difficulty: 8, unlocked: false,
      equipmentNeeded: ["pull-up-bar"], accessoryIds: [], archived: false, attempts: [], failLog: [] },
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
        ]},
      { id: "sk-handstand", name: "Handstand", createdAt: A,
        progressions: [
          { id: uid(), title: "Wall handstand (30s)", target: 30, done: true,  currentBest: 45 },
          { id: uid(), title: "Chest-to-wall (20s)",  target: 20, done: false, currentBest: 12 },
          { id: uid(), title: "Free-standing hold",   target: 10, done: false },
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
  // sessions
  startSession: (name: string, routineId?: string, readinessScore?: number) => string;
  logSet: (sessionId: string, entry: Omit<WorkoutSetLog, "completed"> & { completed?: boolean }) => void;
  updateSession: (sessionId: string, patch: Partial<WorkoutSession>) => void;
  finishSession: (sessionId: string) => void; discardSession: (sessionId: string) => void;
  // wellness
  logReadiness: (r: Omit<WorkoutReadiness, "score" | "date">) => void;
  logBodyweight: (weightKg: number) => void;
  // settings
  updateWorkoutSettings: (patch: Partial<WorkoutSettings>) => void;
  exportWorkoutCSV: () => string;
  getExerciseForBlock: (blockId: string) => WorkoutExercise | undefined;
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
  const tracks = (raw.tracks ?? []).map((t: any) => {
    if (Array.isArray(t.concepts)) return t;
    const ms: any[] = Array.isArray(t.milestones) ? t.milestones : [];
    return { ...t, concepts: ms.map((m: any) => ({ id: m.id ?? uid(), title: m.title ?? "Untitled",
      subConcepts: m.description ? [{ id: uid(), title: m.description, done: !!m.done }] : [] })) };
  });
  return { ...raw, tracks };
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
    setCareer((c) => ({ ...c, achievements: [{ ...a, id: uid() }, ...c.achievements] })), [setCareer]);
  const deleteAchievement = useCallback((id: string) =>
    setCareer((c) => ({ ...c, achievements: c.achievements.filter((a) => a.id !== id) })), [setCareer]);
  const setLinkedin = useCallback((v: string) => setCareer((c) => ({ ...c, linkedin: v })), [setCareer]);

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

  // ---- Sessions ----
  const getExerciseForBlock = useCallback((blockId: string): WorkoutExercise | undefined => {
    for (const r of workout.routines) {
      const b = r.blocks.find((bb) => bb.id === blockId);
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
      return { ...w, caliSkills: w.caliSkills.map((s) => {
        if (s.id !== sid) return s;
        return { ...s, attempts: [...s.attempts, { id: uid(), date: todayIso(), ...a }] };
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
      const key = `${date}-${hour}`;
      const existing = w.gtg.find(g => g.date===date && g.hour===hour && g.exerciseName===exerciseName);
      if (existing) return { ...w, gtg: w.gtg.filter(g => g.id !== existing.id) };
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

  const value: StoreState = {
    tasks, notes, addTask, toggleTask, deleteTask, updateTask,
    addNote, updateNote, deleteNote, togglePinNote,
    career, addTrack, updateTrack, deleteTrack, addConcept, updateConcept, deleteConcept,
    addSubConcept, toggleSubConcept, updateSubConcept, deleteSubConcept,
    addCareerNote, updateCareerNote, deleteCareerNote, addResumeBullet, updateResumeBullet, deleteResumeBullet,
    addGoal, toggleGoal, updateGoal, deleteGoal,
    addAchievement, deleteAchievement, setLinkedin,
    workout, addExercise, updateExercise, deleteExercise,
    logPR, deletePR, addSkill, deleteSkill, addProgression, toggleProgressionDone, updateProgression, deleteProgression,
    addRoutine, updateRoutine, deleteRoutine, addBlock, updateBlock, deleteBlock,
    startSession, logSet, updateSession, finishSession, discardSession,
    logReadiness, logBodyweight, updateWorkoutSettings, exportWorkoutCSV, getExerciseForBlock,
    toggleChainProgression, updateCaliChainProgression, addCaliSkill, logCaliAttempt, logCaliFail,
    toggleCaliSkillArchived, unlockCaliSkill, addFlow, deleteFlow, toggleGtG, logIsometric,
    addIntervalLog, logMobility, addMobilityDrill, logPlanche,
    addCardioLog, deleteCardioLog,
    addProgram, updateProgram, deleteProgram,
    addWorkoutGoal, updateWorkoutGoal, deleteWorkoutGoal,
    addCustomMetric, logCustomMetric,
    addChallenge, toggleChallengeDay, deleteChallenge,
    addJournalEntry, deleteJournalEntry, addBoardItem, deleteBoardItem, logRestDay,
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
