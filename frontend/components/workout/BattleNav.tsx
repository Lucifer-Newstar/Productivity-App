"use client";

/**
 * BattleNav — the primary navigation hub summoned by the BATTLE button.
 *
 * Renders:
 *   - A floating/pulsing BATTLE trigger button (crossed-swords, crimson+gold).
 *   - On click: a full-screen obsidian overlay featuring two diagonal katana
 *     slashes sweeping in, a dragon-fire radial burst at center, ember
 *     particles, and a centered lacquer card displaying every workout
 *     section as an ornate button (icon + roman sigil + title + description).
 *   - Clicking a section fires the onChange callback, plays an exit slash,
 *     and closes. Pressing Esc / backdrop also closes.
 *
 * The card is a portal-style overlay with AnimatePresence.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Swords, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { WorkoutNavItem, WorkoutSectionId } from "./WorkoutShell";
import { WORKOUT_NAV } from "./WorkoutShell";

interface Props {
  current: WorkoutSectionId;
  onPick: (s: WorkoutSectionId) => void;
}

export default function BattleNav({ current, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"closed" | "slashing" | "open" | "closing">("closed");

  const openIt = () => {
    if (stage !== "closed") return;
    setStage("slashing");
    setOpen(true);
    window.setTimeout(() => setStage("open"), 500);
  };
  const closeIt = () => {
    if (stage !== "open") return;
    setStage("closing");
    window.setTimeout(() => { setOpen(false); setStage("closed"); }, 450);
  };

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeIt(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const pick = (s: WorkoutSectionId) => {
    if (stage !== "open") return;
    // Brief exit slash then hand off
    setStage("closing");
    window.setTimeout(() => {
      setOpen(false);
      setStage("closed");
      onPick(s);
    }, 400);
  };

  return (
    <>
      {/* ── Floating BATTLE trigger (always visible) ── */}
      <motion.button
        onClick={openIt}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative overflow-hidden px-5 md:px-6 py-2.5 rounded-xl emperor-title font-black tracking-[0.25em] text-sm md:text-base flex items-center gap-2 shrink-0"
        style={{
          background: "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 50%, #b91c1c 100%)",
          color: "#fff8e4",
          border: "2px solid rgba(253,230,138,0.5)",
          textShadow: "0 1px 2px rgba(0,0,0,0.6), 0 0 10px rgba(253,230,138,0.3)",
          boxShadow: "0 8px 24px -8px rgba(185,28,28,0.9), inset 0 1px 0 rgba(253,230,138,0.3)",
        }}>
        {/* Pulsing gold halo */}
        <motion.span aria-hidden
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 20px -2px rgba(212,175,55,0.5), inset 0 0 20px rgba(253,230,138,0.08)",
              "0 0 40px 2px rgba(212,175,55,0.9), inset 0 0 20px rgba(253,230,138,0.2)",
              "0 0 20px -2px rgba(212,175,55,0.5), inset 0 0 20px rgba(253,230,138,0.08)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Gold shimmer sweep */}
        <span aria-hidden className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(110deg, transparent 30%, rgba(253,230,138,0.45) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2.8s linear infinite",
          }} />
        <Swords size={18} className="relative text-amber-200" />
        <span className="relative">BATTLE</span>
        <Swords size={18} className="relative text-amber-200" style={{ transform: "scaleX(-1)" }} />
      </motion.button>

      {/* ── Overlay ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="battle-nav"
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0"
              onClick={closeIt}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: "radial-gradient(ellipse at center, rgba(20,13,16,0.85) 0%, #050304 80%)",
                backdropFilter: "blur(6px)",
              }}
            />

            {/* Scales + grille under the card */}
            <div aria-hidden className="absolute inset-0 scale-pattern opacity-30 pointer-events-none" />
            <div aria-hidden className="absolute inset-0 grille-pattern opacity-20 pointer-events-none" />

            {/* Embers */}
            <Embers count={30} />

            {/* Slash layers — animate in when slashing, animate out when closing */}
            {(stage === "slashing" || stage === "open" || stage === "closing") && (
              <>
                <motion.div aria-hidden key="slash1"
                  initial={{ clipPath: "inset(0 100% 100% 0)", opacity: 0 }}
                  animate={{ clipPath: stage === "closing"
                    ? "inset(100% -10% -10% 0)" as any
                    : "inset(0 -10% -10% 0)", opacity: stage === "closing" ? 0 : [0,1,1,0.6] }}
                  transition={{ duration: stage === "closing" ? 0.35 : 0.45, ease: [0.7,0,0.3,1] }}
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, transparent 45%, rgba(253,230,138,0.95) 49%, rgba(255,255,255,1) 50%, rgba(253,230,138,0.95) 51%, transparent 55%)",
                    filter: "drop-shadow(0 0 18px rgba(253,230,138,1)) drop-shadow(0 0 40px rgba(185,28,28,0.7))",
                  }}
                />
                <motion.div aria-hidden key="slash2"
                  initial={{ clipPath: "inset(100% 0 0 100%)", opacity: 0 }}
                  animate={{ clipPath: stage === "closing"
                    ? "inset(-10% 0 0 100%)" as any
                    : "inset(-10% 0 0 -10%)", opacity: stage === "closing" ? 0 : [0,1,1,0.6] }}
                  transition={{ duration: stage === "closing" ? 0.38 : 0.5, ease: [0.7,0,0.3,1], delay: stage === "closing" ? 0 : 0.08 }}
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(45deg, transparent 45%, rgba(185,28,28,0.9) 49%, rgba(253,230,138,0.95) 50%, rgba(185,28,28,0.9) 51%, transparent 55%)",
                    filter: "drop-shadow(0 0 20px rgba(185,28,28,1))",
                  }}
                />
                <motion.div aria-hidden key="fire"
                  initial={{ opacity: 0, scale: 0.2 }}
                  animate={{ opacity: stage === "slashing" ? [0,1,0.6] : (stage === "closing" ? 0 : 0), scale: stage === "slashing" ? [0.2,2.5,3.5] : 0 }}
                  transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[60vmin] h-[60vmin] rounded-full"
                    style={{
                      background: "radial-gradient(circle, rgba(253,230,138,0.9) 0%, rgba(185,28,28,0.7) 30%, transparent 70%)",
                      filter: "blur(14px)",
                    }}
                />
                </motion.div>
              </>
            )}

            {/* Nav card — pops in after slashes */}
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.8, rotateY: -20, y: 30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, rotateY: 10, y: -20 }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.22,1,0.36,1] }}
              className="relative z-10 w-full max-w-3xl rounded-3xl p-6 md:p-8 overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #1a1114 0%, #0f0a0d 100%)",
                border: "2px solid rgba(212,175,55,0.4)",
                boxShadow:
                  "0 30px 80px -20px rgba(0,0,0,0.9), " +
                  "inset 0 1px 0 rgba(212,175,55,0.25), " +
                  "0 0 80px -10px rgba(185,28,28,0.5)",
                perspective: 1200,
              }}
            >
              {/* Gold foil edge */}
              <span aria-hidden className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  padding: 1,
                  background: "linear-gradient(135deg, rgba(212,175,55,0.7), transparent 40%, rgba(212,175,55,0.5) 90%)",
                  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor", maskComposite: "exclude",
                }} />
              {/* Top katana blade */}
              <div aria-hidden className="k-blade mb-5" style={{ opacity: 0.7 }} />

              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="emperor-title text-[10px] tracking-[0.5em] flex items-center gap-2" style={{ color: "#d4af37" }}>
                    <Swords size={12} /> CHOOSE YOUR BATTLEFIELD <Swords size={12} style={{ transform: "scaleX(-1)" }} />
                  </div>
                  <h2 className="imperial-name text-3xl md:text-4xl mt-2 animate-crown-glow"
                    style={{
                      background: "linear-gradient(135deg, #fde68a 0%, #d4af37 40%, #b91c1c 80%)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}>
                    HALL OF BLADES
                  </h2>
                  <p className="serif-body italic mt-1 text-sm" style={{ color: "#9c7a1a" }}>
                    Select your campaign, Emperor.
                  </p>
                </div>
                <button onClick={closeIt}
                  className="p-2 rounded-lg transition hover:rotate-90"
                  style={{
                    color: "#fde68a",
                    background: "rgba(185,28,28,0.2)",
                    border: "1px solid rgba(212,175,55,0.3)",
                  }}>
                  <X size={18} />
                </button>
              </div>

              {/* Grid of sections */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3">
                {WORKOUT_NAV.map((item, i) => (
                  <NavButton key={item.id} item={item}
                    active={item.id === current}
                    delay={0.5 + i * 0.05}
                    onClick={() => pick(item.id)} />
                ))}
              </div>

              {/* Footer blade */}
              <div aria-hidden className="k-blade mt-5" style={{ opacity: 0.7 }} />
              <p className="text-center text-[10px] emperor-title tracking-[0.4em] mt-3"
                style={{ color: "rgba(212,175,55,0.6)" }}>
                VINCIT · QUI · SE · VINCIT
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- Single section button in the card ---------- */
function NavButton({ item, active, delay, onClick }:
  { item: WorkoutNavItem; active: boolean; delay: number; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.22,1,0.36,1] }}
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="relative group rounded-xl p-3 md:p-4 text-left overflow-hidden transition"
      style={{
        background: active
          ? `linear-gradient(135deg, ${item.color}30, ${item.color}08)`
          : "linear-gradient(145deg, rgba(26,17,20,0.9), rgba(15,10,13,0.7))",
        border: `1px solid ${active ? item.color : "rgba(212,175,55,0.22)"}`,
        boxShadow: active
          ? `0 8px 24px -8px ${item.color}aa, inset 0 1px 0 ${item.color}40`
          : "inset 0 1px 0 rgba(212,175,55,0.1), 0 4px 12px -8px rgba(0,0,0,0.6)",
      }}>
      {/* Hover gold sweep */}
      <span aria-hidden className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${item.color}00, ${item.color}20 50%, ${item.color}00)`,
        }} />
      {/* Color side strip */}
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: `linear-gradient(180deg, ${item.color}, ${item.color}80)`, boxShadow: `0 0 10px ${item.color}80` }} />

      <div className="flex items-center gap-2 mb-1.5 relative">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${item.color}40, ${item.color}10)`,
            border: `1px solid ${item.color}70`,
            color: item.color,
            boxShadow: `0 4px 12px -4px ${item.color}90`,
          }}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="emperor-title font-black text-sm tracking-[0.15em] truncate"
              style={{ color: active ? "#fde68a" : "#f3e9d2" }}>
              {item.label}
            </span>
          </div>
          <div className="text-[9px] emperor-title tracking-[0.3em]" style={{ color: item.color }}>
            {item.sigil}
          </div>
        </div>
      </div>
      {item.description && (
        <p className="text-[11px] serif-body italic leading-snug" style={{ color: "#9c7a1a" }}>
          {item.description}
        </p>
      )}
      {active && (
        <motion.span
          layoutId="battle-active-dot"
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }}
        />
      )}
    </motion.button>
  );
}

/* ---------- Floating embers ---------- */
function Embers({ count }: { count: number }) {
  const bits = Array.from({ length: count }).map((_, i) => {
    const left = Math.random() * 100;
    const size = 2 + Math.random() * 4;
    const delay = Math.random() * 4;
    const dur = 4 + Math.random() * 6;
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
        animate={{ y: "110vh", opacity: [0,1,1,0], x: [0,(Math.random()-0.5)*60,(Math.random()-0.5)*-60,0] }}
        transition={{ duration: dur, delay, repeat: Infinity, ease: "linear" }}
      />
    );
  });
  return <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">{bits}</div>;
}
