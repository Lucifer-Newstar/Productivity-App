/**
 * Gym/Weights math + helpers.
 *
 * - Epley 1RM (re-exported from workoutAnalytics for convenience)
 * - Training max (90% of 1RM)
 * - Plate calculator (kg — assumes 20kg bar, common plates: 25/20/15/10/5/2.5/1.25)
 * - Dumbbell ↔ barbell rough equivalence (assumes two dumbbells)
 * - Wilks coefficient (2020 coefficient approximation)
 * - Volume & intensity (% of 1RM)
 */

import { epley1RM } from "./workoutAnalytics";
import type { PlateConfig } from "./workoutExtTypes";

export { epley1RM };

// Training max = 90% of 1RM — used for 5/3/1-style programming.
export function trainingMax(oneRM: number): number {
  return Math.round(oneRM * 0.9 * 10) / 10;
}

// Plate calculator: given a target total weight, returns plates per side
// (bar weight included — default Olympic bar = 20kg). Plates greedy-fit from
// largest to smallest. Returns null if the target is under bar weight.
const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
export function platesForKg(targetKg: number, barKg = 20): PlateConfig | null {
  if (targetKg < barKg) return null;
  const perSide = (targetKg - barKg) / 2;
  const plates: number[] = [];
  let remaining = perSide;
  for (const p of KG_PLATES) {
    while (remaining + 0.001 >= p) {
      plates.push(p);
      remaining = +(remaining - p).toFixed(2);
    }
  }
  return { barKg, platesPerSide: plates };
}

// Rough DB → BB: dumbbell press "N each" ≈ 2N total (same total load), but
// stability demands make it harder — multiply by ~0.85 for equivalent barbell.
export function dbToBbEquivalent(dumbbellEachKg: number): number {
  return Math.round(dumbbellEachKg * 2 * 0.85 * 10) / 10;
}
export function bbToDbEquivalent(barbellKg: number): number {
  return Math.round(((barbellKg / 2) / 0.85) * 10) / 10;
}

// Wilks 2020 coefficient (simplified, male+female average approximation).
// Uses the polynomial formula from the official Wilks 2020 paper. Good enough
// for casual display; serious powerlifters should use the official calculator.
export function wilks(bodyweightKg: number, totalKg: number, isFemale = false): number {
  const coeff = isFemale
    ? { a: -125.4255398, b: 13.7028159, c: -0.2401009, d: -0.0099808, e: 0.0003087, f: -0.0000037 }
    : { a: 47.4617885,  b: 8.4720611,  c: 0.073694,   d: -0.0013958, e: 0.0000516, f: -0.0000013 };
  const x = bodyweightKg;
  const denom = 600
    + coeff.a * x
    + coeff.b * x ** 2
    + coeff.c * x ** 3
    + coeff.d * x ** 4
    + coeff.e * x ** 5
    + coeff.f * x ** 6;
  if (denom === 0) return 0;
  return Math.round((600 / denom) * totalKg * 100) / 100;
}

// Strength-to-weight ratio = 1RM / bodyweight
export function strengthToWeight(oneRM: number, bw: number): number {
  if (!bw) return 0;
  return Math.round((oneRM / bw) * 100) / 100;
}

// Average % of 1RM for a session
export function avgIntensity(sets: { weight?: number; reps: number; oneRM?: number }[]): number {
  const vals = sets
    .filter((s) => s.weight && s.oneRM)
    .map((s) => (s.weight! / s.oneRM!) * 100);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((n, v) => n + v, 0) / vals.length);
}

// RIR → RPE mapping. RPE = 10 - RIR, clamped.
export function rirToRpe(rir: number): number {
  return Math.max(1, Math.min(10, 10 - rir));
}
export function rpeToRir(rpe: number): number {
  return Math.max(0, Math.min(10, 10 - rpe));
}

// AMRAP projection: given a weight × reps, predict reps at same weight (linear).
export function projectAMRAP(weight: number, reps: number, oneRM: number): number {
  // From Epley, projected reps at w = (oneRM/w - 1) * 30
  if (!weight || weight >= oneRM) return reps;
  return Math.round((oneRM / weight - 1) * 30);
}

// Deload detector: fire when 4-6 weeks of increasing volume/intensity without deload.
export function shouldDeload(lastDeloadDate: string | undefined, sessionsPerWeek: number): boolean {
  if (!lastDeloadDate) return sessionsPerWeek * 6 >= 24; // 6 weeks @ 4/wk
  const weeks = (Date.now() - new Date(lastDeloadDate).getTime()) / (7 * 86400000);
  return weeks >= 6;
}
