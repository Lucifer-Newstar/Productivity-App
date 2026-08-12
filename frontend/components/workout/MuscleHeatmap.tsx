"use client";

/**
 * MuscleHeatmap — interactive SVG front/back anatomical figure.
 *
 * Muscles are colored by kg volume trained in the last 7 days (scale: 0 → grey,
 * hotter pinks/reds as volume increases). Clicking a muscle fires `onSelect`.
 * Front/back toggle via the "Back" button.
 *
 * The SVG is hand-drawn at 200×440 viewBox. Muscle paths are named by the
 * MuscleGroup ids we use in types. The "3D" feel comes from subtle inner
 * shadows (linear gradients) + stroke highlights, no external 3D libs needed.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import type { MuscleGroup } from "../../lib/types";

interface Props {
  // Map of muscle filter-group → kg volume for the last week
  volume: Partial<Record<MuscleGroup, number>>;
  onSelect?: (muscle: MuscleGroup) => void;
  selected?: MuscleGroup | null;
}

// Max volume for normalisation; above this we cap the colour (deep red).
const MAX_VOL = 2000;

// Convert volume → heat colour: light pink (low) → deep red (high).
function heatColor(kg: number): string {
  const t = Math.min(1, Math.max(0, kg / MAX_VOL));
  // Interpolate from #cbd5e1 (grey-300) → #f43f5e (rose-500) → #b91c1c (red-700)
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

export default function MuscleHeatmap({ volume, onSelect, selected }: Props) {
  const [side, setSide] = useState<"front" | "back">("front");

  const vol = (m: MuscleGroup) => volume[m] ?? 0;
  const fill = (m: MuscleGroup) => heatColor(vol(m));
  const stroke = (m: MuscleGroup) =>
    selected === m ? "#8b5cf6" : "rgba(0,0,0,0.15) dark:rgba(255,255,255,0.08)";
  const sw = (m: MuscleGroup) => (selected === m ? 2.5 : 1);

  // Common props for a clickable muscle region.
  const mp = (m: MuscleGroup) => ({
    className: "cursor-pointer transition-all hover:brightness-110",
    fill: fill(m), stroke: stroke(m), strokeWidth: sw(m),
    onClick: () => onSelect?.(m),
  });

  return (
    <div className="flex flex-col items-center">
      {/* Side toggle */}
      <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-lg mb-4">
        {(["front", "back"] as const).map((s) => (
          <button key={s} onClick={() => setSide(s)}
            className={`px-4 py-1 rounded-md text-xs font-semibold capitalize transition ${
              side === s ? "bg-gradient-to-r from-accent to-accent-pink text-white shadow" : "text-gray-500"
            }`}>{s}</button>
        ))}
      </div>

      <div className="relative w-full max-w-[260px] aspect-[200/440]">
        <svg viewBox="0 0 200 440" className="w-full h-full drop-shadow-lg">
          <defs>
            {/* Soft body gradient for subtle 3D */}
            <linearGradient id="body-shade" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%"  stopColor="rgba(255,255,255,0.35)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
            </linearGradient>
          </defs>

          {side === "front" ? (
            <g>
              {/* Head (neck area hint) */}
              <ellipse cx="100" cy="40" rx="22" ry="26" fill={heatColor(0)} stroke={stroke("other")} strokeWidth={1} />
              {/* Neck */}
              <rect x="90" y="58" width="20" height="16" rx="4" fill={heatColor(0)} stroke={stroke("other")} strokeWidth={1} />
              {/* Torso (core/chest overlay) */}
              <path d="M50 80 Q50 70 65 72 L135 72 Q150 70 150 80 L148 180 Q140 200 100 200 Q60 200 52 180 Z"
                {...mp("core")} />
              {/* Chest */}
              <path d="M60 86 Q70 84 78 92 Q84 110 72 128 Q60 122 56 110 Z" {...mp("chest")} />
              <path d="M140 86 Q130 84 122 92 Q116 110 128 128 Q140 122 144 110 Z" {...mp("chest")} />
              {/* Upper chest (subtle) */}
              <path d="M65 80 Q80 78 100 82 Q120 78 135 80 L135 88 Q110 92 90 92 L65 88 Z" fill={fill("upperChest")} stroke={stroke("chest")} strokeWidth={sw("chest")} className="cursor-pointer" onClick={() => onSelect?.("chest")} />
              {/* Abs */}
              <g>
                <rect x="80" y="128" width="16" height="14" rx="3" {...mp("abs")} />
                <rect x="104" y="128" width="16" height="14" rx="3" {...mp("abs")} />
                <rect x="80" y="146" width="16" height="14" rx="3" {...mp("abs")} />
                <rect x="104" y="146" width="16" height="14" rx="3" {...mp("abs")} />
                <rect x="80" y="164" width="16" height="14" rx="3" {...mp("abs")} />
                <rect x="104" y="164" width="16" height="14" rx="3" {...mp("abs")} />
                {/* Obliques */}
                <path d="M60 140 L78 132 L78 180 Q70 190 56 180 Z" {...mp("obliques")} />
                <path d="M140 140 L122 132 L122 180 Q130 190 144 180 Z" {...mp("obliques")} />
              </g>
              {/* Shoulders (front delts) */}
              <path d="M48 80 Q42 78 40 90 Q40 100 52 104 L60 96 Z" {...mp("frontDelt")} />
              <path d="M152 80 Q158 78 160 90 Q160 100 148 104 L140 96 Z" {...mp("frontDelt")} />
              {/* Side delts hint */}
              <circle cx="40" cy="94" r="10" {...mp("sideDelt")} />
              <circle cx="160" cy="94" r="10" {...mp("sideDelt")} />
              {/* Biceps */}
              <path d="M46 104 Q38 120 42 150 Q48 160 56 152 L60 120 Z" {...mp("biceps")} />
              <path d="M154 104 Q162 120 158 150 Q152 160 144 152 L140 120 Z" {...mp("biceps")} />
              {/* Triceps hint (front shows outer) */}
              <path d="M52 104 Q48 128 52 156 L58 152 L60 118 Z" fill={fill("triceps")} stroke={stroke("triceps")} strokeWidth={sw("triceps")} className="cursor-pointer" onClick={() => onSelect?.("triceps")} />
              <path d="M148 104 Q152 128 148 156 L142 152 L140 118 Z" fill={fill("triceps")} stroke={stroke("triceps")} strokeWidth={sw("triceps")} className="cursor-pointer" onClick={() => onSelect?.("triceps")} />
              {/* Forearms */}
              <rect x="44" y="152" width="18" height="40" rx="7" {...mp("forearms")} />
              <rect x="138" y="152" width="18" height="40" rx="7" {...mp("forearms")} />
              {/* Quads */}
              <path d="M68 200 Q60 250 66 310 L86 310 L94 230 L96 200 Z" {...mp("quads")} />
              <path d="M132 200 Q140 250 134 310 L114 310 L106 230 L104 200 Z" {...mp("quads")} />
              {/* Knees */}
              <ellipse cx="76" cy="312" rx="12" ry="7" fill={heatColor(vol("quads") * 0.6)} stroke={stroke("quads")} strokeWidth={sw("quads")} />
              <ellipse cx="124" cy="312" rx="12" ry="7" fill={heatColor(vol("quads") * 0.6)} stroke={stroke("quads")} strokeWidth={sw("quads")} />
              {/* Calves */}
              <path d="M70 320 Q62 360 70 400 L86 400 Q88 370 88 320 Z" {...mp("calves")} />
              <path d="M130 320 Q138 360 130 400 L114 400 Q112 370 112 320 Z" {...mp("calves")} />
              {/* Subtle shade overlay */}
              <path d="M50 80 L150 80 L148 180 L52 180 Z M46 104 L60 120 L56 152 L44 152 Z M154 104 L140 120 L144 152 L156 152 Z M68 200 L96 200 L94 310 L66 310 Z M132 200 L104 200 L106 310 L134 310 Z" fill="url(#body-shade)" pointerEvents="none" />
            </g>
          ) : (
            <g>
              {/* Head */}
              <ellipse cx="100" cy="40" rx="22" ry="26" fill={heatColor(0)} stroke={stroke("other")} strokeWidth={1} />
              <rect x="90" y="58" width="20" height="16" rx="4" fill={heatColor(0)} stroke={stroke("other")} strokeWidth={1} />
              {/* Back torso */}
              <path d="M50 80 Q50 70 65 72 L135 72 Q150 70 150 80 L148 190 Q140 205 100 205 Q60 205 52 190 Z" {...mp("back")} />
              {/* Traps */}
              <path d="M58 70 Q72 62 100 70 Q128 62 142 70 L138 88 Q120 82 100 84 Q80 82 62 88 Z" {...mp("traps")} />
              {/* Lats */}
              <path d="M54 120 Q70 140 78 190 L60 190 Q48 170 50 130 Z" {...mp("lats")} />
              <path d="M146 120 Q130 140 122 190 L140 190 Q152 170 150 130 Z" {...mp("lats")} />
              {/* Upper back */}
              <path d="M64 90 Q100 95 136 90 L134 120 Q100 128 66 120 Z" {...mp("upperBack")} />
              {/* Lower back */}
              <path d="M80 150 L120 150 L116 198 L84 198 Z" fill={fill("lowerBack")} stroke={stroke("lowerBack")} strokeWidth={sw("lowerBack")} className="cursor-pointer" onClick={() => onSelect?.("back")} />
              {/* Spine line */}
              <line x1="100" y1="90" x2="100" y2="200" stroke="rgba(0,0,0,0.2)" strokeWidth="1" strokeDasharray="2 3" />
              {/* Rear delts */}
              <circle cx="48" cy="88" r="11" {...mp("rearDelt")} />
              <circle cx="152" cy="88" r="11" {...mp("rearDelt")} />
              {/* Triceps (back arm) */}
              <path d="M46 100 Q38 122 44 154 Q50 162 58 154 L60 120 Z" {...mp("triceps")} />
              <path d="M154 100 Q162 122 156 154 Q150 162 142 154 L140 120 Z" {...mp("triceps")} />
              {/* Biceps hint */}
              <path d="M52 104 L60 120 L56 148 L48 148 Z" fill={fill("biceps")} stroke={stroke("biceps")} strokeWidth={sw("biceps")} className="cursor-pointer" onClick={() => onSelect?.("biceps")} />
              <path d="M148 104 L140 120 L144 148 L152 148 Z" fill={fill("biceps")} stroke={stroke("biceps")} strokeWidth={sw("biceps")} className="cursor-pointer" onClick={() => onSelect?.("biceps")} />
              {/* Forearms */}
              <rect x="44" y="154" width="18" height="40" rx="7" {...mp("forearms")} />
              <rect x="138" y="154" width="18" height="40" rx="7" {...mp("forearms")} />
              {/* Glutes */}
              <path d="M60 200 Q72 230 94 232 Q100 210 100 200 Z" {...mp("glutes")} />
              <path d="M140 200 Q128 230 106 232 Q100 210 100 200 Z" {...mp("glutes")} />
              {/* Hamstrings */}
              <path d="M66 228 Q60 270 68 310 L86 310 L92 240 L94 228 Z" {...mp("hamstrings")} />
              <path d="M134 228 Q140 270 132 310 L114 310 L108 240 L106 228 Z" {...mp("hamstrings")} />
              {/* Calves */}
              <path d="M70 318 Q62 360 70 400 L86 400 Q88 370 88 318 Z" {...mp("calves")} />
              <path d="M130 318 Q138 360 130 400 L114 400 Q112 370 112 318 Z" {...mp("calves")} />
              {/* Shade overlay */}
              <path d="M50 80 L150 80 L148 190 L52 190 Z" fill="url(#body-shade)" pointerEvents="none" />
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-[10px] text-gray-500">
        <span>Low</span>
        <div className="h-2 w-28 rounded-full"
          style={{ background: "linear-gradient(90deg, #cbd5e1, #f43f5e, #b91c1c)" }} />
        <span>High</span>
      </div>
    </div>
  );
}
