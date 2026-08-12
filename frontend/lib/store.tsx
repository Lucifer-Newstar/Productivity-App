"use client";

/**
 * Global app store (React Context + localStorage persistence).
 *
 * Contains:
 *   - Core: tasks (scoped to spaces), notes
 *   - Career: tracks/concepts/sub-concepts/notes/resume/goals/achievements/linkedin
 *   - Workout: exercise library, PRs (with history), skill progressions,
 *     routines/schedule, sessions with RIR, readiness check-ins, achievement
 *     badges, bodyweight log, settings (glove mode, minimal mode, sound), streaks
 *
 * All actions are useCallback-wrapped. `useLocalState` is hydration-safe — it
 * returns seed on first render (matching SSR) and hydrates from localStorage in
 * a useEffect, avoiding text-content mismatches.
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type {
  Task, Note, SpaceId,
  CareerState, CareerTrack, CareerConcept, CareerSubConcept,
  CareerNote, CareerBullet, CareerGoal, CareerAchievement,
  WorkoutState, WorkoutExercise, WorkoutPR, WorkoutSkill, WorkoutProgression,
  WorkoutRoutine, WorkoutBlock, WorkoutSession, WorkoutSetLog,
  WorkoutUnit, WorkoutReadiness, WorkoutBadge, WorkoutBodyweight,
  WorkoutSettings, Equipment, Level, BadgeId,
} from "./types";
import { SPACES } from "./types";
import { evaluateBadges, epley1RM, readinessScore as computeReadiness } from "./workoutAnalytics";

// Generate a short random id for entities created at runtime (not in seeds).
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const DAY = 86_400_000;

// ---------------- Seeds (module-level constants, identical server↔client) ----------------

// Anchor time for seeds — captured once at import so all relative dates are stable.
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

// Career seed
const SEED_CAREER: CareerState = (() => {
  const devops = "c-devops", sre = "c-sre";
  const c = (title: string, subs: string[]): CareerConcept => ({
    id: uid(), title, subConcepts: subs.map((t) => ({ id: uid(), title: t, done: false })),
  });
  return {
    tracks: [
      {
        id: devops, name: "DevOps", color: "#06b6d4",
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
          { id: uid(), title: "CI/CD", subConcepts: [
            { id: uid(), title: "GitHub Actions workflows", done: false },
            { id: uid(), title: "ArgoCD GitOps deployments", done: false },
          ]},
          c("Kubernetes (CKA)", ["Pods, deployments, services","ConfigMaps, Secrets, volumes","Helm charts"]),
          c("Infrastructure as Code (Terraform)", ["HCL basics, providers, state","Modules & workspaces"]),
        ],
        notes: [
          { id: uid(), title: "Useful commands", content: "kubectl get pods -A\nkubectl logs -f <pod>\nterraform plan -out=plan", updatedAt: A - 2 * DAY },
          { id: uid(), title: "Interview prep", content: "- Explain CI/CD\n- Blue/green vs canary\n- CAP theorem", updatedAt: A - DAY },
        ],
        resumeBullets: [
          { id: uid(), text: "Designed multi-env CI/CD pipelines reducing deploy time by 60%" },
          { id: uid(), text: "Containerized 12 microservices with Docker and Kubernetes" },
        ],
      },
      {
        id: sre, name: "SRE", color: "#8b5cf6",
        concepts: [
          c("Monitoring & Observability", ["Prometheus metrics","Grafana dashboards","Alertmanager & routing","Distributed tracing (Jaeger)"]),
          c("SLO / SLI / Error Budgets", ["Define SLIs per service","Set SLO targets & burn rates","Error budget policies"]),
          c("Incident Response", ["On-call rotations","Blameless postmortems","Retros & action items"]),
        ],
        notes: [
          { id: uid(), title: "SRE reading list", content: "- Site Reliability Engineering book\n- Google SRE Workbook", updatedAt: A - 3 * DAY },
        ],
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

// Workout seed (module-level IIFE)
const SEED_WORKOUT: WorkoutState = (() => {
  const ex = (
    id: string, name: string, unit: WorkoutUnit, muscleGroup: any,
    equipment?: Equipment, level?: Level, cues?: string[], secondary?: any[],
  ): WorkoutExercise => ({
    id, name, unit, muscleGroup, secondaryMuscles: secondary ?? [], equipment, level, cues,
    estimatedSetSeconds: 30, createdAt: A,
  });
  const bench    = ex("w-bench",    "Bench Press",      "kg", "chest",     "barbell", "intermediate", ["Brace core","Elbows 45°","Drive through heels"]);
  const squat    = ex("w-squat",    "Back Squat",       "kg", "quads",     "barbell", "intermediate", ["Chest up","Knees track toes","Drive through heels"]);
  const deadlift = ex("w-dead",     "Deadlift",         "kg", "hamstrings","barbell", "advanced",     ["Neutral spine","Bar close","Lift with legs"]);
  const ohp      = ex("w-ohp",      "Overhead Press",   "kg", "shoulders", "barbell", "intermediate", ["Core tight","Don't arch back"]);
  const pullup   = ex("w-pullup",   "Pull-up",          "reps","lats",     "bodyweight","intermediate", ["Squeeze scapulae","Chest to bar"]);
  const pushup   = ex("w-pushup",   "Push-up",          "reps","chest",    "bodyweight","beginner",     ["Body in a line","Elbows 45°"]);
  const plank    = ex("w-plank",    "Plank",            "seconds","abs",  "bodyweight","beginner",     ["Glutes squeezed","Neck neutral"]);
  const run5k    = ex("w-run5k",    "5k Run",           "seconds","cardio","cardio","beginner");
  const row      = ex("w-row",      "Barbell Row",      "kg", "upperBack", "barbell", "intermediate");
  const bicep    = ex("w-bicep",    "Bicep Curl",       "kg", "biceps",    "dumbbell","beginner");
  const tri      = ex("w-tri",      "Tricep Pushdown",  "kg", "triceps",   "cable",   "beginner");
  const latRaise = ex("w-latraise", "Lateral Raise",    "kg", "sideDelt",  "dumbbell","beginner");
  const legPress = ex("w-legpress", "Leg Press",        "kg", "quads",     "machine", "beginner");
  const calfRaise= ex("w-calf",     "Calf Raise",       "reps","calves",   "machine", "beginner");
  const lSit     = ex("w-lsit",     "L-Sit Hold",       "seconds","abs",  "bodyweight","advanced");

  const daysAgo = (n: number) => new Date(A - n * DAY).toISOString().slice(0,10);
  const pr = (id: string, eid: string, v: number, reps: number | undefined, da: number): WorkoutPR => ({
    id, exerciseId: eid, value: v, reps, estimated1RM: reps ? epley1RM(v, reps) : v,
    date: daysAgo(da), history: [{ date: daysAgo(da), value: v, reps }],
  });
  // Block ids for Push Day
  const B = { bench1: uid(), ohp1: uid(), pushup1: uid(), rest1: uid(), plank1: uid() };
  const BL = { squat1: uid(), lunge1: uid(), calf1: uid() };

  return {
    exercises: [bench, squat, deadlift, ohp, pullup, pushup, plank, run5k, row, bicep, tri, latRaise, legPress, calfRaise, lSit],
    prs: [
      pr("p1", bench.id, 80, 5, 20),
      pr("p2", squat.id, 120, 3, 10),
      pr("p3", deadlift.id, 140, 1, 7),
      pr("p4", pullup.id, 12, undefined, 5),
      pr("p5", plank.id, 180, undefined, 3),
    ],
    skills: [
      {
        id: "sk-pullup", name: "Pull-up", createdAt: A,
        progressions: [
          { id: uid(), title: "Dead hangs (30s)",       target: 30, done: true,  currentBest: 35 },
          { id: uid(), title: "Australian pull-ups",    target: 15, done: true,  currentBest: 18 },
          { id: uid(), title: "Negative pull-ups",      target: 5,  done: true,  currentBest: 6 },
          { id: uid(), title: "Band-assisted pull-ups", target: 10, done: false, currentBest: 7 },
          { id: uid(), title: "Strict pull-ups",        target: 1,  done: false },
        ],
      },
      {
        id: "sk-handstand", name: "Handstand", createdAt: A,
        progressions: [
          { id: uid(), title: "Wall handstand (30s)", target: 30, done: true,  currentBest: 45 },
          { id: uid(), title: "Chest-to-wall (20s)",  target: 20, done: false, currentBest: 12 },
          { id: uid(), title: "Free-standing hold",   target: 10, done: false },
        ],
      },
    ],
    routines: [
      {
        id: uid(), name: "Push Day", dayOfWeek: 1, createdAt: A,
        blocks: [
          { id: B.bench1,  exerciseId: bench.id,  type: "strength", sets: 4, reps: 6,  restSeconds: 180 },
          { id: B.ohp1,    exerciseId: ohp.id,    type: "strength", sets: 3, reps: 8,  restSeconds: 120 },
          { id: B.pushup1, exerciseId: pushup.id, type: "strength", sets: 3, reps: 15, restSeconds: 60  },
          { id: B.rest1,   label: "Rest",          type: "rest",     sets: 1, reps: 60, restSeconds: 0   },
          { id: B.plank1,  exerciseId: plank.id,  type: "strength", sets: 3, reps: 60, restSeconds: 60  },
        ],
      },
      {
        id: uid(), name: "Leg Day", dayOfWeek: 3, createdAt: A,
        blocks: [
          { id: BL.squat1, exerciseId: squat.id,    type: "strength", sets: 5, reps: 5,  restSeconds: 180 },
          { id: BL.lunge1, label: "Walking Lunges", type: "strength", sets: 3, reps: 10, restSeconds: 90  },
          { id: BL.calf1,  exerciseId: calfRaise.id,type: "strength", sets: 3, reps: 20, restSeconds: 60  },
        ],
      },
    ],
    sessions: [],
    readiness: [],
    badges: [],
    bodyweight: [],
    settings: {
      gloveMode: false,
      minimalMode: false,
      soundEnabled: true,
      restSecondsDefault: 90,
      streakFreezes: 2,
      units: "kg",
    },
    activeSessionId: undefined,
    lastWorkoutDate: undefined,
    currentStreak: 0,
    longestStreak: 0,
  };
})();

// ---------------- Store interface ----------------
interface StoreState {
  // core
  tasks: Task[];
  notes: Note[];
  addTask: (t: Omit<Task, "id" | "createdAt" | "completed">) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  addNote: (n: Omit<Note, "id" | "updatedAt" | "pinned">) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  // career
  career: CareerState;
  addTrack: (name: string, color: string) => void;
  updateTrack: (id: string, patch: Partial<CareerTrack>) => void;
  deleteTrack: (id: string) => void;
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
  addGoal: (title: string) => void;
  toggleGoal: (id: string) => void;
  updateGoal: (id: string, patch: Partial<CareerGoal>) => void;
  deleteGoal: (id: string) => void;
  addAchievement: (a: Omit<CareerAchievement, "id">) => void;
  deleteAchievement: (id: string) => void;
  setLinkedin: (v: string) => void;
  // workout - library
  workout: WorkoutState;
  addExercise: (e: Omit<WorkoutExercise, "id" | "createdAt">) => void;
  updateExercise: (id: string, patch: Partial<WorkoutExercise>) => void;
  deleteExercise: (id: string) => void;
  // workout - PRs
  logPR: (exerciseId: string, value: number, reps?: number, rir?: number, note?: string) => void;
  deletePR: (id: string) => void;
  // workout - skills
  addSkill: (name: string) => void;
  deleteSkill: (id: string) => void;
  addProgression: (skillId: string, title: string, target?: number) => void;
  toggleProgressionDone: (skillId: string, progId: string) => void;
  updateProgression: (skillId: string, progId: string, patch: Partial<WorkoutProgression>) => void;
  deleteProgression: (skillId: string, progId: string) => void;
  // workout - routines
  addRoutine: (name: string, dayOfWeek?: number) => void;
  updateRoutine: (id: string, patch: Partial<WorkoutRoutine>) => void;
  deleteRoutine: (id: string) => void;
  addBlock: (routineId: string, block: Omit<WorkoutBlock, "id">) => void;
  updateBlock: (routineId: string, blockId: string, patch: Partial<WorkoutBlock>) => void;
  deleteBlock: (routineId: string, blockId: string) => void;
  // workout - sessions
  startSession: (name: string, routineId?: string, readinessScore?: number) => string;
  logSet: (sessionId: string, entry: Omit<WorkoutSetLog, "completed"> & { completed?: boolean }) => void;
  finishSession: (sessionId: string) => void;
  discardSession: (sessionId: string) => void;
  // workout - wellness
  logReadiness: (r: Omit<WorkoutReadiness, "score" | "date">) => void;
  logBodyweight: (weightKg: number) => void;
  // workout - settings / badges
  updateWorkoutSettings: (patch: Partial<WorkoutSettings>) => void;
  exportWorkoutCSV: () => string;
  getExerciseForBlock: (blockId: string) => WorkoutExercise | undefined;
}

const StoreContext = createContext<StoreState | null>(null);

/**
 * Hydration-safe localStorage hook.
 * Returns seed on both server and first client render (matching SSR). Hydrates
 * from localStorage in useEffect after mount, then persists on every change.
 */
