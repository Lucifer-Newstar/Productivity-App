"use client";

/**
 * CareerShell — techy HUD chrome for the /career space.
 *
 * DISTINCT from the workout Japanese imperial aesthetic:
 *  - No crown, no katana, no kanji, no crimson/gold throne palette
 *  - Terminal/cyberpunk grid background, scanlines, corner brackets
 *  - Cyan + indigo + acid-green accents, mono font, angular sharp edges
 *  - "COMMAND" is now a terminal-style prompt: `> cmd_`
 *
 * Top strip: brand bracket `[ kaizen // career ]`, current-section HUD pill,
 * command trigger, theme toggle, K/`UID` seal.
 * Content: AnimatePresence page transitions, command card slot.
 */

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Terminal, Sun, Moon, Bell, Map, Brain, Award, Users, Briefcase,
  Trophy, ClipboardList, Globe, Cpu,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../lib/theme";
import { useStore } from "../../lib/store";

export type CareerSectionId =
  | "roadmaps" | "skills" | "certs" | "network" | "jobs"
  | "portfolio" | "daily" | "global";

export interface CareerNavItem {
  id: CareerSectionId;
  label: string;
  code: string;
  icon: LucideIcon;
  color: string;
  description?: string;
}

export const CAREER_NAV: CareerNavItem[] = [
  { id: "roadmaps",  label: "Roadmaps",    code: "01", icon: Map,          color: "#22d3ee", description: "learning.tracks" },
  { id: "skills",    label: "Skills",      code: "02", icon: Brain,        color: "#a78bfa", description: "inventory.gaps" },
  { id: "certs",     label: "Certs",       code: "03", icon: Award,        color: "#34d399", description: "courses.creds" },
  { id: "network",   label: "Network",     code: "04", icon: Users,        color: "#f472b6", description: "contacts.graph" },
  { id: "jobs",      label: "Jobs",        code: "05", icon: Briefcase,    color: "#fb923c", description: "pipeline.offers" },
  { id: "portfolio", label: "Portfolio",   code: "06", icon: Trophy,       color: "#facc15", description: "wins.projects" },
  { id: "daily",     label: "Daily",       code: "07", icon: ClipboardList,color: "#818cf8", description: "standup.logs" },
  { id: "global",    label: "Command",     code: "08", icon: Globe,        color: "#e2e8f0", description: "timeline.vision" },
];

interface Props {
  section: CareerSectionId;
  commandButton: React.ReactNode;
  commandCard?: React.ReactNode;
  children: React.ReactNode;
}

// Subtle blinking cursor for the terminal prompt.
function Cursor() {
  return <span className="inline-block w-2 h-4 ml-0.5 align-middle" style={{background:"#22d3ee",animation:"k-blink 1s steps(2) infinite"}}/>;
}

function Clock() {
  const [now, setNow] = useState<string>(() => new Date().toISOString().slice(11,19));
  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toISOString().slice(11,19)), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono tabular-nums text-[11px]" style={{color:"#22d3ee"}}>{now} UTC</span>;
}

