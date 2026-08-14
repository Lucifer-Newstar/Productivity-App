/**
 * Health (VITAL-SIGN) data model.
 *
 * Offline-first state shape for the Health space. The spec lives in
 * docs/spaces/health/FEATURES.md (257 features across 10 sections). Wave 1
 * ships only the shell + profile + score tiles; the rest of the collections
 * below are empty/seed defaults and get filled in during later waves.
 *
 * Directional contract with Workout:
 *  - Health READS bodyweight/sessions/cardio/PRs/readiness from WorkoutState
 *    via store selectors — never mutates workout.
 *  - Health ADVISES Workout via flags on HealthState (readiness flags, injury
 *    restrictions, deload suggestion, TDEE target) that Workout UI surfaces.
 *  - healthAnalytics may import from workoutAnalytics; never the reverse.
 */

// ---------------- Section IDs (left-rail nav in HealthShell) ----------------

export type HealthSectionId =
  | "triage"       // /health            — daily dashboard
  | "fuel"         // /health/nutrition  — meals, macros, fasting, recipes
  | "hydration"    // /health/hydration  — water, caffeine, electrolytes
  | "somnium"      // /health/sleep      — sleep journal, debt, routines
  | "soma"         // /health/physique   — measurements, BF%, photos
  | "apothecary"   // /health/supplements— supps, deficiency badges, bloodwork
  | "vitals"       // /health/vitals     — HR, BP, HRV, temp, SpO2, symptoms
  | "mind"         // /health/mind       — mood, stress, journal, libido
  | "lab"          // /health/sync       — profile + workout bridge toggles
  | "reports";     // /health/reports    — weekly/monthly/export

// ---------------- Profile (user constants) ----------------

export type HealthGoal = "bulk" | "cut" | "maintain" | "recomp";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Gender = "male" | "female";

export interface HealthProfile {
  gender: Gender;
  ageYears: number;
  heightCm: number;
  /** Goal bodyweight in kg (optional; null = maintain current). */
  targetWeightKg: number | null;
  /** Goal body-fat % (optional). */
  targetBfPct: number | null;
  activityLevel: ActivityLevel;
  goal: HealthGoal;
  /** City label for climate multipliers (default "Chennai, IN"). */
  city: string;
  /** Climate multiplier override (1.0 = off; default 1.1 for Chennai). */
  climateMult: number;
  units: "metric" | "imperial";
  /** Ideal sleep hours per night (default 8). */
  idealSleepHours: number;
  /** Eating window start/end (hours, 24h) for intermittent fasting visualiser. */
  eatingWindowStart: number; // default 12 (noon)
  eatingWindowEnd: number;   // default 20 (8pm) = 16:8
  /** Optional PIN hash (dream journal + bloodwork lock). Stored locally only. */
  pinHash?: string;
}

// ---------------- Daily composite score ----------------

export interface DailyScore {
  date: string; // YYYY-MM-DD (IST)
  sleep: number;       // 0-1
  nutrition: number;   // 0-1
  hydration: number;   // 0-1
  movement: number;    // 0-1
  mind: number;        // 0-1
  total: number;       // weighted 0-100
}

// ---------------- Settings ----------------

export interface HealthSettings {
  nudges: boolean;
  soundEnabled: boolean;
  reminderQuietStart: number; // quiet hours start (hour, default 22)
  reminderQuietEnd: number;   // quiet hours end (hour, default 8)
  alcoholOptIn: boolean;
  cycleTrackingVisible: boolean; // default false for male profile
  // Workout sync toggles (all default ON)
  syncReadBodyweight: boolean;
  syncReadSessions: boolean;
  syncReadCardio: boolean;
  syncReadPRs: boolean;
  syncReadReadiness: boolean;
  syncPushHydration: boolean;
  syncPushSleep: boolean;
  syncPushInjuries: boolean;
  syncPushRecovery: boolean;
  syncPushDeload: boolean;
}

// ---------------- Empty placeholders — types for future waves ---------------
//
// These are stubbed as empty arrays/minimal shapes so the migration function
// can seed them and later waves can fill them in without another schema bump.
// Each entity is intentionally lean for Wave 1; richer fields come in their
// respective wave commits.

export interface MealEntry {
  id: string;
  date: string;
  slot: "breakfast" | "lunch" | "dinner" | "snack";
  time?: string; // HH:MM
  items: MealItem[];
  note?: string;
  social?: boolean;
  cheat?: boolean;
  cheatReason?: "celebratory" | "stress" | "craving" | "social";
  preWorkout?: boolean;
  postWorkout?: boolean;
}
export interface MealItem {
  id: string;
  name: string;
  kcal: number;
  carbsG?: number;
  proteinG?: number;
  fatG?: number;
  fibreG?: number;
}

export interface WaterEntry {
  id: string;
  date: string;
  time: string;
  ml: number;
  beverage: WaterBeverage;
  electrolytes: boolean;
}
export type WaterBeverage =
  | "water" | "coconut" | "coffee" | "tea" | "juice"
  | "soda" | "sports" | "milk" | "lassi" | "ors" | "alcohol" | "other";

