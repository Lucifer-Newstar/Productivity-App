"use client";

/**
 * BattleCard — the ornate "Hall of Blades" navigation card.
 *
 * Renders inline in the page (not a modal / fixed overlay) so it sits
 * cleanly below the top strip, properly inside the scrollable content
 * area.
 *
 * Animation sequence on mount:
 *   1. Two diagonal katana slashes sweep across the card (gold + red-gold)
 *   2. A dragon-fire radial burst blooms behind the content
 *   3. Each section button staggers in with a rise
 */

import { AnimatePresence, motion } from "framer-motion";
import { Swords, Flame as FlameIcon } from "lucide-react";
import { WORKOUT_NAV, type WorkoutSectionId } from "./WorkoutShell";
import GoldenDragon from "./GoldenDragon";

interface Props {
  current: WorkoutSectionId;
  onPick: (s: WorkoutSectionId) => void;
}

export default function BattleCard({ current, onPick }: Props) {
  return (
    <motion.div
      key="battle-card"
      initial={{ opacity: 0, y: 30, scale: 0.96, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.98, rotateX: 5 }}
      transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
      className="relative w-full max-w-5xl mx-auto rounded-3xl p-6 md:p-10 overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #1a1114 0%, #0f0a0d 100%)",
        border: "2px solid rgba(212,175,55,0.45)",
        boxShadow:
          "0 30px 80px -20px rgba(0,0,0,0.9), " +
          "inset 0 1px 0 rgba(212,175,55,0.25), " +
          "0 0 80px -10px rgba(185,28,28,0.55)",
        perspective: 1200,
      }}
    >
      {/* Gold foil edge */}
      <span aria-hidden className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          padding: 1,
          background: "linear-gradient(135deg, rgba(212,175,55,0.75), transparent 40%, rgba(212,175,55,0.55) 90%)",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor", maskComposite: "exclude",
        }} />

      {/* Damascus scale + grille background */}
      <div aria-hidden className="absolute inset-0 scale-pattern opacity-30 pointer-events-none" />
      <div aria-hidden className="absolute inset-0 grille-pattern opacity-20 pointer-events-none" />

      {/* Golden dragon (only when card is open — mounted here) */}
      <AnimatePresence>
        <GoldenDragon />
      </AnimatePresence>

      {/* ── Slashes (mount-only flash) ── */}
      <motion.div aria-hidden
        initial={{ clipPath: "inset(0 100% 100% 0)", opacity: 0 }}
        animate={{ clipPath: "inset(0 -10% -10% 0)", opacity: [0,1,1,0] }}
        transition={{ duration: 0.6, ease: [0.7,0,0.3,1] }}
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: "linear-gradient(135deg, transparent 45%, rgba(253,230,138,0.95) 49%, #fff 50%, rgba(253,230,138,0.95) 51%, transparent 55%)",
          filter: "drop-shadow(0 0 18px rgba(253,230,138,1)) drop-shadow(0 0 40px rgba(185,28,28,0.7))",
        }}
      />
      <motion.div aria-hidden
        initial={{ clipPath: "inset(100% 0 0 100%)", opacity: 0 }}
        animate={{ clipPath: "inset(-10% 0 0 -10%)", opacity: [0,1,1,0] }}
        transition={{ duration: 0.7, ease: [0.7,0,0.3,1], delay: 0.08 }}
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: "linear-gradient(45deg, transparent 45%, rgba(185,28,28,0.9) 49%, rgba(253,230,138,0.95) 50%, rgba(185,28,28,0.9) 51%, transparent 55%)",
          filter: "drop-shadow(0 0 20px rgba(185,28,28,1))",
        }}
      />

      {/* ── Dragon fire burst (center, fades) ── */}
      <motion.div aria-hidden
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0,1,0.4,0], scale: [0.2,1.5,2.2,2.5] }}
        transition={{ duration: 1, ease: [0.22,1,0.36,1] }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-[70vmin] h-[70vmin] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(253,230,138,0.8) 0%, rgba(185,28,28,0.6) 30%, transparent 70%)",
            filter: "blur(18px)",
          }}
      />
      </motion.div>

      {/* ── Floating embers (static, drifting) ── */}
      <Embers count={24} />

      {/* ── Header ── */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2" style={{ color: "#d4af37" }}>
            <span className="h-[1px] w-8 md:w-14" style={{ background: "linear-gradient(90deg, transparent, #d4af37)" }} />
            <span className="text-[10px] md:text-xs tracking-[0.5em] font-imperial">鍛 · 選 · 道</span>
            <span className="h-[1px] w-8 md:w-14" style={{ background: "linear-gradient(90deg, #d4af37, transparent)" }} />
          </div>
          <h2 className="font-jp font-black text-5xl md:text-7xl mt-3 leading-none"
            style={{
              background: "linear-gradient(135deg, #fde68a 0%, #d4af37 40%, #b91c1c 80%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              filter: "drop-shadow(0 0 30px rgba(212,175,55,0.4))",
            }}>
            改善
          </h2>
          <p className="emperor-title text-xs md:text-sm mt-2 tracking-[0.4em]" style={{ color: "#d4af37" }}>
            K A I Z E N
          </p>
          <p className="serif-body italic mt-3 text-sm md:text-base max-w-xl" style={{ color: "#fde68a" }}>
            Choose your path. Each step forges the self — continuous improvement, one rep at a time.
          </p>
        </div>

        {/* Corner sigil */}
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[28%] flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #b91c1c 0%, #6f0f0f 100%)",
              border: "2px solid rgba(253,230,138,0.6)",
              boxShadow: "0 0 40px -8px rgba(185,28,28,0.9), inset 0 2px 0 rgba(253,230,138,0.3)",
            }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-6px] rounded-[28%] pointer-events-none"
              style={{ border: "1px dashed rgba(212,175,55,0.4)" }}
            />
            <span className="imperial-name text-3xl md:text-4xl text-amber-100"
              style={{ textShadow: "0 0 14px rgba(253,230,138,0.7)" }}>K</span>
          </div>
        </div>
      </div>

      {/* Blade divider */}
      <div aria-hidden className="k-blade mb-6" style={{ opacity: 0.7 }} />

      {/* ── Section buttons grid ── */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {WORKOUT_NAV.map((item, i) => (
          <NavButton key={item.id} item={item}
            active={item.id === current}
            delay={0.35 + i * 0.06}
            onClick={() => onPick(item.id)} />
        ))}
      </div>

      {/* Footer blade */}
      <div aria-hidden className="k-blade mt-8" style={{ opacity: 0.7 }} />
      <p className="relative z-10 text-center text-[10px] md:text-xs emperor-title tracking-[0.4em] mt-4"
        style={{ color: "rgba(212,175,55,0.7)" }}>
        一 · 歩 · 一 · 歩
      </p>
    </motion.div>
  );
}

