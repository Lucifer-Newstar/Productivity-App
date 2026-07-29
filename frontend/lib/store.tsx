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

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type {
  Task, Note, SpaceId,
  CareerState, CareerTrack, CareerConcept, CareerSubConcept,
  CareerNote, CareerBullet, CareerGoal, CareerAchievement,
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
// what the page can do before entering their own data.
const seedCareer = (): CareerState => {
  const devops = uid();
  const sre = uid();
  // Helper to build a concept with sub-concepts
  const c = (title: string, subs: string[]): CareerConcept => ({
    id: uid(),
    title,
    subConcepts: subs.map((t) => ({ id: uid(), title: t, done: false })),
  });
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
          { id: uid(), title: "Useful commands", content: "kubectl get pods -A\nkubectl logs -f <pod>\nterraform plan -out=plan", updatedAt: Date.now() - 2 * DAY },
          { id: uid(), title: "Interview prep", content: "- Explain CI/CD\n- Blue/green vs canary deployments\n- CAP theorem", updatedAt: Date.now() - DAY },
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
          { id: uid(), title: "SRE reading list", content: "- Site Reliability Engineering book\n- Google SRE Workbook", updatedAt: Date.now() - 3 * DAY },
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
      { id: uid(), title: "Completed Docker course", date: new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10), icon: "🐳", trackId: devops },
      { id: uid(), title: "Won internal hackathon", date: new Date(Date.now() - 60 * DAY).toISOString().slice(0, 10), icon: "🏆" },
    ],
    linkedin: "",
  };
};

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
}

const StoreContext = createContext<StoreState | null>(null);

/**
 * Helper hook — wraps useState to hydrate from localStorage on mount and
 * auto-persist on change. SSR-safe (returns seed on the server).
 * On first hydration, applies a one-time migration: old `milestones[]` data
 * (flat list per track) is converted to `concepts[]` with each legacy milestone
 * becoming a concept titled by the milestone name and no sub-concepts. This
 * ensures pre-existing users don't lose data when we upgrade the schema.
 */
function useLocalState<T>(key: string, seed: T, migrate?: (raw: any) => T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [v, setV] = useState<T>(() => {
    if (typeof window === "undefined") return seed;
    const raw = localStorage.getItem(key);
    if (!raw) return seed;
    try {
      const parsed = JSON.parse(raw);
      return migrate ? migrate(parsed) : parsed;
    } catch {
      return seed;
    }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(v)); }, [key, v]);
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Persisted slices
  const [tasks, setTasks]   = useLocalState<Task[]>("kaizen.tasks", seedTasks);
  const [notes, setNotes]   = useLocalState<Note[]>("kaizen.notes", seedNotes);
  const [career, setCareer] = useLocalState<CareerState>("kaizen.career", seedCareer(), migrateCareer);

  // One-time cleanup of legacy localStorage keys from pre-monorepo versions
  useEffect(() => {
    localStorage.removeItem("prod.tasks");
    localStorage.removeItem("prod.notes");
    localStorage.removeItem("prod.projects");
    localStorage.removeItem("prod.habits");
  }, []);

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