export interface SleepEntry {
  id: string;
  date: string;
  bedTime: string;    // ISO datetime
  wakeTime: string;   // ISO datetime
  durationHours: number;
  quality: number;    // 1-10
  latencyMin?: number;
  wakeUps?: number;
}

export interface MeasurementEntry {
  id: string;
  date: string;
  neckCm?: number;
  chestCm?: number;
  chestFlexedCm?: number;
  waistCm?: number;
  hipCm?: number;
  armLeftCm?: number;
  armRightCm?: number;
  forearmLeftCm?: number;
  forearmRightCm?: number;
  thighLeftCm?: number;
  thighRightCm?: number;
  calfLeftCm?: number;
  calfRightCm?: number;
  shoulderCm?: number;
  wristCm?: number;
  ankleCm?: number;
  note?: string;
}

export interface SupplementDef {
  id: string;
  name: string;
  doseMg?: number;
  doseUnits?: string;
  timeOfDay: "morning" | "preworkout" | "postworkout" | "evening" | "night" | "any";
  notes?: string;
}
export interface SupplementLog {
  id: string;
  date: string;
  suppId: string;
  taken: boolean;
  time?: string;
}

export interface VitalsEntry {
  id: string;
  date: string;
  time: string;
  restingHr?: number;
  systolic?: number;
  diastolic?: number;
  hrvMs?: number;
  tempC?: number;
  spo2?: number;
  note?: string;
}

export interface MindEntry {
  id: string;
  date: string;
  mood: number;       // 1-10
  stress: number;     // 1-10
  energy: number;     // 1-10
  anxiety?: number;   // 1-10
  focus?: number;     // 1-10
  libido?: number;    // 1-5
  note?: string;
}

// ---------------- Root HealthState ----------------

export interface HealthState {
  profile: HealthProfile;
  scores: DailyScore[];
  meals: MealEntry[];
  water: WaterEntry[];
  sleep: SleepEntry[];
  measurements: MeasurementEntry[];
  supplementDefs: SupplementDef[];
  supplementLog: SupplementLog[];
  vitals: VitalsEntry[];
  mind: MindEntry[];
  settings: HealthSettings;
  /** Wave-1 daily score computed at read time, persisted here for history charts. */
  lastScoreDate?: string;
}

// ---------------- Helpers ----------------

export const DEFAULT_PROFILE: HealthProfile = {
  gender: "male",
  ageYears: 20,
  heightCm: 175,
  targetWeightKg: null,
  targetBfPct: null,
  activityLevel: "moderate",
  goal: "maintain",
  city: "Chennai, IN",
  climateMult: 1.1,
  units: "metric",
  idealSleepHours: 8,
  eatingWindowStart: 12,
  eatingWindowEnd: 20,
};

export const DEFAULT_SETTINGS: HealthSettings = {
  nudges: true,
  soundEnabled: false,
  reminderQuietStart: 22,
  reminderQuietEnd: 8,
  alcoholOptIn: false,
  cycleTrackingVisible: false,
  syncReadBodyweight: true,
  syncReadSessions: true,
  syncReadCardio: true,
  syncReadPRs: true,
  syncReadReadiness: true,
  syncPushHydration: true,
  syncPushSleep: true,
  syncPushInjuries: true,
  syncPushRecovery: true,
  syncPushDeload: true,
};

export function emptyHealthState(): HealthState {
  return {
    profile: { ...DEFAULT_PROFILE },
    scores: [],
    meals: [],
    water: [],
    sleep: [],
    measurements: [],
    supplementDefs: [],
    supplementLog: [],
    vitals: [],
    mind: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

// ---------------- Section metadata ----------------

export interface HealthSectionMeta {
  id: HealthSectionId;
  label: string;
  short: string;       // 3-letter rail label
  route: string;
  code: string;        // rail numeral (00-09)
  description: string;
}

export const HEALTH_SECTIONS: HealthSectionMeta[] = [
  { id: "triage",     label: "Triage",     short: "TRI", route: "/health",             code: "00", description: "Daily dashboard" },
  { id: "fuel",       label: "Fuel",       short: "FUE", route: "/health/nutrition",   code: "01", description: "Meals, macros, fasting" },
  { id: "hydration",  label: "Hydration",  short: "HYD", route: "/health/hydration",   code: "02", description: "Water, caffeine, salts" },
  { id: "somnium",    label: "Somnium",    short: "SOM", route: "/health/sleep",       code: "03", description: "Sleep &amp; circadian" },
  { id: "soma",       label: "Soma",       short: "SMA", route: "/health/physique",    code: "04", description: "Body, measurements, photos" },
  { id: "apothecary", label: "Apothecary", short: "APT", route: "/health/supplements", code: "05", description: "Supplements &amp; bloodwork" },
  { id: "vitals",     label: "Vitals",     short: "VIT", route: "/health/vitals",      code: "06", description: "HR, BP, HRV, temperature" },
  { id: "mind",       label: "Mind",       short: "MND", route: "/health/mind",        code: "07", description: "Mood, stress, journal" },
  { id: "lab",        label: "Lab",        short: "LAB", route: "/health/sync",        code: "08", description: "Profile &amp; workout sync" },
  { id: "reports",    label: "Reports",    short: "RPT", route: "/health/reports",     code: "09", description: "Trends, CSV export" },
];