/* ───────── single section button ───────── */
function NavButton({ item, active, delay, onClick }:
  { item: typeof WORKOUT_NAV[number]; active: boolean; delay: number; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 25, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.22,1,0.36,1] }}
      whileHover={{ y: -5, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="relative group rounded-xl p-4 md:p-5 text-left overflow-hidden transition"
      style={{
        background: active
          ? `linear-gradient(135deg, ${item.color}35, ${item.color}08)`
          : "linear-gradient(145deg, rgba(26,17,20,0.95), rgba(15,10,13,0.8))",
        border: `1px solid ${active ? item.color : "rgba(212,175,55,0.22)"}`,
        boxShadow: active
          ? `0 10px 30px -10px ${item.color}cc, inset 0 1px 0 ${item.color}50, 0 0 30px -5px ${item.color}66`
          : "inset 0 1px 0 rgba(212,175,55,0.12), 0 6px 18px -10px rgba(0,0,0,0.7)",
      }}>
      {/* Hover color wash */}
      <span aria-hidden
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${item.color}00, ${item.color}25 50%, ${item.color}00)` }}
      />
      {/* Gold sweep on hover */}
      <span aria-hidden
        className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(135deg, transparent 30%, ${item.color}40 50%, transparent 70%)`,
          backgroundSize: "200% 100%",
          animation: "shimmer 2s linear infinite",
        }}
      />
      {/* Color side rail */}
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-xl"
        style={{
          background: `linear-gradient(180deg, ${item.color}, ${item.color}90)`,
          boxShadow: `0 0 14px ${item.color}aa`,
        }}
      />

      <div className="relative flex items-start gap-3">
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
            <span className="emperor-title font-black text-sm md:text-base tracking-[0.12em]"
              style={{ color: active ? "#fde68a" : "#f3e9d2" }}>
              {item.label}
            </span>
          </div>
          <div className="text-[10px] emperor-title tracking-[0.35em] mt-0.5"
            style={{ color: item.color }}>
            {item.sigil}
          </div>
          {item.description && (
            <p className="text-[11px] md:text-xs serif-body italic mt-1.5 leading-snug" style={{ color: "#9c7a1a" }}>
              {item.description}
            </p>
          )}
        </div>
      </div>

      {active && (
        <motion.span
          layoutId="battle-active-dot"
          className="absolute top-3 right-3 flex items-center gap-1"
        >
          <span className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
          <FlameIcon size={12} style={{ color: item.color }} />
        </motion.span>
      )}
    </motion.button>
  );
}

/* ───────── floating embers (lighter count for inside-card) ───────── */
function Embers({ count }: { count: number }) {
  const bits = Array.from({ length: count }).map((_, i) => {
    const left = Math.random() * 100;
    const size = 1.5 + Math.random() * 3;
    const delay = Math.random() * 4;
    const dur = 5 + Math.random() * 6;
    const hue = Math.random() > 0.55 ? "#fde68a" : (Math.random() > 0.5 ? "#b91c1c" : "#ec4899");
    return (
      <motion.span key={i}
        className="absolute rounded-full pointer-events-none"
        style={{
          left: `${left}%`, bottom: `-10px`,
          width: size, height: size,
          background: hue,
          boxShadow: `0 0 ${size*3}px ${hue}`,
        }}
        initial={{ y: 0, opacity: 0 }}
        animate={{
          y: `-${100 + Math.random() * 30}%`,
          opacity: [0,1,1,0],
          x: [0, (Math.random()-0.5)*40, (Math.random()-0.5)*-40, 0],
        }}
        transition={{ duration: dur, delay, repeat: Infinity, ease: "linear" }}
      />
    );
  });
  return <div aria-hidden className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">{bits}</div>;
}