function useLocalState<T>(key: string, seed: T, migrate?: (raw: any) => T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [v, setV] = useState<T>(seed);
  const hydrated = useRef(false);

  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setV(migrate ? migrate(parsed) : parsed);
      } catch { /* ignore */ }
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(key, JSON.stringify(v));
  }, [key, v]);

  return [v, setV];
}

// Legacy migration for career milestones → concepts
const migrateCareer = (raw: any): CareerState => {
  const tracks = (raw.tracks ?? []).map((t: any) => {
    if (Array.isArray(t.concepts)) return t;
    const ms: any[] = Array.isArray(t.milestones) ? t.milestones : [];
    return { ...t, concepts: ms.map((m: any) => ({ id: m.id ?? uid(), title: m.title ?? "Untitled",
      subConcepts: m.description ? [{ id: uid(), title: m.description, done: !!m.done }] : [] })) };
  });
  return { ...raw, tracks };
};

// Workout state migration: handles older versions where fields were missing.
const migrateWorkout = (raw: any): WorkoutState => {
  const defs = SEED_WORKOUT;
  return {
    ...defs,
    ...raw,
    exercises:    raw.exercises    ?? defs.exercises,
    prs:          raw.prs          ?? defs.prs,
    skills:       raw.skills       ?? defs.skills,
    routines:     raw.routines     ?? defs.routines,
    sessions:     raw.sessions     ?? defs.sessions,
    readiness:    raw.readiness    ?? [],
    badges:       raw.badges       ?? [],
    bodyweight:   raw.bodyweight   ?? [],
    settings:     { ...defs.settings, ...(raw.settings ?? {}) },
    lastWorkoutDate: raw.lastWorkoutDate,
    currentStreak:  raw.currentStreak ?? 0,
    longestStreak:  raw.longestStreak ?? 0,
    activeSessionId: raw.activeSessionId,
  };
};

