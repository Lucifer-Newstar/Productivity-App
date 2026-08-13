"use client";

/**
 * CommandCard — the big navigation card summoned by the COMMAND button.
 * Inline in the page (not a modal). Terminal/HUD style: no dragon, no kanji,
 * angular corner brackets, mono font, scanline overlay, numbered tiles.
 */

import { AnimatePresence, motion } from "framer-motion";
import { CAREER_NAV, type CareerSectionId } from "./CareerShell";
import { Terminal, Cpu } from "lucide-react";

interface Props {
  current: CareerSectionId;
  onPick: (s: CareerSectionId) => void;
}

export default function CommandCard({ current, onPick }: Props) {
  return (
    <motion.div
      key="career-command-card"
      initial={{ opacity: 0, y: 20, scale: 0.98, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, scale: 0.99, filter: "blur(4px)" }}
      transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
      className="relative w-full max-w-5xl mx-auto rounded-sm p-6 md:p-8 overflow-hidden hud-corner font-mono"
      style={{
        color: "#cbd5e1",
        background: "linear-gradient(180deg, rgba(8,18,30,0.97) 0%, rgba(4,10,18,0.98) 100%)",
        border: "1px solid rgba(34,211,238,0.45)",
        boxShadow:
          "0 30px 80px -20px rgba(0,0,0,0.9), inset 0 1px 0 rgba(34,211,238,0.2), 0 0 60px -15px rgba(34,211,238,0.35)",
      }}>
      <span className="c-tr"/><span className="c-bl"/>

      {/* Grid + scanlines */}
      <div aria-hidden className="pointer-events-none absolute inset-0 career-hud-grid opacity-40" />
      <div aria-hidden className="pointer-events-none absolute inset-0 career-scanlines" />

      {/* Top status lines (terminal-esque) */}
      <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] tracking-widest" style={{color:"#475569"}}>
        <span style={{color:"#34d399"}}>●</span> session::active
        <span>|</span>
        <span>user: <span style={{color:"#22d3ee"}}>k</span></span>
        <span>|</span>
        <span>sector: <span style={{color:"#a78bfa"}}>career</span></span>
        <span>|</span>
        <span>modules: <span style={{color:"#facc15"}}>{CAREER_NAV.length}</span></span>
        <span className="ml-auto hidden md:inline">press <kbd className="px-1 rounded-sm" style={{border:"1px solid rgba(34,211,238,0.4)",color:"#22d3ee"}}>esc</kbd> to dismiss</span>
      </div>

      {/* Header */}
      <div className="relative z-10 mt-5 mb-6 flex flex-col md:flex-row md:items-end gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] md:text-xs tracking-[0.4em]" style={{color:"#22d3ee"}}>
            <Terminal size={13}/>
            <span>CAREER::COMMAND</span>
            <span className="inline-block w-2 h-4" style={{background:"#22d3ee",animation:"k-blink 1s steps(2) infinite"}}/>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mt-2 leading-none"
            style={{
              color: "#e2e8f0",
              textShadow: "0 0 18px rgba(34,211,238,0.3)",
              letterSpacing: "-0.02em",
            }}>
            <span style={{color:"#22d3ee"}}>{">"}</span> select_module
            <span className="text-cyan-400/40">()</span>
          </h2>
          <p className="text-xs md:text-sm mt-3 max-w-xl leading-relaxed" style={{color:"#64748b"}}>
            <span style={{color:"#a78bfa"}}>/*</span>{" "}
            Choose your sector. Every track mastered, every contact mapped,
            every application queued. Run one command at a time.{" "}
            <span style={{color:"#a78bfa"}}>*/</span>
          </p>
        </div>
        <div className="flex items-center gap-2 md:ml-auto shrink-0">
          <div className="relative w-14 h-14 rounded-sm hud-corner flex items-center justify-center"
            style={{color:"#22d3ee",borderColor:"#22d3ee",background:"rgba(34,211,238,0.08)"}}>
            <span className="c-tr"/><span className="c-bl"/>
            <Cpu size={22}/>
            <motion.div aria-hidden
              className="absolute inset-[-3px] rounded-sm pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{ border: "1px dashed rgba(167,139,250,0.4)" }} />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
        {CAREER_NAV.map((item, i) => (
          <NavTile key={item.id} item={item} active={item.id === current} delay={0.12 + i * 0.05} onPick={onPick} index={i}/>
        ))}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-6 pt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] tracking-widest"
        style={{color:"#475569",borderTop:"1px dashed rgba(34,211,238,0.2)"}}>
        <span>kaizen.career // v2.0</span>
        <span>hint: click a module to route</span>
        <span style={{color:"#34d399"}}>sys::ready</span>
      </div>
    </motion.div>
  );
}

function NavTile({ item, active, delay, onPick, index }:
  { item: typeof CAREER_NAV[number]; active: boolean; delay: number; onPick: (s: CareerSectionId) => void; index: number }) {
  const Icon = item.icon;
  return (
    <motion.button onClick={() => onPick(item.id)}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22,1,0.36,1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="relative group rounded-sm p-3 md:p-4 text-left overflow-hidden hud-corner font-mono"
      style={{
        color: active ? "#05080d" : "#cbd5e1",
        background: active
          ? `linear-gradient(135deg, ${item.color}, ${item.color}cc)`
          : "rgba(8,18,30,0.6)",
        border: `1px solid ${active ? item.color : `${item.color}55`}`,
        boxShadow: active
          ? `0 10px 30px -10px ${item.color}cc, inset 0 0 20px -8px rgba(0,0,0,0.4), 0 0 20px -5px ${item.color}55`
          : `inset 0 0 0 1px rgba(34,211,238,0.04)`,
      }}>
      <span className="c-tr"/><span className="c-bl"/>
      {/* Hover shimmer */}
      <span aria-hidden className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: `linear-gradient(135deg, transparent 0%, ${item.color}15 50%, transparent 100%)`,
        }} />
      {/* Left code-line accent */}
      <div aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px]" style={{background:item.color,opacity:active?1:0.5}}/>

      <div className="flex items-start gap-3">
        <div className="shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-sm"
          style={{
            background: active ? "rgba(0,0,0,0.2)" : `${item.color}18`,
            border: `1px solid ${active ? "rgba(0,0,0,0.2)" : item.color + "80"}`,
            color: active ? "#05080d" : item.color,
          }}>
          <Icon size={17}/>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[9px] tracking-widest font-bold" style={{color: active ? "#05080d" : item.color,opacity:0.7}}>
              {item.code}
            </span>
            <span className="font-bold text-sm tracking-wide truncate">{item.label.toLowerCase()}</span>
          </div>
          {item.description && (
            <p className="text-[10px] mt-1 tracking-wider leading-snug"
              style={{color: active ? "rgba(5,8,13,0.7)" : "#475569"}}>
              {item.description}
            </p>
          )}
        </div>
      </div>

      {active && (
        <motion.span layoutId="career-active-dot"
          className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[9px] tracking-widest font-bold">
          <span className="w-1.5 h-1.5 rounded-full" style={{background:"#05080d",boxShadow:`0 0 8px ${item.color}`}}/>
          ACTIVE
        </motion.span>
      )}
    </motion.button>
  );
}