export default function CareerShell({ section, commandButton, commandCard, children }: Props) {
  // Career space always forces dark. Light/parchment theme is for the imperial workout space;
  // a cyber HUD looks wrong on parchment. We still expose toggle for cross-space parity but style neutral.
  const { toggle } = useTheme();
  const { career } = useStore();
  const active = CAREER_NAV.find((n) => n.id === section) ?? CAREER_NAV[0];

  const roadmapCount = career.roadmaps?.length ?? 0;
  const activeRoadmaps = (career.roadmaps ?? []).filter(r => r.status === "active").length;

  return (
    <div className="career-root min-h-screen w-full flex flex-col relative overflow-hidden font-mono"
      style={{
        color: "#cbd5e1",
        background: "radial-gradient(ellipse at top, #0a1624 0%, #05080d 55%, #02050a 100%)",
      }}>
      {/* Global career styles (scoped by being in this subtree doesn't work without a wrapper class;
          we inject a <style> block so these classes only override when this shell is mounted). */}
      <style jsx global>{`
        @keyframes k-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes k-scan {
          0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)}
        }
        @keyframes k-gridshift {
          0%{background-position:0 0} 100%{background-position:40px 40px}
        }
        @keyframes k-pulse-dot {
          0%,100%{opacity:1;box-shadow:0 0 8px currentColor}
          50%{opacity:0.4;box-shadow:0 0 2px currentColor}
        }
        /* Career HUD overrides: neutralize the imperial serif/Cinzel fonts used by workout.
           These !important overrides only apply while this component is mounted, because
           <style jsx global> inside CareerShell injects during mount and removes on unmount. */
        .career-root .imperial-name,
        .career-root .emperor-title { font-family: var(--font-mono, ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace) !important; letter-spacing: 0.08em !important; font-weight: 700 !important; text-transform: none !important; }
        .career-root .serif-body { font-family: var(--font-mono, ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace) !important; font-style: normal !important; letter-spacing: 0 !important; color: #64748b !important; }
        .career-root .font-jp { font-family: var(--font-mono) !important; }
        .career-root .k-blade { display: none !important; }
        .career-root .scale-pattern,
        .career-root .grille-pattern,
        .career-root .glitter-bg { display: none !important; }
        .career-root .card-lacquer { background: rgba(8,18,30,0.5) !important; border: 1px solid rgba(34,211,238,0.2) !important; box-shadow: none !important; border-radius: 2px !important; }
        .career-root .shimmer { display: none !important; }
        /* Neutralize imperial gold/crimson title accents to HUD cyan. */
        .career-root h2.imperial-name,
        .career-root [style*="color: rgb(253, 230, 138)"],
        .career-root [style*="color:#fde68a"] { color: #e2e8f0 !important; }
        .career-root textarea,
        .career-root input,
        .career-root select { color-scheme: dark; }
        .career-root textarea:focus,
        .career-root input:focus,
        .career-root select:focus { outline: 1px solid rgba(34,211,238,0.5) !important; }
        /* Scrollbar tint */
        .career-root ::-webkit-scrollbar { width: 8px; height: 8px; }
        .career-root ::-webkit-scrollbar-track { background: rgba(34,211,238,0.05); }
        .career-root ::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.3); border-radius: 0; }
        .career-root ::-webkit-scrollbar-thumb:hover { background: rgba(34,211,238,0.55); }
        .career-hud-grid {
          background-image:
            linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: k-gridshift 18s linear infinite;
        }
        .career-scanlines {
          background: repeating-linear-gradient(
            to bottom,
            transparent 0,
            transparent 3px,
            rgba(34,211,238,0.04) 3px,
            rgba(34,211,238,0.04) 4px
          );
          mix-blend-mode: overlay;
          pointer-events: none;
        }
        .career-scanbeam {
          position: absolute;
          left: 0; right: 0;
          height: 140px;
          background: linear-gradient(to bottom, transparent, rgba(34,211,238,0.07), transparent);
          animation: k-scan 9s linear infinite;
          pointer-events: none;
        }
        .career-vignette {
          box-shadow: inset 0 0 180px rgba(0,0,0,0.7);
          pointer-events: none;
        }
        .hud-corner::before, .hud-corner::after,
        .hud-corner > .c-tr, .hud-corner > .c-bl {
          content: "";
          position: absolute;
          width: 14px; height: 14px;
          border-color: currentColor;
          border-style: solid;
        }
        .hud-corner::before { top:0; left:0; border-width:1px 0 0 1px; }
        .hud-corner::after { bottom:0; right:0; border-width:0 1px 1px 0; }
        .hud-corner > .c-tr { top:0; right:0; border-width:1px 1px 0 0; }
        .hud-corner > .c-bl { bottom:0; left:0; border-width:0 0 1px 1px; }
      `}</style>

      {/* Background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 career-hud-grid opacity-100" />
      <div aria-hidden className="pointer-events-none absolute inset-0 career-scanlines" />
      <div aria-hidden className="pointer-events-none absolute inset-0 career-scanbeam" />
      <div aria-hidden className="pointer-events-none absolute inset-0 career-vignette" />

      {/* Floating glow orbs */}
      <motion.div aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.22) 0%, transparent 70%)" }}
        animate={{ x: [0,60,0], y: [0,30,0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 w-[460px] h-[460px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)" }}
        animate={{ x: [0,-40,0], y: [0,40,0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 w-[380px] h-[380px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)" }}
        animate={{ x: [0,20,-10,0], y: [0,-20,10,0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }} />

      {/* Top status bar */}
      <header className="h-14 shrink-0 flex items-center gap-3 px-3 md:px-6 border-b z-20 relative"
        style={{
          background: "linear-gradient(180deg, rgba(5,12,20,0.9) 0%, rgba(5,12,20,0.7) 100%)",
          borderColor: "rgba(34,211,238,0.25)",
          backdropFilter: "blur(10px)",
        }}>
        {/* Top accent stripe */}
        <div aria-hidden className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, #22d3ee 20%, #a78bfa 50%, #34d399 80%, transparent)" }} />

        {/* Brand bracket */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="relative px-2.5 py-1 rounded-sm hud-corner text-cyan-300" style={{color:"#22d3ee",background:"rgba(34,211,238,0.06)",borderColor:"rgba(34,211,238,0.4)"}}>
            <span className="c-tr"/><span className="c-bl"/>
            <div className="flex items-center gap-1.5">
              <Cpu size={13} />
              <span className="font-mono text-[11px] tracking-[0.2em] font-bold">KAIZEN</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono tracking-widest" style={{color:"#64748b"}}>
            <span style={{color:"#22d3ee"}}>/</span>career
            <Cursor/>
          </div>
        </Link>

        <div className="w-px h-7" style={{background:"rgba(34,211,238,0.2)"}}/>

        <Link href="/" className="md:hidden p-2 rounded" style={{color:"#64748b"}}>
          <ArrowLeft size={14}/>
        </Link>

        {/* Section HUD pill */}
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div key={active.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="relative w-9 h-9 rounded-sm hud-corner flex items-center justify-center shrink-0"
            style={{
              color: active.color,
              background: `${active.color}18`,
              borderColor: active.color,
            }}>
            <span className="c-tr"/><span className="c-bl"/>
            <active.icon size={15} />
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-widest" style={{color:active.color}}>[{active.code}]</span>
              <h2 className="text-sm font-bold tracking-wide truncate" style={{color:"#e2e8f0"}}>{active.label.toLowerCase()}</h2>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full" style={{background:active.color,animation:"k-pulse-dot 1.8s ease-in-out infinite",color:active.color}}/>
            </div>
            <p className="hidden md:block font-mono text-[10px] tracking-wider" style={{color:"#475569"}}>
              {">"} {active.description}
            </p>
          </div>
        </div>

        {/* Stat chips */}
        <div className="hidden lg:flex items-center gap-2 ml-3">
          <StatChip label="tracks" value={`${activeRoadmaps}/${roadmapCount}`} color="#22d3ee"/>
        </div>

        <div className="flex-1"/>

        <Clock/>

        {commandButton}

        <div className="w-px h-6 hidden sm:block" style={{background:"rgba(34,211,238,0.2)"}}/>

        <button aria-label="Alerts" className="hidden sm:inline-flex p-2 rounded-sm transition hover:bg-cyan-400/10 relative" style={{color:"#64748b"}}>
          <Bell size={14}/>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{background:"#f472b6",boxShadow:"0 0 6px #f472b6"}}/>
        </button>
        <button aria-label="Theme" onClick={toggle} title="Toggle theme"
          className="hidden sm:inline-flex p-2 rounded-sm transition hover:bg-cyan-400/10" style={{color:"#64748b"}}>
          <Sun size={14}/>
        </button>

        {/* UID seal */}
        <div className="relative px-2 py-1 rounded-sm hud-corner font-mono text-[10px] tracking-widest hidden sm:block"
          style={{color:"#34d399",background:"rgba(52,211,153,0.08)",borderColor:"rgba(52,211,153,0.4)"}}>
          <span className="c-tr"/><span className="c-bl"/>
          USR::K
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          {commandCard ? (
            <motion.div key="command-card"
              initial={{ opacity: 0, y: 16, scale: 0.99, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, scale: 1, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
              className="px-4 md:px-8 py-6 md:py-10">
              {commandCard}
            </motion.div>
          ) : (
            <motion.div key={section}
              initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }}
              className="px-4 md:px-8 py-5 md:py-7">
              <div className="max-w-6xl mx-auto w-full">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom status strip */}
      <footer className="h-7 shrink-0 flex items-center gap-3 px-3 md:px-6 border-t text-[10px] font-mono tracking-widest z-20"
        style={{
          background: "rgba(5,12,20,0.8)",
          borderColor: "rgba(34,211,238,0.2)",
          color: "#475569",
        }}>
        <span style={{color:"#34d399"}}>●</span> <span>SYSTEM::ONLINE</span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">SECTOR::{active.code}</span>
        <span className="flex-1"/>
        <span>kaizen.career // v2.0</span>
      </footer>
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="relative px-2.5 py-1 rounded-sm hud-corner font-mono text-[10px] tracking-widest"
      style={{color,background:`${color}10`,borderColor:`${color}55`}}>
      <span className="c-tr"/><span className="c-bl"/>
      <span style={{color:"#64748b"}}>{label.toUpperCase()}</span>
      <span className="ml-1.5 font-bold" style={{color}}>{value}</span>
    </div>
  );
}
