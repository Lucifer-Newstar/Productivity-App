"use client";

/**
 * CommandCard — the module picker summoned by cmd button.
 * Terminal/HUD style. Uses CSS variables so night/blueprint themes both work.
 * Keyboard: ↑↓/jk to move, 1-8 to jump, Enter to select, Esc handled by parent.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../../lib/theme";
import { CAREER_NAV, type CareerSectionId } from "./CareerShell";
import { Terminal, Cpu } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface Props {
  current: CareerSectionId;
  onPick: (s: CareerSectionId) => void;
}

export default function CommandCard({ current, onPick }: Props) {
  const { theme } = useTheme();
  const light = theme === "light";
  const [hoverIdx, setHoverIdx] = useState<number>(() =>
    Math.max(0, CAREER_NAV.findIndex(n => n.id === current)),
  );

  const move = useCallback((delta: number) => {
    setHoverIdx(i => (i + delta + CAREER_NAV.length) % CAREER_NAV.length);
  }, []);

  const pick = useCallback((idx: number) => {
    onPick(CAREER_NAV[idx].id);
  }, [onPick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); move(-1); }
      else if (e.key === "ArrowRight" || e.key === "l") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowLeft" || e.key === "h") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); pick(hoverIdx); }
      else if (/^[1-8]$/.test(e.key)) {
        const n = Number(e.key) - 1;
        if (n < CAREER_NAV.length) pick(n);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, pick, hoverIdx]);

  return (
    <motion.div
      key="career-command-card"
      initial={{ opacity: 0, y: 20, scale: 0.98, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, scale: 0.99, filter: "blur(4px)" }}
      transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
      className="relative w-full max-w-5xl mx-auto rounded-sm p-6 md:p-8 overflow-hidden hud-corner font-mono"
      style={{
        color: "var(--cr-fg)",
        background: light ? "rgba(255,252,244,0.9)" : "linear-gradient(180deg, rgba(8,18,30,0.97) 0%, rgba(4,10,18,0.98) 100%)",
        border: `1px solid ${light ? "rgba(12,74,110,0.5)" : "rgba(34,211,238,0.45)"}`,
        boxShadow: light
          ? "0 30px 80px -20px rgba(0,0,0,0.25), 0 0 0 1px rgba(12,74,110,0.15)"
          : "0 30px 80px -20px rgba(0,0,0,0.9), 0 0 60px -15px rgba(34,211,238,0.35)",
      }}>
      <span className="c-tr"/><span className="c-bl"/>

      {/* Grid overlay */}
      <div aria-hidden className="pointer-events-none absolute inset-0 career-hud-grid opacity-40" />
      {!light && <div aria-hidden className="pointer-events-none absolute inset-0 career-scanlines" />}
      {light && (
        <div aria-hidden className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
          style={{ background: "linear-gradient(135deg, transparent 50%, rgba(194,65,12,0.12) 50%)" }}/>
      )}

      {/* Terminal status header */}
      <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] tracking-widest" style={{color:"var(--cr-fgMuted)"}}>
        <span style={{color:"var(--cr-accent3)"}}>●</span> session::active
        <span>|</span>
        <span>user: <span style={{color:"var(--cr-accent)"}}>k</span></span>
        <span>|</span>
        <span>sector: <span style={{color:"var(--cr-accent4)"}}>career</span></span>
        <span>|</span>
        <span>modules: <span style={{color:"var(--cr-accent2)"}}>{CAREER_NAV.length}</span></span>
        <span className="ml-auto hidden md:inline">
          press <kbd className="px-1 rounded-sm" style={{border:"1px solid var(--cr-border)",color:"var(--cr-accent)"}}>↑↓</kbd>
          <kbd className="px-1 rounded-sm mx-1" style={{border:"1px solid var(--cr-border)",color:"var(--cr-accent)"}}>1-8</kbd>
          <kbd className="px-1 rounded-sm" style={{border:"1px solid var(--cr-border)",color:"var(--cr-accent)"}}>enter</kbd>
          <span className="mx-2">·</span>
          <kbd className="px-1 rounded-sm" style={{border:"1px solid var(--cr-border)",color:"var(--cr-accent2)"}}>esc</kbd>
        </span>
      </div>

      {/* Header */}
      <div className="relative z-10 mt-5 mb-6 flex flex-col md:flex-row md:items-end gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] md:text-xs tracking-[0.4em]" style={{color:"var(--cr-accent)"}}>
            <Terminal size={13}/>
            <span>CAREER::COMMAND</span>
            <span className="inline-block w-2 h-4" style={{background:"var(--cr-accent)",animation:"k-blink 1s steps(2) infinite"}}/>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mt-2 leading-none"
            style={{
              color: "var(--cr-fg)",
              textShadow: light ? "none" : "0 0 18px rgba(34,211,238,0.3)",
            }}>
            <span style={{color:"var(--cr-accent)"}}>{">"}</span> select_module
            <span style={{color:"var(--cr-accent)",opacity:0.5}}>()</span>
          </h2>
          <p className="text-xs md:text-sm mt-3 max-w-xl leading-relaxed" style={{color:"var(--cr-fgMuted)"}}>
            <span style={{color:"var(--cr-accent4)"}}>/*</span>{" "}
            Choose your sector. Every track mastered, every contact mapped,
            every application queued. Run one command at a time.{" "}
            <span style={{color:"var(--cr-accent4)"}}>*/</span>
          </p>
        </div>
        <div className="flex items-center gap-2 md:ml-auto shrink-0">
          <div className="relative w-14 h-14 rounded-sm hud-corner flex items-center justify-center"
            style={{color:"var(--cr-accent)",borderColor:"var(--cr-accent)",background:"transparent"}}>
            <span className="c-tr"/><span className="c-bl"/>
            <Cpu size={22}/>
            <motion.div aria-hidden
              className="absolute inset-[-3px] rounded-sm pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{ border: `1px dashed ${light ? "rgba(109,40,217,0.4)" : "rgba(167,139,250,0.4)"}` }} />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
        {CAREER_NAV.map((item, i) => (
          <NavTile key={item.id} item={item} active={item.id === current}
            hovered={i === hoverIdx}
            onHover={() => setHoverIdx(i)}
            delay={0.12 + i*0.05} onPick={() => pick(i)} index={i} light={light}/>
        ))}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-6 pt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] tracking-widest"
        style={{color:"var(--cr-fgMuted)",borderTop:"1px dashed var(--cr-borderSoft)"}}>
        <span>kaizen.career // v2.0 — {light ? "blueprint" : "night"}</span>
        <span>hint: click a module to route</span>
        <span style={{color:"var(--cr-accent3)"}}>sys::ready</span>
      </div>
    </motion.div>
  );
}

