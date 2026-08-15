/**
 * Health analytics — pure math helpers.
 *
 * Wave 1: BMR / TDEE / BMI / water goal.
 * Wave 2: protein target.
 * Wave 3: sleep bank, sleep score, hygiene score, adherence, deficiency risk.
 *
 * NOTE: this file may import from workoutAnalytics (e.g. Epley 1RM for S:W
 * ratios) but workoutAnalytics MUST NOT import from here — that would
 * create a circular dependency.
 */

import type {
  ActivityLevel, Gender, HealthProfile, HealthState,
  SleepEntry, SleepHygieneTick, SupplementDef, SupplementLog,
  MealEntry, SunlightEntry, DeficiencyBadge, MicronutrientId, DeficiencyLevel,
  MeasurementEntry, VitalsEntry, MindEntry, InjuryEntry, SymptomEntry,
  JournalEntry, OrthostaticTest,
} from "./healthTypes";
import { INDIAN_DEFICIENCY_CONTEXT } from "./healthTypes";

// ---------------- BMR / TDEE / BMI ----------------

/** Mifflin-St Jeor BMR (men, metric). */
export function bmrMifflin(weightKg: number, heightCm: number, ageYears: number, gender: Gender = "male"): number {
  const genderAdj = gender === "male" ? 5 : -161;
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + genderAdj;
}

/** Katch-McArdle BMR (preferred when BF% is known). */
export function bmrKatch(lbmKg: number): number {
  return 370 + 21.6 * lbmKg;
}

/** Activity multiplier table (ACSM / standard). */
export const ACTIVITY_MULT: Record<ActivityLevel, number> = {
  sedentary:    1.20,
  light:        1.375,
  moderate:     1.55,
  active:       1.725,
  very_active:  1.90,
};

/** TDEE using BMR × activity multiplier. */
export function tdee(weightKg: number, p: HealthProfile): number {
  return bmrMifflin(weightKg, p.heightCm, p.ageYears, p.gender) * ACTIVITY_MULT[p.activityLevel];
}

/** BMI (kg/m²). */
export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/**
 * Dynamic water goal in ml.
 *  - Base: 35 ml × weight_kg (EFSA baseline)
 *  - Multiplied by climateMult (1.1 Chennai default)
 *  - workoutAdj: +500ml per 30 minutes of logged exercise today
 * Wave 1: workoutAdj = 0 until sync is wired (wave 7).
 */
export function waterGoalMl(weightKg: number, climateMult = 1.1, workoutAdjMl = 0): number {
  return Math.round(weightKg * 35 * climateMult + workoutAdjMl);
}

/** Protein target grams per day (ACSM baseline; refined by phase in wave 7). */
export function proteinTargetG(weightKg: number): number {
  return Math.round(weightKg * 1.8); // moderate default for trained 20yo
}

// ---------------- Formatters ----------------

export function formatKcal(k: number): string {
  return `${Math.round(k).toLocaleString()} kcal`;
}

export function formatHours(h: number): string {
  const hrs = Math.floor(h);
  const m = Math.round((h - hrs) * 60);
  return m > 0 ? `${hrs}h ${m}m` : `${hrs}h`;
}

