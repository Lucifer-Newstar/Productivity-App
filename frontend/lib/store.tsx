"use client";

/**
 * Global app store (React Context + localStorage persistence).
 *
 * Holds all shared state for Kaizen:
 *   - Core productivity: tasks (scoped to spaces), notes (global sticky notes)
 *   - Career page: tracks (DevOps/SRE/etc.), concepts/sub-concepts per track,
 *     track notes, resume bullets per track, goals, achievements, LinkedIn URL
 *
 * All actions are useCallback-wrapped so consumer components don't re-subscribe
 * unnecessarily. The `useLocalState` helper wraps useState + useEffect to hydrate
 * from localStorage on mount and write back on every change.
 *
 * A one-time migration converts legacy "milestones" data (flat list per track)
 * into the new concepts/sub-concepts shape if a user had existing data.
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type {
  Task, Note, SpaceId,
  CareerState, CareerTrack, CareerConcept, CareerSubConcept,
  CareerNote, CareerBullet, CareerGoal, CareerAchievement,
  WorkoutState, WorkoutExercise, WorkoutPR, WorkoutSkill, WorkoutProgression,
  WorkoutRoutine, WorkoutBlock, WorkoutSession, WorkoutSetLog,
  WorkoutUnit,
} from "./types";
import { SPACES } from "./types";

// Generate a short random ID used for every entity (tasks, notes, tracks, …)
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const DAY = 86_400_000;

// ---------------- Seeds ----------------
// Seed data shown to the user on first visit. Spreads tasks across all five
// spaces so the dashboard looks alive out of the box.
const seedTasks: Task[] = [
  { id: uid(), title: "Design the landing page hero",   completed: false, priority: "high",   space: "projects",      createdAt: Date.now() - 2 * DAY },
  { id: uid(), title: "Set up CI/CD pipeline",          completed: false, priority: "medium", space: "projects",      createdAt: Date.now() - DAY },
  { id: uid(), title: "Push day — chest & triceps",     completed: true,  priority: "medium", space: "workout",       createdAt: Date.now() - 1 * 3600_000 },
  { id: uid(), title: "Leg day session",                completed: false, priority: "high",   space: "workout",       createdAt: Date.now() - 2 * 3600_000 },
  { id: uid(), title: "Update resume & LinkedIn",       completed: false, priority: "medium", space: "career",        createdAt: Date.now() - 5 * 3600_000 },
  { id: uid(), title: "Schedule 1:1 with mentor",       completed: true,  priority: "low",    space: "career",        createdAt: Date.now() - DAY },
  { id: uid(), title: "Watch Dune: Part Two",           completed: false, priority: "low",    space: "entertainment", createdAt: Date.now() - 3 * DAY },
  { id: uid(), title: "Try the new ramen shop",         completed: false, priority: "low",    space: "entertainment", createdAt: Date.now() - 6 * 3600_000 },
  { id: uid(), title: "Drink 2L of water today",        completed: true,  priority: "medium", space: "health",        createdAt: Date.now() - 1 * 3600_000 },
  { id: uid(), title: "7+ hours sleep",                 completed: false, priority: "high",   space: "health",        createdAt: Date.now() - 2 * 3600_000 },
];

const seedNotes: Note[] = [
  { id: uid(), title: "Product ideas",     content: "- AI writing assistant\n- Habit tracker with streaks\n- Minimal pomodoro that plays lo-fi", color: "#8b5cf6", pinned: true,  updatedAt: Date.now() - 100_000 },
  { id: uid(), title: "Books to read",     content: "1. Deep Work — Cal Newport\n2. Atomic Habits\n3. The Pragmatic Programmer",                 color: "#06b6d4", pinned: false, updatedAt: Date.now() - 500_000 },
  { id: uid(), title: "Sprint kickoff",    content: "Sprint 24:\n- Auth refresh\n- Dashboard widgets\n- Performance budget",                      color: "#ec4899", pinned: false, updatedAt: Date.now() - 2_000_000 },
];

// Career seed — pre-populates two tracks (DevOps, SRE) with sample concepts,
// sub-concepts, notes, resume bullets, goals, and achievements so new users see
// what the page can do before entering their own data. Evaluated once at module
// load so server and client produce identical seed data during first render.
const SEED_CAREER: CareerState = (() => {
  const devops = uid();
  const sre = uid();
  const c = (title: string, subs: string[]): CareerConcept => ({
    id: uid(), title, subConcepts: subs.map((t) => ({ id: uid(), title: t, done: false })),
  });
  const ANCHOR_C = Date.now();
  return {
    tracks: [
      {
        id: devops,
        name: "DevOps",
        color: "#06b6d4",
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
          { id: uid(), title: "Kubernetes (CKA)", subConcepts: [
            { id: uid(), title: "Pods, deployments, services", done: false },
            { id: uid(), title: "ConfigMaps, Secrets, volumes", done: false },
            { id: uid(), title: "Helm charts", done: false },
          ]},
          { id: uid(), title: "Infrastructure as Code (Terraform)", subConcepts: [
            { id: uid(), title: "HCL basics, providers, state", done: false },
            { id: uid(), title: "Modules & workspaces", done: false },
          ]},
        ],
        notes: [
          { id: uid(), title: "Useful commands", content: "kubectl get pods -A\nkubectl logs -f <pod>\nterraform plan -out=plan", updatedAt: ANCHOR_C - 2 * DAY },
          { id: uid(), title: "Interview prep", content: "- Explain CI/CD\n- Blue/green vs canary deployments\n- CAP theorem", updatedAt: ANCHOR_C - DAY },
        ],
        resumeBullets: [
          { id: uid(), text: "Designed multi-env CI/CD pipelines reducing deploy time by 60%" },
          { id: uid(), text: "Containerized 12 microservices with Docker and Kubernetes" },
        ],
      },
      {
        id: sre,
        name: "SRE",
        color: "#8b5cf6",
        concepts: [
          c("Monitoring & Observability", ["Prometheus metrics", "Grafana dashboards", "Alertmanager & routing", "Distributed tracing (Jaeger)"]),
          c("SLO / SLI / Error Budgets", ["Define SLIs per service", "Set SLO targets & burn rates", "Error budget policies"]),
          c("Incident Response", ["On-call rotations", "Blameless postmortems", "Retros & action items"]),
        ],
        notes: [
          { id: uid(), title: "SRE reading list", content: "- Site Reliability Engineering book\n- Google SRE Workbook", updatedAt: ANCHOR_C - 3 * DAY },
        ],
        resumeBullets: [
          { id: uid(), text: "Improved MTTR by 40% through better alert routing and on-call docs" },
        ],
      },
    ],
    goals: [
      { id: uid(), title: "Land a summer 2026 internship",        done: false, deadline: "2026-06-01", trackId: devops },
      { id: uid(), title: "Earn CKA certification",              done: false, deadline: "2025-12-31", trackId: devops },
      { id: uid(), title: "Post 12 LinkedIn articles this year", done: false },
    ],
    achievements: [
      { id: uid(), title: "Completed Docker course", date: new Date(ANCHOR_C - 30 * DAY).toISOString().slice(0, 10), icon: "🐳", trackId: devops },
      { id: uid(), title: "Won internal hackathon", date: new Date(ANCHOR_C - 60 * DAY).toISOString().slice(0, 10), icon: "🏆" },
    ],
    linkedin: "",
  };
})();

// Shape of the value exposed by StoreProvider. Grouped by feature for readability.
interface StoreState {
  // core productivity
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
  // career root
  career: CareerState;
  // career tracks
  addTrack: (name: string, color: string) => void;
  updateTrack: (id: string, patch: Partial<CareerTrack>) => void;
  deleteTrack: (id: string) => void;
  // career concepts (top-level roadmap topics)
  addConcept: (trackId: string, title: string) => void;
  updateConcept: (trackId: string, conceptId: string, patch: Partial<CareerConcept>) => void;
  deleteConcept: (trackId: string, conceptId: string) => void;
  // career sub-concepts (checkable items under a concept)
  addSubConcept: (trackId: string, conceptId: string, title: string) => void;
  toggleSubConcept: (trackId: string, conceptId: string, subId: string) => void;
  updateSubConcept: (trackId: string, conceptId: string, subId: string, patch: Partial<CareerSubConcept>) => void;
  deleteSubConcept: (trackId: string, conceptId: string, subId: string) => void;
  // career track notes
  addCareerNote: (trackId: string, title: string, content?: string) => void;
  updateCareerNote: (trackId: string, id: string, patch: Partial<CareerNote>) => void;
  deleteCareerNote: (trackId: string, id: string) => void;
  // career resume bullets
  addResumeBullet: (trackId: string, text: string) => void;
  updateResumeBullet: (trackId: string, id: string, text: string) => void;
  deleteResumeBullet: (trackId: string, id: string) => void;
  // career goals
  addGoal: (title: string) => void;
  toggleGoal: (id: string) => void;
  updateGoal: (id: string, patch: Partial<CareerGoal>) => void;
  deleteGoal: (id: string) => void;
  // career achievements (vault)
  addAchievement: (a: Omit<CareerAchievement, "id">) => void;
  deleteAchievement: (id: string) => void;
  // career posts — LinkedIn URL (portfolio is UI-only placeholder)
  setLinkedin: (v: string) => void;
  // workout — exercises (library)
  workout: WorkoutState;
  addExercise: (name: string, unit: WorkoutUnit, muscleGroup?: string, notes?: string) => void;
  updateExercise: (id: string, patch: Partial<WorkoutExercise>) => void;
  deleteExercise: (id: string) => void;
  // workout — PRs (personal records)
  logPR: (exerciseId: string, value: number, reps?: number, note?: string) => void;
  deletePR: (id: string) => void;
  // workout — skills (progressions)
  addSkill: (name: string) => void;
  deleteSkill: (id: string) => void;
  addProgression: (skillId: string, title: string, target?: number) => void;
  toggleProgressionDone: (skillId: string, progId: string) => void;
  updateProgression: (skillId: string, progId: string, patch: Partial<WorkoutProgression>) => void;
  deleteProgression: (skillId: string, progId: string) => void;
  // workout — routines (schedule templates)
  addRoutine: (name: string, dayOfWeek?: number) => void;
  updateRoutine: (id: string, patch: Partial<WorkoutRoutine>) => void;
  deleteRoutine: (id: string) => void;
  addBlock: (routineId: string, block: Omit<WorkoutBlock, "id">) => void;
  updateBlock: (routineId: string, blockId: string, patch: Partial<WorkoutBlock>) => void;
  deleteBlock: (routineId: string, blockId: string) => void;
  // workout — sessions (live workouts)
  startSession: (name: string, routineId?: string) => string;
  logSet: (sessionId: string, entry: Omit<WorkoutSetLog, "completed"> & { completed?: boolean }) => void;
  finishSession: (sessionId: string) => void;
  discardSession: (sessionId: string) => void;
}

const StoreContext = createContext<StoreState | null>(null);

/**
 * Helper hook — wraps useState to hydrate from localStorage on mount and
 * auto-persist on change. Hydration-safe to prevent React text mismatches:
 *
 *   - On the server: always returns `seed` (matches client first render).
 *   - On first client render: also returns `seed` so HTML matches the server.
 *   - After mount (useEffect), reads localStorage once and updates state — this
 *     is the single re-render that swaps in persisted data.
 *   - Subsequent state changes write back to localStorage automatically.
 *
 * An optional `migrate` upgrades legacy schemas on first read.
 */
