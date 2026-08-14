"use client";

/**
 * ForgeShell v2 — heavy-industry chrome for /projects.
 *
 * Layout (different from Career/Workout):
 *   - LEFT I-BEAM RAIL (64px desktop / collapsed mobile) with vertical stenciled
 *     sector numerals (01/02/03/04), rotating gears, temp gauge mini, Kaizen/改善
 *     anvil brand at the bottom.
 *   - THICK TOP HEADER BEAM: hazard chevrons across the full top, furnace temp
 *     dial (semicircle), active-sprint info, clock, STRIKE, theme.
 *   - MAIN SCROLL AREA: full-bleed heat-stressed dark iron or vellum.
 *   - BOTTOM DIAMOND-PLATE EXHAUST STRIP.
 *
 * Dark = "FOUNDRY" (default):
 *   Charcoal/iron black, welded seams, diagonal warning chevrons, molten
 *   amber/orange, hot rivets, glowing heat orbs, semi-circular temp gauge,
 *   I-beam rail with stenciled §numbers.
 *
 * Light = "DRAFTING ROOM" (vellum):
 *   Yellowed tracing paper, brass grommets, burnt-orange pencil, technical
 *   drawing grid, triangle/rule marks, rubber stamps. No blueprint (career),
 *   no parchment (workout).
 */

import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hammer, Flame, Pickaxe, Archive, LayoutDashboard, Sun, Moon, Bell, Anvil, Gauge, Settings, Volume2, VolumeX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "../../lib/theme";
import { useStore } from "../../lib/store";
import { isDoneStatus as isTaskDone } from "./forgeUtils";

export type ForgeSectionId = "foundry" | "quarry" | "smelter" | "vault";

export interface ForgeNavItem {
  id: ForgeSectionId;
  label: string;
  code: string;
  icon: LucideIcon;
  color: string;
  colorLight: string;
  description?: string;
}

export const FORGE_NAV: ForgeNavItem[] = [
  { id: "foundry", label: "Foundry", code: "01", icon: LayoutDashboard, color: "#f59e0b", colorLight: "#92400e", description: "active.projects" },
  { id: "quarry",  label: "Quarry",  code: "02", icon: Pickaxe,         color: "#fb923c", colorLight: "#c2410c", description: "tasks.kanban" },
  { id: "smelter", label: "Smelter", code: "03", icon: Flame,           color: "#ef4444", colorLight: "#7f1d1d", description: "brainstorms.sprints" },
  { id: "vault",   label: "Vault",   code: "04", icon: Archive,         color: "#94a3b8", colorLight: "#475569", description: "archive.obituaries" },
];

const SECTION_ROUTE: Record<ForgeSectionId, string> = {
  foundry: "/projects",
  quarry:  "/projects/quarry",
  smelter: "/projects/smelter",
  vault:   "/projects/vault",
};

interface Props {
  section: ForgeSectionId;
  actionButton?: React.ReactNode;
  actionPanel?: React.ReactNode;
  children: React.ReactNode;
  rightExtras?: React.ReactNode;
}

function Rivet({ color }: { color: string }) {
  return (
    <span aria-hidden
      className="absolute w-2.5 h-2.5 rounded-full"
      style={{
        background: `radial-gradient(circle at 30% 30%, #fff8dc 0%, ${color} 55%, rgba(0,0,0,0.6) 100%)`,
        boxShadow: `0 0 6px ${color}, inset 0 -1px 1px rgba(0,0,0,0.7)`,
      }}/>
  );
}

function Clock({ light }: { light: boolean }) {
  const [now, setNow] = useState<string>(() => new Date().toISOString().slice(11,19));
  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toISOString().slice(11,19)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono tabular-nums text-[11px]"
      style={{ color: light ? "#92400e" : "#f59e0b" }}>{now} UTC</span>
  );
}

/** Semicircle temperature gauge. */
function TempGauge({ temp, color, light }:{temp:number;color:string;light:boolean}) {
  // Map temp 0..1000°C -> arc fill
  const pct = Math.max(0, Math.min(1, temp/1000));
  const R = 26;
  const cx = 32, cy = 32;
  // Arc from 180deg (left) to 0deg (right) — semicircle
  const startAngle = Math.PI;
  const endAngle = Math.PI - Math.PI*pct;
  const x1 = cx + R*Math.cos(startAngle);
  const y1 = cy - R*Math.sin(startAngle);
  const x2 = cx + R*Math.cos(endAngle);
  const y2 = cy - R*Math.sin(endAngle);
  const largeArc = pct>0.5?1:0;
  const path = `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 0 ${x2} ${y2}`;
  return (
    <div className="hidden sm:flex items-center gap-2" title="Furnace temp">
      <svg width={64} height={36} viewBox="0 0 64 36" className="overflow-visible">
        <path d={`M 6 32 A ${R} ${R} 0 0 1 58 32`} stroke={light?"#94a3b8":"#3f3a33"} strokeWidth={4} fill="none" strokeLinecap="round"/>
        <motion.path d={path}
          initial={{pathLength:0}} animate={{pathLength:1}}
          transition={{duration:1}}
          stroke={color} strokeWidth={4} fill="none" strokeLinecap="round"
          style={{filter:`drop-shadow(0 0 4px ${color})`}}/>
        {/* tick marks */}
        {[0,0.25,0.5,0.75,1].map(t=>{
          const a = Math.PI - Math.PI*t;
          const x1 = cx + (R+3)*Math.cos(a), y1 = cy - (R+3)*Math.sin(a);
          const x2 = cx + (R+7)*Math.cos(a), y2 = cy - (R+7)*Math.sin(a);
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke={light?"#1f2937":"#78716c"} strokeWidth={1}/>;
        })}
      </svg>
      <div className="mono text-[10px] tracking-widest leading-tight">
        <div style={{color}} className="font-black text-sm">{temp}°C</div>
        <div style={{color:light?"#94a3b8":"#78716c"}}>FURNACE</div>
      </div>
    </div>
  );
}

