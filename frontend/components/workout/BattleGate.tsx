"use client";

/**
 * BattleGate — the "open the gates" intro that greets every visit to /workout.
 *
 * Closed state (default on first paint):
 *   - Full-screen obsidian throne room: damascus scales + dragon silhouette +
 *     floating embers + giant K sigil
 *   - One primary BATTLE button pulsing gold, crossed-swords decorations,
 *     vertical Latin "MEMENTO · AUDERE · SEMPER" motto
 *   - No left rail / top strip / bottom tabs are visible — total immersion
 *
 * Open animation on click:
 *   1. Screenshake
 *   2. Two katana SVG slash diagonals sweep across the view (red-to-gold arc)
 *   3. Dragon-fire burst from the center (radial gradient + ember particles)
 *   4. Nav card materializes behind the slashes with scale+glow
 *   5. Slashes retract and shell chrome fades in
 *
 * Once opened the shell shows the rail/top strip as normal. A small "✕ Retreat"
 * button in the top strip closes the gate back to the throne. Slash transitions
 * between sub-pages are handled by SectionSlash (used in WorkoutShell).
 */

import { AnimatePresence, motion } from "framer-motion";
import { Swords, Flame, Crown, Shield } from "lucide-react";
import { useState } from "react";

interface Props {
  onOpen: () => void;
  todaysRoutineName?: string;
  onQuickStart?: () => void;
  onStartTodays?: () => void;
}

