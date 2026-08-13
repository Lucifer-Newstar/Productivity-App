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
        // Legacy dark palette (kept for backwards compat; replaced by JP palette
        // visually but class names must resolve to something sensible).
        bg: {
          DEFAULT: "#0a0709",
          soft: "#140d10",
          card: "#1a1114",
          elevated: "#26191f",
        },
        // Japanese ink + vermillion + gold palette
        ink:    "#0f0a0d",   // deep black-ink
        sumi:   "#1a1216",   // washed ink
        vermilion: {
          DEFAULT: "#c81d25",
          deep:    "#8b0000",
          soft:    "#e11d48",
        },
        gold: {
          DEFAULT: "#d4af37",
          light:   "#f5d76e",
          deep:    "#9c7a1a",
          foil:    "#fbbf24",
        },
        sakura: {
          DEFAULT: "#f472b6",
          soft:    "#fbcfe8",
          deep:    "#be185d",
        },
        silver: {
          DEFAULT: "#cbd5e1",
          bright:  "#f1f5f9",
          dark:    "#64748b",
        },
        washi: "#f5efe4",       // warm rice-paper
        accent: {
          DEFAULT: "#c81d25", // vermilion primary
          cyan:    "#06b6d4", // kept for charts
          pink:    "#ec4899", // sakura
          lime:    "#a3e635",
          amber:   "#d4af37", // gold
        },
      },
      fontFamily: {
        sans:   ["Inter", "system-ui", "sans-serif"],
        mono:   ["JetBrains Mono", "monospace"],
        serif:  ["\"Shippori Mincho\"", "\"Noto Serif JP\"", "Georgia", "serif"],
        jp:     ["\"Shippori Mincho\"", "\"Noto Serif JP\"", "serif"],
        display:["\"Yuji Syuku\"", "\"Shippori Mincho\"", "serif"],
      },
      animation: {
        "gradient-shift": "gradient 8s ease infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        sparkle: "sparkle 2.5s ease-in-out infinite",
        "ink-drift": "inkDrift 12s ease-in-out infinite",
        "gold-pulse": "goldPulse 3s ease-in-out infinite",
        "seal-stamp": "sealStamp 0.6s cubic-bezier(.2,.8,.2,1) both",
        "kanji-fade": "kanjiFade 0.7s ease-out both",
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
        goldPulse: {
          "0%,100%": { filter: "brightness(1) drop-shadow(0 0 8px rgba(212,175,55,0.4))" },
          "50%":     { filter: "brightness(1.2) drop-shadow(0 0 20px rgba(212,175,55,0.8))" },
        },
        sealStamp: {
          "0%":   { transform: "scale(1.6) rotate(-8deg)", opacity: "0" },
          "60%":  { transform: "scale(0.95) rotate(2deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-4deg)",   opacity: "1" },
        },
        kanjiFade: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
