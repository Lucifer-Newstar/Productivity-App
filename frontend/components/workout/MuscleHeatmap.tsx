"use client";

/**
 * MuscleHeatmap — interactive anatomical SVG with both anterior (front) and
 * posterior (back) views. Back muscles are authored at x≈32..67 (offset from
 * front by ~34 units), so we <g transform="translate(-34,0)"> to bring them
 * into the same viewBox as the front figure.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FRONT_MUSCLES, BACK_MUSCLES } from "./body-muscles-data";
import type { MuscleDef } from "./body-muscles-data";
import type { MuscleGroup } from "../../lib/types";
import { MUSCLE_FILTER_GROUP } from "../../lib/types";

interface Props {
  volume: Partial<Record<MuscleGroup, number>>;
  onSelect?: (muscle: MuscleGroup) => void;
  selected?: MuscleGroup | null;
  compact?: boolean;
  highlight?: MuscleGroup | null;
  hoverable?: boolean;
}

const MAX_VOL = 2000;

// body-muscles region id → canonical MuscleGroup
const REGION_TO_GROUP: Record<string, MuscleGroup> = {
  head: "other", face: "other",
  "neck-right": "other", "neck-left": "other", "head-back": "other", nape: "other",
  "chest-upper-left": "upperChest", "chest-upper-right": "upperChest",
  "chest-lower-left": "chest", "chest-lower-right": "chest",
  "serratus-anterior-left": "chest", "serratus-anterior-right": "chest",
  "shoulder-front-left": "frontDelt", "shoulder-front-right": "frontDelt",
  "shoulder-side-left": "sideDelt", "shoulder-side-right": "sideDelt",
  "deltoid-rear-left": "rearDelt", "deltoid-rear-right": "rearDelt",
  "traps-upper-left": "traps", "traps-mid-left": "traps", "traps-lower-left": "traps",
  "traps-upper-right": "traps", "traps-mid-right": "traps", "traps-lower-right": "traps",
  "biceps-left": "biceps", "biceps-right": "biceps",
  "triceps-long-left": "triceps", "triceps-lateral-left": "triceps",
  "triceps-long-right": "triceps", "triceps-lateral-right": "triceps",
  "forearm-left": "forearms", "forearm-right": "forearms",
  "forearm-flexors-left": "forearms", "forearm-extensors-left": "forearms",
  "forearm-flexors-right": "forearms", "forearm-extensors-right": "forearms",
  "elbow-left": "arms", "elbow-right": "arms",
  "hand-left": "other", "hand-right": "other", "hand-back-left": "other", "hand-back-right": "other",
  "abs-upper-left": "abs", "abs-upper-right": "abs",
  "abs-lower-left": "abs", "abs-lower-right": "abs",
  "obliques-left": "obliques", "obliques-right": "obliques",
  spine: "upperBack",
  "lats-upper-left": "lats", "lats-mid-left": "lats", "lats-lower-left": "lats",
  "lats-upper-right": "lats", "lats-mid-right": "lats", "lats-lower-right": "lats",
  "lower-back-erectors-left": "lowerBack", "lower-back-ql-left": "lowerBack",
  "lower-back-erectors-right": "lowerBack", "lower-back-ql-right": "lowerBack",
  "quads-left": "quads", "quads-right": "quads",
  "hip-flexor-left": "quads", "hip-flexor-right": "quads",
  "adductors-left": "legs", "adductors-right": "legs",
  "knee-left": "quads", "knee-right": "quads",
  "knee-back-left": "hamstrings", "knee-back-right": "hamstrings",
  "tibialis-anterior-left": "calves", "tibialis-anterior-right": "calves",
  "foot-left": "other", "foot-right": "other", "foot-back-left": "other", "foot-back-right": "other",
  "hamstrings-medial-left": "hamstrings", "hamstrings-lateral-left": "hamstrings",
  "hamstrings-medial-right": "hamstrings", "hamstrings-lateral-right": "hamstrings",
  "gluteus-medius-left": "glutes", "gluteus-maximus-left": "glutes",
  "gluteus-medius-right": "glutes", "gluteus-maximus-right": "glutes",
  "calves-gastroc-medial-left": "calves", "calves-gastroc-lateral-left": "calves", "calves-soleus-left": "calves",
  "calves-gastroc-medial-right": "calves", "calves-gastroc-lateral-right": "calves", "calves-soleus-right": "calves",
};

function heatColor(kg: number, highlighted?: boolean): string {
  if (highlighted) return "#8b5cf6";
  const t = Math.min(1, Math.max(0, kg / MAX_VOL));
  if (t < 0.02) return "rgba(203,213,225,0.18)";
  let r, g, b;
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

// Compute region colour + selection for a given definition
function regionState(id: string, volume: Props["volume"], selected: MuscleGroup | null | undefined, highlight: MuscleGroup | null | undefined) {
  const mg = REGION_TO_GROUP[id];
  const group = mg ? (MUSCLE_FILTER_GROUP[mg] ?? "other") : "other";
  const isSelected = !!selected && (MUSCLE_FILTER_GROUP[mg as MuscleGroup] === selected || mg === selected);
  const isHighlight = !!highlight && (MUSCLE_FILTER_GROUP[mg as MuscleGroup] === highlight || mg === highlight);
  const kg = volume[group] ?? 0;
  return { color: isHighlight ? heatColor(kg, true) : heatColor(kg), isSelected, isHighlight, group };
}

export default function MuscleHeatmap({ volume, onSelect, selected, compact, highlight, hoverable = true }: Props) {
  const [side, setSide] = useState<"front" | "back">("front");
  const [hover, setHover] = useState<string | null>(null);
  const defs: MuscleDef[] = side === "front" ? (FRONT_MUSCLES as MuscleDef[]) : (BACK_MUSCLES as MuscleDef[]);

  const maxW = compact ? 200 : 260;

  return (
    <div className={`flex flex-col items-center ${compact ? "gap-1" : "w-full gap-3"}`}>
      {!compact && (
        <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
          {(["front","back"] as const).map((s) => (
            <button key={s} onClick={() => setSide(s)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition ${
                side === s ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white" : "text-gray-400 hover:text-gray-200"
              }`}>{s}</button>
          ))}
        </div>
      )}

      <div className={`relative ${compact ? "max-w-[140px]" : "max-w-[260px]"} w-full`}>
        <svg viewBox="-8 -28 48 125" className="w-full h-auto"
          style={{ filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.4))" }}>
          <defs>
            <filter id="muscle-glow-hm" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Body outline shadow for readability */}
          <path fill="rgba(203,213,225,0.05)"
            d={defs.find(d=>d.id===(side==="front"?"head":"head-back"))?.path ?? ""}/>

          <g transform={side==="back" ? "translate(-34,0)" : undefined}>
            {defs.map((m) => {
              const { color, isSelected, isHighlight } = regionState(m.id, volume, selected, highlight);
              return (
                <motion.path
                  key={m.id}
                  d={m.path}
                  fill={color}
                  stroke={isSelected || isHighlight ? "#c4b5fd" : "rgba(0,0,0,0.35)"}
                  strokeWidth={isSelected || isHighlight ? 0.5 : 0.15}
                  strokeLinejoin="round"
                  filter={isSelected || isHighlight ? "url(#muscle-glow-hm)" : undefined}
                  className={hoverable || onSelect ? "cursor-pointer" : ""}
                  onMouseEnter={() => setHover(m.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => {
                    const mg = REGION_TO_GROUP[m.id];
                    if (mg && onSelect) onSelect(MUSCLE_FILTER_GROUP[mg] ?? mg);
                  }}
                  whileHover={hoverable ? { filter: "brightness(1.25)" } as any : undefined}
                  style={{ transition: "fill 0.2s, filter 0.2s" }}
                />
              );
            })}
          </g>
        </svg>
        {hover && hoverable && (
          <div className="absolute top-1 right-1 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded">
            {(defs.find(d=>d.id===hover) as any)?.name ?? hover}
          </div>
        )}
      </div>

      {!compact && (
        <>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span>Low</span>
            <div className="h-2 w-28 rounded-full" style={{background:"linear-gradient(90deg,rgba(203,213,225,0.18),#f43f5e,#b91c1c)"}}/>
            <span>High</span>
          </div>
          <p className="text-[10px] text-gray-600 text-center max-w-[260px]">
            89 anatomically-accurate regions · click a muscle to filter.
          </p>
        </>
      )}
    </div>
  );
}
