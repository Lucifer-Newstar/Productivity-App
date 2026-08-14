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
  MeasurementEntry,
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
