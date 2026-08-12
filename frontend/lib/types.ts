/**
 * Shared type definitions for the Kaizen app.
 *
 * - Core: Task, Note, Space, Priority, SPACES
 * - Career: tracks/concepts/notes/goals/achievements
 * - Workout: full-featured tracker (exercises, PRs, skills, routines,
 *   sessions, readiness, badges, bodyweight, settings) with multi-unit
 *   exercises, RIR logging, equipment/level filters, and a muscle-group
 *   heatmap.
 */

// ---------------- Core ----------------

export type Priority = "low" | "medium" | "high";

export type SpaceId = "projects" | "workout" | "career" | "entertainment" | "health";

export type View =
  | "dashboard"
  | "tasks"
  | "pomodoro"
  | "notes"
  | "habits"
  | "calendar"
  | SpaceId;

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  space: SpaceId;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  updatedAt: number;
}

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

// ---------------- Career ----------------

export type CareerTrackId = string;

export interface CareerSubConcept { id: string; title: string; done: boolean; }
export interface CareerConcept    { id: string; title: string; subConcepts: CareerSubConcept[]; }
export interface CareerNote       { id: string; title: string; content: string; updatedAt: number; }
export interface CareerBullet     { id: string; text: string; }
export interface CareerTrack {
  id: CareerTrackId;
  name: string;
  color: string;
  concepts: CareerConcept[];
  notes: CareerNote[];
  resumeBullets: CareerBullet[];
}
export interface CareerGoal {
  id: string;
  title: string;
  description?: string;
  trackId?: CareerTrackId;
  done: boolean;
  deadline?: string;
}
export interface CareerAchievement {
  id: string;
  title: string;
  description?: string;
  date: string;
  icon: string;
  trackId?: CareerTrackId;
}
export interface CareerState {
  tracks: CareerTrack[];
  goals: CareerGoal[];
  achievements: CareerAchievement[];
  linkedin: string;
}

// ---------------- Workout ----------------

// Measurement unit for an exercise.
export type WorkoutUnit = "reps" | "seconds" | "meters" | "kg";

// Equipment required (filter chip).
export type Equipment =
  | "bodyweight" | "barbell" | "dumbbell" | "kettlebell"
  | "cable" | "machine" | "bands" | "cardio";
export const EQUIPMENT: { id: Equipment; label: string }[] = [
  { id: "bodyweight", label: "Bodyweight" },
  { id: "barbell",    label: "Barbell" },
  { id: "dumbbell",   label: "Dumbbell" },
  { id: "kettlebell", label: "Kettlebell" },
  { id: "cable",      label: "Cable" },
  { id: "machine",    label: "Machine" },
  { id: "bands",      label: "Bands" },
  { id: "cardio",     label: "Cardio" },
];

