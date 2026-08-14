/**
 * Health analytics — pure math helpers.
 *
 * Wave 1 ships only the profile-dependent calculators (BMR, TDEE, BMI,
 * water goal) plus a few trivial formatters. Richer algorithms (sleep bank,
 * BF%, reverse TDEE, recovery score, etc.) are added in their respective
 * waves per docs/ALGORITHMS.md.
 *
 * NOTE: this file may import from workoutAnalytics (e.g. Epley 1RM for S:W
 * ratios) but workoutAnalytics MUST NOT import from here — that would
 * create a circular dependency.
 */

import type { ActivityLevel, Gender, HealthProfile } from "./healthTypes";

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
