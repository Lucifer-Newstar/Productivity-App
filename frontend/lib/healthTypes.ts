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
  caffeineMg?: number;
}
export type WaterBeverage =
  | "water" | "coconut" | "coffee" | "tea" | "juice"
  | "soda" | "sports" | "milk" | "lassi" | "ors" | "alcohol" | "other";

export interface SleepEntry {
  id: string;
  date: string;          // YYYY-MM-DD of the wake day (IST)
  bedTime: string;       // ISO datetime
  wakeTime: string;      // ISO datetime
  durationHours: number;
  quality: number;       // 1-10
  latencyMin?: number;   // minutes to fall asleep
  wakeUps?: number;      // number of nighttime awakenings
  /** Dream journal text (encrypted via PIN in future; plaintext for now). */
  dream?: string;
  /** Hygiene checklist ticked for this night. */
  hygiene?: SleepHygieneTick;
  note?: string;
}

export interface SleepHygieneTick {
  noCaffeineAfter14?: boolean;
  noScreensBeforeBed?: boolean;
  darkRoom?: boolean;
  coolRoom?: boolean;
  consistentSchedule?: boolean;
  noHeavyMealLate?: boolean;
  noAlcohol?: boolean;
  exercisedToday?: boolean;
  sunlightMorning?: boolean;
  relaxedBeforeBed?: boolean;
}

/** Circadian rhythm checkpoints — single row per day, optional. */
export interface CircadianEntry {
  date: string;            // YYYY-MM-DD
  firstSunlight?: string;  // HH:MM
  firstMeal?: string;      // HH:MM
  lastMeal?: string;       // HH:MM
  caffeineCutoff?: string; // HH:MM
  screenOff?: string;      // HH:MM
}

/** Bedtime / wake routine — ordered checklist. */
export interface RoutineStep {
  id: string;
  label: string;
  icon?: string;
  doneToday?: boolean;
}
export interface BedtimeRoutine {
  windowStart: string;   // HH:MM e.g. "22:30"
  windowEnd: string;     // HH:MM e.g. "23:30"
  steps: RoutineStep[];
}
export interface WakeRoutine {
  windowStart: string;   // HH:MM
  windowEnd: string;     // HH:MM
  steps: RoutineStep[];
}

/** Daily sunlight exposure — used for Vit-D synthesis estimates. */
export interface SunlightEntry {
  id: string;
  date: string;
  minutes: number;
  timeOfDay: "morning" | "midday" | "afternoon" | "evening";
  note?: string;
}

export interface MeasurementEntry {
  id: string;
  date: string;
  /** Navy BF% inputs */
  neckCm?: number;
  waistCm?: number;
  hipCm?: number; // for women's formula
  heightCm?: number; // optional override of profile height
  /** Circumference sites (cm) */
  chestCm?: number;
  chestFlexedCm?: number;
  shoulderCm?: number;
  armLeftCm?: number;
  armRightCm?: number;
  forearmLeftCm?: number;
  forearmRightCm?: number;
  thighLeftCm?: number;
  thighRightCm?: number;
  calfLeftCm?: number;
  calfRightCm?: number;
  wristCm?: number;
  ankleCm?: number;
  /** Bodyweight snapshot (copied from Workout at log time, optional manual override) */
  weightKg?: number;
  /** Computed Navy BF% cached at save-time so historical values don't shift if constants change */
  navyBfPct?: number;
  note?: string;
}

/** Progress photo — stored as dataURL (localStorage sized; bigger sets move to IndexedDB later) */
export interface ProgressPhoto {
  id: string;
  date: string;
  /** Angles are multi-select via bit flags but exposed as tags[] for simplicity */
  tags: ProgressPhotoTag[];
  /** base64 dataURL (image/jpeg or image/png) */
  dataUrl: string;
  /** Weight + BF% stamped at time of photo (for before/after comparisons) */
  weightKg?: number;
  bfPct?: number;
  note?: string;
}
export type ProgressPhotoTag =
  | "front_relaxed" | "front_flexed"
  | "side_relaxed" | "side_flexed"
  | "back_relaxed"  | "back_flexed"
  | "progress" | "pump" | "other";
export const PROGRESS_PHOTO_LABELS: Record<ProgressPhotoTag, string> = {
  front_relaxed: "Front relaxed",
  front_flexed:  "Front flexed",
  side_relaxed:  "Side relaxed",
  side_flexed:   "Side flexed",
  back_relaxed:  "Back relaxed",
  back_flexed:   "Back flexed",
  progress:      "Progress check",
  pump:          "Post-workout pump",
  other:         "Other",
};

