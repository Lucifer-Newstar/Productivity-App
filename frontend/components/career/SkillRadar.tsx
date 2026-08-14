"use client";

/**
 * SkillRadar — SVG radar/spider chart rendering up to 8 skills at a glance.
 * Cyan = proficiency (solid fill), violet = confidence (dashed overlay),
 * pink dots per axis. Colors fall back via CSS variables so blueprint light
 * mode works automatically.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import type { CareerSkill } from "../../lib/careerTypes";

const SIZE = 280;
const R = 110;
const CX = SIZE / 2;
const CY = SIZE / 2;

const PROF = "#22d3ee";
const CONF = "#a78bfa";
const DOT  = "#f472b6";

export default function SkillRadar({ skills }: { skills: CareerSkill[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const axes = [...skills].sort((a, b) => b.proficiency - a.proficiency).slice(0, 8);
  const N = axes.length;

  if (N < 3) {
    return (
      <div className="flex items-center justify-center text-center text-sm p-6 rounded-sm hud-corner"
        style={{ color: "var(--cr-fgMuted)", background: "var(--cr-card2)", border: "1px dashed var(--cr-border)" }}>
        <span className="c-tr"/><span className="c-bl"/>
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
  const confPoints = axes.map((s, i) => pointFor(i, s.confidence).join(",")).join(" ");

  return (
    <div className="relative">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto">
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={PROF} stopOpacity="0.55" />
            <stop offset="100%" stopColor={CONF} stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {/* concentric rings */}
        {[2,4,6,8,10].map((v) => {
          const pts = axes.map((_, i) => pointFor(i, v).join(",")).join(" ");
          return (
            <polygon key={v} points={pts} fill="none"
              stroke="var(--cr-borderSoft)" strokeWidth={1} />
          );
        })}

        {/* axis lines */}
        {axes.map((_, i) => {
          const [x, y] = axisPoint(i);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--cr-border)" strokeWidth={1} />;
        })}

        {/* confidence overlay (dashed violet) */}
        <motion.polygon initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}
          points={confPoints} fill="none" stroke={CONF} strokeWidth={1.2} strokeDasharray="3 3" />

        {/* proficiency fill (cyan) */}
        <motion.polygon
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
          points={polyPoints}
          fill="url(#radarFill)" stroke={PROF} strokeWidth={2}
          strokeLinejoin="round"
          filter={`drop-shadow(0 0 10px ${PROF}99)`}
        />

        {/* dots + labels */}
        {axes.map((s, i) => {
          const [x, y] = pointFor(i, s.proficiency);
          const [ax, ay] = axisPoint(i);
          const isHover = hover === i;
          return (
            <g key={s.id} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
               style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r={isHover ? 6 : 4} fill={DOT}
                style={{ filter: `drop-shadow(0 0 6px ${DOT})` }} />
              <text x={ax + (ax < CX ? -8 : 8)} y={ay}
                textAnchor={ax < CX ? "end" : "start"}
                dominantBaseline="middle"
                fontSize={isHover ? 12 : 10}
                fontWeight={isHover ? 800 : 500}
                fill={isHover ? "var(--cr-fg)" : "var(--cr-fgMuted)"}
                fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace">
                {s.name.length > 12 ? s.name.slice(0,11)+"…" : s.name}
              </text>
            </g>
          );
        })}

        <circle cx={CX} cy={CY} r={3} fill={CONF} />
      </svg>

      {hover !== null && axes[hover] && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 -translate-x-1/2 -bottom-2 rounded-sm px-3 py-1.5 text-center hud-corner"
          style={{ background: "var(--cr-card)", border: `1px solid ${DOT}88`, minWidth: 140 }}>
          <span className="c-tr"/><span className="c-bl"/>
          <div className="text-[11px] tracking-widest font-bold" style={{color:DOT}}>
            {axes[hover].name}
          </div>
          <div className="text-[10px] mt-0.5 tracking-wide" style={{color:"var(--cr-fgMuted)"}}>
            lvl {axes[hover].proficiency} · conf {axes[hover].confidence} · int {axes[hover].interest}
          </div>
        </motion.div>
      )}

      <div className="flex justify-center gap-3 mt-1 text-[9px] tracking-widest font-bold">
        <span className="flex items-center gap-1" style={{color:PROF}}>
          <span className="w-3 h-0.5" style={{background:PROF}}/> PROFICIENCY
        </span>
        <span className="flex items-center gap-1" style={{color:CONF}}>
          <span className="w-3" style={{borderTop:`1px dashed ${CONF}`}}/> CONFIDENCE
        </span>
      </div>
    </div>
  );
}