function NavTile({ item, active, hovered, onHover, delay, onPick, index, light }:
  { item: typeof CAREER_NAV[number]; active: boolean; hovered: boolean; onHover: ()=>void; delay: number; onPick: ()=>void; index: number; light: boolean }) {
  const Icon = item.icon;
  const color = light ? item.colorLight : item.color;
  const isOn = active || hovered;
  return (
    <motion.button onClick={onPick} onMouseEnter={onHover} onFocus={onHover}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0,
        boxShadow: hovered && !active ? `0 0 0 1px ${color}88, 0 6px 20px -10px ${color}88` : "none" }}
      transition={{ duration: 0.3, delay, ease: [0.22,1,0.36,1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="relative group rounded-sm p-3 md:p-4 text-left overflow-hidden hud-corner font-mono"
      style={{
        color: active ? (light ? "#fff" : "#05080d") : "var(--cr-fg)",
        background: active
          ? `linear-gradient(135deg, ${color}, ${color}cc)`
          : (light ? "rgba(255,252,244,0.5)" : "rgba(8,18,30,0.6)"),
        border: `1px solid ${isOn ? color : `${color}55`}`,
        boxShadow: active
          ? `0 10px 30px -10px ${color}cc, 0 0 20px -5px ${color}55`
          : "none",
      }}>
      <span className="c-tr"/><span className="c-bl"/>
      <span aria-hidden className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: light
            ? `linear-gradient(135deg, transparent 0%, ${color}15 50%, transparent 100%)`
            : `linear-gradient(135deg, transparent 0%, ${color}20 50%, transparent 100%)`,
        }}/>
      <div aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px]" style={{background:color,opacity:active?1:0.5}}/>

      <div className="flex items-start gap-3">
        <div className="shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-sm"
          style={{
            background: active ? "rgba(0,0,0,0.2)" : `${color}18`,
            border: `1px solid ${active ? "rgba(0,0,0,0.2)" : `${color}80`}`,
            color: active ? (light ? "#fff" : "#05080d") : color,
          }}>
          <Icon size={17}/>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[9px] tracking-widest font-bold" style={{color:active?"inherit":color,opacity:active?0.85:0.7}}>
              {item.code}
            </span>
            <span className="font-bold text-sm tracking-wide truncate">{item.label.toLowerCase()}</span>
          </div>
          {item.description && (
            <p className="text-[10px] mt-1 tracking-wider leading-snug"
              style={{color:active?"rgba(255,255,255,0.85)":"var(--cr-fgMuted)"}}>
              {item.description}
            </p>
          )}
        </div>
      </div>

      {active && (
        <motion.span layoutId="career-active-dot"
          className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[9px] tracking-widest font-bold">
          <span className="w-1.5 h-1.5 rounded-full" style={{background:light?"#fff":"#05080d",boxShadow:`0 0 8px ${color}`}}/>
          ACTIVE
        </motion.span>
      )}
    </motion.button>
  );
}
