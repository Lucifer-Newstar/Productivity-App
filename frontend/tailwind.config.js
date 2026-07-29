/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a0f",
          soft: "#12121a",
          card: "#1a1a25",
          elevated: "#22222f",
        },
        accent: {
          DEFAULT: "#8b5cf6", // violet
          cyan: "#06b6d4",
          pink: "#ec4899",
          lime: "#a3e635",
          amber: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "gradient-shift": "gradient 8s ease infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s ease-in-out infinite",
      },
      keyframes: {
        gradient: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "mesh-gradient":
          "radial-gradient(at 20% 20%, rgba(139,92,246,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(6,182,212,0.12) 0px, transparent 50%), radial-gradient(at 0% 80%, rgba(236,72,153,0.10) 0px, transparent 50%)",
      },
    },
  },
  plugins: [],
};
