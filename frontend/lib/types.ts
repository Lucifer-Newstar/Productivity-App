/**
 * Shared type definitions for the Kaizen app.
 *
 * - Core domain types (Task, Note, Space) power the main productivity features
 * - Career-specific types (CareerTrack, CareerConcept, CareerGoal, etc.)
 *   are used by the /career page.
 * - The SPACES constant is the single source of truth for the five life spaces
 *   (Projects, Workout, Career, Entertainment, Health) that tasks are scoped to.
 */

// Priority level for tasks — controls badge color & sort weight
export type Priority = "low" | "medium" | "high";

// The five life "spaces" that own tasks and their own pages
export type SpaceId = "projects" | "workout" | "career" | "entertainment" | "health";

// Every top-level view routable from the sidebar.
// Core tools + the five spaces.
export type View =
  | "dashboard"
  | "tasks"
  | "pomodoro"
  | "notes"
  | "habits"
  | "calendar"
  | SpaceId;

// A to-do item. Belongs to exactly one space via `space`.
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  space: SpaceId;
  createdAt: number;
}

// Sticky note from the Notes page.
export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  updatedAt: number;
}

// Metadata for a space (color, emoji, display name) used throughout the UI
// to tint badges, headers, cards and gradients.
export interface Space {
  id: SpaceId;
  name: string;
  color: string;
  emoji: string;
}

export const SPACES: Space[] = [
  { id: "projects",      name: "Projects",      color: "#8b5cf6", emoji: "📁" },
  { id: "workout",       name: "Workout",       color: "#ec4899", emoji: "💪" },
  { id: "career",        name: "Career",        color: "#06b6d4", emoji: "💼" },
  { id: "entertainment", name: "Entertainment", color: "#f59e0b", emoji: "🎮" },
  { id: "health",        name: "Health",        color: "#a3e635", emoji: "❤️" },
];

// ---------------- Career domain ----------------

// A career "track" is a path like DevOps, SRE, Backend, etc.
// Each track owns its own roadmap (concepts → sub-concepts), notes, and resume bullets.
export type CareerTrackId = string;

// A single checkable sub-concept nested under a CareerConcept.
// e.g. under the "Networking" concept you might have "TCP/IP", "DNS", "HTTP/TLS".
export interface CareerSubConcept {
  id: string;
  title: string;
  done: boolean;
}

// A top-level roadmap concept (e.g. "Linux Fundamentals") containing an ordered
// checklist of sub-concepts. Rendered as an expandable section with its own progress.
export interface CareerConcept {
  id: string;
  title: string;
  subConcepts: CareerSubConcept[];
}

