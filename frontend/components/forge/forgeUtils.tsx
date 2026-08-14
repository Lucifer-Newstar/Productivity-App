"use client";
/**
 * forgeUtils — pure date/math helpers used across all Forge sections.
 *
 * Kept colocated with components (instead of in lib/) because they are
 * Forge-specific (status labels, health colors, velocity regression) and
 * should not leak into Career/Workout utilities.
 *
 * Date helpers operate on ISO yyyy-mm-dd strings at LOCAL midnight to avoid
 * timezone drift when comparing due dates across reloads.
 */
import type { ProjectTask, ForgeProject } from "../../lib/forgeTypes";

/** Milliseconds in a day — used for all date arithmetic. */
export const DAY_MS = 86_400_000;

/** @returns today as yyyy-mm-dd in local time. */
export const todayISO = () => new Date().toISOString().slice(0,10);

/** @returns ISO date n days in the past. */
export const daysAgo = (n: number) => new Date(Date.now() - n*DAY_MS).toISOString().slice(0,10);

/** @returns ISO date n days in the future. */
export const daysFrom = (n: number) => new Date(Date.now() + n*DAY_MS).toISOString().slice(0,10);

/** @returns whole-day difference (b - a) in days, for two ISO date strings. */
export function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / DAY_MS);
}

export function mondayOf(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const dow = (d.getDay() + 6) % 7; // 0=Mon
  d.setDate(d.getDate() - dow);
  return d.toISOString().slice(0,10);
}

export function addDays(iso: string, n: number): string {
  return new Date(new Date(iso+"T00:00:00").getTime() + n*DAY_MS).toISOString().slice(0,10);
}

export function weekOfLabel(iso: string) {
  const end = addDays(iso, 6);
  return `${iso.slice(5)} → ${end.slice(5)}`;
}

export const TASK_STATUSES: { id: ProjectTask["status"]; label: string; color: string }[] = [
  { id: "todo",    label: "TO DO",    color: "#94a3b8" },
  { id: "doing",   label: "FORGING",  color: "#f59e0b" },
  { id: "review",  label: "QUENCH",   color: "#06b6d4" },
  { id: "blocked", label: "JAMMED",   color: "#ef4444" },
  { id: "done",    label: "SHIPPED",  color: "#22c55e" },
];

export function statusColor(s: ProjectTask["status"]): string {
  return TASK_STATUSES.find(x => x.id === s)?.color ?? "#94a3b8";
}

export function projectHealthColor(h: ForgeProject["status"]): string {
  switch (h) {
    case "done":      return "#22c55e";
    case "on-track":  return "#f59e0b";
    case "blocked":   return "#ef4444";
    case "off-track": return "#ea580c";
    case "paused":    return "#94a3b8";
    case "dead":      return "#7f1d1d";
    default:          return "#94a3b8";
  }
}

// Velocity projection: linear regression over completed-per-week points.
export function projectVelocity(points: number[]): { avg: number; slope: number; projected: number } {
  if (points.length === 0) return { avg: 0, slope: 0, projected: 0 };
  const avg = points.reduce((a,b)=>a+b,0)/points.length;
  if (points.length < 2) return { avg, slope: 0, projected: avg };
  // least-squares slope
  const n = points.length;
  const xs = Array.from({length:n}, (_,i)=>i);
  const mx = xs.reduce((a,b)=>a+b,0)/n;
  const my = avg;
  let num=0, den=0;
  for (let i=0;i<n;i++){ num += (xs[i]-mx)*(points[i]-my); den += (xs[i]-mx)**2; }
  const slope = den ? num/den : 0;
  const projected = Math.max(0, points[n-1] + slope);
  return { avg, slope, projected };
}