export default function BattleGate({ onOpen, todaysRoutineName, onQuickStart, onStartTodays }: Props) {
  const [stage, setStage] = useState<"idle" | "slashing" | "burst" | "done">("idle");

  const handleBattle = () => {
    if (stage !== "idle") return;
    setStage("slashing");
    // Slash → burst → hand off to shell
    window.setTimeout(() => setStage("burst"), 420);
    window.setTimeout(() => {
      setStage("done");
      onOpen();
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(26,17,20,0.95) 0%, #050304 80%)",
      }}>
      {/* Damascus scale floor */}
      <div aria-hidden className="absolute inset-0 scale-pattern opacity-50" />
      <div aria-hidden className="absolute inset-0 grille-pattern opacity-20" />

      {/* Dragon silhouette watermark (flipped/rotated to feel like two dragons) */}
      <motion.div aria-hidden
        className="absolute dragon-watermark pointer-events-none"
        style={{ inset: 0, opacity: 0.35 }}
        animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />

      {/* Vignette */}
      <div aria-hidden className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)",
        }} />

      {/* Floating embers */}
      <Embers count={40} />

      {/* Vertical Latin motto left + right */}
      <div aria-hidden className="hidden md:flex absolute left-4 top-0 bottom-0 items-center">
        <div className="emperor-title text-[11px] tracking-[0.7em] opacity-40"
          style={{ writingMode: "vertical-rl", color: "#d4af37" }}>
          MEMENTO · AUDERE · SEMPER
        </div>
      </div>
      <div aria-hidden className="hidden md:flex absolute right-4 top-0 bottom-0 items-center">
        <div className="emperor-title text-[11px] tracking-[0.7em] opacity-40"
          style={{ writingMode: "vertical-rl", color: "#c81d25" }}>
          VINCIT · QUI · SE · VINCIT
        </div>
      </div>

      {/* Gate content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Crown + sigil */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
          className="relative mb-6"
        >
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-[28%] flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #b91c1c 0%, #6f0f0f 100%)",
              border: "2px solid rgba(253,230,138,0.6)",
              boxShadow:
                "0 0 80px -10px rgba(185,28,28,0.9), " +
                "inset 0 2px 0 rgba(253,230,138,0.3), " +
                "0 0 120px -20px rgba(212,175,55,0.5)",
            }}>
            <Crown size={48} className="text-amber-100 animate-crown-glow"
              style={{ filter: "drop-shadow(0 0 14px rgba(253,230,138,0.7))" }} />
            {/* rotating rune ring */}
            <motion.div aria-hidden
              className="absolute inset-[-8px] rounded-[28%] pointer-events-none"
              style={{
                border: "1px dashed rgba(212,175,55,0.4)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />
          </div>
          <div aria-hidden className="absolute -top-3 -left-3 text-amber-200 text-2xl animate-float">✦</div>
          <div aria-hidden className="absolute -bottom-2 -right-4 text-red-400 text-xl animate-float" style={{ animationDelay: "1s" }}>✦</div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="imperial-name text-5xl md:text-7xl tracking-[0.15em] animate-crown-glow mb-3"
          style={{
            background: "linear-gradient(135deg, #fde68a 0%, #d4af37 40%, #b91c1c 80%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            filter: "drop-shadow(0 0 25px rgba(212,175,55,0.35))",
          }}>
          KAIZER
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="serif-body italic text-lg md:text-xl max-w-lg mb-2"
          style={{ color: "#d4af37" }}>
          Training is war against yesterday&apos;s self.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.55 }}
          className="emperor-title text-[10px] tracking-[0.5em] mb-10"
          style={{ color: "rgba(212,175,55,0.7)" }}>
          ⚔  HALL OF BLADES  ⚔
        </motion.p>

        {/* Battle button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.7, type: "spring", stiffness: 200, damping: 14 }}
          className="relative">
          {/* Glow halo */}
          <motion.div aria-hidden
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{
              boxShadow: [
                "0 0 40px 0px rgba(185,28,28,0.6), 0 0 80px 10px rgba(212,175,55,0.35)",
                "0 0 60px 4px rgba(185,28,28,0.9), 0 0 120px 18px rgba(212,175,55,0.6)",
                "0 0 40px 0px rgba(185,28,28,0.6), 0 0 80px 10px rgba(212,175,55,0.35)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <button onClick={handleBattle}
            disabled={stage !== "idle"}
            className="relative overflow-hidden px-12 py-5 rounded-2xl emperor-title text-2xl md:text-3xl tracking-[0.35em] font-black transition-transform hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 50%, #b91c1c 100%)",
              color: "#fff8e4",
              border: "2px solid rgba(253,230,138,0.5)",
              textShadow: "0 2px 4px rgba(0,0,0,0.6), 0 0 14px rgba(253,230,138,0.4)",
              boxShadow: "inset 0 2px 0 rgba(253,230,138,0.3)",
            }}>
            {/* Shimmer */}
            <span aria-hidden className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(110deg, transparent 30%, rgba(253,230,138,0.4) 50%, transparent 70%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2.5s linear infinite",
              }} />
            <span className="relative flex items-center gap-3">
              <Swords size={26} className="text-amber-200" />
              BATTLE
              <Swords size={26} className="text-amber-200" style={{ transform: "scaleX(-1)" }} />
            </span>
          </button>
        </motion.div>

        {/* Quick actions under button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.95 }}
          className="mt-8 flex flex-wrap gap-3 items-center justify-center">
          {todaysRoutineName && onStartTodays && (
            <button onClick={() => { handleBattle(); window.setTimeout(onStartTodays, 900); }}
              className="btn-gold flex items-center gap-2 text-sm">
              <Flame size={14} /> {todaysRoutineName}
            </button>
          )}
          {onQuickStart && (
            <button onClick={() => { handleBattle(); window.setTimeout(onQuickStart, 900); }}
              className="btn-ghost flex items-center gap-2 text-sm">
              <Shield size={14} /> Quick Skirmish
            </button>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-6 left-0 right-0 text-center text-[11px] emperor-title tracking-[0.4em] opacity-50"
          style={{ color: "#d4af37" }}>
          PRESS BATTLE TO ENTER THE ARENA
        </motion.p>
      </div>

      {/* Slash layers (AnimatePresence) */}
      <AnimatePresence>
        {(stage === "slashing" || stage === "burst") && (
          <>
            {/* Two diagonal slashes */}
            <motion.div aria-hidden key="slash1"
              initial={{ clipPath: "inset(0 100% 100% 0)", opacity: 0 }}
              animate={{ clipPath: "inset(0 -10% -10% 0)", opacity: [0,1,1,0.8] }}
              exit={{ clipPath: "inset(100% 0 0 0)", opacity: 0 }}
              transition={{ duration: stage === "slashing" ? 0.4 : 0.35, ease: [0.7,0,0.3,1] }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(135deg, transparent 45%, rgba(253,230,138,0.9) 49%, rgba(255,255,255,1) 50%, rgba(253,230,138,0.9) 51%, transparent 55%)",
                filter: "drop-shadow(0 0 18px rgba(253,230,138,0.9)) drop-shadow(0 0 40px rgba(185,28,28,0.6))",
              }} />
            <motion.div aria-hidden key="slash2"
              initial={{ clipPath: "inset(100% 0 0 100%)", opacity: 0 }}
              animate={{ clipPath: "inset(-10% 0 0 -10%)", opacity: [0,1,1,0.8] }}
              exit={{ clipPath: "inset(0 100% 100% 0)", opacity: 0 }}
              transition={{ duration: stage === "slashing" ? 0.45 : 0.38, ease: [0.7,0,0.3,1], delay: 0.08 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(45deg, transparent 45%, rgba(185,28,28,0.9) 49%, rgba(253,230,138,0.95) 50%, rgba(185,28,28,0.9) 51%, transparent 55%)",
                filter: "drop-shadow(0 0 20px rgba(185,28,28,0.9))",
              }} />
          </>
        )}
        {stage === "burst" && (
          <motion.div aria-hidden key="burst"
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 1, 0.8, 0], scale: [0.2, 1.8, 2.5, 4] }}
            transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[60vmin] h-[60vmin] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(253,230,138,0.9) 0%, rgba(185,28,28,0.7) 30%, transparent 70%)",
                filter: "blur(12px)",
              }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screenshake on battle press */}
      <AnimatePresence>
        {stage !== "idle" && stage !== "done" && (
          <motion.div aria-hidden key="shake"
            initial={{ x: 0, y: 0 }}
            animate={{ x: [0,-6,6,-4,4,-2,2,0], y: [0,3,-3,2,-2,1,-1,0] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Floating embers ---------- */
function Embers({ count }: { count: number }) {
  const bits = Array.from({ length: count }).map((_, i) => {
    const left = Math.random() * 100;
    const size = 2 + Math.random() * 4;
    const delay = Math.random() * 6;
    const dur = 5 + Math.random() * 8;
    const hue = Math.random() > 0.5 ? "#fde68a" : (Math.random() > 0.5 ? "#b91c1c" : "#ec4899");
    return (
      <motion.span key={i}
        className="absolute rounded-full"
        style={{
          left: `${left}%`, bottom: `-10px`,
          width: size, height: size,
          background: hue,
          boxShadow: `0 0 ${size*3}px ${hue}`,
        }}
        initial={{ y: 0, opacity: 0 }}
        animate={{
          y: ["110vh", "-10vh"],
          opacity: [0, 1, 1, 0],
          x: [0, (Math.random()-0.5)*60, (Math.random()-0.5)*-60, 0],
        }}
        transition={{ duration: dur, delay, repeat: Infinity, ease: "linear" }}
      />
    );
  });
  return <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">{bits}</div>;
}
