"use client";

/**
 * CareerFx — global polish layer for the /career space.
 *
 * Provides:
 *  - burst({color, count})    — callable particle/confetti burst from anywhere
 *  - toast({title, sub, color}) — HUD achievement stamp toast (bottom-left)
 *  - BootScreen               — 1.2s matrix boot sequence shown once per session
 *  - Typist                   — terminal typewriter text (reveals once per mount)
 *  - KeyboardArmed            — footer chip that glows when user has typed
 *
 * Uses a small singleton event bus so sections don't need prop drilling.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../../lib/theme";
import { CheckCircle2, Zap, Terminal } from "lucide-react";

/* ---------- event bus ---------- */

type BurstOpts = { color?: string; count?: number; x?: number; y?: number };
type ToastOpts = {
  id?: string;
  title: string;
  sub?: string;
  color?: string;
  icon?: "check" | "zap" | "term";
  timeout?: number;
};

type Bus = {
  burst: (opts?: BurstOpts) => void;
  toast: (opts: ToastOpts) => void;
};

const Ctx = createContext<Bus | null>(null);

export function useCareerFx() {
  const b = useContext(Ctx);
  if (!b) throw new Error("useCareerFx must be used inside <CareerFx>");
  return b;
}

/* ---------- particle canvas burst ---------- */

function ParticleLayer() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const burstsRef = useRef<
    { x: number; y: number; color: string; parts: { vx: number; vy: number; life: number; size: number }[] }[]
  >([]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const resize = () => {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      burstsRef.current = burstsRef.current.filter((b) => b.parts.length > 0);
      for (const b of burstsRef.current) {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        b.parts = b.parts.filter((p) => p.life > 0);
        for (const p of b.parts) {
          p.vy += 0.12;
          p.vx *= 0.99;
          p.life -= 1;
          const px = b.x + p.vx * (60 - p.life);
          const py = b.y + p.vy * (60 - p.life) + 0.5 * 0.12 * (60 - p.life) ** 2;
          ctx.globalAlpha = Math.max(0, p.life / 60);
          ctx.fillRect(px, py, p.size, p.size);
        }
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const handler = (e: Event) => {
      const d = (e as CustomEvent<BurstOpts>).detail ?? {};
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = d.x ?? w / 2;
      const cy = d.y ?? h / 2;
      const color = d.color ?? "#22d3ee";
      const count = d.count ?? 42;
      const parts = Array.from({ length: count }, () => {
        const ang = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 6;
        return {
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 2,
          life: 40 + Math.floor(Math.random() * 30),
          size: Math.random() < 0.7 ? 2 : 3,
        };
      });
      burstsRef.current.push({ x: cx, y: cy, color, parts });
    };
    window.addEventListener("career:burst", handler);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("career:burst", handler);
    };
  }, []);

  return (
    <canvas ref={ref} aria-hidden
      className="pointer-events-none fixed inset-0 z-[60]" />
  );
}

/* ---------- toasts ---------- */

type Toast = ToastOpts & { born: number };