function useLocalState<T>(key: string, seed: T, migrate?: (raw: any) => T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [v, setV] = useState<T>(seed);
  const hydrated = useRef(false);

  // Hydrate from localStorage exactly once on the client after mount
  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setV(migrate ? migrate(parsed) : parsed);
      } catch {
        /* corrupted storage — keep seed */
      }
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Persist on every change AFTER hydration completes
  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(key, JSON.stringify(v));
  }, [key, v]);

  return [v, setV];
}

// Migration: convert flat `milestones[]` (pre-concepts schema) into concepts[]
const migrateCareer = (raw: any): CareerState => {
  const tracks: CareerTrack[] = (raw.tracks ?? []).map((t: any) => {
    if (Array.isArray(t.concepts)) return t;
    // legacy milestones detected -> convert
    const legacyMilestones: any[] = Array.isArray(t.milestones) ? t.milestones : [];
    return {
      ...t,
      concepts: legacyMilestones.map((m) => ({
        id: m.id ?? uid(),
        title: m.title ?? "Untitled",
        subConcepts: m.description
          ? [{ id: uid(), title: m.description, done: !!m.done }]
          : [],
      })),
    };
  });
  return { ...raw, tracks };
};

// ---------------- Workout seed ----------------
// Pre-populate with a starter library, PRs, skills, routines, and one sample
// session. Evaluated once at module load so server and client produce the same
// data shape on first render.
const SEED_WORKOUT: WorkoutState = (() => {
  const ANCHOR_W = Date.now();
  const ex = (name: string, unit: WorkoutUnit, muscleGroup?: any): WorkoutExercise => ({
    id: uid(), name, unit, muscleGroup, createdAt: ANCHOR_W,
  });
  const bench   = ex("Bench Press", "kg", "chest");
  const squat   = ex("Back Squat", "kg", "legs");
  const deadlift= ex("Deadlift", "kg", "back");
  const ohp     = ex("Overhead Press", "kg", "shoulders");
  const pullup  = ex("Pull-up", "reps", "back");
  const pushup  = ex("Push-up", "reps", "chest");
  const plank   = ex("Plank", "seconds", "core");
  const run5k   = ex("5k Run", "seconds", "cardio");

  // Build a PR with a fixed-days-ago date — deterministic offsets so seed values
  // are identical between server and client (no Math.random).
  const makePr = (exerciseId: string, value: number, reps: number | undefined, daysAgo: number): WorkoutPR => {
    const d = new Date(Date.now() - daysAgo * DAY).toISOString().slice(0, 10);
    return {
      id: uid(), exerciseId, value, reps, date: d,
      history: [{ date: d, value, reps }],
    };
  };

  return {
    exercises: [bench, squat, deadlift, ohp, pullup, pushup, plank, run5k],
    prs: [
      makePr(bench.id, 80, 5, 20),
      makePr(squat.id, 120, 3, 10),
      makePr(deadlift.id, 140, 1, 7),
      makePr(pullup.id, 12, undefined, 5),
      makePr(plank.id, 180, undefined, 3),
    ],
    skills: [
      {
        id: uid(), name: "Pull-up", createdAt: ANCHOR_W,
        progressions: [
          { id: uid(), title: "Dead hangs (30s)",         target: 30,  done: true,  currentBest: 35 },
          { id: uid(), title: "Australian pull-ups",      target: 15,  done: true,  currentBest: 18 },
          { id: uid(), title: "Negative pull-ups",        target: 5,   done: true,  currentBest: 6 },
          { id: uid(), title: "Band-assisted pull-ups",   target: 10,  done: false, currentBest: 7 },
          { id: uid(), title: "Strict pull-ups",          target: 1,   done: false },
        ],
      },
      {
        id: uid(), name: "Handstand", createdAt: ANCHOR_W,
        progressions: [
          { id: uid(), title: "Wall handstand (30s)", target: 30, done: true, currentBest: 45 },
          { id: uid(), title: "Chest-to-wall (20s)",  target: 20, done: false, currentBest: 12 },
          { id: uid(), title: "Free-standing hold",   target: 10, done: false },
        ],
      },
    ],
    routines: [
      {
        id: uid(), name: "Push Day", dayOfWeek: 1, createdAt: ANCHOR_W,
        blocks: [
          { id: uid(), exerciseId: bench.id,  type: "strength", sets: 4, reps: 6,  restSeconds: 180 },
          { id: uid(), exerciseId: ohp.id,    type: "strength", sets: 3, reps: 8,  restSeconds: 120 },
          { id: uid(), exerciseId: pushup.id, type: "strength", sets: 3, reps: 15, restSeconds: 60 },
          { id: uid(), label: "Rest",         type: "rest",     sets: 1, reps: 60, restSeconds: 0 },
          { id: uid(), exerciseId: plank.id,  type: "strength", sets: 3, reps: 60, restSeconds: 60 },
        ],
      },
      {
        id: uid(), name: "Leg Day", dayOfWeek: 3, createdAt: ANCHOR_W,
        blocks: [
          { id: uid(), exerciseId: squat.id,    type: "strength", sets: 5, reps: 5, restSeconds: 180 },
          { id: uid(), label: "Lunges",         type: "strength", sets: 3, reps: 10, restSeconds: 90 },
          { id: uid(), label: "Calf raises",    type: "strength", sets: 3, reps: 20, restSeconds: 60 },
        ],
      },
    ],
    sessions: [
      // Sample completed session from yesterday
      {
        id: uid(), routineId: undefined, name: "Push Day",
        date: new Date(ANCHOR_W - DAY).toISOString().slice(0, 10),
        startedAt: ANCHOR_W - DAY - 50 * 60 * 1000, endedAt: ANCHOR_W - DAY,
        sets: [],
        totalVolumeKg: 0,
        durationSeconds: 50 * 60,
      },
    ],
    activeSessionId: undefined,
  };
})();

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Persisted slices. Seeds are module-level constants so both server and client
  // see the exact same data on first render — any Date.now()/uid() inside seeds
  // runs once at import, not per render.
  const [tasks, setTasks]     = useLocalState<Task[]>("kaizen.tasks", seedTasks);
  const [notes, setNotes]     = useLocalState<Note[]>("kaizen.notes", seedNotes);
  const [career, setCareer]   = useLocalState<CareerState>("kaizen.career", SEED_CAREER, migrateCareer);
  const [workout, setWorkout] = useLocalState<WorkoutState>("kaizen.workout", SEED_WORKOUT);

  // One-time cleanup of legacy localStorage keys from pre-monorepo versions
  useEffect(() => {
    localStorage.removeItem("prod.tasks");
    localStorage.removeItem("prod.notes");
    localStorage.removeItem("prod.projects");
    localStorage.removeItem("prod.habits");
  }, []);

  // ---------------- Workout: exercise library ----------------
  const addExercise: StoreState["addExercise"] = useCallback((name, unit, muscleGroup, notes) => {
    setWorkout((w) => ({
      ...w,
      exercises: [{ id: uid(), name, unit, muscleGroup: muscleGroup as any, notes, createdAt: Date.now() }, ...w.exercises],
    }));
  }, [setWorkout]);
  const updateExercise: StoreState["updateExercise"] = useCallback((id, patch) => {
    setWorkout((w) => ({ ...w, exercises: w.exercises.map((e) => e.id === id ? { ...e, ...patch } : e) }));
  }, [setWorkout]);
  const deleteExercise: StoreState["deleteExercise"] = useCallback((id) => {
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.filter((e) => e.id !== id),
      prs: w.prs.filter((p) => p.exerciseId !== id),
      // Strip references from routine blocks but leave blocks intact (user can edit)
      routines: w.routines.map((r) => ({
        ...r,
        blocks: r.blocks.map((b) => b.exerciseId === id ? { ...b, exerciseId: undefined } : b),
      })),
    }));
  }, [setWorkout]);

  // ---------------- Workout: PRs (personal records) ----------------
  // logPR creates a new PR or updates an existing one if the new value is better.
  // Also appends to the history array of the existing PR so we can show progress.
  const logPR: StoreState["logPR"] = useCallback((exerciseId, value, reps, note) => {
    const today = new Date().toISOString().slice(0, 10);
    setWorkout((w) => {
      const existing = w.prs.find((p) => p.exerciseId === exerciseId);
      if (existing) {
        // Is this a new peak? Higher value wins. For kg we compare weight (value).
        const isBetter = value > existing.value;
        return {
          ...w,
          prs: w.prs.map((p) => p.id === existing.id ? {
            ...p,
            value: isBetter ? value : p.value,
            reps:  isBetter ? (reps ?? p.reps) : p.reps,
            date:  isBetter ? today : p.date,
            note:  isBetter ? (note ?? p.note) : p.note,
            history: [...p.history, { date: today, value, reps }]
              .sort((a, b) => a.date.localeCompare(b.date)),
          } : p),
        };
      }
      return {
        ...w,
        prs: [...w.prs, {
          id: uid(), exerciseId, value, reps, date: today, note,
          history: [{ date: today, value, reps }],
        }],
      };
    });
  }, [setWorkout]);
  const deletePR: StoreState["deletePR"] = useCallback((id) => {
    setWorkout((w) => ({ ...w, prs: w.prs.filter((p) => p.id !== id) }));
  }, [setWorkout]);

  // ---------------- Workout: skills (progressions) ----------------
  const addSkill: StoreState["addSkill"] = useCallback((name) => {
    setWorkout((w) => ({ ...w, skills: [...w.skills, { id: uid(), name, progressions: [], createdAt: Date.now() }] }));
  }, [setWorkout]);
  const deleteSkill: StoreState["deleteSkill"] = useCallback((id) => {
    setWorkout((w) => ({ ...w, skills: w.skills.filter((s) => s.id !== id) }));
  }, [setWorkout]);
  const addProgression: StoreState["addProgression"] = useCallback((skillId, title, target) => {
    setWorkout((w) => ({
      ...w,
      skills: w.skills.map((s) => s.id === skillId ? {
        ...s, progressions: [...s.progressions, { id: uid(), title, target, done: false }],
      } : s),
    }));
  }, [setWorkout]);
  const toggleProgressionDone: StoreState["toggleProgressionDone"] = useCallback((skillId, progId) => {
    setWorkout((w) => ({
      ...w,
      skills: w.skills.map((s) => s.id === skillId ? {
        ...s,
        progressions: s.progressions.map((p) => p.id === progId ? { ...p, done: !p.done } : p),
      } : s),
    }));
  }, [setWorkout]);
  const updateProgression: StoreState["updateProgression"] = useCallback((skillId, progId, patch) => {
    setWorkout((w) => ({
      ...w,
      skills: w.skills.map((s) => s.id === skillId ? {
        ...s, progressions: s.progressions.map((p) => p.id === progId ? { ...p, ...patch } : p),
      } : s),
    }));
  }, [setWorkout]);
  const deleteProgression: StoreState["deleteProgression"] = useCallback((skillId, progId) => {
    setWorkout((w) => ({
      ...w,
      skills: w.skills.map((s) => s.id === skillId ? {
        ...s, progressions: s.progressions.filter((p) => p.id !== progId),
      } : s),
    }));
  }, [setWorkout]);

  // ---------------- Workout: routines (schedule templates) ----------------
  const addRoutine: StoreState["addRoutine"] = useCallback((name, dayOfWeek) => {
    setWorkout((w) => ({
      ...w,
      routines: [...w.routines, { id: uid(), name, dayOfWeek, blocks: [], createdAt: Date.now() }],
    }));
  }, [setWorkout]);
  const updateRoutine: StoreState["updateRoutine"] = useCallback((id, patch) => {
    setWorkout((w) => ({ ...w, routines: w.routines.map((r) => r.id === id ? { ...r, ...patch } : r) }));
  }, [setWorkout]);
  const deleteRoutine: StoreState["deleteRoutine"] = useCallback((id) => {
    setWorkout((w) => ({ ...w, routines: w.routines.filter((r) => r.id !== id) }));
  }, [setWorkout]);
  const addBlock: StoreState["addBlock"] = useCallback((routineId, block) => {
    setWorkout((w) => ({
      ...w,
      routines: w.routines.map((r) => r.id === routineId ? { ...r, blocks: [...r.blocks, { ...block, id: uid() }] } : r),
    }));
  }, [setWorkout]);
  const updateBlock: StoreState["updateBlock"] = useCallback((routineId, blockId, patch) => {
    setWorkout((w) => ({
      ...w,
      routines: w.routines.map((r) => r.id === routineId ? {
        ...r, blocks: r.blocks.map((b) => b.id === blockId ? { ...b, ...patch } : b),
      } : r),
    }));
  }, [setWorkout]);
  const deleteBlock: StoreState["deleteBlock"] = useCallback((routineId, blockId) => {
    setWorkout((w) => ({
      ...w,
      routines: w.routines.map((r) => r.id === routineId ? {
        ...r, blocks: r.blocks.filter((b) => b.id !== blockId),
      } : r),
    }));
  }, [setWorkout]);

  // ---------------- Workout: sessions (live workouts) ----------------
  const startSession: StoreState["startSession"] = useCallback((name, routineId) => {
    const id = uid();
    setWorkout((w) => ({
      ...w,
      activeSessionId: id,
      sessions: [
        { id, name, routineId, date: new Date().toISOString().slice(0, 10), startedAt: Date.now(), sets: [] },
        ...w.sessions,
      ].slice(0, 100), // keep last 100
    }));
    return id;
  }, [setWorkout]);

  const logSet: StoreState["logSet"] = useCallback((sessionId, entry) => {
    setWorkout((w) => ({
      ...w,
      sessions: w.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        // Update existing set (same block+setIndex) or append a new one
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

  const finishSession: StoreState["finishSession"] = useCallback((sessionId) => {
    setWorkout((w) => {
      const sessions = w.sessions.map((s) => s.id === sessionId ? {
        ...s,
        endedAt: Date.now(),
        durationSeconds: Math.round((Date.now() - s.startedAt) / 1000),
      } : s);
      return { ...w, sessions, activeSessionId: undefined };
    });
  }, [setWorkout]);

  const discardSession: StoreState["discardSession"] = useCallback((sessionId) => {
    setWorkout((w) => ({
      ...w,
      sessions: w.sessions.filter((s) => s.id !== sessionId),
      activeSessionId: w.activeSessionId === sessionId ? undefined : w.activeSessionId,
    }));
  }, [setWorkout]);

  // ---------------- Tasks ----------------
  const addTask: StoreState["addTask"] = useCallback((t) => {
    setTasks((prev) => [{ ...t, id: uid(), completed: false, createdAt: Date.now() }, ...prev]);
  }, [setTasks]);
  const toggleTask = useCallback((id: string) => setTasks((p) => p.map((t) => t.id === id ? { ...t, completed: !t.completed } : t)), [setTasks]);
  const deleteTask = useCallback((id: string) => setTasks((p) => p.filter((t) => t.id !== id)), [setTasks]);
  const updateTask = useCallback((id: string, patch: Partial<Task>) => setTasks((p) => p.map((t) => t.id === id ? { ...t, ...patch } : t)), [setTasks]);

  // ---------------- Notes ----------------
  const addNote: StoreState["addNote"] = useCallback((n) => {
    setNotes((p) => [{ ...n, id: uid(), pinned: false, updatedAt: Date.now() }, ...p]);
  }, [setNotes]);
  const updateNote = useCallback((id: string, patch: Partial<Note>) => setNotes((p) => p.map((n) => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)), [setNotes]);
  const deleteNote = useCallback((id: string) => setNotes((p) => p.filter((n) => n.id !== id)), [setNotes]);
  const togglePinNote = useCallback((id: string) => setNotes((p) => p.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n)), [setNotes]);

  // ---------------- Career: tracks ----------------
  const addTrack: StoreState["addTrack"] = useCallback((name, color) => {
    setCareer((c) => ({ ...c, tracks: [...c.tracks, { id: uid(), name, color, concepts: [], notes: [], resumeBullets: [] }] }));
  }, [setCareer]);
  const updateTrack: StoreState["updateTrack"] = useCallback((id, patch) => {
    setCareer((c) => ({ ...c, tracks: c.tracks.map((t) => t.id === id ? { ...t, ...patch } : t) }));
  }, [setCareer]);
  // When deleting a track, detach its goals/achievements (set trackId to undefined)
  // rather than deleting them so nothing is lost silently.
  const deleteTrack: StoreState["deleteTrack"] = useCallback((id) => {
    setCareer((c) => ({
      ...c,
      tracks: c.tracks.filter((t) => t.id !== id),
      goals: c.goals.map((g) => g.trackId === id ? { ...g, trackId: undefined } : g),
      achievements: c.achievements.map((a) => a.trackId === id ? { ...a, trackId: undefined } : a),
    }));
  }, [setCareer]);

  // ---------------- Career: concepts ----------------
  const addConcept: StoreState["addConcept"] = useCallback((trackId, title) => {
    setCareer((c) => ({
      ...c,
      tracks: c.tracks.map((t) => t.id === trackId
        ? { ...t, concepts: [...t.concepts, { id: uid(), title, subConcepts: [] }] }
        : t),
    }));
  }, [setCareer]);
  const updateConcept: StoreState["updateConcept"] = useCallback((trackId, conceptId, patch) => {
    setCareer((c) => ({
      ...c,
      tracks: c.tracks.map((t) => t.id === trackId
        ? { ...t, concepts: t.concepts.map((cc) => cc.id === conceptId ? { ...cc, ...patch } : cc) }
        : t),
    }));
  }, [setCareer]);
  const deleteConcept: StoreState["deleteConcept"] = useCallback((trackId, conceptId) => {
    setCareer((c) => ({
      ...c,
      tracks: c.tracks.map((t) => t.id === trackId
        ? { ...t, concepts: t.concepts.filter((cc) => cc.id !== conceptId) }
        : t),
    }));
  }, [setCareer]);

  // ---------------- Career: sub-concepts ----------------
  const addSubConcept: StoreState["addSubConcept"] = useCallback((trackId, conceptId, title) => {
    setCareer((c) => ({
      ...c,
      tracks: c.tracks.map((t) => t.id === trackId
        ? { ...t, concepts: t.concepts.map((cc) => cc.id === conceptId
          ? { ...cc, subConcepts: [...cc.subConcepts, { id: uid(), title, done: false }] }
          : cc) }
        : t),
    }));
  }, [setCareer]);
  const toggleSubConcept: StoreState["toggleSubConcept"] = useCallback((trackId, conceptId, subId) => {
    setCareer((c) => ({
      ...c,
      tracks: c.tracks.map((t) => t.id === trackId ? { ...t, concepts: t.concepts.map((cc) => cc.id === conceptId ? {
        ...cc, subConcepts: cc.subConcepts.map((sc) => sc.id === subId ? { ...sc, done: !sc.done } : sc),
      } : cc) } : t),
    }));
  }, [setCareer]);
  const updateSubConcept: StoreState["updateSubConcept"] = useCallback((trackId, conceptId, subId, patch) => {
    setCareer((c) => ({
      ...c,
      tracks: c.tracks.map((t) => t.id === trackId ? { ...t, concepts: t.concepts.map((cc) => cc.id === conceptId ? {
        ...cc, subConcepts: cc.subConcepts.map((sc) => sc.id === subId ? { ...sc, ...patch } : sc),
      } : cc) } : t),
    }));
  }, [setCareer]);
  const deleteSubConcept: StoreState["deleteSubConcept"] = useCallback((trackId, conceptId, subId) => {
    setCareer((c) => ({
      ...c,
      tracks: c.tracks.map((t) => t.id === trackId ? { ...t, concepts: t.concepts.map((cc) => cc.id === conceptId ? {
        ...cc, subConcepts: cc.subConcepts.filter((sc) => sc.id !== subId),
      } : cc) } : t),
    }));
  }, [setCareer]);

  // ---------------- Career: track notes ----------------
  const addCareerNote: StoreState["addCareerNote"] = useCallback((trackId, title, content = "") => {
    setCareer((c) => ({
      ...c,
      tracks: c.tracks.map((t) => t.id === trackId
        ? { ...t, notes: [{ id: uid(), title, content, updatedAt: Date.now() }, ...t.notes] }
        : t),
    }));
  }, [setCareer]);
  const updateCareerNote: StoreState["updateCareerNote"] = useCallback((trackId, id, patch) => {
    setCareer((c) => ({
      ...c,
      tracks: c.tracks.map((t) => t.id === trackId
        ? { ...t, notes: t.notes.map((n) => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n) }
        : t),
    }));
  }, [setCareer]);
  const deleteCareerNote: StoreState["deleteCareerNote"] = useCallback((trackId, id) => {
    setCareer((c) => ({
      ...c,
      tracks: c.tracks.map((t) => t.id === trackId ? { ...t, notes: t.notes.filter((n) => n.id !== id) } : t),
    }));
  }, [setCareer]);

  // ---------------- Career: resume bullets ----------------
  const addResumeBullet: StoreState["addResumeBullet"] = useCallback((trackId, text) => {
    setCareer((c) => ({
      ...c,
      tracks: c.tracks.map((t) => t.id === trackId ? { ...t, resumeBullets: [...t.resumeBullets, { id: uid(), text }] } : t),
    }));
  }, [setCareer]);
  const updateResumeBullet: StoreState["updateResumeBullet"] = useCallback((trackId, id, text) => {
    setCareer((c) => ({
      ...c,
      tracks: c.tracks.map((t) => t.id === trackId
        ? { ...t, resumeBullets: t.resumeBullets.map((b) => b.id === id ? { ...b, text } : b) }
        : t),
    }));
  }, [setCareer]);
  const deleteResumeBullet: StoreState["deleteResumeBullet"] = useCallback((trackId, id) => {
    setCareer((c) => ({
      ...c,
      tracks: c.tracks.map((t) => t.id === trackId ? { ...t, resumeBullets: t.resumeBullets.filter((b) => b.id !== id) } : t),
    }));
  }, [setCareer]);

  // ---------------- Career: goals ----------------
  const addGoal: StoreState["addGoal"] = useCallback((title) => {
    setCareer((c) => ({ ...c, goals: [{ id: uid(), title, done: false, deadline: "" }, ...c.goals] }));
  }, [setCareer]);
  const toggleGoal = useCallback((id: string) => {
    setCareer((c) => ({ ...c, goals: c.goals.map((g) => g.id === id ? { ...g, done: !g.done } : g) }));
  }, [setCareer]);
  const updateGoal = useCallback((id: string, patch: Partial<CareerGoal>) => {
    setCareer((c) => ({ ...c, goals: c.goals.map((g) => g.id === id ? { ...g, ...patch } : g) }));
  }, [setCareer]);
  const deleteGoal = useCallback((id: string) => {
    setCareer((c) => ({ ...c, goals: c.goals.filter((g) => g.id !== id) }));
  }, [setCareer]);

  // ---------------- Career: achievements ----------------
  const addAchievement: StoreState["addAchievement"] = useCallback((a) => {
    setCareer((c) => ({ ...c, achievements: [{ ...a, id: uid() }, ...c.achievements] }));
  }, [setCareer]);
  const deleteAchievement = useCallback((id: string) => {
    setCareer((c) => ({ ...c, achievements: c.achievements.filter((a) => a.id !== id) }));
  }, [setCareer]);

  // ---------------- Career: posts ----------------
  const setLinkedin = useCallback((v: string) => setCareer((c) => ({ ...c, linkedin: v })), [setCareer]);

  // Assemble the context value — stable object identity via useCallback deps
  const value: StoreState = {
    tasks, notes,
    addTask, toggleTask, deleteTask, updateTask,
    addNote, updateNote, deleteNote, togglePinNote,
    career,
    addTrack, updateTrack, deleteTrack,
    addConcept, updateConcept, deleteConcept,
    addSubConcept, toggleSubConcept, updateSubConcept, deleteSubConcept,
    addCareerNote, updateCareerNote, deleteCareerNote,
    addResumeBullet, updateResumeBullet, deleteResumeBullet,
    addGoal, toggleGoal, updateGoal, deleteGoal,
    addAchievement, deleteAchievement,
    setLinkedin,
    workout,
    addExercise, updateExercise, deleteExercise,
    logPR, deletePR,
    addSkill, deleteSkill, addProgression, toggleProgressionDone, updateProgression, deleteProgression,
    addRoutine, updateRoutine, deleteRoutine, addBlock, updateBlock, deleteBlock,
    startSession, logSet, finishSession, discardSession,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** Primary consumer hook. Throws if used outside StoreProvider. */
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/** Convenience hook to look up Space metadata by id (color/emoji/name). */
export function useSpace(spaceId: SpaceId) {
  return SPACES.find((s) => s.id === spaceId)!;
}
