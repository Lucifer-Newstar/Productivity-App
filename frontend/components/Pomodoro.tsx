"use client";

/**
 * Pomodoro timer — focus / short-break / long-break modes.
 * Animated circular SVG progress ring, live minute:second display, session counter,
 * optional beep when a session ends, and start/pause/reset/skip controls.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Brain, SkipForward, Volume2, VolumeX } from "lucide-react";

type Mode = "focus" | "short" | "long";
const MODES: Record<Mode, { label: string; minutes: number; color: string; icon: any; tagline: string; ring: [string, string] }> = {
  focus: { label: "Focus",      minutes: 25, color: "from-accent to-accent-pink",    icon: Brain,  tagline: "Deep work. No distractions.", ring: ["#8b5cf6", "#ec4899"] },
  short: { label: "Short Break", minutes: 5, color: "from-accent-cyan to-accent-lime", icon: Coffee, tagline: "Stretch. Hydrate. Breathe.",   ring: ["#06b6d4", "#a3e635"] },
  long:  { label: "Long Break", minutes: 15, color: "from-accent-cyan to-accent",    icon: Coffee, tagline: "You earned it. Step away.",  ring: ["#06b6d4", "#8b5cf6"] },
};

export default function Pomodoro() {
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [muted, setMuted] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const total = MODES[mode].minutes * 60;
  const progress = 1 - secondsLeft / total;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  useEffect(() => {
    setSecondsLeft(MODES[mode].minutes * 60);
    setRunning(false);
  }, [mode]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          if (!muted) {
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g);
              g.connect(ctx.destination);
              o.frequency.value = 800;
              g.gain.value = 0.15;
              o.start();
              o.stop(ctx.currentTime + 0.3);
              o.frequency.setValueAtTime(600, ctx.currentTime + 0.15);
            } catch {}
          }
          if (mode === "focus") {
            setSessions((n) => n + 1);
            setMode((sessions + 1) % 4 === 0 ? "long" : "short");
          } else {
            setMode("focus");
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running, mode, sessions, muted]);

  const reset = () => { setSecondsLeft(MODES[mode].minutes * 60); setRunning(false); };
  const skip = () => setSecondsLeft(0);

  const ModeIcon = MODES[mode].icon;
  const circ = 2 * Math.PI * 140;
  const gradId = `pomodoro-grad-${mode}`;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Focus Session</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Work in bursts. Rest intentionally.</p>
      </div>

      {/* Mode switcher */}
      <div className="flex justify-center gap-2 p-1 bg-black/5 dark:bg-bg-card/60 rounded-2xl border border-black/5 dark:border-white/5 max-w-md mx-auto">
        {(Object.keys(MODES) as Mode[]).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                active
                  ? `bg-gradient-to-r ${MODES[m].color} text-white shadow-lg`
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {MODES[m].label}
            </button>
          );
        })}
      </div>

      {/* Timer ring */}
      <div className="flex justify-center">
        <div className="relative w-80 h-80 flex items-center justify-center">
          <svg width="320" height="320" className="-rotate-90">
            {/* Track */}
            <circle cx="160" cy="160" r="140" stroke="rgba(0,0,0,0.08)" strokeWidth="12" fill="none" className="dark:stroke-white/10" />
            <motion.circle
              cx="160"
              cy="160"
              r="140"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              stroke={`url(#${gradId})`}
              strokeDasharray={circ}
              animate={{ strokeDashoffset: circ * (1 - progress) }}
              transition={{ duration: 0.5, ease: "linear" }}
              style={{ filter: `drop-shadow(0 0 12px ${MODES[mode].ring[0]}66)` }}
            />
            <defs>
              <linearGradient id="pomodoro-grad-focus" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="pomodoro-grad-short" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#a3e635" />
              </linearGradient>
              <linearGradient id="pomodoro-grad-long" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${MODES[mode].color} text-white mb-4 shadow`}>
              <ModeIcon size={12} />
              {MODES[mode].label}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${minutes}:${seconds}`}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.05, opacity: 0 }}
                className="text-6xl font-bold font-mono tracking-tight text-gray-900 dark:text-white"
              >
                {String(minutes).padStart(2, "0")}
                <span className={running ? "animate-pulse" : ""}>:</span>
                {String(seconds).padStart(2, "0")}
              </motion.div>
            </AnimatePresence>
            <p className="text-sm text-gray-500 mt-3">{MODES[mode].tagline}</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">{sessions} sessions completed today</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <button onClick={reset} className="btn-ghost flex items-center gap-2">
          <RotateCcw size={16} /> Reset
        </button>
        <button onClick={() => setRunning((r) => !r)} className="btn-primary flex items-center gap-2 px-8 text-base">
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={skip} className="btn-ghost flex items-center gap-2">
          <SkipForward size={16} /> Skip
        </button>
        <button onClick={() => setMuted((m) => !m)} className="btn-ghost p-2.5" title={muted ? "Unmute" : "Mute"}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      <div className="card max-w-md mx-auto">
        <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">How it works</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex gap-2"><span className="text-accent font-semibold">1.</span> 25 minutes of distraction-free focus</li>
          <li className="flex gap-2"><span className="text-accent-cyan font-semibold">2.</span> 5 minute short break between sessions</li>
          <li className="flex gap-2"><span className="text-accent-pink font-semibold">3.</span> After 4 sessions, take a 15 minute long break</li>
        </ul>
      </div>
    </div>
  );
}