export function formatMl(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(2)} L`;
  return `${Math.round(ml)} ml`;
}

// ---------------- Sleep ----------------

/**
 * Compute duration in hours between two ISO datetimes or HH:MM times.
 * We treat end < start as crossing midnight (e.g. 23:00 -> 07:00 = 8h).
 */
export function durationHours(bedIso: string, wakeIso: string): number {
  const b = new Date(bedIso).getTime();
  const w = new Date(wakeIso).getTime();
  if (!isFinite(b) || !isFinite(w) || w <= b) return 0;
  return (w - b) / 3_600_000;
}

/**
 * Sleep bank — rolling debt/credit capped at [-20h, +10h].
 *  - credit for any night above ideal (capped at +2h/night before overflow reservoir)
 *  - debit for any night below ideal
 *  - credit accrues at 0.5× the surplus (you can't "bank" surplus as efficiently
 *    as you incur debt; this is evidence-based from sleep extension studies).
 *  - returns signed hours (negative = debt, positive = credit)
 */
export const SLEEP_BANK_MIN = -20;
export const SLEEP_BANK_MAX = 10;
export const SLEEP_DEBT_WARN = 5;   // soft nudge threshold
export const SLEEP_DEBT_STRONG = 10; // deload/push to workout

export function computeSleepBank(entries: SleepEntry[], idealHours: number, lastN = 14): number {
  const sorted = [...entries]
    .filter(e => e.durationHours > 0 && e.durationHours < 16)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-lastN);
  let bank = 0;
  for (const e of sorted) {
    const delta = e.durationHours - idealHours;
    if (delta < 0) bank += delta;              // debit 1:1
    else bank += Math.min(delta * 0.5, 1.0);   // credit 0.5×, capped +1h/night
    bank = Math.max(SLEEP_BANK_MIN, Math.min(SLEEP_BANK_MAX, bank));
  }
  return Math.round(bank * 10) / 10;
}

/** Sleep score 0-1 combining duration vs ideal and quality rating. */
export function sleepScore(entry: SleepEntry | undefined, idealHours: number): number {
  if (!entry) return 0;
  const durFrac = Math.min(1, entry.durationHours / idealHours);
  const qualFrac = (entry.quality ?? 5) / 10;
  // 60% duration, 40% subjective quality
  return Math.max(0, Math.min(1, 0.6 * durFrac + 0.4 * qualFrac));
}

/** Sleep hygiene score 0-10 from a tick map. */
export function hygieneScore(tick?: SleepHygieneTick): number {
  if (!tick) return 0;
  const KEYS: (keyof SleepHygieneTick)[] = [
    "noCaffeineAfter14","noScreensBeforeBed","darkRoom","coolRoom",
    "consistentSchedule","noHeavyMealLate","noAlcohol","exercisedToday",
    "sunlightMorning","relaxedBeforeBed",
  ];
  const hits = KEYS.reduce((n, k) => n + (tick[k] ? 1 : 0), 0);
  return Math.round((hits / KEYS.length) * 10);
}

/** Adherence % for a routine step list (0-100). */
export function routineAdherence(steps: { doneToday?: boolean }[]): number {
  if (steps.length === 0) return 0;
  const done = steps.filter(s => s.doneToday).length;
  return Math.round((done / steps.length) * 100);
}

/** Average sleep over last N days (0 if none). */
export function avgSleepHours(entries: SleepEntry[], lastN = 7): number {
  const sorted = [...entries].filter(e=>e.durationHours>0).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,lastN);
  if (sorted.length===0) return 0;
  return sorted.reduce((s,e)=>s+e.durationHours,0)/sorted.length;
}

// ---------------- Adherence / supplements ----------------

/**
 * Compute per-supplement streak (consecutive days taken up to today).
 * Returns a map of suppId -> streak count (0 if not taken today).
 */
export function supplementStreaks(logs: SupplementLog[]): Record<string, number> {
  const streaks: Record<string, number> = {};
  const bySupp: Record<string, string[]> = {};
  for (const l of logs) {
    if (!l.taken) continue;
    (bySupp[l.suppId] ||= []).push(l.date);
  }
  for (const [id, dates] of Object.entries(bySupp)) {
    const set = new Set(dates);
    let streak = 0;
    const d = new Date();
    // walk backwards
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0,10);
      if (set.has(key)) { streak++; d.setDate(d.getDate()-1); }
      else break;
    }
    streaks[id] = streak;
  }
  return streaks;
}

/** Adherence % over last N days for all supps or a single supp. */
export function supplementAdherence(logs: SupplementLog[], suppId: string | null, lastN = 30): number {
  const d = new Date();
  const days: string[] = [];
  for (let i=0;i<lastN;i++){ days.push(d.toISOString().slice(0,10)); d.setDate(d.getDate()-1); }
  const daySet = new Set(days);
  const taken = new Set<string>();
  for (const l of logs) {
    if (!l.taken) continue;
    if (suppId && l.suppId !== suppId) continue;
    if (daySet.has(l.date)) taken.add(l.date);
  }
  return Math.round((taken.size / lastN) * 100);
}

// ---------------- Deficiency badges ----------------
/**
 * Heuristic deficiency risk. We don't pretend this is a blood test — the badges
 * are "intake sufficiency signals" based on logged food macros and taken supps
 * over the last 7 days. Real bloodwork always wins (future wave).
 *
 * Scoring is intentionally conservative: most young Indian men are at least
 * "watch" for D3/B12/omega3 if they don't supplement, per ICMR prevalence.
 */

const MICRO_DAILY_TARGETS: Record<MicronutrientId, number> = {
  vitD:      600,    // IU — can't really come from food in India; sun/supp needed
  vitB12:    2.4,    // mcg
  iron:      19,     // mg (RDA for young male is 19mg / ICMR 2020)
  zinc:      12,     // mg
  calcium:   600,    // mg
  omega3:    250,    // mg EPA+DHA
  magnesium: 420,    // mg
  vitC:      80,     // mg
  folate:    300,    // mcg DFE
  potassium: 3500,   // mg
};

/** Approximate micronutrient contribution per food (very rough; wave-8 replaces with detailed DB). */
const FOOD_MICRO_HINTS: Record<string, Partial<Record<MicronutrientId, number>>> = {
  // dairy
  milk:          { calcium: 240, vitB12: 0.9, vitD: 100 },
  curd:          { calcium: 180, vitB12: 0.5 },
  paneer:        { calcium: 200 },
  lassi:         { calcium: 200 },
  // fish/meat
  "fish curry":           { omega3: 400, vitD: 300, vitB12: 2.0 },
  "chicken curry":        { iron: 1.5, zinc: 2.0, vitB12: 0.3 },
  "chicken 65":           { iron: 1.5, zinc: 2.0, vitB12: 0.3 },
  "chicken breast":       { iron: 1.0, zinc: 1.5, vitB12: 0.3 },
  "grilled chicken":      { iron: 1.0, zinc: 1.5, vitB12: 0.3 },
  "egg curry":            { vitD: 200, vitB12: 1.0, iron: 1.2 },
  omelette:               { vitD: 200, vitB12: 1.0 },
  "egg bhurji":           { vitD: 180, vitB12: 0.9 },
  // rice/veg/legumes
  "dal tadka":            { iron: 2.5, zinc: 1.5, folate: 80, potassium: 300 },
  "dal":                  { iron: 2.0, zinc: 1.2, folate: 70, potassium: 280 },
  sambhar:                { iron: 2.0, folate: 60, potassium: 350 },
  rasam:                  { potassium: 300, vitC: 10 },
  idli:                   { iron: 1.0, folate: 15 },
  dosa:                   { iron: 1.2 },
  chole:                  { iron: 3.0, zinc: 1.8, folate: 100 },
  rajma:                  { iron: 3.0, zinc: 1.5, folate: 90, potassium: 500 },
  palak:                  { iron: 4.0, folate: 120, vitC: 20 },
  "palak paneer":         { iron: 4.0, calcium: 250, folate: 120, vitC: 20 },
  "aloo paratha":         { iron: 1.0 },
  "fruit chaat":          { vitC: 25, potassium: 400 },
  banana:                 { potassium: 400, vitC: 10 },
  orange:                 { vitC: 50, folate: 30 },
  guava:                  { vitC: 200, folate: 30, potassium: 400 },
  mango:                  { vitC: 30 },
  lemon:                  { vitC: 30 },
  amla:                   { vitC: 600 },
  // drinks/supps
  "filter coffee":        { magnesium: 5 },
  chai:                   { magnesium: 5 },
  "coconut water":        { potassium: 600, magnesium: 25 },
  "whey protein":         { calcium: 100 },
  "whey":                 { calcium: 100 },
};

const SUPP_MICRO_DOSE: Record<string, Partial<Record<MicronutrientId, number>>> = {
  vitd3:     { vitD: 1000 },
  b12:       { vitB12: 1.5 },
  omega3:    { omega3: 1000 },
  zinc:      { zinc: 15 },
  calcium:   { calcium: 500 },
  magnesium: { magnesium: 300 },
  multivit:  { vitB12: 1.5, zinc: 10, folate: 200, vitC: 60, iron: 5, vitD: 400 },
};

/**
 * Compute deficiency risk badges from the last 7 days of meals/supps + sunlight.
 */
export function computeDeficiencyBadges(
  state: Pick<HealthState, "meals"|"supplementLog"|"sunlight">,
): DeficiencyBadge[] {
  const today = new Date();
  const days: string[] = [];
  const d = new Date(today);
  for (let i=0;i<7;i++){ days.push(d.toISOString().slice(0,10)); d.setDate(d.getDate()-1); }
  const daySet = new Set(days);

  // Aggregate micro totals over the 7-day window
  const totals: Record<MicronutrientId, number> = {
    vitD:0, vitB12:0, iron:0, zinc:0, calcium:0, omega3:0,
    magnesium:0, vitC:0, folate:0, potassium:0,
  };

  // Food contributions — very rough keyword match
  for (const m of state.meals) {
    if (!daySet.has(m.date)) continue;
    for (const it of m.items) {
      const lname = it.name.toLowerCase();
      for (const [key, micros] of Object.entries(FOOD_MICRO_HINTS)) {
        if (lname.includes(key)) {
          for (const [mk, mv] of Object.entries(micros) as [MicronutrientId, number][]) {
            if (mk in totals && typeof mv === "number") totals[mk] += mv;
          }
        }
      }
    }
  }
  // Supplement contributions
  for (const l of state.supplementLog) {
    if (!l.taken) continue;
    if (!daySet.has(l.date)) continue;
    const d_ = SUPP_MICRO_DOSE[l.suppId];
    if (!d_) continue;
    for (const [mk, mv] of Object.entries(d_) as [MicronutrientId, number][]) {
      totals[mk] += mv;
    }
  }
  // Sunlight → Vit D: 10min midday Indian sun ≈ 1000 IU synthesis (very rough).
  const sunMinutes = state.sunlight.filter(s => daySet.has(s.date)).reduce((n,s)=>n+s.minutes, 0);
  totals.vitD += Math.min(3000, sunMinutes * 80); // cap at 3000 IU / week to avoid over-claiming

  const badges: DeficiencyBadge[] = [];
  const MICROS: MicronutrientId[] = ["vitD","vitB12","iron","zinc","calcium","omega3","magnesium","vitC","folate","potassium"];
  for (const mk of MICROS) {
    const target7 = MICRO_DAILY_TARGETS[mk] * 7;
    const frac = totals[mk] / target7;
    let level: DeficiencyLevel;
    if (frac >= 0.9) level = "ok";
    else if (frac >= 0.6) level = "watch";
    else if (frac >= 0.3) level = "at_risk";
    else level = "deficient";
    const ctx = INDIAN_DEFICIENCY_CONTEXT[mk];
    badges.push({
      id: mk,
      label: ctx.label,
      level,
      tip: ctx.tip,
      indiaPrevalence: ctx.prevalence,
    });
  }
  return badges;
}

/** Convenience: is any critical badge at "deficient" or "at_risk"? */
export function hasDeficiencyRisk(badges: DeficiencyBadge[]): boolean {
  return badges.some(b => b.level === "deficient" || b.level === "at_risk");
}

// ---------------- Physique / body composition ----------------

/**
 * US Navy body-fat %, men (metric).
 *   BF% = 495 / (1.0324 − 0.19077·log10(waist−neck) + 0.15456·log10(height)) − 450
 * Waist measured at navel, neck at narrowest point, both in cm. Height in cm.
 * Standard error ±3-4% vs DEXA; fine for trend tracking.
 */
export function navyBF_m(waistCm: number, neckCm: number, heightCm: number): number {
  if (!(waistCm > neckCm) || waistCm <= 0 || neckCm <= 0 || heightCm <= 0) return 0;
  const denom = 1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm);
  return Math.max(3, Math.min(50, 495 / denom - 450));
}

/** US Navy body-fat %, women (metric) — hip included. Stored but gated behind gender flag. */
export function navyBF_f(waistCm: number, neckCm: number, hipCm: number, heightCm: number): number {
  if (!(waistCm > neckCm) || hipCm <= 0) return 0;
  const denom = 1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(heightCm);
  return Math.max(8, Math.min(55, 495 / denom - 450));
}

/** Lean body mass (kg) */
export function lbmKg(weightKg: number, bfPct: number): number {
  return weightKg * (1 - bfPct / 100);
}
/** Fat mass (kg) */
export function fatMassKg(weightKg: number, bfPct: number): number {
  return weightKg * bfPct / 100;
}

/** BMI category for display (lifter caveat appended in UI). */
export function bmiCategory(bmiVal: number): { label: string; color: string; caveat?: string } {
  if (bmiVal < 18.5) return { label: "Underweight", color: "#60a5fa" };
  if (bmiVal < 25)   return { label: "Normal",    color: "#10b981" };
  if (bmiVal < 30)   return { label: "Overweight",color: "#f59e0b", caveat: "Lifters often land here from lean mass" };
  return { label: "Obese", color: "#ef4444", caveat: "Lifters with thick builds may false-flag" };
}

/**
 * Strength-to-weight ratio classification by bodyweight multiples (men, untrained→elite).
 * Standards approximate (kg/kg), based on Lon Kilgore / Mark Rippetoe / ExRx tiered
 * tables for 18-35yo natural lifters.
 */
export const SW_STANDARDS: Record<string, { beginner: number; intermediate: number; advanced: number; elite: number }> = {
  back_squat:    { beginner: 0.75, intermediate: 1.25, advanced: 1.75, elite: 2.5 },
  bench_press:   { beginner: 0.55, intermediate: 0.95, advanced: 1.35, elite: 1.8 },
  deadlift:      { beginner: 0.9,  intermediate: 1.5,  advanced: 2.2,  elite: 3.0 },
  overhead_press:{ beginner: 0.35, intermediate: 0.55, advanced: 0.75, elite: 1.05 },
  pullup:        { beginner: 0,    intermediate: 5,    advanced: 12,   elite: 20 }, // reps not BW ratio
};

export function strengthClass(ratioOrReps: number, tableKey: keyof typeof SW_STANDARDS): { tier: string; color: string } {
  const s = SW_STANDARDS[tableKey];
  if (!s) return { tier: "—", color: "#64748b" };
  if (tableKey === "pullup") {
    if (ratioOrReps >= s.elite) return { tier: "Elite", color: "#fbbf24" };
    if (ratioOrReps >= s.advanced) return { tier: "Advanced", color: "#a78bfa" };
    if (ratioOrReps >= s.intermediate) return { tier: "Intermediate", color: "#10b981" };
    return { tier: "Beginner", color: "#64748b" };
  }
  if (ratioOrReps >= s.elite) return { tier: "Elite", color: "#fbbf24" };
  if (ratioOrReps >= s.advanced) return { tier: "Advanced", color: "#a78bfa" };
  if (ratioOrReps >= s.intermediate) return { tier: "Intermediate", color: "#10b981" };
  if (ratioOrReps >= s.beginner) return { tier: "Novice", color: "#60a5fa" };
  return { tier: "Beginner", color: "#64748b" };
}

/** Waist-to-height ratio (central adiposity proxy). Ratio <0.5 healthy; >0.6 high risk. */
export function whtr(waistCm: number, heightCm: number): number {
  if (!heightCm) return 0;
  return waistCm / heightCm;
}

/** Asymmetry flag: if L-R difference in any pair exceeds 1.0cm, returns list of offending pairs. */
export interface Asymmetry { site: string; diff: number; }
export function detectAsymmetries(m: MeasurementEntry): Asymmetry[] {
  const out: Asymmetry[] = [];
  const pairs: [string, number|undefined, number|undefined][] = [
    ["Arms",    m.armLeftCm,     m.armRightCm],
    ["Forearms",m.forearmLeftCm, m.forearmRightCm],
    ["Thighs",  m.thighLeftCm,   m.thighRightCm],
    ["Calves",  m.calfLeftCm,    m.calfRightCm],
  ];
  for (const [site, l, r] of pairs) {
    if (l != null && r != null) {
      const diff = Math.abs(l - r);
      if (diff >= 1.0) out.push({ site, diff: Math.round(diff*10)/10 });
    }
  }
  return out;
}

/** Latest measurement entry (by date) or undefined. */
export function latestMeasurement(entries: MeasurementEntry[]): MeasurementEntry | undefined {
  if (!entries.length) return undefined;
  return [...entries].sort((a,b)=>b.date.localeCompare(a.date))[0];
}

/**
 * Resolve current BF%: latest measurement's navyBfPct if present, else compute
 * from latest measurements + profile height. Returns 0 if insufficient data.
 */
export function currentBfPct(entries: MeasurementEntry[], heightCm: number): number {
  const last = latestMeasurement(entries);
  if (!last) return 0;
  if (last.navyBfPct != null && last.navyBfPct > 0) return last.navyBfPct;
  if (last.waistCm != null && last.neckCm != null) {
    return navyBF_m(last.waistCm, last.neckCm, last.heightCm ?? heightCm);
  }
  return 0;
}

// ---------------- Recovery / workout-advisory flags (wave 3 light; deeper in wave 7) ----------------

/** Simple recovery-readiness 0-1, combining sleep bank + last night + hydration.
 *  Returns 0 when no sleep entries exist (no data = no recovery signal).
 */
export function recoveryScore(
  sleepEntries: SleepEntry[],
  idealHours: number,
  hydrationPct: number,
): number {
  if (!sleepEntries || sleepEntries.length === 0) return 0;
  const last = [...sleepEntries].sort((a,b)=>b.date.localeCompare(a.date))[0];
  if (!last) return 0;
  const lastScore = sleepScore(last, idealHours);
  const bank = computeSleepBank(sleepEntries, idealHours);
  const bankNorm = Math.max(0, Math.min(1, 1 - Math.max(0, -bank) / SLEEP_DEBT_STRONG));
  return Math.round((0.5 * lastScore + 0.3 * bankNorm + 0.2 * Math.min(1, hydrationPct/100)) * 100) / 100;
}

/** Should we push a deload hint to Workout? */
export function shouldDeload(sleepEntries: SleepEntry[], idealHours: number): boolean {
  const bank = computeSleepBank(sleepEntries, idealHours);
  return bank <= -SLEEP_DEBT_STRONG;
}

// ---------------- Vitals ----------------

/**
 * AHA 2024 BP categories for adults (systolic/diastolic mmHg).
 *   Normal:        <120 / <80
 *   Elevated:      120-129 / <80
 *   Stage 1 HTN:   130-139 / 80-89
 *   Stage 2 HTN:   ≥140 / ≥90
 *   Hypertensive Crisis: ≥180 / ≥120 — seek emergency care
 */
export type BpCategory =
  | "normal" | "elevated" | "stage1" | "stage2" | "crisis" | "unknown";

export function classifyBp(sys?: number, dia?: number): { cat: BpCategory; color: string; label: string; warn: boolean } {
  if (sys == null || dia == null || sys <= 0 || dia <= 0) {
    return { cat: "unknown", color: "#64748b", label: "—", warn: false };
  }
  if (sys >= 180 || dia >= 120) return { cat: "crisis",   color: "#dc2626", label: "Hypertensive crisis — seek care", warn: true };
  if (sys >= 140 || dia >= 90)   return { cat: "stage2",   color: "#ef4444", label: "Stage 2 Hypertension",            warn: true };
  if (sys >= 130 || dia >= 80)   return { cat: "stage1",   color: "#f59e0b", label: "Stage 1 Hypertension",            warn: true };
  if (sys >= 120)                return { cat: "elevated", color: "#f59e0b", label: "Elevated",                       warn: false };
  return { cat: "normal", color: "#10b981", label: "Normal", warn: false };
}

/** Fever flag thresholds (°C, oral/temporal). <36 low, 37.5-38 low-grade, 38+ fever, 39+ high, 40+ emergency. */
export function classifyTemp(tempC?: number): { label: string; color: string; warn: boolean } {
  if (tempC == null) return { label: "—", color: "#64748b", warn: false };
  if (tempC >= 40)   return { label: "≥40°C — emergency",       color: "#dc2626", warn: true };
  if (tempC >= 39)   return { label: "High fever (≥39°C)",      color: "#ef4444", warn: true };
  if (tempC >= 38)   return { label: "Fever (≥38°C)",           color: "#f59e0b", warn: true };
  if (tempC >= 37.5) return { label: "Low-grade fever",         color: "#f59e0b", warn: false };
  if (tempC < 35.5)  return { label: "Hypothermic (<35.5°C)",   color: "#60a5fa", warn: true };
  if (tempC < 36)    return { label: "Low",                     color: "#60a5fa", warn: false };
  return { label: "Normal", color: "#10b981", warn: false };
}

/** SpO2 classification. ≥95 normal, 94 borderline, <94 seek eval; <90 emergency. */
export function classifySpo2(spo2?: number): { label: string; color: string; warn: boolean } {
  if (spo2 == null) return { label: "—", color: "#64748b", warn: false };
  if (spo2 >= 99)   return { label: "Excellent (≥99%)", color: "#10b981", warn: false };
  if (spo2 >= 95)   return { label: "Normal (≥95%)",    color: "#10b981", warn: false };
  if (spo2 >= 94)   return { label: "Borderline (94%)", color: "#f59e0b", warn: false };
  if (spo2 >= 90)   return { label: "Low (<94%) — check", color: "#f59e0b", warn: true };
  return { label: "Critical (<90%) — seek emergency", color: "#dc2626", warn: true };
}

/** Resting HR classification (bpm, adult male). ~60-70 fit, <50 athletic normal, >100 tachy. */
export function classifyRhr(hr?: number): { label: string; color: string; warn: boolean } {
  if (hr == null) return { label: "—", color: "#64748b", warn: false };
  if (hr >= 120) return { label: "Very high (≥120)", color: "#dc2626", warn: true };
  if (hr >= 100) return { label: "Tachycardic (≥100)", color: "#ef4444", warn: true };
  if (hr >= 85)  return { label: "Elevated (≥85)",  color: "#f59e0b", warn: false };
  if (hr >= 60)  return { label: "Normal (60-84)",  color: "#10b981", warn: false };
  if (hr >= 50)  return { label: "Athletic (50-59)", color: "#10b981", warn: false };
  if (hr >= 40)  return { label: "Bradycardic (40-49)", color: "#60a5fa", warn: false };
  return { label: "Very low (<40) — check", color: "#ef4444", warn: true };
}

/** Latest vitals entry by date+time. */
export function latestVitals(entries: VitalsEntry[]): VitalsEntry | undefined {
  if (!entries.length) return undefined;
  return [...entries].sort((a,b) => (b.date + "T" + (b.time||"00:00")).localeCompare(a.date + "T" + (a.time||"00:00")))[0];
}

/** Average RHR over last N days (one reading per day — the first "waking" or earliest). */
export function avgRhr(entries: VitalsEntry[], lastN = 7): number {
  const byDay: Record<string, number> = {};
  for (const v of entries) {
    if (v.restingHr == null) continue;
    if (!byDay[v.date] || v.context === "waking") byDay[v.date] = v.restingHr;
  }
  const dates = Object.keys(byDay).sort().slice(-lastN);
  if (dates.length === 0) return 0;
  return Math.round(dates.reduce((s,d)=>s+byDay[d],0)/dates.length);
}

// ---------------- Mind / burnout ----------------

/** Average of a mind-metric over last N days (0 if none). */
export function avgMind(entries: MindEntry[], key: keyof MindEntry, lastN = 7): number {
  const sorted = [...entries].filter(e => typeof e[key] === "number").sort((a,b)=>b.date.localeCompare(a.date)).slice(0,lastN);
  if (sorted.length === 0) return 0;
  return sorted.reduce((s,e)=>s + (e[key] as number), 0) / sorted.length;
}

/** Today's mind entry if it exists. */
export function todayMind(entries: MindEntry[]): MindEntry | undefined {
  const today = new Date().toISOString().slice(0,10);
  return entries.find(e => e.date === today);
}

/**
 * Burnout / overtraining heuristic — evidence-based combo for young lifters.
 * Triggers a yellow/red flag when MULTIPLE of these align over the last 7-14d:
 *  - Sleep bank ≤ -10h (red) / ≤ -5h (yellow contributor)
 *  - RHR elevated ≥5 bpm above 14d baseline (yellow) / ≥8 bpm (red)
 *  - Mood avg ≤4/10 (yellow) / ≤3/10 (red)
 *  - Motivation approximated by energy+focus avg ≤4
 *  - Libido ≤2/5 (yellow) / ≤1 (red)
 *  - Any active injury with severity ≥3 (yellow)
 * Scoring: 1 point per yellow signal, 2 per red; score ≥3 = warn, ≥5 = overtraining/deload.
 */
export interface BurnoutResult {
  score: number;       // 0-10
  level: "ok" | "watch" | "warn" | "overtraining";
  color: string;
  signals: string[];
}
export function burnoutHeuristic(args: {
  sleepEntries: SleepEntry[]; idealHours: number;
  vitals: VitalsEntry[];
  mind: MindEntry[];
  injuries: InjuryEntry[];
}): BurnoutResult {
  const { sleepEntries, idealHours, vitals, mind, injuries } = args;
  const signals: { text: string; weight: 1|2 }[] = [];

  // Sleep
  const bank = computeSleepBank(sleepEntries, idealHours);
  if (bank <= -SLEEP_DEBT_STRONG) signals.push({ text: `Sleep bank ${bank.toFixed(1)}h (debt ≥10h)`, weight: 2 });
  else if (bank <= -SLEEP_DEBT_WARN) signals.push({ text: `Sleep bank ${bank.toFixed(1)}h (debt ≥5h)`, weight: 1 });

  // RHR elevation — compare last 7d avg vs prior 14d avg
  const last7 = [...vitals].filter(v => v.restingHr != null).sort((a,b)=>b.date.localeCompare(a.date));
  const last7Days = new Set<string>();
  { const d = new Date(); for (let i=0;i<7;i++){ last7Days.add(d.toISOString().slice(0,10)); d.setDate(d.getDate()-1); } }
  const prev14Days = new Set<string>();
  { const d = new Date(); d.setDate(d.getDate()-7); for (let i=0;i<14;i++){ prev14Days.add(d.toISOString().slice(0,10)); d.setDate(d.getDate()-1); } }
  const recent = last7.filter(v => last7Days.has(v.date)).map(v => v.restingHr!).filter(Boolean);
  const prev   = last7.filter(v => prev14Days.has(v.date)).map(v => v.restingHr!).filter(Boolean);
  if (recent.length >= 3 && prev.length >= 3) {
    const rAvg = recent.reduce((s,x)=>s+x,0)/recent.length;
    const pAvg = prev.reduce((s,x)=>s+x,0)/prev.length;
    const delta = rAvg - pAvg;
    if (delta >= 8) signals.push({ text: `RHR elevated +${Math.round(delta)} bpm`, weight: 2 });
    else if (delta >= 5) signals.push({ text: `RHR up +${Math.round(delta)} bpm vs baseline`, weight: 1 });
  }

  // Mood
  const mood7 = avgMind(mind, "mood", 7);
  if (mood7 > 0 && mood7 <= 3) signals.push({ text: `Mood avg ${mood7.toFixed(1)}/10 (very low)`, weight: 2 });
  else if (mood7 > 0 && mood7 <= 4) signals.push({ text: `Mood avg ${mood7.toFixed(1)}/10 (low)`, weight: 1 });

  // Motivation = avg(energy, focus)
  const energy = avgMind(mind, "energy", 7);
  const focus  = avgMind(mind, "focus", 7);
  if (energy > 0 && focus > 0) {
    const mot = (energy + focus) / 2;
    if (mot <= 4) signals.push({ text: `Energy+Focus avg ${mot.toFixed(1)}/10 (motivation low)`, weight: 1 });
  }

  // Libido
  const libido7 = avgMind(mind, "libido", 7);
  if (libido7 > 0) {
    // libido is 1-5; normalise thresholds
    if (libido7 <= 1.5) signals.push({ text: `Libido suppressed (${libido7.toFixed(1)}/5)`, weight: 2 });
    else if (libido7 <= 2.5) signals.push({ text: `Libido low (${libido7.toFixed(1)}/5)`, weight: 1 });
  }

  // Active injury
  const active = injuries.filter(i => i.ongoing && i.severity >= 3);
  if (active.length >= 1) signals.push({ text: `${active.length} active injury(ies)`, weight: 1 });

  const score = signals.reduce((n,s) => n + s.weight, 0);
  const level: BurnoutResult["level"] =
    score >= 6 ? "overtraining" :
    score >= 4 ? "warn" :
    score >= 2 ? "watch" : "ok";
  const color =
    level === "overtraining" ? "#dc2626" :
    level === "warn"         ? "#ef4444" :
    level === "watch"        ? "#f59e0b" : "#10b981";
  return { score, level, color, signals: signals.map(s => s.text) };
}

// ---------------- Mind-journal helpers ----------------

/** Today's journal entry if any. */
export function todayJournal(entries: JournalEntry[]): JournalEntry | undefined {
  const today = new Date().toISOString().slice(0,10);
  return entries.find(e => e.date === today);
}

// ---------------- Orthostatic test ----------------
/**
 * Orthostatic HR test result. Normal = rise ≤10-15 bpm on standing.
 * Rise ≥20 bpm = possible dysautonomia/fatigue/dehydration flag (used as a recovery signal).
 * Returns { delta, level }.
 */
export function classifyOrthostatic(t: Pick<OrthostaticTest,"hrSupine"|"hrStanding1min">): { delta: number; level: "ok"|"mild"|"elevated"|"high"; color: string } {
  if (!t.hrSupine || !t.hrStanding1min) return { delta: 0, level: "ok", color: "#64748b" };
  const delta = t.hrStanding1min - t.hrSupine;
  if (delta >= 30) return { delta, level: "high",     color: "#dc2626" };
  if (delta >= 20) return { delta, level: "elevated", color: "#ef4444" };
  if (delta >= 13) return { delta, level: "mild",     color: "#f59e0b" };
  return { delta, level: "ok", color: "#10b981" };
}

// ---------------- Active injury helpers ----------------

/** Any active injury that should surface as workout restriction. */
export function activeInjuries(injuries: InjuryEntry[]): InjuryEntry[] {
  return injuries.filter(i => i.ongoing).sort((a,b)=>b.date.localeCompare(a.date));
}

/** Workout restriction hints based on injury category/severity. */
export function injuryRestrictionHints(injuries: InjuryEntry[]): string[] {
  const out: string[] = [];
  for (const i of injuries) {
    if (!i.ongoing) continue;
    const part = i.bodyPart || i.category || "injury";
    if (i.severity >= 4) out.push(`Avoid loading ${part} — see a physiotherapist.`);
    else if (i.severity >= 3) {
      if (i.category === "shoulder") out.push(`Avoid overhead pressing on ${part}.`);
      else if (i.category === "knee") out.push(`Avoid deep squats / heavy leg press on ${part}.`);
      else if (i.category === "back") out.push(`Avoid heavy deadlifts / rounding on ${part}.`);
      else if (i.category === "elbow") out.push(`Avoid weighted chin/dips on ${part}.`);
      else if (i.category === "wrist") out.push(`Avoid push-ups/OHP without wraps on ${part}.`);
      else if (i.category === "ankle") out.push(`Avoid heavy calf raises / running on ${part}.`);
      else out.push(`Modify lifts that aggravate ${part}.`);
    } else {
      out.push(`Warm-up and mobilise ${part} before lifting.`);
    }
  }
  return out;
}

// ---------------- Reports / wave 6 ----------------

export interface DailyHealthSummary {
  date: string;
  hasSleep: boolean;
  sleepHours: number;
  sleepScore: number;
  kcal: number;
  proteinG: number;
  waterMl: number;
  hydrationPct: number;
  hasWorkout: boolean;
  workoutVolumeKg: number;
  workoutMinutes: number;
  restingHr?: number;
  systolic?: number;
  diastolic?: number;
  mood?: number;
  stress?: number;
  energy?: number;
  meditatedMin: number;
  gratitudeCount: number;
  suppsTaken: number;
  suppsTotal: number;
  completed: number;
}

/**
 * Per-day summary builder: joins sleep/meals/water/vitals/mind/journal with workout
 * sessions across the last N days, oldest→newest.
 */
export function buildDailySummaries(
  state: Pick<HealthState, "sleep"|"meals"|"water"|"vitals"|"mind"|"journal"|"supplementDefs"|"supplementLog">,
  workoutSessions: { date: string; endedAt?: number; totalVolumeKg?: number; durationSeconds?: number }[],
  waterGoalMl: (weightKg: number) => number,
  proteinGoalG: (weightKg: number) => number,
  tdee: (weightKg: number) => number,
  weightKg: number,
  lastN = 90,
): DailyHealthSummary[] {
  const out: DailyHealthSummary[] = [];
  const sleepByDay = new Map(state.sleep.map(s => [s.date, s]));
  const mealsByDay = new Map<string, typeof state.meals>();
  for (const m of state.meals) (mealsByDay.get(m.date) ?? mealsByDay.set(m.date, []).get(m.date)!).push(m);
  const waterByDay = new Map<string, typeof state.water>();
  for (const w of state.water) (waterByDay.get(w.date) ?? waterByDay.set(w.date, []).get(w.date)!).push(w);
  const vitalsByDay = new Map<string, VitalsEntry>();
  for (const v of state.vitals) {
    const existing = vitalsByDay.get(v.date);
    if (!existing || v.context === "waking" || (v.time || "") > (existing.time || "")) vitalsByDay.set(v.date, v);
  }
  const mindByDay = new Map(state.mind.map(m => [m.date, m]));
  const jByDay = new Map(state.journal.map(j => [j.date, j]));
  const suppsByDay = new Map<string, number>();
  const todayStr = new Date().toISOString().slice(0,10);
  const totalSupps = state.supplementDefs.length;
  for (const l of state.supplementLog) if (l.taken) suppsByDay.set(l.date, (suppsByDay.get(l.date) ?? 0) + 1);
  const sessionsByDay = new Map<string, any[]>();
  for (const s of workoutSessions) { if (!s.endedAt) continue; (sessionsByDay.get(s.date) ?? sessionsByDay.set(s.date, []).get(s.date)!).push(s); }

  const wGoal = waterGoalMl(weightKg);
  const pGoal = proteinGoalG(weightKg);
  const kGoal = tdee(weightKg);

  for (let i = lastN - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0,10);
    const sl = sleepByDay.get(key);
    const meals = mealsByDay.get(key) ?? [];
    const wArr = waterByDay.get(key) ?? [];
    const vit = vitalsByDay.get(key);
    const mnd = mindByDay.get(key);
    const jrn = jByDay.get(key);
    const sessions = sessionsByDay.get(key) ?? [];
    const kcal = meals.flatMap(m => m.items).reduce((n,it)=>n+(it.kcal||0),0);
    const protein = meals.flatMap(m => m.items).reduce((n,it)=>n+(it.proteinG||0),0);
    const waterMl = wArr.reduce((n,w)=>n+w.ml,0);
    const hydrationPct = Math.round(Math.min(100, (waterMl/Math.max(1,wGoal))*100));
    const kcalFrac = Math.min(1, kcal/Math.max(1,kGoal));
    const protFrac = Math.min(1, protein/Math.max(1,pGoal));
    const sleepFrac = sl ? Math.min(1, sl.durationHours/8) : 0;
    const medFrac = jrn?.meditationMin ? Math.min(1, jrn.meditationMin/10) : 0;
    const gratCount = jrn?.gratitude ? jrn.gratitude.filter(Boolean).length : 0;
    const suppCount = suppsByDay.get(key) ?? 0;
    const suppFrac = totalSupps > 0 ? suppCount/totalSupps : 0;
    const moodFrac = mnd ? (mnd.mood-1)/9 : 0;
    const woFrac = sessions.length > 0 ? 1 : 0;
    const completed = Math.round(
      sleepFrac*20 + kcalFrac*12 + protFrac*13 + (hydrationPct/100)*20
      + suppFrac*10 + medFrac*5 + (gratCount>=3?5:gratCount*1.5) + woFrac*10
      + moodFrac*5
    );
    const vol = sessions.reduce((n:number,s:any)=>n+(s.totalVolumeKg??0),0);
    const dur = sessions.reduce((n:number,s:any)=>n+((s.durationSeconds??0)/60),0);
    out.push({
      date: key,
      hasSleep: !!sl, sleepHours: sl?.durationHours ?? 0,
      sleepScore: sl ? Math.round((0.6*Math.min(1,sl.durationHours/8)+0.4*(sl.quality??5)/10)*100) : 0,
      kcal: Math.round(kcal), proteinG: Math.round(protein), waterMl, hydrationPct,
      hasWorkout: sessions.length>0, workoutVolumeKg: Math.round(vol), workoutMinutes: Math.round(dur),
      restingHr: vit?.restingHr, systolic: vit?.systolic, diastolic: vit?.diastolic,
      mood: mnd?.mood, stress: mnd?.stress, energy: mnd?.energy,
      meditatedMin: jrn?.meditationMin ?? 0,
      gratitudeCount: gratCount,
      suppsTaken: suppCount, suppsTotal: totalSupps,
      completed: Math.max(0, Math.min(100, completed)),
    });
    void todayStr;
  }
  return out;
}

/** Habit streak (consecutive days meeting a predicate; walking backwards for current). */
export function habitStreak(summaries: DailyHealthSummary[], predicate: (s: DailyHealthSummary)=>boolean): { current: number; longest: number } {
  let current = 0, longest = 0, run = 0;
  for (let i = summaries.length-1; i >= 0; i--) { if (predicate(summaries[i])) current++; else break; }
  for (const s of summaries) { if (predicate(s)) { run++; longest = Math.max(longest, run); } else run = 0; }
  return { current, longest };
}

/** Weekly aggregates from daily summaries (last 7 days). */
export function weeklyReport(summaries: DailyHealthSummary[]) {
  const last7 = summaries.slice(-7);
  if (last7.length === 0) return null;
  const avg = (arr: number[]) => arr.length ? arr.reduce((s,x)=>s+x,0)/arr.length : 0;
  return {
    days: last7.length,
    sleep: avg(last7.map(s=>s.sleepHours)),
    kcal: avg(last7.map(s=>s.kcal)),
    protein: avg(last7.map(s=>s.proteinG)),
    water: avg(last7.map(s=>s.hydrationPct)),
    completion: avg(last7.map(s=>s.completed)),
    woDays: last7.filter(s=>s.hasWorkout).length,
    vol: last7.reduce((n,s)=>n+s.workoutVolumeKg,0),
    mins: last7.reduce((n,s)=>n+s.workoutMinutes,0),
    moodAvg: avg(last7.filter(s=>s.mood!=null).map(s=>s.mood!)),
    stressAvg: avg(last7.filter(s=>s.stress!=null).map(s=>s.stress!)),
    medDays: last7.filter(s=>s.meditatedMin>0).length,
    streak: habitStreak(summaries, s => s.completed >= 70),
  };
}

/** Flat CSV export of daily summaries. */
export function exportHealthCSV(summaries: DailyHealthSummary[]): string {
  const header = ["date","sleep_hours","sleep_score","kcal","protein_g","water_ml","hydration_pct","workout","volume_kg","workout_min","rhr","bp_sys","bp_dia","mood","stress","energy","meditation_min","gratitude_count","supps_taken","supps_total","completion_pct"];
  const rows = [header.join(",")];
  for (const s of summaries) {
    rows.push([
      s.date, s.sleepHours.toFixed(1), s.sleepScore,
      s.kcal, s.proteinG, s.waterMl, s.hydrationPct,
      s.hasWorkout?1:0, s.workoutVolumeKg, s.workoutMinutes,
      s.restingHr??"", s.systolic??"", s.diastolic??"",
      s.mood??"", s.stress??"", s.energy??"",
      s.meditatedMin, s.gratitudeCount, s.suppsTaken, s.suppsTotal, s.completed,
    ].join(","));
  }
  return rows.join("\n");
}

// ---------------- Wave 7: Workout bridge ----------------

/**
 * Reverse-engineer TDEE from 2+ weeks of calorie+weight data using energy balance:
 * Δweight_kg/day = (avg_kcal - TDEE) / 7700   (7700 kcal ≈ 1 kg adipose; rough Wishnofsky).
 */
export function reverseEngineerTdee(
  meals: {date:string;items:{kcal?:number}[]}[],
  weights: {date:string;weightKg:number}[],
  minDays = 10,
): { estTdee: number; avgKcal: number; deltaKg: number; days: number } | null {
  const kcalByDay = new Map<string, number>();
  for (const m of meals) {
    const k = m.items.reduce((n,it)=>n+(it.kcal||0),0);
    kcalByDay.set(m.date, (kcalByDay.get(m.date) ?? 0) + k);
  }
  const sortedW = [...weights].sort((a,b)=>a.date.localeCompare(b.date));
  if (sortedW.length < 2) return null;
  const first = sortedW[0], last = sortedW[sortedW.length-1];
  const daySpan = Math.round((new Date(last.date).getTime() - new Date(first.date).getTime())/86400000);
  if (daySpan < minDays) return null;
  const d0 = new Date(first.date);
  let totKcal = 0, kcalDays = 0;
  for (let i=0;i<=daySpan;i++){ const d=new Date(d0); d.setDate(d.getDate()+i); const k=kcalByDay.get(d.toISOString().slice(0,10)); if(k!=null){totKcal+=k;kcalDays++;} }
  if (kcalDays < Math.max(5, minDays/2)) return null;
  const avgKcal = totKcal/kcalDays;
  const deltaKg = last.weightKg - first.weightKg;
  const estTdee = Math.round(avgKcal - (deltaKg/daySpan)*7700);
  return { estTdee, avgKcal: Math.round(avgKcal), deltaKg: Math.round(deltaKg*10)/10, days: daySpan };
}

/** Rough cardio kcal: MET × kg × hours. */
export function cardioCalorieEstimate(durationMin: number, weightKg: number, met: number = 7): number {
  return Math.round(met * weightKg * (durationMin/60));
}

/** Nights of ideal sleep needed to clear sleep debt (rough projection). */
export function projectedSleepRecovery(sleepEntries: SleepEntry[], idealHours: number): { extraHoursNeeded: number; nightsAtIdeal: number } {
  const bank = computeSleepBank(sleepEntries, idealHours);
  if (bank >= 0) return { extraHoursNeeded: 0, nightsAtIdeal: 0 };
  const deficit = -bank;
  const creditPerNight = Math.min(idealHours*0.125, 1.0)*0.5;
  return { extraHoursNeeded: Math.round(deficit*10)/10, nightsAtIdeal: Math.max(1, Math.ceil(deficit/Math.max(0.25, creditPerNight))) };
}

export type TrainingStatus = "fresh"|"maintaining"|"accumulating"|"peaking"|"fatigued"|"overreaching"|"detrained";

/** Training status classifier (Craik/ACSM-informed heuristic). */
export function trainingStatus(args: {
  recentVol: number; priorVol: number; recovery: number; rhrDelta: number;
  sessionsRecent: number; sessionsPrior: number;
}): { status: TrainingStatus; color: string; label: string } {
  const { recentVol, priorVol, recovery, rhrDelta, sessionsRecent, sessionsPrior } = args;
  const volRatio = priorVol > 0 ? recentVol/priorVol : (sessionsRecent>0?1:0);
  if (sessionsRecent === 0) return { status:"detrained", color:"#64748b", label:"Detrained (no recent sessions)" };
  if (recovery < 30 && volRatio > 1.0 && rhrDelta >= 8) return { status:"overreaching", color:"#dc2626", label:"Functional overreaching — deload" };
  if (recovery < 45 && volRatio > 0.85) return { status:"fatigued", color:"#ef4444", label:"Fatigued — easy week" };
  if (volRatio > 1.15 && recovery >= 55) return { status:"peaking", color:"#f59e0b", label:"Peaking — hit a heavy single" };
  if (volRatio > 1.05 && recovery >= 60) return { status:"accumulating", color:"#10b981", label:"Accumulating — push volume" };
  if (volRatio < 0.7 && recovery >= 70 && sessionsPrior > 2) return { status:"fresh", color:"#06b6d4", label:"Fresh — ready to load" };
  return { status:"maintaining", color:"#a78bfa", label:"Maintaining — solid" };
}

export interface PreWorkoutAdvisory {
  level: "clear"|"caution"|"warn"|"abort";
  color: string; title: string; messages: string[]; suggestedIntensity: number;
}
function sev(l: PreWorkoutAdvisory["level"]) { return {clear:0,caution:1,warn:2,abort:3}[l]; }

/** Pre-workout advisory card (drives green/yellow/red light on Workout overview). */
export function preWorkoutAdvisory(args: {
  sleepBank: number; lastNightHrs: number; recovery: number;
  hydrationPct: number; activeInjuries: number; bpCrisis: boolean; fever?: boolean;
  rhrDelta: number; burnoutLevel: "ok"|"watch"|"warn"|"overtraining";
}): PreWorkoutAdvisory {
  const { sleepBank, lastNightHrs, recovery, hydrationPct, activeInjuries, bpCrisis, fever, rhrDelta, burnoutLevel } = args;
  const msgs: string[] = [];
  let level: PreWorkoutAdvisory["level"] = "clear";
  let suggestedIntensity = 1.0;
  const up = (l: PreWorkoutAdvisory["level"]) => { if (sev(l) > sev(level)) level = l; };  if (bpCrisis) { up("abort"); msgs.push("BP in crisis range — skip, seek medical opinion."); suggestedIntensity = 0; }
  if (fever) { up("abort"); msgs.push("Fever logged — training hits the immune system hard. Rest."); suggestedIntensity = 0; }
  if (sleepBank <= -10 || lastNightHrs < 5) { up("warn"); msgs.push(`Sleep bank ${sleepBank.toFixed(1)}h, last night ${lastNightHrs.toFixed(1)}h — cut volume 40-50%, no PRs.`); suggestedIntensity = Math.min(suggestedIntensity, 0.6); }
  else if (sleepBank <= -5 || lastNightHrs < 6.5) { up("caution"); msgs.push(`Sleep bank ${sleepBank.toFixed(1)}h — reduce load ~20%, leave 1-2 RIR.`); suggestedIntensity = Math.min(suggestedIntensity, 0.8); }
  if (hydrationPct < 50) { up("caution"); msgs.push(`Hydration ${hydrationPct}% — drink 500ml+ with salt before first set.`); }
  if (activeInjuries > 0) { up("caution"); msgs.push(`${activeInjuries} active injury(ies) — modify aggravating lifts.`); }
  if (rhrDelta >= 8) { up("warn"); msgs.push(`RHR +${Math.round(rhrDelta)} bpm vs baseline — sympathetic load high.`); suggestedIntensity = Math.min(suggestedIntensity, 0.7); }
  if (burnoutLevel === "overtraining") { up("abort"); msgs.push("Overtraining flagged — deload week, active recovery only."); suggestedIntensity = 0.3; }
  else if (burnoutLevel === "warn") { up("warn"); msgs.push("Burnout warning — light session or mobility only."); suggestedIntensity = Math.min(suggestedIntensity, 0.6); }
  const lv = level as PreWorkoutAdvisory["level"];
  if (recovery >= 80 && lv === "clear") { msgs.push("Recovery strong — green light to push."); suggestedIntensity = 1.05; }
  else if (recovery >= 65 && lv === "clear") { msgs.push("Recovery good — normal session."); }
  else if (lv === "clear") { msgs.push("Recovery sub-par — take warm-ups seriously."); }
  const color = lv==="abort"?"#dc2626":lv==="warn"?"#ef4444":lv==="caution"?"#f59e0b":"#10b981";
  const title = lv==="abort"?"STAND DOWN":lv==="warn"?"MODIFY HEAVILY":lv==="caution"?"CAUTION":"GREEN LIGHT";
  return { level, color, title, messages: msgs, suggestedIntensity };
}

/** Post-workout recovery macro/sleep projection. */
export function postWorkoutRecoveryNeeds(args: {
  volumeKg: number; durationMin: number; intensity: number; recovery: number;
}): { proteinTargetAddG: number; waterAddMl: number; sleepTargetHrs: number; carbsG: number } {
  const { volumeKg, durationMin, intensity, recovery } = args;
  return {
    proteinTargetAddG: Math.round(15 + volumeKg*0.015*intensity),
    waterAddMl: Math.round(500 + durationMin*8*intensity),
    sleepTargetHrs: Math.round((8 + (volumeKg>5000?1:volumeKg>2000?0.5:0) + (recovery<60?0.5:0))*10)/10,
    carbsG: Math.round(60 + volumeKg*0.01*intensity),
  };
}

// ---------------- Wave 8A — FUEL core UX ----------------

/** Fasting window state at a given time (hours since midnight, fractional). */
export interface FastingWindowState {
  inWindow: boolean;
  /** Hours until the window opens (if fasting) or closes (if eating). */
  hoursToNext: number;
  /** Label of the next transition ("opens" | "closes"). */
  next: "opens" | "closes";
  /** Window length in hours (eating side). */
  eatingHours: number;
  fastingHours: number;
}

/**
 * Fasting/eating-window state. Handles windows that cross midnight
 * (e.g. start 20, end 4). `nowHours` = current time as fractional hours.
 */
export function fastingWindowState(startHour: number, endHour: number, nowHours: number): FastingWindowState {
  const norm = (h: number) => ((h % 24) + 24) % 24;
  const s = norm(startHour), e = norm(endHour), n = norm(nowHours);
  const eatingHours = norm(e - s) || 24;
  const fastingHours = 24 - eatingHours;
  const inWindow = s <= e ? (n >= s && n < e) : (n >= s || n < e);
  const until = (target: number) => norm(target - n) || 24;
  return inWindow
    ? { inWindow, hoursToNext: until(e), next: "closes", eatingHours, fastingHours }
    : { inWindow, hoursToNext: until(s), next: "opens", eatingHours, fastingHours };
}

/**
 * Fast-streak: consecutive days (ending yesterday or today) where every meal
 * with a time fell inside the eating window. Days with no timed meals count
 * as compliant only if they have at least one meal logged.
 */
export function fastStreak(meals: MealEntry[], startHour: number, endHour: number, todayIso: string): number {
  const byDate = new Map<string, MealEntry[]>();
  for (const m of meals) {
    if (!byDate.has(m.date)) byDate.set(m.date, []);
    byDate.get(m.date)!.push(m);
  }
  const dayCompliant = (date: string): boolean | null => {
    const dm = byDate.get(date);
    if (!dm || dm.length === 0) return null; // no data — breaks streak walk
    for (const meal of dm) {
      if (!meal.time) continue;
      const [hh, mm] = meal.time.split(":").map(Number);
      const t = (hh ?? 0) + (mm ?? 0) / 60;
      const st = fastingWindowState(startHour, endHour, t);
      if (!st.inWindow) return false;
    }
    return true;
  };
  let streak = 0;
  const d = new Date(todayIso + "T00:00:00");
  // Today may still be in progress: count it if compliant, else start from yesterday.
  for (let i = 0; i < 365; i++) {
    const iso = new Date(d.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    const c = dayCompliant(iso);
    if (c === true) streak++;
    else if (c === false) break;
    else if (i === 0) continue; // today unlogged — look back
    else break;
  }
  return streak;
}

/** Macro percent triple that always sums to 100. Adjust one axis, others scale. */
export function rebalanceMacros(
  current: { c: number; p: number; f: number },
  changed: "c" | "p" | "f",
  newValue: number,
): { c: number; p: number; f: number } {
  const v = Math.max(0, Math.min(100, Math.round(newValue)));
  const keys: ("c" | "p" | "f")[] = ["c", "p", "f"];
  const others = keys.filter(k => k !== changed);
  const rest = 100 - v;
  const oldRest = others.reduce((n, k) => n + current[k], 0);
  const out = { ...current, [changed]: v } as { c: number; p: number; f: number };
  if (oldRest <= 0) {
    // Split remainder evenly when the other two were both zero.
    out[others[0]] = Math.floor(rest / 2);
    out[others[1]] = rest - out[others[0]];
  } else {
    out[others[0]] = Math.round(rest * current[others[0]] / oldRest);
    out[others[1]] = rest - out[others[0]];
  }
  return out;
}

/** Convert macro percents of a kcal budget into gram targets (4/4/9 kcal per g). */
export function macroGramTargets(kcal: number, cPct: number, pPct: number, fPct: number): { carbsG: number; proteinG: number; fatG: number } {
  return {
    carbsG: Math.round((kcal * cPct / 100) / 4),
    proteinG: Math.round((kcal * pPct / 100) / 4),
    fatG: Math.round((kcal * fPct / 100) / 9),
  };
}

/**
 * Frequent-foods library: top-N item names by log count across all meals,
 * with their most recent kcal/macros for one-tap re-log. Pinned names float
 * to the top regardless of count.
 */
export interface FrequentFood {
  name: string;
  count: number;
  kcal: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  pinned: boolean;
}
export function frequentFoods(meals: MealEntry[], pinned: string[] = [], topN = 20): FrequentFood[] {
  const stats = new Map<string, { count: number; kcal: number; c: number; p: number; f: number; last: string }>();
  for (const m of meals) {
    for (const it of m.items) {
      // Strip serving multipliers ("idli ×2" → "idli") so variants aggregate.
      const key = it.name.replace(/\s*×[\d.]+\s*$/, "").trim();
      if (!key) continue;
      const prev = stats.get(key);
      if (!prev) {
        stats.set(key, { count: 1, kcal: it.kcal, c: it.carbsG ?? 0, p: it.proteinG ?? 0, f: it.fatG ?? 0, last: m.date });
      } else {
        prev.count++;
        if (m.date >= prev.last) { prev.kcal = it.kcal; prev.c = it.carbsG ?? 0; prev.p = it.proteinG ?? 0; prev.f = it.fatG ?? 0; prev.last = m.date; }
      }
    }
  }
  const pinnedSet = new Set(pinned.map(p => p.toLowerCase()));
  const rows: FrequentFood[] = Array.from(stats.entries()).map(([name, s]) => ({
    name, count: s.count, kcal: s.kcal, carbsG: s.c, proteinG: s.p, fatG: s.f,
    pinned: pinnedSet.has(name.toLowerCase()),
  }));
  rows.sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (b.count - a.count) || a.name.localeCompare(b.name));
  return rows.slice(0, topN);
}

/**
 * Hourly sip suggestion — how much to drink by the top of the next hour to
 * stay on a linear pace toward the daily goal. Assumes a 7:00→23:00 drinking
 * day (16h). Returns null before 7:00 or once the goal is met.
 */
export function sipSuggestion(loggedMl: number, goalMl: number, nowHours: number): { ml: number; byHour: number } | null {
  if (goalMl <= 0 || loggedMl >= goalMl) return null;
  const DAY_START = 7, DAY_END = 23;
  if (nowHours < DAY_START) return null;
  const h = Math.min(nowHours, DAY_END);
  const nextHour = Math.min(Math.floor(h) + 1, DAY_END);
  const targetByNextHour = goalMl * (nextHour - DAY_START) / (DAY_END - DAY_START);
  const ml = Math.max(0, Math.round((targetByNextHour - loggedMl) / 50) * 50);
  if (ml === 0) return null;
  return { ml: Math.min(ml, 750), byHour: nextHour };
}

// ---------------- Wave 8B — FUEL nutrient depth ----------------

import type { DailyNutrientEntry, MealEntry as MealEntry8B } from "./healthTypes";

/** Daily sub-nutrient targets/caps (ICMR/WHO-aligned, male lifter defaults). */
export const NUTRIENT_TARGETS = {
  fiberG:        { goal: 30,   kind: "goal" as const, label: "Fiber",      unit: "g",  note: "ICMR 30g/day" },
  addedSugarG:   { goal: 25,   kind: "cap"  as const, label: "Added sugar",unit: "g",  note: "WHO <25g/day" },
  sodiumMg:      { goal: 2300, kind: "cap"  as const, label: "Sodium",     unit: "mg", note: "cap 2300mg — sweat losses in Chennai raise needs on training days", warnAt: 1500 },
  cholesterolMg: { goal: 300,  kind: "cap"  as const, label: "Cholesterol",unit: "mg", note: "cap 300mg" },
  satFatG:       { goal: 25,   kind: "cap"  as const, label: "Sat fat",    unit: "g",  note: "<10% of ~2300kcal" },
  transFatG:     { goal: 0,    kind: "zero" as const, label: "Trans fat",  unit: "g",  note: "any amount flagged" },
  omega3Mg:      { goal: 500,  kind: "goal" as const, label: "Omega-3",    unit: "mg", note: "500mg+ EPA/DHA" },
};
export type NutrientKey = keyof typeof NUTRIENT_TARGETS;

export type NutrientStatus = "ok" | "low" | "near" | "over";
/** Status vs target: goals want >=100%, caps want <100%. */
export function nutrientStatus(key: NutrientKey, value: number | undefined): { status: NutrientStatus; pct: number } {
  const t = NUTRIENT_TARGETS[key];
  const v = value ?? 0;
  if (t.kind === "zero") return { status: v > 0 ? "over" : "ok", pct: v > 0 ? 100 : 0 };
  const pct = t.goal > 0 ? Math.round((v / t.goal) * 100) : 0;
  if (t.kind === "goal") return { status: pct >= 100 ? "ok" : pct >= 60 ? "near" : "low", pct: Math.min(pct, 150) };
  // cap
  const warnPct = "warnAt" in t && t.warnAt ? Math.round((t.warnAt / t.goal) * 100) : 80;
  return { status: pct > 100 ? "over" : pct >= warnPct ? "near" : "ok", pct: Math.min(pct, 150) };
}

/**
 * Sugar-spike risk heuristic (H9): carb quality × protein/fat pairing.
 * Not medical-grade — glycemic-load awareness only.
 */
export function sugarSpikeRisk(
  carbQuality: "simple" | "complex" | "mixed" | undefined,
  pairing: "none" | "some" | "high" | undefined,
  carbsG?: number,
): { level: "low" | "medium" | "high"; color: string; tip: string } {
  const cq = carbQuality ?? "mixed";
  const pr = pairing ?? "some";
  let score = 0;
  score += cq === "simple" ? 2 : cq === "mixed" ? 1 : 0;
  score += pr === "none" ? 2 : pr === "some" ? 1 : 0;
  if ((carbsG ?? 0) >= 80) score += 1;           // big carb bolus
  if ((carbsG ?? 0) > 0 && (carbsG ?? 0) < 20) score -= 1; // tiny carbs = non-event
  if (score >= 4) return { level: "high",   color: "#ef4444", tip: "Simple carbs alone — add protein/fat or take a 10-min walk after." };
  if (score >= 2) return { level: "medium", color: "#f59e0b", tip: "Moderate spike — pairing carbs with protein blunts the curve." };
  return { level: "low", color: "#10b981", tip: "Complex carb + protein = slow release. Good." };
}

/** Get (or synthesize) the nutrient row for a date. */
export function nutrientRowFor(nutrients: DailyNutrientEntry[], date: string): DailyNutrientEntry | undefined {
  return nutrients.find(n => n.date === date);
}

/** Sum fibre from logged meal items (food-DB fibreG) for a date — seed for the fiber tracker. */
export function fiberFromMeals(meals: MealEntry8B[], date: string): number {
  let g = 0;
  for (const m of meals) if (m.date === date) for (const it of m.items) g += it.fibreG ?? 0;
  return Math.round(g);
}

// ---------------- Wave 8C — FUEL planning ----------------

import type { Recipe, RecipeIngredient, PlannedMeal } from "./healthTypes";

/** Totals for a whole recipe and per serving (Recipe Nutrition Analyzer). */
export function recipeNutrition(r: Pick<Recipe, "ingredients" | "portions">): {
  total: { kcal: number; carbsG: number; proteinG: number; fatG: number };
  perServing: { kcal: number; carbsG: number; proteinG: number; fatG: number };
} {
  let kcal = 0, c = 0, p = 0, f = 0;
  for (const ing of r.ingredients) {
    kcal += ing.kcal ?? 0; c += ing.carbsG ?? 0; p += ing.proteinG ?? 0; f += ing.fatG ?? 0;
  }
  const n = Math.max(1, r.portions || 1);
  const rd = (x: number) => Math.round(x * 10) / 10;
  return {
    total: { kcal: Math.round(kcal), carbsG: rd(c), proteinG: rd(p), fatG: rd(f) },
    perServing: { kcal: Math.round(kcal / n), carbsG: rd(c / n), proteinG: rd(p / n), fatG: rd(f / n) },
  };
}

/** Day-of-week index (0=Mon…6=Sun) for an ISO date. */
export function isoDow(dateIso: string): number {
  const d = new Date(dateIso + "T00:00:00");
  return (d.getDay() + 6) % 7;
}

/** Planner cells for a given day-of-week, ordered breakfast→snack. */
export function planForDow(plan: PlannedMeal[], dow: number): PlannedMeal[] {
  const order: Record<PlannedMeal["slot"], number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
  return plan.filter(p => p.dow === dow).sort((a, b) => order[a.slot] - order[b.slot]);
}

/** Meal-prep progress across the week's plan. */
export function prepProgress(plan: PlannedMeal[]): { done: number; total: number; pct: number } {
  const total = plan.length;
  const done = plan.filter(p => p.prepped).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

// ---------------- Wave 8D — SOMNIUM + HYDRATION polish ----------------

import type { NapEntry, UrineCheck } from "./healthTypes";

/** Sleep-bank weekly statement: hours slept vs needed over the last 7 logged nights. */
export interface SleepStatement {
  nights: number;          // nights logged in window
  totalSlept: number;      // h
  totalNeeded: number;     // h (ideal × nights)
  avgHours: number;
  delta: number;           // slept − needed (negative = debt built this week)
  avgQuality: number;      // 1-10
  trend: "improving" | "flat" | "declining";
}
export function sleepStatement(entries: SleepEntry[], idealHours: number): SleepStatement {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const win = sorted.slice(-7);
  const nights = win.length;
  const totalSlept = win.reduce((n, e) => n + (e.durationHours || 0), 0);
  const totalNeeded = idealHours * nights;
  const avgHours = nights ? totalSlept / nights : 0;
  const avgQuality = nights ? win.reduce((n, e) => n + (e.quality || 0), 0) / nights : 0;
  // Trend: first-half avg vs second-half avg of the window.
  let trend: SleepStatement["trend"] = "flat";
  if (nights >= 4) {
    const half = Math.floor(nights / 2);
    const a = win.slice(0, half).reduce((n, e) => n + e.durationHours, 0) / half;
    const b = win.slice(-half).reduce((n, e) => n + e.durationHours, 0) / half;
    if (b - a > 0.4) trend = "improving";
    else if (a - b > 0.4) trend = "declining";
  }
  const rd = (x: number) => Math.round(x * 10) / 10;
  return { nights, totalSlept: rd(totalSlept), totalNeeded: rd(totalNeeded), avgHours: rd(avgHours), delta: rd(totalSlept - totalNeeded), avgQuality: rd(avgQuality), trend };
}

/**
 * Circadian consistency score 0-100 from wake-time variance over last 14 nights.
 * σ ≤ 30min → 100; score decays linearly to 0 at σ = 2.5h.
 * Also flags social jetlag: weekend vs weekday wake gap > 90min.
 */
export function circadianConsistency(entries: SleepEntry[]): { score: number; sigmaMin: number; socialJetlagMin: number; flagged: boolean } {
  const win = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
    .filter(e => e.wakeTime);
  if (win.length < 3) return { score: 0, sigmaMin: 0, socialJetlagMin: 0, flagged: false };
  const wakeMins = win.map(e => {
    const d = new Date(e.wakeTime);
    return d.getHours() * 60 + d.getMinutes();
  });
  const mean = wakeMins.reduce((a, b) => a + b, 0) / wakeMins.length;
  const sigma = Math.sqrt(wakeMins.reduce((a, b) => a + (b - mean) ** 2, 0) / wakeMins.length);
  const score = Math.max(0, Math.min(100, Math.round(100 * (1 - Math.max(0, sigma - 30) / 120))));
  // Social jetlag: avg weekend wake − avg weekday wake.
  const wd: number[] = [], we: number[] = [];
  win.forEach((e, i) => {
    const day = new Date(e.date + "T00:00:00").getDay();
    (day === 0 || day === 6 ? we : wd).push(wakeMins[i]);
  });
  const avg = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
  const jet = (we.length && wd.length) ? Math.round(avg(we) - avg(wd)) : 0;
  return { score, sigmaMin: Math.round(sigma), socialJetlagMin: jet, flagged: Math.abs(jet) > 90 };
}

/** Nap classification + circadian note. */
export function classifyNap(durationMin: number, time?: string): { kind: "power" | "long"; note: string } {
  const kind = durationMin <= 30 ? "power" : "long";
  let late = false;
  if (time) {
    const h = +time.split(":")[0];
    late = h >= 16;
  }
  if (kind === "power") return { kind, note: late ? "Power nap, but post-4pm — may still delay sleep onset." : "Power nap ≤30min — alertness boost without sleep inertia." };
  return { kind, note: late ? "Long nap after 4pm — high risk of pushing bedtime back. Cap at 30min next time." : "Long nap — expect some grogginess (sleep inertia); protects sleep debt though." };
}

/** Urine color 1-8 → hydration status. */
export function urineStatus(color: number): { label: string; color: string; dehydrated: boolean } {
  if (color <= 3) return { label: "Well hydrated", color: "#10b981", dehydrated: false };
  if (color <= 5) return { label: "Mild dehydration — drink a glass now", color: "#f59e0b", dehydrated: false };
  return { label: "Dehydrated — 500ml + electrolytes", color: "#ef4444", dehydrated: true };
}

/** Simple non-crypto PIN hash (FNV-1a) — local honesty lock, not security. */
export function pinHash(pin: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < pin.length; i++) {
    h ^= pin.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}
