"use client";

/**
 * GoldenDragon — a stylized east-Asian dragon that coils across the
 * background of the BattleCard. Rendered as inline SVG so we can animate
 * parts (head, whiskers, tail, orb) with Framer Motion. Only mounted when
 * the nav card is open.
 */

import { motion } from "framer-motion";

export default function GoldenDragon() {
  return (
    <motion.div
      aria-hidden
      key="golden-dragon"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0"
    >
      {/* Radial gold glow behind dragon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0.3, 0.6, 0.4], scale: [0.6, 1.1, 1] }}
        transition={{ duration: 2.5, times: [0, 0.4, 1] }}
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 30% 50%, rgba(212,175,55,0.25) 0%, rgba(253,230,138,0.1) 30%, transparent 60%)",
          filter: "blur(10px)",
        }}
      />

      <motion.svg
        viewBox="0 0 1200 600"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.22,1,0.36,1] }}
        style={{ filter: "drop-shadow(0 0 18px rgba(212,175,55,0.6)) drop-shadow(0 0 40px rgba(185,28,28,0.3))" }}
      >
        <defs>
          <linearGradient id="goldBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#9c7a1a" />
          </linearGradient>
          <linearGradient id="goldBodySoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#d4af37" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#9c7a1a" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff8e4" />
            <stop offset="40%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Long coiled body — S-curve sweeping diagonally */}
        <g fill="none" stroke="url(#goldBody)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.55">
          {/* main serpentine */}
          <motion.path
            d="M -80,480 C 120,380 200,520 340,420 S 520,250 680,330 S 880,480 1020,320 S 1200,180 1280,240"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: "easeOut", delay: 0.2 }}
          />
          {/* second parallel accent line for depth */}
          <motion.path
            d="M -80,490 C 120,390 200,530 340,430 S 520,260 680,340 S 880,490 1020,330 S 1200,190 1280,250"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: "easeOut", delay: 0.35 }}
            strokeWidth="2" opacity="0.6"
          />
        </g>

        {/* Body segments (scales) along the curve */}
        <g fill="url(#goldBody)" opacity="0.5">
          {[
            [60, 460], [150, 410], [240, 460], [320, 420], [400, 360],
            [480, 300], [560, 300], [640, 330], [720, 380], [800, 400],
            [880, 380], [960, 340], [1030, 300], [1100, 260],
          ].map(([x, y], i) => (
            <motion.circle key={i}
              cx={x} cy={y} r={6 + (i % 3)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
            />
          ))}
        </g>

        {/* Spines along the back */}
        <g stroke="#d4af37" strokeWidth="2" strokeLinecap="round" opacity="0.55">
          {[
            [80, 450, 8], [180, 400, 10], [280, 440, 10], [370, 385, 12],
            [460, 315, 12], [560, 300, 12], [660, 330, 12], [760, 390, 12],
            [860, 390, 10], [960, 340, 10], [1060, 290, 8],
          ].map(([x, y, l], i) => (
            <motion.line key={i}
              x1={x} y1={y - 4} x2={x} y2={y - (l as number) - 4}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 0.7, scaleY: 1 }}
              transition={{ duration: 0.2, delay: 0.7 + i * 0.04 }}
              style={{ transformOrigin: `${x}px ${y - 4}px` }}
            />
          ))}
        </g>

        {/* Dragon head (bottom-left, facing in toward center) */}
        <motion.g
          initial={{ x: -40, opacity: 0, rotate: -8 }}
          animate={{ x: 0, opacity: 1, rotate: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: [0.22,1,0.36,1] }}
        >
          {/* Head */}
          <path d="M 70,440 Q 30,430 20,470 Q 25,500 70,490 Q 100,485 110,455 Z"
            fill="url(#goldBody)" stroke="#9c7a1a" strokeWidth="1.5" opacity="0.85" />
          {/* Snout */}
          <path d="M 20,470 Q -10,470 -5,495 Q 20,500 40,485 Z"
            fill="url(#goldBody)" stroke="#9c7a1a" strokeWidth="1.5" opacity="0.8" />
          {/* Horns */}
          <path d="M 60,435 Q 45,390 55,370" stroke="#fde68a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 85,430 Q 80,395 95,380" stroke="#fde68a" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Eye — crimson */}
          <circle cx="55" cy="460" r="4" fill="#b91c1c" />
          <circle cx="55" cy="460" r="1.5" fill="#fff8e4" />
          {/* Whiskers */}
          <motion.path d="M 0,480 Q -40,470 -70,500" stroke="#fde68a" strokeWidth="1.5" fill="none" strokeLinecap="round"
            animate={{ d: ["M 0,480 Q -40,470 -70,500", "M 0,480 Q -40,490 -70,500", "M 0,480 Q -40,470 -70,500"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} opacity="0.8" />
          <motion.path d="M -5,490 Q -50,505 -80,495" stroke="#fde68a" strokeWidth="1.5" fill="none" strokeLinecap="round"
            animate={{ d: ["M -5,490 Q -50,505 -80,495", "M -5,490 Q -50,490 -80,505", "M -5,490 Q -50,505 -80,495"] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} opacity="0.7" />
          {/* Teeth */}
          <path d="M 15,485 l -5,8 l 3,-8 M 25,488 l -4,7 l 2,-7" stroke="#fff8e4" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.9" />
        </motion.g>

        {/* Tail tip (top-right) with flourish */}
        <motion.g
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 0.8, x: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
        >
          <path d="M 1110,260 Q 1150,230 1200,240 Q 1230,250 1260,220 Q 1250,270 1200,275 Q 1160,278 1110,260 Z"
            fill="url(#goldBody)" opacity="0.6" />
          {/* Tail fin */}
          <path d="M 1220,235 l 40,-25 l -10,35 l 25,-5 l -35,25 z" fill="url(#goldBody)" opacity="0.5" />
        </motion.g>

        {/* Claws along underside */}
        <g fill="#fde68a" opacity="0.55">
          {[
            [220, 475], [420, 400], [700, 400], [920, 360],
          ].map(([x, y], i) => (
            <motion.g key={i}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 0.6, y: 0 }}
              transition={{ duration: 0.3, delay: 1 + i * 0.08 }}>
              <path d={`M ${x},${y} l -4,8 l 2,-6 l 3,5 l 0,-7 l 3,6 z`} />
            </motion.g>
          ))}
        </g>

        {/* Wisdom pearl / orb the dragon chases */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.9] }}
          transition={{ duration: 0.8, delay: 1.2, ease: [0.22,1,0.36,1] }}
          style={{ transformOrigin: "1070px 200px" }}
        >
          <motion.circle cx="1070" cy="200" r="22" fill="url(#orbGrad)"
            animate={{ r: [22, 24, 22] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
          <motion.circle cx="1070" cy="200" r="10" fill="#fff8e4"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }} />
          {/* flame swirls around orb */}
          <motion.path d="M 1070,170 Q 1050,150 1070,135 Q 1090,150 1070,170"
            fill="#fde68a" opacity="0.6"
            animate={{ rotate: [0, 360], transformOrigin: "1070px 200px" }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
        </motion.g>

        {/* Drifting gold clouds (sumi-e style) */}
        <g fill="url(#goldBody)" opacity="0.18">
          <motion.ellipse cx="200" cy="130" rx="90" ry="14"
            animate={{ x: [0, 30, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
          <motion.ellipse cx="850" cy="90" rx="120" ry="12"
            animate={{ x: [0, -30, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
          <motion.ellipse cx="600" cy="500" rx="140" ry="10"
            animate={{ x: [0, 20, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} />
        </g>

        {/* Floating sparkle kanji 改善 (kaizen) big in the background — decorative */}
        <motion.g
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 0.12, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.8 }}
          style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 900 }}>
          <text x="780" y="170" fontSize="120" fill="#d4af37">改</text>
          <text x="900" y="250" fontSize="120" fill="#d4af37">善</text>
        </motion.g>
      </motion.svg>

      {/* Extra ember sparks rising from near the dragon */}
      {Array.from({ length: 14 }).map((_, i) => {
        const left = 20 + Math.random() * 70;
        const size = 2 + Math.random() * 3;
        const delay = Math.random() * 2;
        const dur = 4 + Math.random() * 5;
        return (
          <motion.span key={i}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              bottom: "10%",
              width: size, height: size,
              background: Math.random() > 0.5 ? "#fde68a" : "#b91c1c",
              boxShadow: `0 0 ${size*4}px ${Math.random() > 0.5 ? "#fde68a" : "#b91c1c"}`,
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: "-60vh", opacity: [0,1,1,0], x: [0,(Math.random()-0.5)*40,(Math.random()-0.5)*-40,0] }}
            transition={{ duration: dur, delay, repeat: Infinity, ease: "easeOut" }}
          />
        );
      })}
    </motion.div>
  );
}
