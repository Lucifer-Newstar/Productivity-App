/**
 * Shared type definitions for the Kaizen app.
 *
 * - Core: Task, Note, Space, Priority, SPACES
 * - Career: tracks/concepts/notes/goals/achievements
 * - Workout: full-featured tracker.  Types here are exhaustive — calisthenics,
 *   gym/weights, cardio, and global wellness features are all modelled in
 *   this file (no parallel ext-types file).  Per-set metadata captures
 *   every data point a serious lifter would want to log.
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
  | "cable" | "machine" | "bands" | "cardio"
  | "sandbag" | "sled" | "medicine-ball" | "foam-roll" | "misc";
export const EQUIPMENT: { id: Equipment; label: string }[] = [
  { id: "bodyweight",    label: "Bodyweight" },
  { id: "barbell",       label: "Barbell" },
  { id: "dumbbell",      label: "Dumbbell" },
  { id: "kettlebell",    label: "Kettlebell" },
  { id: "cable",         label: "Cable" },
  { id: "machine",       label: "Machine" },
  { id: "bands",         label: "Bands" },
  { id: "cardio",        label: "Cardio" },
  { id: "sandbag",       label: "Sandbag" },
  { id: "sled",          label: "Sled" },
  { id: "medicine-ball", label: "Medicine Ball" },
  { id: "foam-roll",     label: "Foam Roller" },
  { id: "misc",          label: "Other" },
];

// Experience level (filter chip).
export type Level = "beginner" | "intermediate" | "advanced";
export const LEVELS: { id: Level; label: string }[] = [
  { id: "beginner",     label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced",     label: "Advanced" },
];

// Muscle groups used for tagging AND for the anatomical heatmap.
export type MuscleGroup =
  | "chest" | "back" | "legs" | "shoulders" | "arms" | "core"
  | "upperChest"
  | "abs" | "obliques"
  | "biceps" | "triceps" | "forearms"
  | "frontDelt" | "sideDelt" | "rearDelt" | "traps"
  | "lats" | "upperBack" | "lowerBack"
  | "quads" | "hamstrings" | "glutes" | "calves"
  | "cardio" | "other";

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
export const HEATMAP_MUSCLES: MuscleGroup[] = [
  "chest","upperChest","abs","obliques","biceps","triceps","forearms",
  "shoulders","frontDelt","sideDelt","rearDelt","traps",
  "lats","upperBack","lowerBack",
  "quads","hamstrings","glutes","calves","cardio",
];

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
  cues?: string[];
  estimatedSetSeconds?: number;
  pattern?: MovementPattern;
  videoUrl?: string;
  isBodyweight?: boolean;
  createdAt: number;
}

// A Personal Record entry.
export interface WorkoutPR {
  id: string;
  exerciseId: string;
  value: number;
  reps?: number;
  estimated1RM?: number;
  date: string;
  note?: string;
  history: WorkoutPRAttempt[];
}
export interface WorkoutPRAttempt {
  date: string;
  value: number;
  reps?: number;
  rir?: number;
  rpe?: number;
  weight?: number;
}

// Skill progressions (high-level bodyweight goals visible on /workout/skills).
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
  reps: number;
  restSeconds: number;
}
export interface WorkoutRoutine {
  id: string;
  name: string;
  dayOfWeek?: number;
  blocks: WorkoutBlock[];
  isTemplate?: boolean;
  createdAt: number;
}

// -------- Extended per-set gym metadata --------

export type RepQuality = "perfect" | "good" | "decent" | "bad";
export type BarSpeed = "fast" | "normal" | "slow" | "grind";
export type GripType = "overhand" | "underhand" | "mixed" | "hook" | "straps";
export type Feeling = "fast" | "normal" | "slow" | "grind";
export type MentalState = "locked-in" | "distracted" | "anxious" | "tired";
export type CrowdLevel = "empty" | "light" | "moderate" | "packed";
export type TrainingPhase = "bulking" | "cutting" | "maintenance" | "deload" | "peak";
export type StickingPoint = "off-floor" | "mid-range" | "lockout" | "transition" | "none";
export type MovementPattern =
  | "Push" | "Pull" | "Squat" | "Hinge" | "Carry" | "Rotation" | "Gait" | "Isometric" | "Other";

export interface WorkoutSetLog {
  blockId: string;
  setIndex: number;
  value: number;                 // reps or seconds performed
  weight?: number;               // kg
  rir?: number;                  // reps in reserve
  rpe?: number;                  // 1-10 rate of perceived exertion
  durationSeconds?: number;
  completed: boolean;
  // gym per-set flags
  isWarmup?: boolean;
  isJoker?: boolean;
  isDrop?: boolean;
  dropFromWeight?: number;       // previous weight when drop
  isAMRAP?: boolean;
  isPaused?: boolean;
  pauseSec?: number;
  tempo?: string;                // "3-1-2-1"
  isCluster?: boolean;
  clusterReps?: number[];        // reps per mini-set within cluster
  clusterRestSec?: number;
  isSuperset?: boolean;
  supersetGroupId?: string;
  isGiant?: boolean;
  isMyo?: boolean;               // myo-reps / rest-pause
  unilateral?: boolean;
  leftValue?: number;
  rightValue?: number;
  leftWeight?: number;
  rightWeight?: number;
  belt?: boolean;
  kneeSleeves?: boolean;
  wristWraps?: boolean;
  barSpinOk?: boolean;
  grip?: GripType;
  quality?: RepQuality;
  speed?: BarSpeed;
  feeling?: Feeling;
  mental?: MentalState;
  pain?: number;                 // 0-10
  stickingPoint?: StickingPoint;
  asymmetry?: "left-weak" | "right-weak" | "none";
  notes?: string;
}

// Daily readiness check-in (1-10 scales).
export interface WorkoutReadiness {
  date: string;
  soreness: number;
  sleep: number;
  stress: number;
  score: number;
  note?: string;
}

// Achievement badges.
export type BadgeId =
  | "first_workout" | "ten_workouts" | "fifty_workouts"
  | "pr_strength" | "pr_cardio" | "pr_bodyweight"
  | "streak_3" | "streak_7" | "streak_30"
  | "early_bird" | "iron_grip" | "century_volume"
  | "perfect_week" | "cardio_king" | "goal_achieved";
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
export interface WorkoutSettings {
  gloveMode: boolean;
  minimalMode: boolean;
  soundEnabled: boolean;
  restSecondsDefault: number;
  streakFreezes: number;
  units: "kg" | "lb";
  phase?: TrainingPhase;
  age?: number;                   // for cardio HR max
  gender?: "male" | "female";    // for Wilks
}

// -------- Calisthenics domain --------

export interface CalisthenicsProgression {
  id: string;
  name: string;
  difficulty: number;
  achieved: boolean;
  achievedDate?: string;
  bestReps?: number;
  bestHoldSec?: number;
  notes?: string;
}
export interface CalisthenicsChain {
  id: string;
  name: string;
  pattern: MovementPattern;
  progressions: CalisthenicsProgression[];
}
export type CaliEquipment =
  | "pull-up-bar" | "rings" | "parallettes" | "resistance-bands" | "weighted-vest" | "dip-bars" | "none";
export interface CalisthenicsSkill {
  id: string;
  name: string;
  pattern: MovementPattern;
  difficulty: number;
  unlocked: boolean;
  unlockedAt?: string;
  videoUrl?: string;
  accessoryIds: string[];       // exercise or chain ids
  equipmentNeeded: CaliEquipment[];
  archived: boolean;
  firstAttemptDate?: string;
  bestAttempt?: { reps?: number; holdSec?: number; date: string };
  attempts: CaliAttempt[];
  failLog: CaliFail[];
  ringHeightCm?: number;
}
export interface CaliAttempt {
  id: string;
  date: string;
  reps?: number;
  holdSec?: number;
  ringHeightCm?: number;
  assistance?: string;
  mmc?: number;                  // mind-muscle connection 1-10
  tempo?: string;
  quality?: RepQuality;
  isTestDay?: boolean;
  isRestPause?: boolean;
  restPauseAttempts?: number[];
  notes?: string;
}
export interface CaliFail {
  id: string;
  date: string;
  reason: string;
}
export interface CalisthenicsFlow {
  id: string;
  name: string;
  moves: string;                 // free-text sequence
  quality: number;               // 1-10
  date: string;
}
export interface GtGEntry {
  id: string;
  date: string;
  hour: number;
  reps: number;
  exerciseName: string;
}
export interface IsometricLog {
  id: string;
  date: string;
  name: string;
  seconds: number;
}
export interface IntervalLog {
  id: string;
  date: string;
  type: "emom" | "amrap" | "rest-pause" | "cluster" | "fartlek" | "intervals" | "brick";
  name: string;
  timeCapSec?: number;
  perMinuteReps?: number[];
  rounds?: number;
  reps?: number;
  clusters?: { reps: number; restSec: number }[];
  intervals?: { reps: number; workSec: number; restSec: number }[];
  notes?: string;
}
export interface MobilityDrill {
  id: string;
  name: string;
  durationSec: number;
  tags: string[];
}
export interface MobilitySession {
  id: string;
  date: string;
  drillIds: string[];
  durationSec: number;
  notes?: string;
}
export interface PseudoPlancheEntry {
  id: string;
  date: string;
  handDistanceCm: number;         // distance forward from waist
  holdSec: number;
}

// -------- Cardio domain --------

export type CardioType = "run" | "bike" | "swim" | "row" | "jump-rope" | "walk" | "hike" | "other";
export interface CardioLog {
  id: string;
  date: string;
  type: CardioType;
  routeName?: string;
  distanceMeters?: number;
  durationSec: number;
  avgHr?: number;
  maxHr?: number;
  hr2minPost?: number;
  cadenceSpm?: number;
  splitsSec?: number[];
  negativeSplit?: boolean;
  hrStart?: number;
  hrEnd?: number;
  hrDriftPct?: number;
  fuel?: string;
  strides?: { count: number; distanceM: number };
  cooldownMin?: number;
  jumpRope?: { jumps: number; misses: number };
  paceSecPerKm?: number;
  power?: number;
  intervals?: { reps: number; workSec: number; restSec: number }[];
  fartlek?: { workSec: number; restSec: number; reps: number }[];
  isLSD?: boolean;
  isRecovery?: boolean;
  isBrick?: boolean;
  brickNextType?: CardioType;
  brickTransSec?: number;
  injuryNotes?: string;
  injuryTags?: string[];         // shin-splints / plantar / it-band / achilles
  notes?: string;
}

// -------- Global / session metadata --------

export interface IntraWorkoutNutrition {
  carbsG?: number;
  bcaaG?: number;
  electrolytes?: boolean;
  waterMl?: number;
}
export interface WorkoutNote {
  id: string;
  date: string;
  content: string;
  tags?: string[];
}
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
  // metadata
  playlist?: string;
  crowdLevel?: CrowdLevel;
  phase?: TrainingPhase;
  rating?: number;
  isDeload?: boolean;
  isRestDay?: boolean;
  restReason?: "soreness" | "fatigue" | "injury" | "life" | "deload";
  bodyweightKg?: number;
  timeOfDay?: "morning" | "afternoon" | "evening";
  hydrationPreMl?: number;
  hydrationPostMl?: number;
  preworkout?: boolean;
  caffeineMg?: number;
  soreness?: number;
  jointPain?: string[];
  warmupDrillIds?: string[];
  warmupDurationSec?: number;
  cooldownDurationSec?: number;
  nutrition?: IntraWorkoutNutrition;
  programId?: string;
  workoutNumberInProgram?: number;
  /** Ad-hoc blocks created during a freestyle/quick-start session (so history/CSV can resolve exercise names after refresh). */
  adHocBlocks?: WorkoutBlock[];
}

