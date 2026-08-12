/**
 * Extended types for Calisthenics, Gym/Weights, and Cardio sections.
 *
 * The existing types (WorkoutExercise, WorkoutSetLog, WorkoutSession, ...)
 * are extended via intersection-style augmentation below, plus all new
 * entities for the feature set.
 */

import type {
  WorkoutExercise as BaseExercise,
  WorkoutSetLog as BaseSetLog,
  WorkoutSession as BaseSession,
  WorkoutState as BaseState,
  WorkoutSettings as BaseSettings,
  WorkoutPR,
  WorkoutRoutine,
  WorkoutBlock,
  WorkoutSkill,
} from "./types";

/* ---------- Calisthenics ---------- */

// Link progression exercises (Push-up → Diamond → Archer → One-Arm).
export interface CalisthenicsProgression {
  id: string;
  name: string;
  exerciseId?: string;        // optional link to a WorkoutExercise
  difficulty: number;         // 1-10
  achieved: boolean;
  achievedDate?: string;
  bestReps?: number;
  bestHoldSec?: number;       // for isometrics
  notes?: string;
}
export interface CalisthenicsChain {
  id: string;
  name: string;               // e.g. "Push-up progression"
  pattern: MovementPattern;
  progressions: CalisthenicsProgression[];
}

// Movement patterns (library)
export type MovementPattern =
  | "Push" | "Pull" | "Squat" | "Hinge" | "Carry" | "Rotation" | "Gait" | "Isometric" | "Other";

// Difficulty-tagged calisthenics skill
export interface CalisthenicsSkill {
  id: string;
  name: string;
  pattern: MovementPattern;
  difficulty: number;         // 1-10
  unlocked: boolean;
  unlockedAt?: string;        // ISO date
  videoUrl?: string;
  accessories: string[];      // links to accessory exercise ids
  equipmentNeeded: CalisthenicsEquipment[];
  archived: boolean;
  notes?: string;
  // "First attempt" vs "best"
  firstAttemptDate?: string;
  bestAttempt?: { reps?: number; holdSec?: number; date: string };
  attempts: CalisthenicsAttempt[];
  failLog: CalisthenicsFail[];
}

export type CalisthenicsEquipment =
  | "pull-up-bar" | "rings" | "parallettes" | "resistance-bands" | "weighted-vest" | "dip-bars" | "none";

export interface CalisthenicsAttempt {
  id: string;
  date: string;
  reps?: number;
  holdSec?: number;
  ringHeightCm?: number;      // ring-height tracker
  assistance?: string;        // e.g. "band #2", "spotter"
  mindMuscleConnection?: number; // 1-10
  tempo?: string;             // e.g. "3-1-2-1"
  quality?: RepQuality;
  notes?: string;
  isTestDay?: boolean;        // marks a test/max day
}

export interface CalisthenicsFail {
  id: string;
  date: string;
  reason: string;             // free text: "Lost tension in core"
}

// Freestyle flow logger
export interface CalisthenicsFlow {
  id: string;
  name: string;
  sequence: { exerciseId: string; durationSec?: number; reps?: number }[];
  qualityRating?: number;     // 1-10
  date: string;
  notes?: string;
}

// Grease-the-Groove micro-sets
export interface GtGEntry {
  id: string;
  date: string;               // yyyy-mm-dd
  hour: number;               // 0-23
  exerciseId: string;
  reps: number;
  holdSec?: number;
}

// Isometric hold log (shared between skills and exercises)
export interface IsometricLog {
  id: string;
  date: string;
  exerciseId?: string;
  skillId?: string;
  seconds: number;
  notes?: string;
}

// EMOM / AMRAP / Rest-pause shared shape (used by both cali + gym)
export interface IntervalLog {
  id: string;
  date: string;
  type: "emom" | "amrap" | "rest-pause" | "cluster" | "fartlek" | "intervals" | "brick";
  name: string;
  timeCapSec?: number;         // for AMRAP
  perMinuteReps?: number[];    // for EMOM: minute 1 → reps, minute 2 → reps ...
  rounds?: number;
  reps?: number;
  // rest-pause / cluster: sets + intra rest
  clusters?: { reps: number; restSec: number }[];
  notes?: string;
}

// Mobility / warmup library
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

/* ---------- Gym / Weights ---------- */

export type RepQuality = "perfect" | "good" | "decent" | "bad";
export type BarSpeed = "fast" | "normal" | "slow" | "grind";
export type GripType = "overhand" | "underhand" | "mixed" | "hook" | "straps";
export type Feeling = "fast" | "normal" | "slow" | "grind";
export type MentalState = "locked-in" | "distracted" | "anxious" | "tired";
export type CrowdLevel = "empty" | "light" | "moderate" | "packed";
export type TrainingPhase = "bulking" | "cutting" | "maintenance" | "deload" | "peak";
export type StickingPoint = "off-floor" | "mid-range" | "lockout" | "transition" | "none";