// Experience level (filter chip).
export type Level = "beginner" | "intermediate" | "advanced";
export const LEVELS: { id: Level; label: string }[] = [
  { id: "beginner",     label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced",     label: "Advanced" },
];

// Muscle groups used for tagging AND for the anatomical heatmap.
// Coarse filter groups (chest/back/legs/shoulders/arms/core) are also valid as
// tags — they alias to the heatmap regions via MUSCLE_FILTER_GROUP below.
export type MuscleGroup =
  // coarse filter-aliases (kept for backward compat with seed data & old components)
  | "chest" | "back" | "legs" | "shoulders" | "arms" | "core"
  // fine-grained heatmap regions
  | "upperChest"
  | "abs" | "obliques"
  | "biceps" | "triceps" | "forearms"
  | "frontDelt" | "sideDelt" | "rearDelt" | "traps"
  | "lats" | "upperBack" | "lowerBack"
  | "quads" | "hamstrings" | "glutes" | "calves"
  | "cardio" | "other";

// Human-friendly grouping + colour for the muscle-group filter chips. The first
// column is the *chip id*; fine-grained muscles map back to these via
// MUSCLE_FILTER_GROUP.
export const MUSCLE_GROUPS: { id: MuscleGroup; label: string; color: string }[] = [
  { id: "chest",     label: "Chest",     color: "#ec4899" },
  { id: "back",      label: "Back",      color: "#8b5cf6" },
  { id: "shoulders", label: "Shoulders", color: "#f59e0b" },
  { id: "arms",      label: "Arms",      color: "#a3e635" },
  { id: "core",      label: "Core",      color: "#f43f5e" },
  { id: "legs",      label: "Legs",      color: "#06b6d4" },
  { id: "cardio",    label: "Cardio",    color: "#ef4444" },
  { id: "other",     label: "Other",     color: "#64748b" },
];
// Internal expanded groups for heatmap colours; still map to one of the
// above filter chips via `muscleFilterGroup` below.
export const HEATMAP_MUSCLES: MuscleGroup[] = [
  "chest","upperChest","abs","obliques","biceps","triceps","forearms",
  "shoulders","frontDelt","sideDelt","rearDelt","traps",
  "lats","upperBack","lowerBack",
  "quads","hamstrings","glutes","calves","cardio",
];

// Map detailed muscles (and coarse aliases) back to their filter-chip id.
export const MUSCLE_FILTER_GROUP: Record<MuscleGroup, MuscleGroup> = {
  chest: "chest", upperChest: "chest",
  abs: "core", obliques: "core", core: "core",
  biceps: "arms", triceps: "arms", forearms: "arms", arms: "arms",
  shoulders: "shoulders", frontDelt: "shoulders", sideDelt: "shoulders", rearDelt: "shoulders", traps: "shoulders",
  lats: "back", upperBack: "back", lowerBack: "back", back: "back",
  quads: "legs", hamstrings: "legs", glutes: "legs", calves: "legs", legs: "legs",
  cardio: "cardio",
  other: "other",
};

// Format a value+unit for display.
export function formatWorkoutValue(value: number, unit: WorkoutUnit): string {
  if (unit === "seconds") {
    const h = Math.floor(value / 3600);
    const m = Math.floor((value % 3600) / 60);
    const s = Math.floor(value % 60);
    if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  if (unit === "kg") return `${value} kg`;
  if (unit === "meters") {
    return value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 2)} km` : `${value} m`;
  }
  return `${value} reps`;
}

// An exercise definition.
export interface WorkoutExercise {
  id: string;
  name: string;
  unit: WorkoutUnit;
  muscleGroup?: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment?: Equipment;
  level?: Level;
  notes?: string;
  cues?: string[];       // short form cues shown during a set
  estimatedSetSeconds?: number;
  createdAt: number;
}

// A Personal Record entry — peak performance on a single exercise.
// `history` tracks every logged attempt to allow charting progress.
export interface WorkoutPR {
  id: string;
  exerciseId: string;
  value: number;
  reps?: number;
  estimated1RM?: number;
  date: string;
  note?: string;
  history: { date: string; value: number; reps?: number; rir?: number }[];
}

// Skill progressions (e.g. pull-up progressions).
export interface WorkoutProgression {
  id: string;
  title: string;
  target?: number;
  currentBest?: number;
  done: boolean;
}
export interface WorkoutSkill {
  id: string;
  name: string;
  progressions: WorkoutProgression[];
  createdAt: number;
}

// Routines / schedule.
export type WorkoutBlockType = "strength" | "cardio" | "rest";
export interface WorkoutBlock {
  id: string;
  exerciseId?: string;
  label?: string;
  type: WorkoutBlockType;
  sets: number;
  reps: number;              // target reps OR seconds for cardio/rest
  restSeconds: number;
}
export interface WorkoutRoutine {
  id: string;
  name: string;
  dayOfWeek?: number;        // 0=Sun..6=Sat
  blocks: WorkoutBlock[];
  createdAt: number;
}

// A performed set, optionally annotated with RIR (reps in reserve).
export interface WorkoutSetLog {
  blockId: string;
  setIndex: number;
  value: number;             // reps or seconds performed
  weight?: number;
  rir?: number;              // reps in reserve (0 = all-out)
  durationSeconds?: number;  // wall-clock time the set took (timed sets)
  completed: boolean;
}

// Daily readiness check-in (1-10 scales).
export interface WorkoutReadiness {
  date: string;              // ISO yyyy-mm-dd
  soreness: number;          // 1 (fine) - 10 (crippling)
  sleep: number;             // 1 (terrible) - 10 (great)
  stress: number;            // 1 (calm) - 10 (max)
  score: number;             // computed 0-100
  note?: string;
}

// Achievement badges.
export type BadgeId =
  | "first_workout" | "ten_workouts" | "fifty_workouts"
  | "pr_strength" | "pr_cardio" | "pr_bodyweight"
  | "streak_3" | "streak_7" | "streak_30"
  | "early_bird" | "iron_grip" | "century_volume"
  | "perfect_week" | "cardio_king";
export interface WorkoutBadge {
  id: BadgeId;
  earnedAt: number;
}

// Bodyweight log entry.
export interface WorkoutBodyweight {
  date: string;
  weightKg: number;
}

// Workout UI preferences.
export type TrainingPhase = "bulking" | "cutting" | "maintenance" | "deload" | "peak";
export interface WorkoutSettings {
  gloveMode: boolean;        // giant buttons for chalky fingers
  minimalMode: boolean;      // hide everything except current set + timer
  soundEnabled: boolean;     // rest-over beep
  restSecondsDefault: number;
  streakFreezes: number;     // Duolingo-style freezes earned/available
  units: "kg" | "lb";
  phase?: TrainingPhase;     // current training block
}

// A completed (or in-progress) session.
export interface WorkoutSession {
  id: string;
  routineId?: string;
  name: string;
  date: string;
  startedAt: number;
  endedAt?: number;
  sets: WorkoutSetLog[];
  note?: string;
  totalVolumeKg?: number;
  durationSeconds?: number;
  readinessScore?: number;
  warmup?: string[];
  cooldown?: MuscleGroup[];
  // Extended per-session metadata
  playlist?: string;
  crowdLevel?: "empty" | "light" | "moderate" | "packed";
  phase?: TrainingPhase;
  rating?: number;            // 1-10
  isDeload?: boolean;
  isRestDay?: boolean;
  bodyweightKg?: number;
}

// Root workout state.
export interface WorkoutState {
  exercises: WorkoutExercise[];
  prs: WorkoutPR[];
  skills: WorkoutSkill[];
  routines: WorkoutRoutine[];
  sessions: WorkoutSession[];
  readiness: WorkoutReadiness[];
  badges: WorkoutBadge[];
  bodyweight: WorkoutBodyweight[];
  settings: WorkoutSettings;
  activeSessionId?: string;
  lastWorkoutDate?: string;
  currentStreak?: number;
  longestStreak?: number;
}
