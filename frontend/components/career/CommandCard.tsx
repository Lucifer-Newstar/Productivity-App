"use client";

/**
 * CommandCard — the big navigation card summoned by the COMMAND button.
 * Inline in the page (not a modal). Golden-dragon + sword-slash reveal,
 * section tiles with Roman sigils, colors, descriptions, hover lift.
 * Mirrors workout's BattleCard but uses career-specific copy/colors/nav.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Swords } from "lucide-react";
import { CAREER_NAV, type CareerSectionId } from "./CareerShell";
import GoldenDragon from "../workout/GoldenDragon";

interface Props {
  current: CareerSectionId;
  onPick: (s: CareerSectionId) => void;
}

export default function CommandCard({ current, onPick }: Props) {
  return (
    <motion.div
      key="career-command-card"
      initial={{ opacity: 0, y: 30, scale: 0.96, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.98, rotateX: 5 }}
      transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
      className="relative w-full max-w-5xl mx-auto rounded-3xl p-6 md:p-10 overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #0c1a22 0%, #0a1418 60%, #0a0709 100%)",
        border: "2px solid rgba(103,232,249,0.45)",
        boxShadow:
          "0 30px 80px -20px rgba(0,0,0,0.9), " +
          "inset 0 1px 0 rgba(103,232,249,0.25), " +
          "0 0 80px -10px rgba(6,182,212,0.5)",
        perspective: 1200,
      }}>
      <span aria-hidden className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          padding: 1,
          background: "linear-gradient(135deg, rgba(103,232,249,0.75), transparent 40%, rgba(212,175,55,0.5) 90%)",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor", maskComposite: "exclude",
        }} />

      {/* Damascus scales */}
      <div aria-hidden className="absolute inset-0 scale-pattern opacity-20 pointer-events-none" />
      <div aria-hidden className="absolute inset-0 grille-pattern opacity-15 pointer-events-none" />

      <AnimatePresence>
        <GoldenDragon />
      </AnimatePresence>

      {/* Slashes */}
      <motion.div aria-hidden
        initial={{ clipPath: "inset(0 100% 100% 0)", opacity: 0 }}
        animate={{ clipPath: "inset(0 -10% -10% 0)", opacity: [0,1,1,0] }}
        transition={{ duration: 0.6, ease: [0.7,0,0.3,1] }}
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: "linear-gradient(135deg, transparent 45%, rgba(103,232,249,0.95) 49%, #fff 50%, rgba(103,232,249,0.95) 51%, transparent 55%)",
          filter: "drop-shadow(0 0 18px rgba(103,232,249,1)) drop-shadow(0 0 40px rgba(212,175,55,0.7))",
        }} />
      <motion.div aria-hidden
        initial={{ clipPath: "inset(100% 0 0 100%)", opacity: 0 }}
        animate={{ clipPath: "inset(-10% 0 0 -10%)", opacity: [0,1,1,0] }}
        transition={{ duration: 0.7, ease: [0.7,0,0.3,1], delay: 0.08 }}
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: "linear-gradient(45deg, transparent 45%, rgba(212,175,55,0.9) 49%, #fff 50%, rgba(212,175,55,0.9) 51%, transparent 55%)",
          filter: "drop-shadow(0 0 20px rgba(212,175,55,1))",
        }} />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2" style={{ color: "#67e8f9" }}>
            <span className="h-[1px] w-8 md:w-14" style={{ background: "linear-gradient(90deg, transparent, #67e8f9)" }} />
            <span className="text-[10px] md:text-xs tracking-[0.5em] font-imperial">COMMAND · CENTER</span>
            <span className="h-[1px] w-8 md:w-14" style={{ background: "linear-gradient(90deg, #67e8f9, transparent)" }} />
          </div>
          <h2 className="font-jp font-black text-5xl md:text-7xl mt-3 leading-none"
            style={{
              background: "linear-gradient(135deg, #67e8f9 0%, #d4af37 50%, #b91c1c 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              filter: "drop-shadow(0 0 28px rgba(6,182,212,0.4))",
            }}>
            成長
          </h2>
          <p className="emperor-title text-xs md:text-sm mt-2 tracking-[0.4em]" style={{ color: "#d4af37" }}>
            C A R E E R · C O M M A N D
          </p>
          <p className="serif-body italic mt-3 text-sm md:text-base max-w-xl" style={{ color: "#a5f3fc" }}>
            Choose your front, commander. Every roadmap mastered, every contact
            nurtured, every application sent — one step closer to your throne.
          </p>
        </div>
        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[28%] flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, #0e7490, #164e63)",
            border: "2px solid rgba(103,232,249,0.6)",
            boxShadow: "0 0 40px -8px rgba(6,182,212,0.9), inset 0 2px 0 rgba(186,230,253,0.3)",
          }}>
          <motion.div animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-6px] rounded-[28%] pointer-events-none"
            style={{ border: "1px dashed rgba(212,175,55,0.4)" }} />
          <span className="imperial-name text-3xl md:text-4xl text-amber-100"
            style={{ textShadow: "0 0 14px rgba(103,232,249,0.7)" }}>K</span>
        </div>
      </div>

      <div className="k-blade mb-6" style={{ opacity: 0.7 }} />

      {/* Grid */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {CAREER_NAV.map((item, i) => <NavTile key={item.id} item={item} active={item.id === current} delay={0.35 + i * 0.06} onPick={onPick} />)}
      </div>

      <div className="k-blade mt-8 relative z-10" style={{ opacity: 0.7 }} />
      <p className="relative z-10 text-center text-[10px] md:text-xs emperor-title tracking-[0.4em] mt-4"
        style={{ color: "rgba(103,232,249,0.7)" }}>
        一 · 歩 · 一 · 歩
      </p>
    </motion.div>
  );
}