// Extended set log for weights (supercedes base set for new entries)
export interface GymSetLog {
  id: string;
  blockId?: string;
  setIndex: number;
  value: number;              // reps (or seconds for timed)
  weight?: number;            // kg
  rpe?: number;               // 1-10
  rir?: number;
  isWarmup?: boolean;
  isJoker?: boolean;
  isDrop?: boolean;
  isAMRAP?: boolean;
  isPaused?: boolean;
  pauseSec?: number;
  tempo?: string;             // "3-1-2-1"
  leftWeight?: number;        // unilateral left
  rightWeight?: number;       // unilateral right
  leftReps?: number;
  rightReps?: number;
  belt?: boolean;
  kneeSleeves?: boolean;
  wristWraps?: boolean;
  grip?: GripType;
  quality?: RepQuality;
  speed?: BarSpeed;
  feeling?: Feeling;
  mental?: MentalState;
  pain?: number;              // 0-10
  stickingPoint?: StickingPoint;
  asymmetry?: "left-weak" | "right-weak" | "none";
  notes?: string;
}

// Drop-set chain
export interface DropSetEntry {
  id: string;
  setLogId: string;
  weightKg: number;
  reps: number;
}

// Superset / giant set grouping
export interface Superset {
  id: string;
  sessionId: string;
  exerciseIds: string[];      // 2 = super, 3-4 = giant
}

// Plate calculator result
export interface PlateConfig {
  barKg: number;
  platesPerSide: number[];    // sorted desc
}

/* ---------- Cardio ---------- */

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
  hr2minPost?: number;        // HR recovery
  cadenceSpm?: number;
  splitsSec?: number[];       // per-km or per-mile splits
  negativeSplit?: boolean;
  hrStart?: number;
  hrEnd?: number;
  hrDriftPct?: number;
  fuel?: string;              // pre-run fuel
  strides?: { count: number; distanceM: number; paceSec?: number };
  cooldownMin?: number;
  jumpRope?: { jumps: number; misses: number };
  hrZones?: { z1: number; z2: number; z3: number; z4: number; z5: number }; // seconds per zone
  paceSecPerKm?: number;
  power?: number;
  intervals?: { reps: number; workSec: number; restSec: number; paceSec?: number }[];
  fartlek?: { workSec: number; restSec: number; reps: number }[];
  isLSD?: boolean;
  isRecovery?: boolean;
  isBrick?: boolean;
  brickNextType?: CardioType;
  brickTransSec?: number;
  injuryNotes?: string;
  notes?: string;
}

/* ---------- Global session + wellness ---------- */

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

export interface ExtendedSession extends Omit<BaseSession, "sets"> {
  // Replace base sets with mixed-shape entries
  sets: (BaseSetLog | GymSetLog)[];
  // Global per-session fields
  playlist?: string;
  crowdLevel?: CrowdLevel;
  timeOfDay?: "morning" | "afternoon" | "evening";
  hydrationPreMl?: number;
  hydrationPostMl?: number;
  preworkout?: boolean;
  caffeineMg?: number;
  phase?: TrainingPhase;
  rating?: number;            // 1-10
  soreness?: number;          // 1-10 post
  jointPain?: string[];       // areas
  programId?: string;
  workoutNumberInProgram?: number;
  isDeload?: boolean;
  isRestDay?: boolean;
  restReason?: "soreness" | "fatigue" | "injury" | "life" | "deload";
  warmupDrillIds?: string[];
  warmupDurationSec?: number;
  cooldownDurationSec?: number;
  nutrition?: IntraWorkoutNutrition;
  bodyweightKg?: number;
  durationSeconds?: number;
}

export interface Program {
  id: string;
  name: string;
  weeks: number;
  daysPerWeek: number;
  routineIds: string[];
  startDate?: string;
}

export interface CustomMetric {
  id: string;
  name: string;                // e.g. "Flow score"
  unit?: string;
  emoji?: string;
}
export interface CustomMetricEntry {
  id: string;
  metricId: string;
  sessionId: string;
  value: number;
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

export interface ChallengeEntry {
  id: string;
  name: string;                // e.g. "30-day push-up"
  startDate: string;
  lengthDays: number;
  perDay: { date: string; done: boolean; value?: number; note?: string }[];
}

export interface MotivationBoardItem {
  id: string;
  type: "quote" | "photo" | "pr" | "goal";
  content: string;
  createdAt: number;
}

/* ---------- Extended state shape ---------- */

export interface WorkoutStateExtension {
  // calisthenics
  caliChains: CalisthenicsChain[];
  caliSkills: CalisthenicsSkill[];
  caliFlows: CalisthenicsFlow[];
  gtg: GtGEntry[];
  isometricLogs: IsometricLog[];
  intervalLogs: IntervalLog[];
  mobilityDrills: MobilityDrill[];
  mobilitySessions: MobilitySession[];
  // gym
  supersets: Superset[];
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
  restDays: { date: string; reason: string }[];
}

// Re-export base types we keep using
export type {
  BaseExercise as WorkoutExercise,
  BaseSetLog as WorkoutSetLog,
  BaseSession as WorkoutSession,
  BaseState as WorkoutState,
  BaseSettings as WorkoutSettings,
  WorkoutPR, WorkoutRoutine, WorkoutBlock, WorkoutSkill,
};