// Helper to compute streak after a session finishes
function applyStreak(state: WorkoutState, sessionDate: string): WorkoutState {
  const last = state.lastWorkoutDate;
  let current = state.currentStreak ?? 0;
  let longest = state.longestStreak ?? 0;
  if (last) {
    const diff = Math.round((new Date(sessionDate).getTime() - new Date(last).getTime()) / DAY);
    if (diff === 0) {
      // Same day — streak unchanged
    } else if (diff === 1) {
      current = current + 1;
    } else {
      current = 1;
    }
  } else {
    current = 1;
  }
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
  const deleteTask = useCallback((id: string) =>
    setTasks((p) => p.filter((t) => t.id !== id)), [setTasks]);
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
  const addTrack: StoreState["addTrack"] = useCallback((name: string, color: string) =>
    setCareer((c) => ({ ...c, tracks: [...c.tracks, { id: uid(), name, color, concepts: [], notes: [], resumeBullets: [] }] })), [setCareer]);
  const updateTrack = useCallback((id: string, patch: Partial<CareerTrack>) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === id ? { ...t, ...patch } : t) })), [setCareer]);
  const deleteTrack = useCallback((id: string) =>
    setCareer((c) => ({ ...c,
      tracks: c.tracks.filter((t) => t.id !== id),
      goals: c.goals.map((g) => g.trackId === id ? { ...g, trackId: undefined } : g),
      achievements: c.achievements.map((a) => a.trackId === id ? { ...a, trackId: undefined } : a),
    })), [setCareer]);
  const addConcept: StoreState["addConcept"] = useCallback((tid: string, title: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, concepts: [...t.concepts, { id: uid(), title, subConcepts: [] }] } : t) })), [setCareer]);
  const updateConcept = useCallback((tid: string, cid: string, patch: Partial<CareerConcept>) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, concepts: t.concepts.map((cc) => cc.id === cid ? { ...cc, ...patch } : cc) } : t) })), [setCareer]);
  const deleteConcept = useCallback((tid: string, cid: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, concepts: t.concepts.filter((cc) => cc.id !== cid) } : t) })), [setCareer]);
  const addSubConcept: StoreState["addSubConcept"] = useCallback((tid: string, cid: string, title: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, concepts: t.concepts.map((cc) => cc.id === cid ? { ...cc, subConcepts: [...cc.subConcepts, { id: uid(), title, done: false }] } : cc) } : t) })), [setCareer]);
  const toggleSubConcept = useCallback((tid: string, cid: string, sid: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, concepts: t.concepts.map((cc) => cc.id === cid ? { ...cc, subConcepts: cc.subConcepts.map((sc) => sc.id === sid ? { ...sc, done: !sc.done } : sc) } : cc) } : t) })), [setCareer]);
  const updateSubConcept = useCallback((tid: string, cid: string, sid: string, patch: Partial<CareerSubConcept>) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, concepts: t.concepts.map((cc) => cc.id === cid ? { ...cc, subConcepts: cc.subConcepts.map((sc) => sc.id === sid ? { ...sc, ...patch } : sc) } : cc) } : t) })), [setCareer]);
  const deleteSubConcept = useCallback((tid: string, cid: string, sid: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, concepts: t.concepts.map((cc) => cc.id === cid ? { ...cc, subConcepts: cc.subConcepts.filter((sc) => sc.id !== sid) } : cc) } : t) })), [setCareer]);
  const addCareerNote: StoreState["addCareerNote"] = useCallback((tid: string, title: string, content: string = "") =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, notes: [{ id: uid(), title, content, updatedAt: Date.now() }, ...t.notes] } : t) })), [setCareer]);
  const updateCareerNote = useCallback((tid: string, id: string, patch: Partial<CareerNote>) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, notes: t.notes.map((n) => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n) } : t) })), [setCareer]);
  const deleteCareerNote = useCallback((tid: string, id: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, notes: t.notes.filter((n) => n.id !== id) } : t) })), [setCareer]);
  const addResumeBullet: StoreState["addResumeBullet"] = useCallback((tid: string, text: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, resumeBullets: [...t.resumeBullets, { id: uid(), text }] } : t) })), [setCareer]);
  const updateResumeBullet = useCallback((tid: string, id: string, text: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, resumeBullets: t.resumeBullets.map((b) => b.id === id ? { ...b, text } : b) } : t) })), [setCareer]);
  const deleteResumeBullet = useCallback((tid: string, id: string) =>
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === tid ? { ...t, resumeBullets: t.resumeBullets.filter((b) => b.id !== id) } : t) })), [setCareer]);
  const addGoal: StoreState["addGoal"] = useCallback((title: string) =>
    setCareer((c) => ({ ...c, goals: [{ id: uid(), title, done: false, deadline: "" }, ...c.goals] })), [setCareer]);
  const toggleGoal = useCallback((id: string) => setCareer((c) => ({ ...c, goals: c.goals.map((g) => g.id === id ? { ...g, done: !g.done } : g) })), [setCareer]);
  const updateGoal = useCallback((id: string, patch: Partial<CareerGoal>) => setCareer((c) => ({ ...c, goals: c.goals.map((g) => g.id === id ? { ...g, ...patch } : g) })), [setCareer]);
  const deleteGoal = useCallback((id: string) => setCareer((c) => ({ ...c, goals: c.goals.filter((g) => g.id !== id) })), [setCareer]);
  const addAchievement: StoreState["addAchievement"] = useCallback((a: Omit<CareerAchievement, "id">) =>
    setCareer((c) => ({ ...c, achievements: [{ ...a, id: uid() }, ...c.achievements] })), [setCareer]);
  const deleteAchievement = useCallback((id: string) => setCareer((c) => ({ ...c, achievements: c.achievements.filter((a) => a.id !== id) })), [setCareer]);
  const setLinkedin = useCallback((v: string) => setCareer((c) => ({ ...c, linkedin: v })), [setCareer]);

  // ---- Workout: exercises ----
  const addExercise: StoreState["addExercise"] = useCallback((e) =>
    setWorkout((w) => ({ ...w, exercises: [{ ...e, id: uid(), createdAt: Date.now() }, ...w.exercises] })), [setWorkout]);
  const updateExercise = useCallback((id: string, patch: Partial<WorkoutExercise>) =>
    setWorkout((w) => ({ ...w, exercises: w.exercises.map((e) => e.id === id ? { ...e, ...patch } : e) })), [setWorkout]);
  const deleteExercise = useCallback((id: string) =>
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.filter((e) => e.id !== id),
      prs: w.prs.filter((p) => p.exerciseId !== id),
      routines: w.routines.map((r) => ({ ...r, blocks: r.blocks.map((b) => b.exerciseId === id ? { ...b, exerciseId: undefined } : b) })),
    })), [setWorkout]);

  // ---- Workout: PRs ----
  // logPR creates or updates a PR and appends to history. If the new value is a
  // peak, updates the PR's value/date/reps/estimated1RM.
  const logPR: StoreState["logPR"] = useCallback((exerciseId, value, reps, rir, note) => {
    const today = new Date().toISOString().slice(0,10);
    setWorkout((w) => {
      const existing = w.prs.find((p) => p.exerciseId === exerciseId);
      const ex = w.exercises.find((e) => e.id === exerciseId);
      const est1rm = reps ? epley1RM(value, reps) : value;
      // For kg lifts, compare by 1RM so adding reps at the same weight still counts
      // as a PR; for other units compare raw value.
      const candidateScore = ex?.unit === "kg" ? est1rm : value;
      const existingScore = existing ? (ex?.unit === "kg" ? (existing.estimated1RM ?? existing.value) : existing.value) : 0;
      if (existing) {
        const isBetter = candidateScore > existingScore;
        return {
          ...w,
          prs: w.prs.map((p) => p.id === existing.id ? {
            ...p,
            value: isBetter ? value : p.value,
            reps:  isBetter ? (reps ?? p.reps) : p.reps,
            estimated1RM: isBetter ? est1rm : p.estimated1RM,
            date: isBetter ? today : p.date,
            note: isBetter ? (note ?? p.note) : p.note,
            history: [...p.history, { date: today, value, reps, rir }].sort((a,b) => a.date.localeCompare(b.date)),
          } : p),
        };
      }
      return {
        ...w,
        prs: [...w.prs, {
          id: uid(), exerciseId, value, reps, estimated1RM: est1rm,
          date: today, note, history: [{ date: today, value, reps, rir }],
        }],
      };
    });
  }, [setWorkout]);
  const deletePR = useCallback((id: string) =>
    setWorkout((w) => ({ ...w, prs: w.prs.filter((p) => p.id !== id) })), [setWorkout]);

  // ---- Workout: skills ----
  const addSkill: StoreState["addSkill"] = useCallback((name) =>
    setWorkout((w) => ({ ...w, skills: [...w.skills, { id: uid(), name, progressions: [], createdAt: Date.now() }] })), [setWorkout]);
  const deleteSkill = useCallback((id: string) => setWorkout((w) => ({ ...w, skills: w.skills.filter((s) => s.id !== id) })), [setWorkout]);
  const addProgression: StoreState["addProgression"] = useCallback((sid: string, title: string, target?: number) =>
    setWorkout((w) => ({ ...w, skills: w.skills.map((s) => s.id === sid ? { ...s, progressions: [...s.progressions, { id: uid(), title, target, done: false }] } : s) })), [setWorkout]);
  const toggleProgressionDone = useCallback((sid: string, pid: string) =>
    setWorkout((w) => ({ ...w, skills: w.skills.map((s) => s.id === sid ? { ...s, progressions: s.progressions.map((p) => p.id === pid ? { ...p, done: !p.done } : p) } : s) })), [setWorkout]);
  const updateProgression = useCallback((sid: string, pid: string, patch: Partial<WorkoutProgression>) =>
    setWorkout((w) => ({ ...w, skills: w.skills.map((s) => s.id === sid ? { ...s, progressions: s.progressions.map((p) => p.id === pid ? { ...p, ...patch } : p) } : s) })), [setWorkout]);
  const deleteProgression = useCallback((sid: string, pid: string) =>
    setWorkout((w) => ({ ...w, skills: w.skills.map((s) => s.id === sid ? { ...s, progressions: s.progressions.filter((p) => p.id !== pid) } : s) })), [setWorkout]);

  // ---- Workout: routines ----
  const addRoutine: StoreState["addRoutine"] = useCallback((name: string, dayOfWeek?: number) =>
    setWorkout((w) => ({ ...w, routines: [...w.routines, { id: uid(), name, dayOfWeek, blocks: [], createdAt: Date.now() }] })), [setWorkout]);
  const updateRoutine = useCallback((id: string, patch: Partial<WorkoutRoutine>) =>
    setWorkout((w) => ({ ...w, routines: w.routines.map((r) => r.id === id ? { ...r, ...patch } : r) })), [setWorkout]);
  const deleteRoutine = useCallback((id: string) =>
    setWorkout((w) => ({ ...w, routines: w.routines.filter((r) => r.id !== id) })), [setWorkout]);
  const addBlock: StoreState["addBlock"] = useCallback((rid, block) =>
    setWorkout((w) => ({ ...w, routines: w.routines.map((r) => r.id === rid ? { ...r, blocks: [...r.blocks, { ...block, id: uid() }] } : r) })), [setWorkout]);
  const updateBlock = useCallback((rid: string, bid: string, patch: Partial<WorkoutBlock>) =>
    setWorkout((w) => ({ ...w, routines: w.routines.map((r) => r.id === rid ? { ...r, blocks: r.blocks.map((b) => b.id === bid ? { ...b, ...patch } : b) } : r) })), [setWorkout]);
  const deleteBlock = useCallback((rid: string, bid: string) =>
    setWorkout((w) => ({ ...w, routines: w.routines.map((r) => r.id === rid ? { ...r, blocks: r.blocks.filter((b) => b.id !== bid) } : r) })), [setWorkout]);

  // ---- Workout: sessions ----
  // Helper: find an exercise by searching all routines for a block id (used by logSet
  // to resolve per-muscle volume; intentionally robust to missing references).
  const getExerciseForBlock = useCallback((blockId: string): WorkoutExercise | undefined => {
    for (const r of workout.routines) {
      const b = r.blocks.find((bb) => bb.id === blockId);
      if (b?.exerciseId) return workout.exercises.find((e) => e.id === b.exerciseId);
    }
    return undefined;
  }, [workout]);

  const startSession: StoreState["startSession"] = useCallback((name, routineId, readinessScore) => {
    const id = uid();
    setWorkout((w) => ({
      ...w,
      activeSessionId: id,
      sessions: [
        { id, name, routineId, date: new Date().toISOString().slice(0,10),
          startedAt: Date.now(), sets: [], readinessScore, totalVolumeKg: 0 },
        ...w.sessions,
      ].slice(0, 200),
    }));
    return id;
  }, [setWorkout]);

  const logSet: StoreState["logSet"] = useCallback((sid, entry) => {
    setWorkout((w) => ({
      ...w,
      sessions: w.sessions.map((s) => {
        if (s.id !== sid) return s;
        const existingIdx = s.sets.findIndex((x) => x.blockId === entry.blockId && x.setIndex === entry.setIndex);
        const logged: WorkoutSetLog = { completed: true, ...entry };
        const sets = existingIdx >= 0
          ? s.sets.map((x, i) => i === existingIdx ? logged : x)
          : [...s.sets, logged];
        const totalVolumeKg = sets.reduce((n, set) => n + (set.weight ? set.weight * set.value : 0), 0);
        return { ...s, sets, totalVolumeKg };
      }),
    }));
  }, [setWorkout]);

  const finishSession: StoreState["finishSession"] = useCallback((sid) => {
    setWorkout((w) => {
      let next = { ...w };
      const sessions = w.sessions.map((s) => s.id === sid ? {
        ...s, endedAt: Date.now(), durationSeconds: Math.round((Date.now() - s.startedAt)/1000),
      } : s);
      next = { ...next, sessions, activeSessionId: undefined };
      const finished = sessions.find((s) => s.id === sid);
      if (finished) next = applyStreak(next, finished.date);
      // Award new badges
      const existingIds = new Set(next.badges.map((b) => b.id));
      const earnedNow = evaluateBadges({
        sessions: next.sessions,
        prs: next.prs,
        currentStreak: next.currentStreak ?? 0,
        exercises: next.exercises,
      }).filter((id) => !existingIds.has(id));
      if (earnedNow.length) {
        next = {
          ...next,
          badges: [...next.badges, ...earnedNow.map((id: BadgeId) => ({ id, earnedAt: Date.now() }))],
        };
      }
      return next;
    });
  }, [setWorkout]);

  const discardSession: StoreState["discardSession"] = useCallback((sid) =>
    setWorkout((w) => ({
      ...w,
      sessions: w.sessions.filter((s) => s.id !== sid),
      activeSessionId: w.activeSessionId === sid ? undefined : w.activeSessionId,
    })), [setWorkout]);

  // ---- Workout: wellness ----
  const logReadiness: StoreState["logReadiness"] = useCallback((r) => {
    const today = new Date().toISOString().slice(0,10);
    const entry: WorkoutReadiness = { date: today, ...r, score: computeReadiness(r) };
    setWorkout((w) => {
      const others = w.readiness.filter((x) => x.date !== today);
      return { ...w, readiness: [entry, ...others].slice(0, 60) };
    });
  }, [setWorkout]);
  const logBodyweight: StoreState["logBodyweight"] = useCallback((weightKg) => {
    const today = new Date().toISOString().slice(0,10);
    setWorkout((w) => {
      const others = w.bodyweight.filter((x) => x.date !== today);
      return { ...w, bodyweight: [{ date: today, weightKg }, ...others].slice(0, 200) };
    });
  }, [setWorkout]);

  // ---- Workout: settings ----
  const updateWorkoutSettings: StoreState["updateWorkoutSettings"] = useCallback((patch) =>
    setWorkout((w) => ({ ...w, settings: { ...w.settings, ...patch } })), [setWorkout]);

  // CSV export
  const exportWorkoutCSV: StoreState["exportWorkoutCSV"] = useCallback(() => {
    const rows = [["date","exercise","set","reps_or_seconds","weight_kg","rir","duration_s","volume_kg"]];
    for (const s of workout.sessions.filter((x) => x.endedAt)) {
      for (const set of s.sets) {
        const ex = getExerciseForBlock(set.blockId);
        rows.push([
          s.date, ex?.name ?? "—", String(set.setIndex), String(set.value),
          set.weight != null ? String(set.weight) : "",
          set.rir != null ? String(set.rir) : "",
          set.durationSeconds != null ? String(set.durationSeconds) : "",
          set.weight ? String(set.weight * set.value) : "",
        ]);
      }
    }
    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  }, [workout, getExerciseForBlock]);

  // ---- Assemble value ----
  const value: StoreState = {
    tasks, notes, addTask, toggleTask, deleteTask, updateTask,
    addNote, updateNote, deleteNote, togglePinNote,
    career, addTrack, updateTrack, deleteTrack,
    addConcept, updateConcept, deleteConcept, addSubConcept, toggleSubConcept,
    updateSubConcept, deleteSubConcept, addCareerNote, updateCareerNote, deleteCareerNote,
    addResumeBullet, updateResumeBullet, deleteResumeBullet,
    addGoal, toggleGoal, updateGoal, deleteGoal,
    addAchievement, deleteAchievement, setLinkedin,
    workout, addExercise, updateExercise, deleteExercise,
    logPR, deletePR, addSkill, deleteSkill, addProgression, toggleProgressionDone, updateProgression, deleteProgression,
    addRoutine, updateRoutine, deleteRoutine, addBlock, updateBlock, deleteBlock,
    startSession, logSet, finishSession, discardSession,
    logReadiness, logBodyweight, updateWorkoutSettings, exportWorkoutCSV, getExerciseForBlock,
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
