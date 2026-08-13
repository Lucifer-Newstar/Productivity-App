"use client";

/**
 * TopNav — horizontal top navigation for all Kaizer pages (non-workout).
 * Imperial / obsidian-throne styling: crimson seal logo, gold accents, Cinzel
 * display type, crown sigil. Dark mode: black lacquer + gold + red mesh.
 * Light mode: parchment + burgundy + bronze.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Crown, Bell, Search, Sun, Moon, Swords } from "lucide-react";
import { useStore } from "../lib/store";
import { useTheme } from "../lib/theme";
import { SPACES } from "../lib/types";
import { useState } from "react";

export default function TopNav() {
  const { tasks } = useStore();
  const { theme, toggle } = useTheme();
  const pathname = usePathname() || "/";
  const [query, setQuery] = useState("");
  const isDark = theme === "dark";

  const activeSpace: string = pathname === "/" ? "" : pathname.replace(/^\//, "").replace(/\/$/, "");

  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-xl border-b relative overflow-hidden"
      style={{
        background: isDark
          ? "linear-gradient(90deg, rgba(15,10,13,0.88) 0%, rgba(20,13,16,0.78) 100%)"
          : "linear-gradient(90deg, rgba(255,248,228,0.85) 0%, rgba(242,230,201,0.78) 100%)",
        borderColor: isDark ? "rgba(212,175,55,0.25)" : "rgba(127,29,29,0.2)",
        boxShadow: isDark
          ? "0 4px 24px -12px rgba(0,0,0,0.7)"
          : "0 4px 24px -12px rgba(127,29,29,0.25)",
      }}
    >
      {/* Gold blade line along bottom */}
      <div aria-hidden className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: isDark
          ? "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)"
          : "linear-gradient(90deg, transparent, rgba(127,29,29,0.4), transparent)" }} />

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center gap-4 relative">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 group-hover:rotate-[-2deg]"
            style={{
              background: "linear-gradient(135deg, #b91c1c 0%, #6f0f0f 100%)",
              border: "1.5px solid rgba(253,230,138,0.45)",
              boxShadow: "0 6px 20px -6px rgba(185,28,28,0.8), inset 0 1px 0 rgba(253,230,138,0.3)",
            }}>
            <Crown size={20} className="text-amber-100"
              style={{ filter: "drop-shadow(0 0 6px rgba(253,230,138,0.6))" }} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-2xl imperial-name leading-none animate-crown-glow"
              style={{
                background: "linear-gradient(135deg, #fde68a 0%, #d4af37 40%, #b91c1c 80%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
              Kaizer
            </h1>
            <p className="text-[9px] uppercase tracking-[0.3em] mt-0.5 flex items-center gap-1 font-imperial"
              style={{ color: isDark ? "#d4af37" : "#9c7a1a" }}>
              <Swords size={9} /> Rule your realm
            </p>
          </div>
        </Link>

        <div className="h-6 w-px" style={{ background: isDark ? "rgba(212,175,55,0.2)" : "rgba(127,29,29,0.15)" }} />

        {/* Spaces */}
        <nav className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
          {pathname !== "/" && (
            <Link
              href="/"
              className={`hidden md:inline-flex relative items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors group shrink-0 emperor-title
                ${isDark ? "text-gray-400 hover:text-amber-200" : "text-gray-600 hover:text-red-900"}`}
            >
              ◆ Throne
            </Link>
          )}
          {SPACES.map((s) => {
            const active = activeSpace === s.id;
            const count = tasks.filter((t) => t.space === s.id && !t.completed).length;
            return (
              <Link
                key={s.id}
                href={`/${s.id}`}
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors group shrink-0 emperor-title tracking-wide"
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: isDark ? `${s.color}28` : `${s.color}18`,
                      border: `1px solid ${s.color}${isDark ? "60" : "40"}`,
                      boxShadow: `0 6px 22px -10px ${s.color}${isDark ? "aa" : "66"}`,
                    }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className={`relative z-10 text-base transition ${active ? "" : "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"}`}>
                  {s.emoji}
                </span>
                <span className={`relative z-10 text-xs ${
                  active
                    ? (isDark ? "text-amber-100" : "text-red-900")
                    : (isDark ? "text-gray-300 group-hover:text-amber-100" : "text-gray-700 group-hover:text-red-900")
                }`}>
                  {s.name}
                </span>
                {count > 0 && (
                  <span
                    className="relative z-10 ml-0.5 text-[10px] font-imperial font-bold px-1.5 py-0.5 rounded-full text-amber-50"
                    style={{
                      background: "linear-gradient(135deg, #b91c1c, #6f0f0f)",
                      border: "1px solid rgba(253,230,138,0.35)",
                      boxShadow: "0 2px 8px -2px rgba(185,28,28,0.7)",
                    }}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative hidden sm:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: isDark ? "#d4af37" : "#9c7a1a" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the realm..."
              className="w-40 md:w-56 rounded-xl pl-9 pr-3 py-1.5 text-sm outline-none transition font-imperial tracking-wide"
              style={{
                background: isDark ? "rgba(253,230,138,0.05)" : "rgba(26,15,10,0.04)",
                border: `1px solid ${isDark ? "rgba(212,175,55,0.22)" : "rgba(26,15,10,0.12)"}`,
                color: isDark ? "#f3e9d2" : "#1a0f0a",
              }}
            />
          </div>

          <button
            onClick={toggle}
            aria-label="Toggle theme"
            title={`Switch to ${isDark ? "parchment" : "obsidian"}`}
            className="p-2 rounded-xl transition"
            style={{
              background: isDark ? "rgba(253,230,138,0.05)" : "rgba(26,15,10,0.04)",
              border: `1px solid ${isDark ? "rgba(212,175,55,0.22)" : "rgba(26,15,10,0.12)"}`,
              color: isDark ? "#fde68a" : "#7f1d1d",
            }}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            aria-label="Notifications"
            className="relative p-2 rounded-xl transition"
            style={{
              background: isDark ? "rgba(253,230,138,0.05)" : "rgba(26,15,10,0.04)",
              border: `1px solid ${isDark ? "rgba(212,175,55,0.22)" : "rgba(26,15,10,0.12)"}`,
              color: isDark ? "#f3e9d2" : "#1a0f0a",
            }}
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: "#b91c1c", boxShadow: "0 0 8px #b91c1c" }} />
          </button>

          {/* K seal */}
          <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-sm font-imperial font-black text-amber-50 shrink-0 transition hover:scale-105 hover:rotate-[-3deg]"
            style={{
              background: "linear-gradient(135deg, #b91c1c, #6f0f0f)",
              border: "1.5px solid rgba(253,230,138,0.45)",
              boxShadow: "0 4px 14px -4px rgba(185,28,28,0.8), inset 0 1px 0 rgba(253,230,138,0.25)",
            }}>
            K
          </button>
        </div>
      </div>
    </header>
  );
}