// Free-form note scoped to a specific track (interview prep, reading, etc.)
export interface CareerNote {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

// A single resume bullet point under a track.
export interface CareerBullet {
  id: string;
  text: string;
}

export interface CareerTrack {
  id: CareerTrackId;
  name: string;
  color: string;
  concepts: CareerConcept[];     // roadmap hierarchy: concepts -> sub-concepts
  notes: CareerNote[];
  resumeBullets: CareerBullet[];
}

// A high-level goal, optionally tied to a track and a deadline.
export interface CareerGoal {
  id: string;
  title: string;
  description?: string;
  trackId?: CareerTrackId;
  done: boolean;
  deadline?: string;
}

// Celebrated win (internship, certification, course completion, etc.)
// Shown in the Achievement Vault timeline.
export interface CareerAchievement {
  id: string;
  title: string;
  description?: string;
  date: string;           // ISO yyyy-mm-dd
  icon: string;           // emoji
  trackId?: CareerTrackId;
}

// Root career state persisted to localStorage under `kaizen.career`.
export interface CareerState {
  tracks: CareerTrack[];
  goals: CareerGoal[];
  achievements: CareerAchievement[];
  linkedin: string;       // LinkedIn profile URL (portfolio is placeholder)
}

// ---------------- Workout domain ----------------

// Measurement unit for an exercise — determines how we record progress.
// - reps:    count of repetitions (e.g. pull-ups, push-ups)
// - seconds: timed duration (e.g. plank, treadmill, wall sit)
// - meters:  distance (e.g. running, rowing, swimming)
// - kg:      weight lifted — stored alongside reps (compound lifts)
export type WorkoutUnit = "reps" | "seconds" | "meters" | "kg";

// Muscle groups used to tag exercises (for filtering/color coding)
export type MuscleGroup = "chest" | "back" | "legs" | "shoulders" | "arms" | "core" | "cardio" | "other";

export const MUSCLE_GROUPS: { id: MuscleGroup; label: string; color: string }[] = [
  { id: "chest",     label: "Chest",     color: "#ec4899" },
  { id: "back",      label: "Back",      color: "#8b5cf6" },
  { id: "legs",      label: "Legs",      color: "#06b6d4" },
  { id: "shoulders", label: "Shoulders", color: "#f59e0b" },
  { id: "arms",      label: "Arms",      color: "#a3e635" },
  { id: "core",      label: "Core",      color: "#f43f5e" },
  { id: "cardio",    label: "Cardio",    color: "#ef4444" },
  { id: "other",     label: "Other",     color: "#64748b" },
];

// An exercise definition from the user's library (user-created).
// e.g. { name: "Bench Press", unit: "kg", muscleGroup: "chest" }
export interface WorkoutExercise {
  id: string;
  name: string;
  unit: WorkoutUnit;
  muscleGroup?: MuscleGroup;
  notes?: string;
  createdAt: number;
}

// Helper to format a unit value for display ("135" + "kg" → "135 kg"; "60" + "seconds" → "1:00")
export function formatWorkoutValue(value: number, unit: WorkoutUnit): string {
  if (unit === "seconds") {
    const m = Math.floor(value / 60);
    const s = Math.floor(value % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  if (unit === "kg") return `${value} kg`;
  if (unit === "meters") {
    return value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 2)} km` : `${value} m`;
  }
  return `${value} reps`;
}

// A Personal Record entry — peak performance on a single exercise.
// For kg lifts we also track how many reps that PR was done for.
// A history log lets us chart progress over time.
export interface WorkoutPR {
  id: string;
  exerciseId: string;
  value: number;
  reps?: number;
  date: string;              // ISO yyyy-mm-dd
  note?: string;
  history: { date: string; value: number; reps?: number }[];
}

// A Skill — a progressive chain of exercises leading to a target move.
// e.g. "Pull-up" with progressions: negative → Australian → band-assisted → strict.
export interface WorkoutProgression {
  id: string;
  title: string;
  target?: number;           // target reps/seconds to unlock next level
  currentBest?: number;
  done: boolean;
}

export interface WorkoutSkill {
  id: string;
  name: string;              // e.g. "Pull-up", "Handstand", "Planche"
  progressions: WorkoutProgression[];
  createdAt: number;
}

// A scheduled routine (template for a workout day).
// Contains ordered blocks — each block is one exercise with sets/reps/rest.
export type WorkoutBlockType = "strength" | "cardio" | "rest";

export interface WorkoutBlock {
  id: string;
  exerciseId?: string;
  label?: string;            // fallback free-text label (also used for "Rest")
  type: WorkoutBlockType;
  sets: number;
  reps: number;              // target reps per set, or seconds for cardio/rest
  restSeconds: number;       // rest between sets
}

export interface WorkoutRoutine {
  id: string;
  name: string;              // e.g. "Push Day", "Leg Day", "Morning Cardio"
  dayOfWeek?: number;        // 0=Sun..6=Sat (optional schedule)
  blocks: WorkoutBlock[];
  createdAt: number;
}

// A performed set logged during an active session
export interface WorkoutSetLog {
  blockId: string;
  setIndex: number;          // 1-based
  value: number;             // reps performed or seconds elapsed
  weight?: number;           // for kg lifts
  durationSeconds?: number;  // wall-clock time the set took (from auto-timer)
  completed: boolean;
}

// A completed (or in-progress) workout session
export interface WorkoutSession {
  id: string;
  routineId?: string;
  name: string;
  date: string;              // ISO yyyy-mm-dd
  startedAt: number;         // epoch ms
  endedAt?: number;
  sets: WorkoutSetLog[];
  totalVolumeKg?: number;    // computed: sum(weight * reps) for strength sets
  durationSeconds?: number;
}

// Root workout state persisted to localStorage under `kaizen.workout`.
export interface WorkoutState {
  exercises: WorkoutExercise[];
  prs: WorkoutPR[];
  skills: WorkoutSkill[];
  routines: WorkoutRoutine[];
  sessions: WorkoutSession[];
  activeSessionId?: string;
}
