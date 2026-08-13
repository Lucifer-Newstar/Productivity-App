"use client";

/**
 * SkillRadar — SVG radar/spider chart rendering up to 8 skills at a glance.
 * Skills are sorted by proficiency, top 8 selected, axes drawn from center,
 * area filled with a gradient. Hovering an axis highlights it.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import type { CareerSkill } from "../../lib/careerTypes";

const SIZE = 280;
const R = 110;
const CX = SIZE / 2;
const CY = SIZE / 2;

export default function SkillRadar({ skills }: { skills: CareerSkill[] }) {
  const [hover, setHover] = useState<number | null>(null);

  // Sort by proficiency desc, cap at 8 axes.
  const axes = [...skills].sort((a, b) => b.proficiency - a.proficiency).slice(0, 8);
  const N = axes.length;

  if (N < 3) {
    return (
      <div className="flex items-center justify-center text-center serif-body italic text-sm p-6 rounded-xl"
        style={{ color: "#8b9eb0", background: "rgba(12,26,34,0.6)", border: "1px dashed rgba(185,28,28,0.3)" }}>
        Add at least 3 skills to<br/>draw the radar.
      </div>
    );
  }

  const pointFor = (i: number, value: number) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    const r = (Math.max(1, Math.min(10, value)) / 10) * R;
    return [CX + Math.cos(angle) * r, CY + Math.sin(angle) * r];
  };
  const axisPoint = (i: number) => pointFor(i, 10);
  const polyPoints = axes.map((s, i) => pointFor(i, s.proficiency).join(",")).join(" ");

  // Confidence overlay (dashed)
  const confPoints = axes.map((s, i) => pointFor(i, s.confidence).join(",")).join(" ");

  return (
    <div className="relative">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto">
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.15" />
          </radialGradient>
        </defs>

        {/* concentric rings */}
        {[2,4,6,8,10].map((v) => {
          const pts = axes.map((_, i) => pointFor(i, v).join(",")).join(" ");
          return (
            <polygon key={v} points={pts} fill="none"
              stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
          );
        })}

        {/* axis lines */}
        {axes.map((_, i) => {
          const [x, y] = axisPoint(i);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" />;
        })}

        {/* confidence overlay */}
        <motion.polygon initial={{ opacity: 0 }} animate={{ opacity: 0.35 }}
          points={confPoints} fill="none" stroke="#d4af37" strokeWidth={1.2} strokeDasharray="3 3" />

        {/* proficiency fill */}
        <motion.polygon
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
          points={polyPoints}
          fill="url(#radarFill)" stroke="#b91c1c" strokeWidth={2}
          strokeLinejoin="round"
          filter="drop-shadow(0 0 10px rgba(185,28,28,0.6))"
        />

        {/* dots */}
        {axes.map((s, i) => {
          const [x, y] = pointFor(i, s.proficiency);
          const [ax, ay] = axisPoint(i);
          const isHover = hover === i;
          return (
            <g key={s.id} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
               style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r={isHover ? 6 : 4} fill="#ec4899"
                style={{ filter: "drop-shadow(0 0 6px #ec4899)" }} />
              <text x={ax + (ax < CX ? -8 : 8)} y={ay}
                textAnchor={ax < CX ? "end" : "start"}
                dominantBaseline="middle"
                fontSize={isHover ? 12 : 10}
                fontWeight={isHover ? 800 : 400}
                fill={isHover ? "#fde68a" : "#c4cfd9"}
                fontFamily="Cinzel,serif">
                {s.name.length > 12 ? s.name.slice(0,11)+"…" : s.name}
              </text>
            </g>
          );
        })}

        {/* center */}
        <circle cx={CX} cy={CY} r={3} fill="#d4af37" />
      </svg>

      {hover !== null && axes[hover] && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 -translate-x-1/2 -bottom-2 rounded-lg px-3 py-1.5 text-center"
          style={{ background: "rgba(12,26,34,0.95)", border: "1px solid #ec489966", minWidth: 140 }}>
          <div className="text-[11px] emperor-title tracking-widest" style={{ color: "#ec4899" }}>
            {axes[hover].name}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: "#8b9eb0" }}>
            LVL {axes[hover].proficiency} · conf {axes[hover].confidence} · int {axes[hover].interest}
          </div>
        </motion.div>
      )}

      <div className="flex justify-center gap-3 mt-1 text-[9px] emperor-title tracking-widest">
        <span className="flex items-center gap-1" style={{color:"#b91c1c"}}>
          <span className="w-3 h-0.5" style={{background:"#b91c1c"}}/> PROFICIENCY
        </span>
        <span className="flex items-center gap-1" style={{color:"#d4af37"}}>
          <span className="w-3 h-0.5" style={{background:"#d4af37",borderTop:"1px dashed #d4af37"}}/> CONFIDENCE
        </span>
      </div>
    </div>
  );
}