export interface SupplementDef {
  id: string;
  name: string;
  shortName?: string;   // 2-4 char rail label
  color?: string;       // accent hex
  doseMg?: number;
  doseUnits?: string;   // "mg" | "mcg" | "g" | "IU" | "ml"
  timeOfDay: "morning" | "preworkout" | "postworkout" | "evening" | "night" | "any";
  /** Which deficiency this supplement addresses (for risk badges). */
  addresses?: MicronutrientId[];
  notes?: string;
}
export interface SupplementLog {
  id: string;
  date: string;
  suppId: string;
  taken: boolean;
  time?: string;
  doseMg?: number;
  note?: string;
}

export type MicronutrientId =
  | "vitD" | "vitB12" | "iron" | "zinc" | "calcium" | "omega3"
  | "magnesium" | "vitC" | "folate" | "potassium";

/** Deficiency risk badge level per micronutrient, derived from food+supp+sunlight. */
export type DeficiencyLevel = "ok" | "watch" | "at_risk" | "deficient";
export interface DeficiencyBadge {
  id: MicronutrientId;
  label: string;
  level: DeficiencyLevel;
  tip: string;
  indiaPrevalence?: string; // human-readable stat for context
}

export interface VitalsEntry {
  id: string;
  date: string;
  time: string;       // HH:MM (IST)
  /** Resting heart rate (bpm), taken seated/waking preferred. */
  restingHr?: number;
  /** Systolic / diastolic BP (mmHg). */
  systolic?: number;
  diastolic?: number;
  /** Heart rate variability (ms) from watch/phone; optional. */
  hrvMs?: number;
  /** Oral / temporal temperature (°C). */
  tempC?: number;
  /** Peripheral oxygen saturation (%). */
  spo2?: number;
  /** Respiratory rate (breaths/min); optional. */
  respRate?: number;
  /** Context for this reading. */
  context?: "waking" | "pre_workout" | "post_workout" | "resting" | "bedtime" | "other";
  note?: string;
}

/** Tagged symptom — lightweight; used for daily tagging. */
export type SymptomId =
  | "headache" | "fever" | "cold_cough" | "sore_throat" | "body_ache"
  | "nausea" | "dizziness" | "fatigue" | "skin" | "digestive"
  | "joint_pain" | "cramping" | "allergies" | "other";

export interface SymptomEntry {
  id: string;
  date: string;
  symptom: SymptomId;
  severity: 1 | 2 | 3 | 4 | 5;   // 1=mild, 5=debilitating
  note?: string;
}