function NavTile({ item, active, delay, onPick }:
  { item: typeof CAREER_NAV[number]; active: boolean; delay: number; onPick: (s: CareerSectionId) => void }) {
  const Icon = item.icon;
  return (
    <motion.button onClick={() => onPick(item.id)}
      initial={{ opacity: 0, y: 25, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.22,1,0.36,1] }}
      whileHover={{ y: -5, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="relative group rounded-xl p-4 md:p-5 text-left overflow-hidden transition"
      style={{
        background: active
          ? `linear-gradient(135deg, ${item.color}35, ${item.color}08)`
          : "linear-gradient(145deg, rgba(12,26,34,0.95), rgba(10,20,24,0.85))",
        border: `1px solid ${active ? item.color : "rgba(103,232,249,0.2)"}`,
        boxShadow: active
          ? `0 10px 30px -10px ${item.color}cc, inset 0 1px 0 ${item.color}50, 0 0 30px -5px ${item.color}66`
          : "inset 0 1px 0 rgba(103,232,249,0.12), 0 6px 18px -10px rgba(0,0,0,0.7)",
      }}>
      <span aria-hidden className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(135deg, ${item.color}00, ${item.color}25 50%, ${item.color}00)`, backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }} />
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-xl"
        style={{ background: `linear-gradient(180deg, ${item.color}, ${item.color}90)`, boxShadow: `0 0 14px ${item.color}aa` }} />

      <div className="flex items-start gap-3">
        <div className="w-11 h-11 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0 transition group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${item.color}55, ${item.color}15)`,
            border: `1px solid ${item.color}80`,
            color: item.color,
            boxShadow: `0 6px 16px -6px ${item.color}aa`,
          }}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="emperor-title font-black text-sm md:text-base tracking-[0.12em]" style={{ color: active ? "#67e8f9" : "#e0f2fe" }}>
              {item.label}
            </span>
          </div>
          <div className="text-[10px] emperor-title tracking-[0.35em] mt-0.5" style={{ color: item.color }}>{item.sigil}</div>
          {item.description && (
            <p className="text-[11px] md:text-xs serif-body italic mt-1.5 leading-snug" style={{ color: "#a8b8c8" }}>
              {item.description}
            </p>
          )}
        </div>
      </div>

      {active && (
        <motion.span layoutId="career-active-dot"
          className="absolute top-3 right-3 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
        </motion.span>
      )}
    </motion.button>
  );
}