function ToastLayer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const o = (e as CustomEvent<ToastOpts>).detail;
      const id = o.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((ts) => [...ts.filter((t) => t.id !== id), { ...o, id, born: Date.now() }]);
      const life = o.timeout ?? 2400;
      setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), life);
    };
    window.addEventListener("career:toast", handler);
    return () => window.removeEventListener("career:toast", handler);
  }, []);

  return (
    <div className="fixed bottom-10 left-4 md:left-6 z-[55] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = t.icon === "zap" ? Zap : t.icon === "term" ? Terminal : CheckCircle2;
          return (
            <motion.div key={t.id}
              initial={{ opacity: 0, x: -40, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative px-3 py-2 hud-corner flex items-center gap-2.5 text-[11px] font-mono tracking-wider pointer-events-auto"
              style={{
                color: t.color ?? "#34d399",
                background: "rgba(8,18,30,0.85)",
                borderColor: t.color ?? "#34d399",
                boxShadow: `0 0 24px -8px ${t.color ?? "#34d399"}`,
                backdropFilter: "blur(6px)",
              }}>
              <span className="c-tr"/><span className="c-bl"/>
              <Icon size={14}/>
              <div className="flex flex-col">
                <span className="font-bold" style={{color: "#e2e8f0"}}>{t.title}</span>
                {t.sub ? <span style={{color: "#94a3b8"}} className="text-[10px]">{t.sub}</span> : null}
              </div>
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                style={{background: t.color ?? "#34d399", boxShadow:`0 0 6px ${t.color ?? "#34d399"}`, animation:"k-pulse-dot 1.6s ease-in-out infinite"}}/>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ---------- boot screen ---------- */

const BOOT_LINES = [
  "> kaizen.career // v2.0",
  "> mounting neural matrix...",
  "> calibrating hud grid............ OK",
  "> loading 9 sectors................ OK",
  "> restoring session........... { USR::K }",
  "> compiled. welcome operator.",
];

function BootScreen() {
  const [visible, setVisible] = useState(true);
  const [lineIdx, setLineIdx] = useState(0);
  const { theme } = useTheme();
  const light = theme === "light";

  useEffect(() => {
    const done = sessionStorage.getItem("kaizen.career.booted");
    if (done) { setVisible(false); return; }
    sessionStorage.setItem("kaizen.career.booted", "1");
    let i = 0;
    const iv = window.setInterval(() => {
      i++;
      setLineIdx(i);
      if (i >= BOOT_LINES.length + 1) {
        window.clearInterval(iv);
        window.setTimeout(() => setVisible(false), 380);
      }
    }, 150);
    return () => window.clearInterval(iv);
  }, []);

  if (!visible) return null;

  const bg = light ? "#f5f1e6" : "#05080d";
  const fg = light ? "#0c4a6e" : "#22d3ee";
  const fgMuted = light ? "#475569" : "#64748b";
  const accent = light ? "#c2410c" : "#22d3ee";

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: lineIdx >= BOOT_LINES.length + 1 ? 0 : 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[70] flex items-center justify-center font-mono"
      style={{ background: bg }}>
      <style jsx>{`
        @keyframes bootBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
      `}</style>
      <div className="w-full max-w-xl px-6" style={{ color: fg }}>
        {/* top bracket */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1" style={{background:fg}}/>
          <span className="text-[10px] tracking-[0.3em]" style={{color:fgMuted}}>KAIZEN::BOOT</span>
          <div className="h-px flex-1" style={{background:fg}}/>
        </div>
        <pre className="text-[12px] md:text-sm leading-7">
          {BOOT_LINES.slice(0, lineIdx).map((l, i) => {
            const last = i === lineIdx - 1;
            return (
              <div key={i} style={{ color: i === BOOT_LINES.length - 1 ? accent : fg }}>
                {l}
                {last && <span className="inline-block w-2 h-4 ml-1 align-middle"
                  style={{background:accent,animation:"bootBlink 1s steps(2) infinite"}}/>}
              </div>
            );
          })}
        </pre>
        {/* progress bar */}
        <div className="mt-6 h-[2px] w-full relative overflow-hidden" style={{background:fgMuted, opacity:0.3}}>
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min(100, (lineIdx / BOOT_LINES.length) * 100)}%` }}
            transition={{ duration: 0.2 }}
            className="h-full" style={{background:accent}}/>
        </div>
        <div className="mt-2 text-right text-[10px] tracking-widest" style={{color:fgMuted}}>
          SECTOR::00 — {Math.round(Math.min(100, (lineIdx / BOOT_LINES.length) * 100))}%
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- typist (terminal typewriter for subtitles) ---------- */

export function Typist({ text, delay = 0, speed = 18, className = "", style }: {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    let t: number;
    const start = window.setTimeout(() => {
      t = window.setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) {
          window.clearInterval(t);
          setDone(true);
        }
      }, speed);
    }, delay);
    return () => { window.clearTimeout(start); window.clearInterval(t!); };
  }, [text, delay, speed]);
  return (
    <span className={className} style={style}>
      {out}
      {!done && <span className="inline-block w-1.5 h-3 ml-0.5 align-middle"
        style={{background: "currentColor", animation:"k-blink 1s steps(2) infinite"}}/>}
    </span>
  );
}

/* ---------- keyboard armed footer indicator ---------- */

function KeyboardArmed() {
  const [armed, setArmed] = useState(false);
  const [key, setKey] = useState("");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      setArmed(true);
      setKey(e.key.length === 1 ? e.key.toUpperCase() : e.key);
      window.clearTimeout((window as any).__karmed_t);
      (window as any).__karmed_t = window.setTimeout(() => setArmed(false), 1500);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence>
      {armed && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="inline-flex items-center gap-1 text-[10px] tracking-widest"
          style={{color:"#34d399"}}>
          <span>KEY::ARMED</span>
          <kbd className="px-1 rounded-sm border"
            style={{borderColor:"#34d399", color:"#34d399", fontFamily:"inherit"}}>{key === " " ? "␣" : key}</kbd>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/* ---------- provider ---------- */

export default function CareerFx({ children }: { children: React.ReactNode }) {
  const bus = useMemo<Bus>(() => ({
    burst: (opts = {}) => window.dispatchEvent(new CustomEvent("career:burst", { detail: opts })),
    toast: (opts) => window.dispatchEvent(new CustomEvent("career:toast", { detail: opts })),
  }), []);

  return (
    <Ctx.Provider value={bus}>
      {children}
      <ParticleLayer />
      <ToastLayer />
      <GlobalCssHooks />
    </Ctx.Provider>
  );
}

/* Export these so shells can mount the boot screen & keyboard indicator */
export { BootScreen, KeyboardArmed };

/* ---------- global CSS polish hooks (hover lift, pencil press, etc) ---------- */

function GlobalCssHooks() {
  return (
    <style>{`
      /* hud-corner card hover lift + glow — in dark only (too cutesy on blueprint) */
      .career-root[data-lt="0"] .hud-corner {
        transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
      }
      .career-root[data-lt="0"] .hud-corner:hover {
        transform: translateY(-1px);
      }
      .career-root[data-lt="0"] button.hud-corner:hover {
        box-shadow: 0 0 24px -8px currentColor;
      }

      /* Blueprint pencil-press: buttons/clickable corners jiggle like pencil mark */
      .career-root[data-lt="1"] button.hud-corner:active {
        transform: translate(1px, 1px) rotate(0.3deg);
      }
      .career-root[data-lt="1"] .hud-corner:hover {
        box-shadow: 2px 2px 0 -1px var(--cr-border);
      }

      /* Subtle data-stream flicker for numeric chips (timers, counts) */
      @keyframes k-flicker {
        0%,96%,100% { opacity: 1; }
        97% { opacity: 0.7; }
        98% { opacity: 1; }
        99% { opacity: 0.85; }
      }
      .career-kpi { animation: k-flicker 6s infinite; }

      /* Milestone check BURST wrapper */
      .career-burst-target { position: relative; }

      /* Stamp animation for achievements (used by toasts) */
      @keyframes k-stamp {
        0% { transform: scale(1.6) rotate(-8deg); opacity: 0; }
        50% { transform: scale(0.95) rotate(-3deg); opacity: 1; }
        100% { transform: scale(1) rotate(-3deg); opacity: 1; }
      }
      .career-stamp { animation: k-stamp 0.45s ease-out; }

      /* Selection color matches theme */
      .career-root ::selection {
        background: var(--cr-accent);
        color: var(--cr-bg);
      }
    `}</style>
  );
}