/** Illness episode (e.g. viral fever, food poisoning) — aggregates symptoms over dates. */
export interface IllnessEpisode {
  id: string;
  startDate: string;
  endDate?: string;               // undefined = ongoing
  label: string;                  // free text e.g. "viral fever", "dengue", "cold"
  severity: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

/** Injury log — surfaces as workout restriction (bridge to Workout). */
export interface InjuryEntry {
  id: string;
  date: string;
  bodyPart: string;               // "left shoulder", "lower back", etc.
  severity: 1 | 2 | 3 | 4 | 5;
  ongoing: boolean;               // true = currently injured; false = recovered
  /** Body region category for workout restriction suggestions. */
  category?: "shoulder" | "elbow" | "wrist" | "back" | "hip" | "knee" | "ankle" | "neck" | "other";
  notes?: string;
}

/** Medication / supplement-as-drug entry (paracetamol, antihistamine, antibiotics, etc.). */
export interface MedicationEntry {
  id: string;
  date: string;
  time?: string;
  name: string;                   // "paracetamol" / "Azithromycin" / "cetirizine"
  doseMg?: number;
  dose?: string;                  // free text for non-mg doses e.g. "1 tab", "5ml"
  type: "otc" | "rx" | "ayurveda" | "other";
  notes?: string;
}

/** Known allergy list (displayed as reference; not daily-tracked). */
export interface AllergyEntry {
  id: string;
  name: string;                   // "peanuts", "sulfa drugs", "dust mites"
  severity: "mild" | "moderate" | "severe";
  notes?: string;
}

/** Orthostatic HR test (lying → standing) — rough autonomic signal. */
export interface OrthostaticTest {
  id: string;
  date: string;
  time?: string;
  hrSupine: number;               // bpm lying down after 5 min rest
  hrStanding1min: number;         // bpm 60s after standing
  hrStanding3min?: number;        // bpm 3 min after standing
  note?: string;
}

export interface MindEntry {
  id: string;
  date: string;
  mood: number;       // 1-10 (10=amazing)
  stress: number;     // 1-10 (10=crushing)
  energy: number;     // 1-10
  anxiety?: number;   // 1-10 (10=panic)
  focus?: number;     // 1-10
  libido?: number;    // 1-5  (overtraining signal; optional)
  /** Mood context tags. */
  tags?: string[];
  note?: string;
}

/** Free-text daily journal entry (one per day; kept separate from MindEntry sliders). */
export interface JournalEntry {
  id: string;
  date: string;
  /** Free text body. */
  text: string;
  /** 3 gratitude bullets (optional but primary in Wave 5 UI). */
  gratitude?: [string?, string?, string?];
  /** Meditation minutes logged this day (mindfulness, box breathing, trataka). */
  meditationMin?: number;
  tags?: string[];
}

// ---------------- Root HealthState ----------------

export interface HealthState {
  profile: HealthProfile;
  scores: DailyScore[];
  meals: MealEntry[];
  water: WaterEntry[];
  sleep: SleepEntry[];
  measurements: MeasurementEntry[];
  photos: ProgressPhoto[];
  supplementDefs: SupplementDef[];
  supplementLog: SupplementLog[];
  vitals: VitalsEntry[];
  mind: MindEntry[];
  /** Wave 5 new collections below. */
  symptoms: SymptomEntry[];
  illnesses: IllnessEpisode[];
  injuries: InjuryEntry[];
  medications: MedicationEntry[];
  allergies: AllergyEntry[];
  orthostatic: OrthostaticTest[];
  journal: JournalEntry[];
  circadian: CircadianEntry[];
  sunlight: SunlightEntry[];
  bedtimeRoutine: BedtimeRoutine;
  wakeRoutine: WakeRoutine;
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

/** Default bedtime routine tuned for a Chennai lifter on a college+gym schedule. */
export const DEFAULT_BEDTIME_ROUTINE: BedtimeRoutine = {
  windowStart: "22:30",
  windowEnd:   "23:30",
  steps: [
    { id: "bt1", label: "Last caffeine cut-off (3pm hard stop)" },
    { id: "bt2", label: "Phone on night shift / warm light" },
    { id: "bt3", label: "Magnesium + Ashwagandha" },
    { id: "bt4", label: "Cold / lukewarm shower" },
    { id: "bt5", label: "5 min stretch + box breathing" },
    { id: "bt6", label: "Read (no screens) 10 min" },
  ],
};

/** Default wake routine tuned for early morning lifter / college student. */
export const DEFAULT_WAKE_ROUTINE: WakeRoutine = {
  windowStart: "06:00",
  windowEnd:   "07:00",
  steps: [
    { id: "wk1", label: "Get 5-10 min sunlight within 30 min of waking" },
    { id: "wk2", label: "Hydrate (500ml water + pinch salt)" },
    { id: "wk3", label: "Creatine 5g" },
    { id: "wk4", label: "Review today's training + macros" },
    { id: "wk5", label: "10 min movement / mobility" },
  ],
};

/** Seeded starter supplement stack for a 20yo Indian male lifter in Chennai. */
export const SEED_SUPPLEMENT_DEFS: SupplementDef[] = [
  { id: "whey",      name: "Whey Protein",     shortName: "WHEY", color: "#f59e0b", doseMg: 30000, doseUnits: "g",  timeOfDay: "postworkout", addresses: [], notes: "25-30g scoop with milk/water post lift" },
  { id: "creatine",  name: "Creatine Monohydrate", shortName: "CRE",  color: "#ef4444", doseMg: 5000,  doseUnits: "g",  timeOfDay: "morning", addresses: [], notes: "5g daily, any time, don't load" },
  { id: "multivit",  name: "Multivitamin",     shortName: "MVT",  color: "#10b981", doseMg: 1,     doseUnits: "tab",timeOfDay: "morning", addresses: ["vitB12","zinc","folate"], notes: "With breakfast" },
  { id: "vitd3",     name: "Vitamin D3",       shortName: "D3",   color: "#fbbf24", doseMg: 1000,  doseUnits: "IU", timeOfDay: "morning", addresses: ["vitD"], notes: "Chennai indoor life = high deficiency risk" },
  { id: "b12",       name: "Vitamin B12",      shortName: "B12",  color: "#a78bfa", doseMg: 1.5,   doseUnits: "mcg",timeOfDay: "morning", addresses: ["vitB12"], notes: "Vegetarian/veg risk" },
  { id: "omega3",    name: "Omega-3 Fish Oil", shortName: "OMG3", color: "#06b6d4", doseMg: 1000,  doseUnits: "mg", timeOfDay: "evening", addresses: ["omega3"], notes: "1g EPA+DHA with dinner" },
  { id: "magnesium", name: "Magnesium Glycinate", shortName: "MG", color: "#84cc16", doseMg: 300,   doseUnits: "mg", timeOfDay: "night",   addresses: ["magnesium"], notes: "300-400mg before bed" },
  { id: "zinc",      name: "Zinc",             shortName: "ZN",   color: "#64748b", doseMg: 15,    doseUnits: "mg", timeOfDay: "evening", addresses: ["zinc"], notes: "15-30mg, not with coffee" },
  { id: "calcium",   name: "Calcium",          shortName: "CA",   color: "#f472b6", doseMg: 500,   doseUnits: "mg", timeOfDay: "evening", addresses: ["calcium"], notes: "If milk intake is low" },
  { id: "ashwa",     name: "Ashwagandha",      shortName: "ASH",  color: "#22d3ee", doseMg: 600,   doseUnits: "mg", timeOfDay: "night",   addresses: [], notes: "KSM-66 preferred, take ~1hr before bed" },
  { id: "preworkout",name: "Pre-workout",      shortName: "PRE",  color: "#ec4899", doseMg: 1,     doseUnits: "scoop", timeOfDay: "preworkout", addresses: [], notes: "Avoid within 6hrs of bed" },
  { id: "eaa",       name: "EAA / BCAA",       shortName: "EAA",  color: "#3b82f6", doseMg: 10000, doseUnits: "g",  timeOfDay: "preworkout", addresses: [], notes: "Intra-workout optional" },
  { id: "probiotic", name: "Probiotic",        shortName: "PRO",  color: "#fb923c", doseMg: 10,    doseUnits: "B CFU", timeOfDay: "morning", addresses: [], notes: "With breakfast on empty-ish stomach" },
];

/** Indian deficiency prevalence context (ICMR 2019-2024 urban south India surveys). */
export const INDIAN_DEFICIENCY_CONTEXT: Record<MicronutrientId, { label: string; prevalence: string; tip: string; }> = {
  vitD:     { label: "Vitamin D",   prevalence: "76-90% urban Indian adults insufficient (ICMR/NIN 2020)", tip: "10-30 min unprotected midday sun most days; consider D3 1000-2000 IU/d." },
  vitB12:   { label: "Vitamin B12", prevalence: "40-50% vegetarians deficient",                             tip: "B12 1.5mcg/d or fortified foods; get tested if fatigue/tingling." },
  iron:     { label: "Iron",        prevalence: "~30% young adult males marginal/low ferritin",            tip: "Red meat, leafy greens, lemon juice for absorption." },
  zinc:     { label: "Zinc",        prevalence: "~25% Indian adults low intake",                           tip: "Pumpkin seeds, chicken, legumes; 15mg supp if low." },
  calcium:  { label: "Calcium",     prevalence: "~40% below RDA (600mg/d)",                                tip: "Milk/curd/paneer, ragi, sesame; 500mg supp if dairy <2 servings." },
  omega3:   { label: "Omega-3",     prevalence: "Very low in Indian diets <100mg EPA+DHA/d vs 250mg RDA", tip: "Fatty fish 2x/week or 1g fish oil." },
  magnesium:{ label: "Magnesium",   prevalence: "Sub-optimal in ~30% with processed/grain-heavy diets",    tip: "Nuts, dark chocolate, greens; 300mg glycinate at night." },
  vitC:     { label: "Vitamin C",   prevalence: "Usually adequate with fruit/veg; seasonal dips",          tip: "1 amla = ~600mg; lime, guava, oranges." },
  folate:   { label: "Folate",      prevalence: "~20-30% marginal (esp. non-veg low)",                     tip: "Leafy greens, lentils, fortified cereals." },
  potassium:{ label: "Potassium",   prevalence: "Often low in high-sodium restaurant diets",               tip: "Coconut water, banana, sweet potato post-workout." },
};

export function emptyHealthState(): HealthState {
  return {
    profile: { ...DEFAULT_PROFILE },
    scores: [],
    meals: [],
    water: [],
    sleep: [],
    measurements: [],
    photos: [],
    supplementDefs: SEED_SUPPLEMENT_DEFS.map(s => ({ ...s })),
    supplementLog: [],
    vitals: [],
    mind: [],
    symptoms: [],
    illnesses: [],
    injuries: [],
    medications: [],
    allergies: [],
    orthostatic: [],
    journal: [],
    circadian: [],
    sunlight: [],
    bedtimeRoutine: JSON.parse(JSON.stringify(DEFAULT_BEDTIME_ROUTINE)),
    wakeRoutine: JSON.parse(JSON.stringify(DEFAULT_WAKE_ROUTINE)),
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
