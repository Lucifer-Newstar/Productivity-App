/**
 * Gym math helpers — plate math, Wilks 2020, DB↔BB equivalence, strength ratio.
 *
 * These are pure functions used by the Gym tab and ActiveWorkout.
 * See docs/ALGORITHMS.md for formulas and references.
 */

// ---------- Training Max ----------
// Training Max = 90% of 1RM — used for 5/3/1 and similar percentage-based programs.
export const trainingMax = (oneRM: number) => oneRM * 0.9;

// ---------- Plate calculator (greedy) ----------
// Given a total bar+loaded weight, returns a sorted (desc) array of plates per side.
// Defaults to a 20 kg men's Olympic bar and the standard colored kg set. Add
// micro-plates (0.25/0.5) so 0.5/1 kg jumps are possible.
const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25];
const LB_PLATES = [45, 35, 25, 10, 5, 2.5, 1.25];

export function platesForKg(totalKg: number, barKg = 20, plates = KG_PLATES): number[] {
  let side = (totalKg - barKg) / 2;
  if (side < 0) side = 0;
  const used: number[] = [];
  for (const p of plates) {
    while (side >= p - 1e-9) {
      used.push(p);
      side -= p;
    }
  }
  return used;
}
export function platesForLb(totalLb: number, barLb = 45, plates = LB_PLATES): number[] {
  return platesForKg(totalLb, barLb, plates); // math is identical
}

// ---------- DB ↔ BB equivalence ----------
// Empirically dumbbell press ≈ 0.85× barbell press for the same load-per-hand sum.
// I.e. 2 × 40 kg DBs (80 kg total) ≈ 0.85 × 80 = 68 kg BB, or 34 kg/hand DB ≈ 80 kg BB.
export const dbToBbEquivalent = (dbPerHandKg: number) => +(dbPerHandKg * 2 * 0.85).toFixed(1);
export const bbToDbEquivalent = (bbKg: number) => +(bbKg / 2 / 0.85).toFixed(1);

// ---------- Wilks 2020 coefficient ----------
// Third-order polynomial coefficients from the official 2020 Wilks formula.
// coeffs = [a, b, c, d, e, f] ; score = 600 / (a + b*x + c*x^2 + d*x^3 + e*x^4 + f*x^5)
// where x = totalKg for male and female lifters respectively.
const WILKS_M = [-125.4255398, 13.74242991, -0.348573308, 0.004598018, -0.000020133, 0];
const WILKS_F = [-255.0505161, 20.7270857, -0.490282466, 0.006673806, -0.00004461, 0.00000011];
function poly(coeffs: number[], x: number) {
  return coeffs.reduce((acc, c, i) => acc + c * Math.pow(x, i), 0);
}
export function wilks(bodyweightKg: number, totalKg: number, female = false): number {
  if (bodyweightKg <= 0 || totalKg <= 0) return 0;
  const coeffs = female ? WILKS_F : WILKS_M;
  const denom = poly(coeffs, bodyweightKg);
  if (denom <= 0) return 0;
  return +(600 / denom * totalKg / 100).toFixed(2);
}

// ---------- Strength-to-weight ratio ----------
export const strengthToWeight = (liftKg: number, bodyweightKg: number) =>
  bodyweightKg > 0 ? +(liftKg / bodyweightKg).toFixed(2) : 0;

// ---------- RPE ↔ RIR ----------
export const rirToRpe = (rir: number) => Math.max(1, Math.min(10, 10 - rir));
export const rpeToRir = (rpe: number) => Math.max(0, Math.min(10, 10 - rpe));

// ---------- Epley (re-export from analytics so consumers can import from one file) ----------
export { epley1RM, brzycki1RM, projectAMRAP, shouldDeload } from "./workoutAnalytics";
