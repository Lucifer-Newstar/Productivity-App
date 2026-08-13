/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Legacy palette kept for backwards compat (older components still
        // reference bg.* / accent.* classes). They resolve onto the new
        // Kaizer palette so nothing breaks.
        bg: {
          DEFAULT: "#0a0709",
          soft: "#140d10",
          card: "#1a1114",
          elevated: "#26191f",
        },
        // Kaizer palette — obsidian + royal crimson + emperor gold + dragon pink + steel silver
        ink:     "#0a0709",
        obsidian:"#11080c",
        crimson: {
          DEFAULT: "#b91c1c",
          deep:    "#6f0f0f",
          royal:   "#991b1b",
          rose:    "#e11d48",
        },
        gold: {
          DEFAULT: "#d4af37",
          light:   "#fde68a",
          soft:    "#fbbf24",
          deep:    "#9c7a1a",
          bronze:  "#7c5a1f",
        },
        magenta: {
          DEFAULT: "#ec4899",
          deep:    "#be185d",
          soft:    "#f9a8d4",
        },
        steel: {
          DEFAULT: "#cbd5e1",
          bright:  "#f1f5f9",
          dark:    "#475569",
          cold:    "#94a3b8",
        },
        // Light mode — parchment + ink
        parchment: "#f2e6c9",
        inkpen:    "#1a0f0a",
        burgundy:  "#7f1d1d",
        accent: {
          DEFAULT: "#b91c1c", // royal crimson
          cyan:    "#06b6d4", // kept for charts
          pink:    "#ec4899", // magenta/dragon-pink
          lime:    "#a3e635",
          amber:   "#d4af37", // emperor gold
        },
      },
      fontFamily: {
        sans:   ["Inter", "system-ui", "sans-serif"],
        mono:   ["JetBrains Mono", "monospace"],
        // Cormorant Garamond + Cinzel for the royal/imperial display feel, with
        // a Japanese serif (Shippori Mincho) retained purely so decorative
        // background kanji render correctly (it does NOT appear in UI text).
        serif:     ["Cormorant Garamond", "Georgia", "serif"],
        imperial:  ["Cinzel", "Cormorant Garamond", "Georgia", "serif"],
        display:   ["Cinzel Decorative", "Cinzel", "Cormorant Garamond", "serif"],
        body_serif:["Cormorant Garamond", "Georgia", "serif"],
        jp:        ["\"Shippori Mincho\"", "\"Noto Serif JP\"", "serif"],
      },
      animation: {
        "gradient-shift": "gradient 8s ease infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        sparkle: "sparkle 2.5s ease-in-out infinite",
        "ink-drift": "inkDrift 18s ease-in-out infinite",
        "dragon-float": "dragonFloat 40s linear infinite",
        "gold-pulse": "goldPulse 3s ease-in-out infinite",
        "seal-stamp": "sealStamp 0.6s cubic-bezier(.2,.8,.2,1) both",
        "sword-draw": "swordDraw 0.8s cubic-bezier(.2,.8,.2,1) both",
        "crown-glow": "crownGlow 4s ease-in-out infinite",
        flicker: "flicker 4s ease-in-out infinite",
      },
      keyframes: {
        gradient: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%":     { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%":     { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        sparkle: {
          "0%,100%": { opacity: "0.2", transform: "scale(0.8) rotate(0deg)" },
          "50%":     { opacity: "1",   transform: "scale(1.1) rotate(180deg)" },
        },
        inkDrift: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%":     { transform: "translate(40px,-20px) scale(1.05)" },
          "66%":     { transform: "translate(-30px,30px) scale(0.97)" },
        },
        dragonFloat: {
          "0%":   { transform: "translate(0,0) rotate(0deg)" },
          "50%":  { transform: "translate(30px,-20px) rotate(1deg)" },
          "100%": { transform: "translate(0,0) rotate(0deg)" },
        },
        goldPulse: {
          "0%,100%": { filter: "brightness(1) drop-shadow(0 0 8px rgba(212,175,55,0.4))" },
          "50%":     { filter: "brightness(1.2) drop-shadow(0 0 24px rgba(212,175,55,0.85))" },
        },
        sealStamp: {
          "0%":   { transform: "scale(1.6) rotate(-8deg)", opacity: "0" },
          "60%":  { transform: "scale(0.95) rotate(2deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-4deg)",   opacity: "1" },
        },
        swordDraw: {
          "0%":   { transform: "translateX(-40px) rotate(-45deg)", opacity: "0" },
          "100%": { transform: "translateX(0) rotate(-45deg)",     opacity: "0.3" },
        },
        crownGlow: {
          "0%,100%": { textShadow: "0 0 8px rgba(212,175,55,0.5), 0 0 20px rgba(185,28,28,0.4)" },
          "50%":     { textShadow: "0 0 16px rgba(212,175,55,0.9), 0 0 36px rgba(185,28,28,0.7)" },
        },
        flicker: {
          "0%,100%": { opacity: "0.85" },
          "50%":     { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
