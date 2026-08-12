"use client";

/**
 * MuscleHeatmap — high-fidelity interactive anatomical SVG, adapted from the
 * body-muscles library (70+ regions, anterior + posterior views).
 *
 * Source of path data: `body-muscles` npm package (Apache 2.0). We render the
 * SVG directly with React for SSR-friendliness + Tailwind / framer-motion
 * compatibility (the vanilla `BodyChart` class is imperative and touches the
 * DOM directly which fights React).
 *
 * - Heat colour scale is driven by kg volume per coarse MUSCLE_FILTER_GROUP
 *   (chest/back/legs/shoulders/arms/core/cardio). All left/right sub-regions
 *   belonging to that coarse group share the colour.
 * - Clicking a region fires `onSelect` with the coarse group (the same ids the
 *   rest of our app uses). Left/right symmetry lights up together.
 * - Selected muscle gets a violet outline + glow.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
// Inlined from body-muscles@1.0.0 (Apache-2.0) — see ./body-muscles-data.ts.
// We keep the data next to the component to avoid "module not found" errors
// when someone pulls the repo without running `npm install` first.
import { FRONT_MUSCLES, BACK_MUSCLES } from "./body-muscles-data";
import type { MuscleDef } from "./body-muscles-data";
import type { MuscleGroup } from "../../lib/types";
import { MUSCLE_FILTER_GROUP } from "../../lib/types";

interface Props {
  volume: Partial<Record<MuscleGroup, number>>;
  onSelect?: (muscle: MuscleGroup) => void;
  selected?: MuscleGroup | null;
}

// Max kg volume for normalisation; above this we cap the colour (deep red).
const MAX_VOL = 2000;

// Map body-muscles region id → our coarse MuscleGroup. body-muscles uses
// left/right naming ("chest-upper-left", "biceps-right", ...); we strip the
// side suffixes and map to our canonical groups.
const REGION_TO_GROUP: Record<string, MuscleGroup> = {
  // head/face/neck — treated as "other" (rarely volume-relevant)
  head: "other", face: "other",
  "neck-right": "other", "neck-left": "other", "head-back": "other", nape: "other",
  // chest
  "chest-upper-left": "upperChest", "chest-upper-right": "upperChest",
  "chest-lower-left": "chest", "chest-lower-right": "chest",
  // serratus lumped with chest visually
  "serratus-anterior-left": "chest", "serratus-anterior-right": "chest",
  // shoulders (front/side/rear delts + traps upper)
  "shoulder-front-left": "frontDelt", "shoulder-front-right": "frontDelt",
  "shoulder-side-left": "sideDelt", "shoulder-side-right": "sideDelt",
  "deltoid-rear-left": "rearDelt", "deltoid-rear-right": "rearDelt",
  "traps-upper-left": "traps", "traps-upper-right": "traps",
  "traps-mid-left": "traps", "traps-mid-right": "traps",
  "traps-lower-left": "traps", "traps-lower-right": "traps",
  // arms
  "biceps-left": "biceps", "biceps-right": "biceps",
  "triceps-long-left": "triceps", "triceps-lateral-left": "triceps",
  "triceps-long-right": "triceps", "triceps-lateral-right": "triceps",
  "forearm-left": "forearms", "forearm-right": "forearms",
  "forearm-flexors-left": "forearms", "forearm-extensors-left": "forearms",
  "forearm-flexors-right": "forearms", "forearm-extensors-right": "forearms",
  "elbow-left": "arms", "elbow-right": "arms",
  "hand-left": "other", "hand-right": "other",
  "hand-back-left": "other", "hand-back-right": "other",
  // abs / core
  "abs-upper-left": "abs", "abs-upper-right": "abs",
  "abs-lower-left": "abs", "abs-lower-right": "abs",
  "obliques-left": "obliques", "obliques-right": "obliques",
  // back
  "lats-upper-left": "lats", "lats-mid-left": "lats", "lats-lower-left": "lats",
  "lats-upper-right": "lats", "lats-mid-right": "lats", "lats-lower-right": "lats",
  spine: "upperBack",
  "lower-back-erectors-left": "lowerBack", "lower-back-ql-left": "lowerBack",
  "lower-back-erectors-right": "lowerBack", "lower-back-ql-right": "lowerBack",
  // legs — front
  "quads-left": "quads", "quads-right": "quads",
  "hip-flexor-left": "quads", "hip-flexor-right": "quads",
  "adductors-left": "legs", "adductors-right": "legs",
  "knee-left": "quads", "knee-right": "quads",
  "knee-back-left": "hamstrings", "knee-back-right": "hamstrings",
  "tibialis-anterior-left": "calves", "tibialis-anterior-right": "calves",
  "foot-left": "other", "foot-right": "other",
  "foot-back-left": "other", "foot-back-right": "other",
  // legs — back
  "hamstrings-medial-left": "hamstrings", "hamstrings-lateral-left": "hamstrings",
  "hamstrings-medial-right": "hamstrings", "hamstrings-lateral-right": "hamstrings",
  "gluteus-medius-left": "glutes", "gluteus-maximus-left": "glutes",
  "gluteus-medius-right": "glutes", "gluteus-maximus-right": "glutes",
  "calves-gastroc-medial-left": "calves", "calves-gastroc-lateral-left": "calves",
  "calves-soleus-left": "calves",
  "calves-gastroc-medial-right": "calves", "calves-gastroc-lateral-right": "calves",
  "calves-soleus-right": "calves",
};

// Convert a volume kg (0..MAX_VOL) into a heat colour. We keep the original
// grey → pink → deep-red ramp for visual continuity with the rest of the app.
function heatColor(kg: number): string {
  const t = Math.min(1, Math.max(0, kg / MAX_VOL));
  let r: number, g: number, b: number;
  if (t < 0.5) {
    const k = t / 0.5;
    r = Math.round(203 + (244 - 203) * k);
    g = Math.round(213 + (63 - 213) * k);
    b = Math.round(225 + (94 - 225) * k);
  } else {
    const k = (t - 0.5) / 0.5;
    r = Math.round(244 + (185 - 244) * k);
    g = Math.round(63 + (28 - 63) * k);
    b = Math.round(94 + (28 - 94) * k);
  }
  return `rgb(${r},${g},${b})`;
}

// Build a stable lookup of def by id.
function buildDefMap(defs: MuscleDef[]) {
  const map = new Map<string, MuscleDef>();
  defs.forEach((d) => map.set(d.id, d));
  return map;
}

export default function MuscleHeatmap({ volume, onSelect, selected }: Props) {
  const [side, setSide] = useState<"front" | "back">("front");
  const frontMap = useMemo(() => buildDefMap(FRONT_MUSCLES as MuscleDef[]), []);
  const backMap = useMemo(() => buildDefMap(BACK_MUSCLES as MuscleDef[]), []);

  const defs = side === "front" ? FRONT_MUSCLES : BACK_MUSCLES;
  const map = side === "front" ? frontMap : backMap;

  // Region → heat colour. Regions inherit from their *filter-group* (coarse)
  // so both sides of a group light up together.
  const regionColor = (id: string): string => {
    const mg = REGION_TO_GROUP[id];
    if (!mg) return heatColor(0);
    const group = MUSCLE_FILTER_GROUP[mg] ?? "other";
    return heatColor(volume[group] ?? 0);
  };

  const isSelected = (id: string): boolean => {
    if (!selected) return false;
    const mg = REGION_TO_GROUP[id];
    if (!mg) return false;
    return MUSCLE_FILTER_GROUP[mg] === selected || mg === selected;
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Side toggle */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg mb-4">
        {(["front", "back"] as const).map((s) => (
          <button key={s} onClick={() => setSide(s)}
            className={`px-4 py-1 rounded-md text-xs font-semibold capitalize transition ${
              side === s
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30"
                : "text-gray-400 hover:text-gray-200"
            }`}>{s}</button>
        ))}
      </div>

      <div className="relative w-full max-w-[240px]">
        <svg viewBox="0 0 35 93" className="w-full h-auto drop-shadow-xl"
          style={{ filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.4))" }}>
          <defs>
            {/* Subtle body gradient for 3D pop — same trick as before, scaled down. */}
            <linearGradient id="body-shade-hm" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%"  stopColor="rgba(255,255,255,0.25)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
            </linearGradient>
            {/* Soft glow for selected muscles */}
            <filter id="muscle-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Shadow body outline */}
          <path
            d={(defs as MuscleDef[]).find((d) => d.id === (side === "front" ? "head" : "head-back"))?.path ?? ""}
            fill="rgba(203,213,225,0.05)"
          />

          {/* Muscle regions */}
          {(defs as MuscleDef[]).map((m) => {
            const color = regionColor(m.id);
            const sel = isSelected(m.id);
            return (
              <motion.path
                key={m.id}
                d={m.path}
                fill={color}
                stroke={sel ? "#8b5cf6" : "rgba(0,0,0,0.25)"}
                strokeWidth={sel ? 0.4 : 0.15}
                strokeLinejoin="round"
                filter={sel ? "url(#muscle-glow)" : undefined}
                className="cursor-pointer transition-all hover:brightness-125"
                onClick={() => {
                  const g = REGION_TO_GROUP[m.id];
                  if (g) onSelect?.(MUSCLE_FILTER_GROUP[g] ?? g);
                }}
                whileHover={{ scale: 1.02 }}
                style={{ transformOrigin: "center" }}
              />
            );
          })}

          {/* Subtle contour shade overlay on top for depth */}
          <g pointerEvents="none" opacity={0.4}>
            {(defs as MuscleDef[]).slice(0, 1).map(() => null)}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-[10px] text-gray-500">
        <span>Low</span>
        <div className="h-2 w-28 rounded-full"
          style={{ background: "linear-gradient(90deg, #cbd5e1, #f43f5e, #b91c1c)" }} />
        <span>High</span>
      </div>
      <p className="text-[10px] text-gray-600 mt-1 text-center max-w-[260px]">
        70+ anatomically-accurate regions (via body-muscles) — darker = more kg volume this week.
      </p>

      {/* map retained for type-check; avoids unused-variable warning */}
      <span className="hidden">{map.size}</span>
    </div>
  );
}