/** Rotating gear (pure SVG). */
function Gear({ size=22, color="#f59e0b", speed=20, reverse=false }:{size?:number;color?:string;speed?:number;reverse?:boolean}) {
  const teeth = 10;
  const pts: string[] = [];
  for (let i=0;i<teeth*2;i++){
    const a = (i/(teeth*2))*Math.PI*2;
    const r = i%2===0 ? 10 : 7;
    pts.push(`${(Math.cos(a)*r).toFixed(2)},${(Math.sin(a)*r).toFixed(2)}`);
  }
  return (
    <motion.svg width={size} height={size} viewBox="-12 -12 24 24"
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration: speed, repeat: Infinity, ease: "linear" }}>
      <polygon points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.2} opacity={0.6}/>
      <circle r={3} fill="none" stroke={color} strokeWidth={1.2} opacity={0.6}/>
      <circle r={0.8} fill={color}/>
    </motion.svg>
  );
}

export default function ForgeShell({ section, actionButton, actionPanel, children, rightExtras }: Props) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { forge, updateForge } = useStore();
  const light = theme === "light";
  const active = FORGE_NAV.find(n => n.id === section) ?? FORGE_NAV[0];
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sName, setSName] = useState(forge.settings.forgeName);
  const [sLen, setSLen] = useState(forge.settings.sprintLengthDays);
  const [sStart, setSStart] = useState(forge.settings.workStartHour);
  const [sEnd, setSEnd] = useState(forge.settings.workEndHour);
  // Ember soundscape (WebAudio brown-noise + crackle) — generated offline, no assets.
  const [embers, setEmbers] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<{stop:() => void} | null>(null);
  useEffect(() => {
    if (!embers) {
      audioNodesRef.current?.stop();
      audioNodesRef.current = null;
      if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
      return;
    }
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx: AudioContext = new AC();
    audioCtxRef.current = ctx;
    // Brown noise (low rumble)
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i=0;i<bufferSize;i++){
      const white = Math.random()*2-1;
      output[i] = (lastOut + 0.02*white)/1.02;
      lastOut = output[i]; output[i] *= 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer; noise.loop = true;
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = "lowpass"; rumbleFilter.frequency.value = 420;
    const rumbleGain = ctx.createGain(); rumbleGain.gain.value = 0.08;
    noise.connect(rumbleFilter); rumbleFilter.connect(rumbleGain); rumbleGain.connect(ctx.destination);
    noise.start();
    // Crackle: random high-frequency pops
    let crackleTimer: number | null = null;
    const scheduleCrackle = () => {
      const pop = () => {
        if (!audioCtxRef.current) return;
        const dur = 0.03 + Math.random()*0.08;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass"; bp.frequency.value = 1800 + Math.random()*3500; bp.Q.value = 0.9;
        osc.type = "square"; osc.frequency.value = 80 + Math.random()*60;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.05 + Math.random()*0.08, ctx.currentTime+0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+dur);
        osc.connect(bp); bp.connect(g); g.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime+dur+0.02);
      };
      pop();
      if (Math.random()<0.25) setTimeout(pop, 80 + Math.random()*220);
      crackleTimer = window.setTimeout(scheduleCrackle, 180 + Math.random()*900);
    };
    scheduleCrackle();
    audioNodesRef.current = {
      stop: () => {
        if (crackleTimer) { clearTimeout(crackleTimer); crackleTimer=null; }
        try{noise.stop();}catch{}
        rumbleGain.gain.cancelScheduledValues(ctx.currentTime);
        rumbleGain.gain.setValueAtTime(rumbleGain.gain.value, ctx.currentTime);
        rumbleGain.gain.linearRampToValueAtTime(0, ctx.currentTime+0.2);
      }
    };
    return () => { audioNodesRef.current?.stop(); audioNodesRef.current=null; if(audioCtxRef.current){audioCtxRef.current.close();audioCtxRef.current=null;} };
  }, [embers]);
  const saveSettings = () => {
    updateForge(f => ({ settings: { ...f.settings, forgeName:sName, sprintLengthDays:Number(sLen)||14, workStartHour:Number(sStart)||9, workEndHour:Number(sEnd)||18 } }));
    setSettingsOpen(false);
    window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"SETTINGS SAVED",sub:"forge calibrated",color:"#22c55e",icon:"check"}}));
  };

  const isTaskShipped = (s: any) => isTaskDone(s, forge.customStatuses);
  const activeCount = forge.projects.filter(p => !p.archived && p.status !== "dead" && p.status !== "done").length;
  const blockedCount = forge.projects.filter(p => p.status === "blocked" || p.status === "off-track").length;
  const tasksDue = forge.tasks.filter(t => t.today && !isTaskShipped(t.status)).length;
  const shippedCount = forge.projects.filter(p => p.status === "done").length;
  const activeSprint = forge.sprints.find(s => s.status === "active");
  const temp = 420 + Math.min(580, activeCount * 40 + tasksDue*20);

  const T = light ? {
    bg: "radial-gradient(ellipse at top left, #f3ecdd 0%, #e8dec4 55%, #d9cba9 100%)",
    fg: "#1f2937", fgMuted: "#475569", fgDim: "#94a3b8",
    border: "rgba(31,41,55,0.45)", borderSoft: "rgba(31,41,55,0.18)",
    grid: "rgba(31,41,55,0.07)", gridStrong: "rgba(31,41,55,0.16)",
    headerBg: "linear-gradient(180deg, #f3ecdd 0%, #e8dec4 100%)",
    railBg: "linear-gradient(180deg,#e8dec4 0%, #d9cba9 100%)",
    cardBg: "rgba(255,252,244,0.72)",
    cardBg2: "rgba(255,252,244,0.55)",
    accent1: "#92400e", accent2: "#c2410c", accent3: "#065f46", accent4: "#7f1d1d", accentCyan: "#0c4a6e",
    steel: "#475569",
    stripe: "repeating-linear-gradient(135deg, #1f2937 0 10px, #fcd34d 10px 20px)",
    diamond: "repeating-linear-gradient(45deg, rgba(31,41,55,0.15) 0 4px, transparent 4px 10px), repeating-linear-gradient(-45deg, rgba(31,41,55,0.15) 0 4px, transparent 4px 10px)",
    footerBg: "rgba(232,222,196,0.9)",
    dotOnline: "#065f46",
    bell: "#475569", bellDot: "#c2410c",
    stamp: "#7f1d1d", seal: "#92400e", sealBg: "rgba(146,64,14,0.08)",
    orb1: "rgba(146,64,14,0.14)", orb2: "rgba(194,65,12,0.1)", orb3: "rgba(31,41,55,0.08)",
    weld: "rgba(31,41,55,0.6)",
  } : {
    bg: "radial-gradient(ellipse at top left, #14100c 0%, #0a0806 55%, #000 100%)",
    fg: "#e5e7eb", fgMuted: "#78716c", fgDim: "#44403c",
    border: "rgba(245,158,11,0.35)", borderSoft: "rgba(245,158,11,0.12)",
    grid: "rgba(245,158,11,0.05)", gridStrong: "rgba(245,158,11,0.16)",
    headerBg: "linear-gradient(180deg, rgba(20,16,12,0.96) 0%, rgba(10,8,6,0.88) 100%)",
    railBg: "linear-gradient(180deg, #1a150f 0%, #0a0806 100%)",
    cardBg: "rgba(22,19,16,0.7)", cardBg2: "rgba(15,13,11,0.6)",
    accent1: "#f59e0b", accent2: "#ea580c", accent3: "#22c55e", accent4: "#ef4444", accentCyan: "#06b6d4",
    steel: "#94a3b8",
    stripe: "repeating-linear-gradient(135deg, #000 0 10px, #f59e0b 10px 20px)",
    diamond: "repeating-linear-gradient(45deg, rgba(245,158,11,0.07) 0 4px, transparent 4px 10px), repeating-linear-gradient(-45deg, rgba(245,158,11,0.07) 0 4px, transparent 4px 10px)",
    footerBg: "rgba(8,7,6,0.95)",
    dotOnline: "#22c55e",
    bell: "#78716c", bellDot: "#ef4444",
    stamp: "#f59e0b", seal: "#ea580c", sealBg: "rgba(234,88,12,0.08)",
    orb1: "rgba(245,158,11,0.28)", orb2: "rgba(234,88,12,0.2)", orb3: "rgba(6,182,212,0.12)",
    weld: "rgba(245,158,11,0.6)",
  };

  const aColor = light ? active.colorLight : active.color;

  return (
    <div className="forge-root min-h-screen w-full flex relative overflow-hidden"
      data-lt={light ? "1" : "0"}
      style={{ color: T.fg, background: T.bg, fontFamily: "var(--font-condensed,'Oswald','Impact',sans-serif)" }}>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;500;600;700&family=Special+Elite&family=JetBrains+Mono:wght@400;600;800&display=swap');
        @keyframes f-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes f-pulse-rivet {
          0%,100% { box-shadow: 0 0 6px currentColor, inset 0 -1px 1px rgba(0,0,0,0.7); }
          50% { box-shadow: 0 0 14px currentColor, inset 0 -1px 1px rgba(0,0,0,0.7); }
        }
        @keyframes f-stamp {
          0% { transform: scale(1.8) rotate(-12deg); opacity:0; }
          60% { transform: scale(0.95) rotate(-8deg); opacity:1; }
          100% { transform: scale(1) rotate(-8deg); opacity:1; }
        }
        @keyframes f-grind {
          0%{background-position:0 0} 100%{background-position:40px 0}
        }
        @keyframes f-weld {
          0%,100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes f-smoke {
          0% { transform: translateY(0) scale(1); opacity: 0.4; }
          100% { transform: translateY(-30px) scale(1.4); opacity: 0; }
        }
        .forge-root {
          --fr-bg: ${light ? "#f3ecdd" : "#080706"};
          --fr-fg: ${T.fg};
          --fr-fgMuted: ${T.fgMuted};
          --fr-fgDim: ${T.fgDim};
          --fr-border: ${T.border};
          --fr-borderSoft: ${T.borderSoft};
          --fr-steel: ${T.steel};
          --fr-amber: ${T.accent1};
          --fr-orange: ${T.accent2};
          --fr-green: ${T.accent3};
          --fr-red: ${T.accent4};
          --fr-cyan: ${T.accentCyan};
          --fr-violet: #818cf8;
          --fr-pink: #f472b6;
          --fr-card: ${T.cardBg};
          --fr-card2: ${T.cardBg2};
          --fr-grid: ${T.grid};
          --fr-header: ${T.headerBg};
        }
        .forge-root .imperial-name,.forge-root .emperor-title,.forge-root .serif-body,
        .forge-root .font-jp,.forge-root .k-blade,.forge-root .scale-pattern,
        .forge-root .grille-pattern,.forge-root .glitter-bg,.forge-root .shimmer,
        .forge-root .hud-corner { all: unset; }
        .forge-root .career-root,.forge-root .workout-root { all: unset; }
        .forge-root h1,.forge-root h2,.forge-root h3,.forge-root h4,.forge-root .forge-heading {
          font-family: 'Bebas Neue','Oswald','Impact',sans-serif !important;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .forge-root code,.forge-root .mono,.forge-root .metric {
          font-family: 'JetBrains Mono',ui-monospace,monospace !important;
        }
        .forge-root .pencil { font-family: 'Special Elite', 'Courier New', monospace; }
        /* Grid floor */
        .forge-grid {
          background-image:
            linear-gradient(${T.grid} 1px, transparent 1px),
            linear-gradient(90deg, ${T.grid} 1px, transparent 1px),
            linear-gradient(${T.gridStrong} 1px, transparent 1px),
            linear-gradient(90deg, ${T.gridStrong} 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 100px 100px, 100px 100px;
          ${light ? "" : "animation: f-grind 22s linear infinite;"}
        }
        .forge-vignette { box-shadow: inset 0 0 260px ${light ? "rgba(120,80,20,0.22)" : "rgba(0,0,0,0.85)"}; pointer-events: none; }
        .forge-grain {
          position: absolute; inset:0; pointer-events:none; opacity:0.3;
          background-image: ${light
            ? "radial-gradient(rgba(31,41,55,0.08) 1px, transparent 1px)"
            : "radial-gradient(rgba(245,158,11,0.04) 1px, transparent 1px)"};
          background-size: 3px 3px; mix-blend-mode: multiply;
        }
        /* Welded steel plate (double border with weld dashes) */
        .steel-plate {
          position: relative;
          background: ${light ? T.cardBg : `linear-gradient(145deg, ${T.cardBg}, rgba(8,7,6,0.65))`};
          border: 2px solid ${light ? T.border : "rgba(245,158,11,0.3)"};
          ${light ? "box-shadow: 2px 3px 0 -1px rgba(31,41,55,0.25);"
                  : "box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.6), 0 4px 0 rgba(0,0,0,0.5), 0 10px 24px -12px rgba(0,0,0,0.8);"}
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
        }
        .steel-plate .riv-tl,.steel-plate .riv-tr,
        .steel-plate .riv-bl,.steel-plate .riv-br {
          position: absolute; width: 10px; height: 10px; border-radius: 999px;
          background: ${light
            ? `radial-gradient(circle at 30% 30%, #fde68a 0%, ${T.accent1} 55%, rgba(0,0,0,0.5) 100%)`
            : `radial-gradient(circle at 30% 30%, #fde68a 0%, ${T.accent1} 55%, rgba(0,0,0,0.7) 100%)`};
          z-index: 2;
          ${light ? "box-shadow: inset 0 -1px 1px rgba(0,0,0,0.6);" : "animation: f-pulse-rivet 3s ease-in-out infinite;"}
        }
        .steel-plate .riv-tl { top:-5px; left:-5px; }
        .steel-plate .riv-tr { top:-5px; right:-5px; }
        .steel-plate .riv-bl { bottom:-5px; left:-5px; }
        .steel-plate .riv-br { bottom:-5px; right:-5px; }
        /* Welded seam along the top of plates */
        .steel-plate::before {
          content:""; position:absolute; top:-3px; left:12px; right:12px; height:2px;
          background: repeating-linear-gradient(90deg, ${T.weld} 0 4px, transparent 4px 8px);
          opacity: 0.5;
        }
        /* Hazard chevron strip */
        .hazard-stripe { height: 6px; background: ${T.stripe}; ${light ? "" : "box-shadow: 0 0 10px rgba(245,158,11,0.6), 0 2px 0 rgba(0,0,0,0.6);"}; }
        .diamond-plate { background: ${T.diamond}; }
        /* Rubber stamp */
        .forge-stamp {
          font-family: 'Oswald',sans-serif; font-weight: 800; letter-spacing: 0.2em;
          border: 2.5px solid currentColor; padding: 2px 8px; display: inline-block;
          transform: rotate(-8deg); opacity: 0.85; border-radius: 2px;
          animation: f-stamp 0.5s ease-out;
        }
        .forge-root button { font-family:'Bebas Neue','Oswald',sans-serif; letter-spacing:0.12em; text-transform:uppercase; }
        .forge-root button:focus-visible { outline: 2px solid ${T.accent1}; outline-offset: 2px; }
        .forge-root ::selection { background: ${T.accent1}; color:#000; }
        .forge-root ::-webkit-scrollbar { width: 12px; height: 12px; }
        .forge-root ::-webkit-scrollbar-track { background: transparent; }
        .forge-root ::-webkit-scrollbar-thumb {
          background: ${light ? "rgba(31,41,55,0.3)" : "rgba(245,158,11,0.4)"};
          border: 2px solid ${light ? "#f3ecdd" : "#080706"};
        }
        .forge-root ::-webkit-scrollbar-thumb:hover {
          background: ${light ? "rgba(31,41,55,0.55)" : "rgba(245,158,11,0.7)"};
        }
        /* Light mode form overrides */
        .forge-root[data-lt="1"] .steel-plate {
          background: ${T.cardBg}; border-color: rgba(31,41,55,0.4);
        }
        .forge-root[data-lt="1"] input,.forge-root[data-lt="1"] textarea,.forge-root[data-lt="1"] select {
          background: rgba(255,252,244,0.7) !important; color: ${T.fg} !important;
          border-color: ${T.borderSoft} !important;
        }
        .forge-root[data-lt="1"] textarea::placeholder,.forge-root[data-lt="1"] input::placeholder { color: ${T.fgDim} !important; }
        .forge-root[data-lt="1"] option { background: #f3ecdd; color: #1f2937; }
        .forge-root[data-lt="0"] button.steel-plate {
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }
        .forge-root[data-lt="0"] button.steel-plate:hover {
          transform: translateY(-2px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 16px 34px -14px rgba(245,158,11,0.6);
          border-color: ${T.accent1};
        }
        .forge-root[data-lt="1"] button.steel-plate:active { transform: translate(1px,1px) rotate(0.3deg); }
        /* Rail nav: stenciled vertical text */
        .rail-link {
          position: relative;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-family: 'Bebas Neue','Oswald',sans-serif;
          letter-spacing: 0.2em;
          font-size: 13px;
          transition: all 180ms ease;
        }
        .rail-link.active {
          color: ${light?"#92400e":"#f59e0b"};
          text-shadow: ${light?"none":"0 0 10px rgba(245,158,11,0.8)"};
        }
        .rail-numeral {
          font-family: 'Bebas Neue',sans-serif;
          font-size: 42px;
          line-height: 1;
          letter-spacing: 0.05em;
          opacity: 0.18;
        }
        @media (max-width: 768px) {
          .forge-root .forge-rail { width: 44px; }
          .rail-link { font-size: 11px; }
          .rail-numeral { font-size: 28px; }
        }
        /* Print */
        @media print {
          .forge-root { background:#fff !important; color:#000 !important; }
          .forge-root .forge-grid,.forge-root .forge-vignette,.forge-root .forge-grain,
          .forge-root [aria-hidden].blur-3xl,.forge-root header .hazard-stripe,
          .forge-root footer,.forge-root button,.forge-root nav,.forge-root .forge-rail { display:none !important; }
          .forge-root .steel-plate {
            box-shadow:none !important; border:1px solid #999 !important;
            background:#fff !important; break-inside:avoid; page-break-inside:avoid;
            clip-path:none !important;
          }
          .forge-root main { overflow:visible !important; }
          .forge-root * { animation:none !important; color:#000 !important; }
          .forge-root .steel-plate .riv-tl,.forge-root .steel-plate .riv-tr,
          .forge-root .steel-plate .riv-bl,.forge-root .steel-plate .riv-br { display:none !important; }
          .forge-root h1,.forge-root h2,.forge-root h3,.forge-root h4 { color:#000 !important; }
          .forge-root a { color:#000 !important; text-decoration:underline; }
        }
      `}</style>

      {/* ============ LEFT I-BEAM RAIL ============ */}
      <aside className="forge-rail shrink-0 relative z-20 flex flex-col items-center py-3"
        style={{
          width: 68,
          background: T.railBg,
          borderRight: `3px solid ${light ? T.border : "rgba(245,158,11,0.4)"}`,
          boxShadow: light ? "4px 0 0 rgba(31,41,55,0.08)" : "6px 0 20px rgba(0,0,0,0.6), inset -2px 0 0 rgba(245,158,11,0.2)",
        }}>
        {/* Anvil brand */}
        <Link href="/" className="relative w-11 h-11 steel-plate flex items-center justify-center shrink-0"
          style={{ color: T.accent1, background:"transparent", borderColor: T.accent1 }}>
          <Rivet color={T.accent1}/>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <Anvil size={18}/>
        </Link>
        <div className="mt-1 text-[9px] mono tracking-widest" style={{color:T.fgMuted}}>改善</div>

        {/* Stenciled sector nav */}
        <nav className="flex-1 flex flex-col items-center justify-center gap-8 py-6">
          {FORGE_NAV.map(n => {
            const isActive = section === n.id;
            const c = light ? n.colorLight : n.color;
            return (
              <Link key={n.id} href={SECTION_ROUTE[n.id]}
                className="group relative flex flex-col items-center gap-1"
                title={`${n.label} — ${n.description}`}>
                <div className="rail-numeral" style={{color: isActive ? c : T.fgDim}}>{n.code}</div>
                {isActive && <motion.div layoutId="rail-active"
                  className="absolute -left-0 top-0 bottom-0 w-[3px]"
                  style={{background:c, boxShadow:`0 0 8px ${c}`}}/>}
                <div className={`rail-link ${isActive?"active":""}`} style={{color: isActive ? c : T.fgMuted}}>
                  {n.label.toUpperCase()}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Gears */}
        <div className="relative flex flex-col items-center gap-1 mb-2">
          <Gear size={24} color={T.accent1} speed={16}/>
          <Gear size={16} color={T.accent2} speed={10} reverse/>
        </div>

        {/* Stat: HEAT */}
        <div className="relative steel-plate px-1 py-2 mt-1 flex flex-col items-center gap-0.5"
          style={{color:T.accent1, background:"transparent", borderColor:T.accent1}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <Flame size={12}/>
          <span className="text-[14px] font-black leading-none">{activeCount}</span>
        </div>
      </aside>

      {/* ============ MAIN COLUMN ============ */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Background layers */}
        <div aria-hidden className="pointer-events-none absolute inset-0 forge-grid"/>
        <div aria-hidden className="pointer-events-none absolute inset-0 forge-vignette"/>
        <div aria-hidden className="forge-grain"/>

        {/* Heat orbs */}
        <motion.div aria-hidden
          className="pointer-events-none absolute -top-40 -right-20 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{background:`radial-gradient(circle, ${T.orb1} 0%, transparent 70%)`}}
          animate={{x:[0,-30,0],y:[0,20,0]}}
          transition={{duration:20,repeat:Infinity,ease:"easeInOut"}}/>
        <motion.div aria-hidden
          className="pointer-events-none absolute top-1/3 -left-20 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{background:`radial-gradient(circle, ${T.orb2} 0%, transparent 70%)`}}
          animate={{x:[0,20,0],y:[0,-30,0]}}
          transition={{duration:24,repeat:Infinity,ease:"easeInOut"}}/>
        <motion.div aria-hidden
          className="pointer-events-none absolute bottom-0 right-1/4 w-[360px] h-[360px] rounded-full blur-3xl"
          style={{background:`radial-gradient(circle, ${T.orb3} 0%, transparent 70%)`}}
          animate={{x:[0,10,-10,0],y:[0,-10,10,0]}}
          transition={{duration:28,repeat:Infinity,ease:"easeInOut"}}/>

        {/* Top header beam */}
        <header className="relative shrink-0 z-20">
          <div aria-hidden className="hazard-stripe absolute top-0 left-0 right-0 z-10"/>
          <div className="px-4 md:px-6 pt-3 pb-3 flex items-center gap-3 md:gap-4 flex-wrap"
            style={{background:T.headerBg, borderBottom:`2px solid ${T.border}`}}>
            {/* Title block */}
            <div className="relative min-w-0">
              <div className="flex items-baseline gap-2">
                <h1 className="text-3xl md:text-4xl leading-none tracking-[0.15em]"
                  style={{color:T.accent1, textShadow:light?"none":"0 0 18px rgba(245,158,11,0.4)"}}>THE FORGE</h1>
                <span className="mono text-[10px] tracking-widest hidden sm:inline" style={{color:T.fgMuted}}>
                  /projects · {active.label.toUpperCase()}
                </span>
              </div>
              <div className="mono text-[10px] tracking-widest mt-0.5" style={{color:T.fgMuted}}>
                // <span style={{color:T.accent2}}>{active.description}</span>
                {activeSprint && <> · sprint <b style={{color:T.accent1}}>{activeSprint.name}</b></>}
              </div>
            </div>

            <div className="hidden md:block flex-1"/>

            {/* Gauges cluster */}
            <div className="hidden md:flex items-center gap-3">
              <StatChip label="ACTIVE" value={activeCount} color={T.accent1} T={T}/>
              <StatChip label="COLD"   value={blockedCount} color={T.accent4} T={T}/>
              <StatChip label="DUE"    value={tasksDue} color={T.accentCyan} T={T}/>
              <StatChip label="SHIPPED" value={shippedCount} color={T.accent3} T={T}/>
            </div>

            {/* Temp gauge */}
            <div className="relative pl-3 ml-1 hidden md:block" style={{borderLeft:`1px solid ${T.borderSoft}`}}>
              <TempGauge temp={temp} color={T.accent1} light={light}/>
            </div>

            <div className="flex-1 md:hidden"/>

            <Clock light={light}/>

            {actionButton}

            <button aria-label="Alerts" className="hidden sm:inline-flex p-2 rounded-sm transition hover:bg-black/5 relative"
              style={{color:T.bell}}>
              <Bell size={14}/>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{background:T.bellDot, boxShadow:`0 0 6px ${T.bellDot}`}}/>
            </button>
            <button aria-label="Theme" onClick={toggle}
              title={`Switch to ${light?"foundry":"drafting"} mode`}
              className="p-2 rounded-sm transition hover:bg-black/5 hidden sm:inline-flex"
              style={{color:T.fgMuted}}>
              {light ? <Moon size={14}/> : <Sun size={14}/>}
            </button>
            <button aria-label="Settings" onClick={()=>setSettingsOpen(v=>!v)}
              title="Forge settings"
              className="p-2 rounded-sm transition hover:bg-black/5 hidden sm:inline-flex"
              style={{color:settingsOpen?T.accent1:T.fgMuted}}>
              <Settings size={14}/>
            </button>
            <button aria-label="Ember soundscape" onClick={()=>setEmbers(v=>!v)}
              title={embers?"Mute embers":"Ember soundscape"}
              className="p-2 rounded-sm transition hover:bg-black/5 hidden sm:inline-flex"
              style={{color:embers?T.accent2:T.fgMuted}}>
              {embers ? <Volume2 size={14}/> : <VolumeX size={14}/>}
            </button>
            {rightExtras}

            <div className="relative px-2 py-1 rounded-sm steel-plate text-[10px] tracking-widest hidden sm:flex items-center gap-1"
              style={{color:T.seal, background:T.sealBg, borderColor:T.seal}}>
              <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
              <Gauge size={10}/> HEAT
            </div>
          </div>

          {/* Section eyebrow */}
          <div className="flex items-center gap-2 px-4 md:px-6 py-1.5"
            style={{background: light ? "rgba(31,41,55,0.05)" : "rgba(245,158,11,0.04)", borderBottom:`1px solid ${T.borderSoft}`}}>
            <span className="mono text-[10px] tracking-[0.3em] font-black" style={{color:aColor}}>§{active.code} · {active.label.toUpperCase()}</span>
            <span className="h-px flex-1" style={{background:T.borderSoft}}/>
            <span className="flex items-center gap-1 mono text-[10px] tracking-widest" style={{color:T.dotOnline}}>
              <span style={{width:6,height:6,borderRadius:999,background:T.dotOnline,boxShadow:`0 0 6px ${T.dotOnline}`,animation:"f-pulse-rivet 1.8s ease-in-out infinite",color:T.dotOnline}}/>
              LIVE
            </span>
            <span className="hidden sm:inline mono text-[10px] tracking-widest" style={{color:T.fgMuted}}>
              <kbd style={{padding:"0 4px",border:`1px solid ${T.border}`,borderRadius:2,color:T.accent1,marginRight:4}}>?</kbd>hotkeys
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto relative z-10" style={{paddingBottom:40}}>
          <AnimatePresence mode="wait">
            {actionPanel ? (
              <motion.div key="action-panel"
                initial={{ opacity:0, y:16, scale:0.99, filter:"blur(6px)" }}
                animate={{ opacity:1, y:0, scale:1, filter:"blur(0px)" }}
                exit={{ opacity:0, y:-8, scale:1, filter:"blur(4px)" }}
                transition={{ duration:0.3, ease:[0.22,1,0.36,1] }}
                className="px-4 md:px-8 py-5 md:py-8">
                {actionPanel}
              </motion.div>
            ) : (
              <motion.div key={section}
                initial={{ opacity:0, y:16, filter:"blur(6px)" }}
                animate={{ opacity:1, y:0, filter:"blur(0px)" }}
                exit={{ opacity:0, y:-8, filter:"blur(4px)" }}
                transition={{ duration:0.25, ease:[0.22,1,0.36,1] }}
                className="px-4 md:px-8 py-5 md:py-7">
                <div className="max-w-[1600px] mx-auto w-full">{children}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Settings modal */}
        <AnimatePresence>
          {settingsOpen && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              style={{background:"rgba(0,0,0,0.7)"}} onClick={()=>setSettingsOpen(false)}>
              <motion.div initial={{scale:0.95,y:8}} animate={{scale:1,y:0}} exit={{scale:0.95,y:8}}
                onClick={e=>e.stopPropagation()}
                className="relative w-full max-w-md steel-plate p-6"
                style={{background:"var(--fr-card)",borderColor:"var(--fr-amber)",color:"var(--fr-fg)"}}>
                <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-black tracking-widest" style={{color:"var(--fr-amber)"}}>⚙ FORGE SETTINGS</h2>
                  <button onClick={()=>setSettingsOpen(false)} className="mono text-[10px] tracking-widest px-2 py-1 rounded-sm" style={{color:"var(--fr-fgMuted)"}}>ESC</button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mono text-[10px] tracking-widest block mb-1" style={{color:"var(--fr-fgMuted)"}}>FORGE NAME</label>
                    <input value={sName} onChange={e=>setSName(e.target.value)}
                      className="w-full px-3 py-2 rounded-sm outline-none mono text-sm"
                      style={{background:"var(--fr-card2)",border:"1px solid var(--fr-border)",color:"var(--fr-fg)"}}/>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="mono text-[10px] tracking-widest block mb-1" style={{color:"var(--fr-fgMuted)"}}>SPRINT (DAYS)</label>
                      <input type="number" min={3} max={60} value={sLen} onChange={e=>setSLen(Number(e.target.value))}
                        className="w-full px-2 py-2 rounded-sm outline-none mono text-sm"
                        style={{background:"var(--fr-card2)",border:"1px solid var(--fr-border)",color:"var(--fr-fg)"}}/>
                    </div>
                    <div>
                      <label className="mono text-[10px] tracking-widest block mb-1" style={{color:"var(--fr-fgMuted)"}}>WORK START</label>
                      <input type="number" min={0} max={23} value={sStart} onChange={e=>setSStart(Number(e.target.value))}
                        className="w-full px-2 py-2 rounded-sm outline-none mono text-sm"
                        style={{background:"var(--fr-card2)",border:"1px solid var(--fr-border)",color:"var(--fr-fg)"}}/>
                    </div>
                    <div>
                      <label className="mono text-[10px] tracking-widest block mb-1" style={{color:"var(--fr-fgMuted)"}}>WORK END</label>
                      <input type="number" min={0} max={23} value={sEnd} onChange={e=>setSEnd(Number(e.target.value))}
                        className="w-full px-2 py-2 rounded-sm outline-none mono text-sm"
                        style={{background:"var(--fr-card2)",border:"1px solid var(--fr-border)",color:"var(--fr-fg)"}}/>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={()=>setSettingsOpen(false)} className="mono text-[10px] tracking-widest px-3 py-2" style={{color:"var(--fr-fgMuted)"}}>CANCEL</button>
                  <button onClick={saveSettings}
                    className="mono text-[10px] font-black tracking-widest px-4 py-2 rounded-sm flex items-center gap-1"
                    style={{background:"var(--fr-amber)",color:"#000"}}>
                    <Hammer size={12}/> CALIBRATE
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Diamond-plate footer exhaust */}
        <footer className="relative h-8 shrink-0 flex items-center gap-3 px-3 md:px-6 z-20"
          style={{background:T.footerBg, borderTop:`2px solid ${T.border}`}}>
          <div className="absolute inset-0 diamond-plate pointer-events-none" style={{opacity:0.5}}/>
          <div className="relative flex items-center gap-2 mono text-[10px] tracking-widest" style={{color:T.fgMuted}}>
            <span style={{color:T.dotOnline,textShadow:`0 0 6px ${T.dotOnline}`}}>●</span> FORGE::LIVE
          </div>
          <span className="relative mono text-[10px] tracking-widest hidden sm:inline" style={{color:T.fgMuted}}>
            ANVIL::{active.code}
          </span>
          <span className="relative flex-1"/>
          <span className={`relative ${light?"pencil":"mono"} text-[10px] tracking-widest`} style={{color:T.fgMuted}}>
            kaizen.forge // v1.1 — {light ? "vellum" : "foundry"}
          </span>
        </footer>
      </div>
    </div>
  );
}

function StatChip({ label, value, color, T }:{label:string;value:number|string;color:string;T:any}) {
  return (
    <div className="relative px-2.5 py-1.5 rounded-sm steel-plate flex items-center gap-2"
      style={{color, background:T.cardBg2, borderColor:`${color}88`, minWidth:74}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <span className="mono text-[9px] tracking-widest" style={{color:T.fgMuted}}>{label}</span>
      <span className="text-lg font-black leading-none ml-auto" style={{color}}>{value}</span>
    </div>
  );
}