// Programs / goals / challenges / board

export interface Program {
  id: string;
  name: string;
  weeks: number;
  daysPerWeek: number;
  routineIds: string[];
  startDate?: string;
}
export interface WorkoutGoal {
  id: string;
  title: string;
  target: number;
  unit: string;
  metric: "volume-kg" | "workouts" | "streak" | "bodyweight-kg" | "1rm-kg" | "custom";
  exerciseId?: string;
  byDate?: string;
  achieved?: boolean;
  achievedAt?: number;
}
export interface CustomMetric {
  id: string;
  name: string;
  unit?: string;
  emoji?: string;
}
export interface CustomMetricEntry {
  id: string;
  metricId: string;
  sessionId: string;
  value: number;
}
export interface ChallengeEntry {
  id: string;
  name: string;
  startDate: string;
  lengthDays: number;
  perDay: { date: string; done: boolean; value?: number; note?: string }[];
}
export interface MotivationBoardItem {
  id: string;
  type: "quote" | "photo" | "pr" | "goal" | "custom";
  content: string;
  emoji?: string;
  createdAt: number;
}
export interface RestDayEntry {
  date: string;
  reason: string;
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
  // calisthenics
  caliChains: CalisthenicsChain[];
  caliSkills: CalisthenicsSkill[];
  caliFlows: CalisthenicsFlow[];
  gtg: GtGEntry[];
  isometricLogs: IsometricLog[];
  intervalLogs: IntervalLog[];
  mobilityDrills: MobilityDrill[];
  mobilitySessions: MobilitySession[];
  plancheEntries: PseudoPlancheEntry[];
  // cardio
  cardioLogs: CardioLog[];
  // global
  programs: Program[];
  customMetrics: CustomMetric[];
  customMetricEntries: CustomMetricEntry[];
  goals: WorkoutGoal[];
  challenges: ChallengeEntry[];
  journal: WorkoutNote[];
  board: MotivationBoardItem[];
  restDays: RestDayEntry[];
}
