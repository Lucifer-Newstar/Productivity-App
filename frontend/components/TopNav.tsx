"use client";
/** Global Home header for space navigation, theme, and notifications. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Command, Search, Sun, Moon, ArrowUpRight } from "lucide-react";
import { useStore } from "../lib/store";
import { useTheme } from "../lib/theme";
import { SPACES } from "../lib/types";
import { useState } from "react";
import SpaceIcon from "./SpaceIcon";
import NotificationButton from "./NotificationButton";

export default function TopNav() {
  const { tasks } = useStore(),
    { theme, toggle } = useTheme(),
    pathname = usePathname() || "/",
    [query, setQuery] = useState(""),
    dark = theme === "dark",
    activeSpace =
      pathname === "/" ? "" : pathname.replace(/^\//, "").split("/")[0];
  return (
    <header className="home-topnav" data-theme={dark ? "dark" : "light"}>
      <div className="home-topnav-inner">
        <Link href="/" className="home-brand">
          <span className="home-brand-mark">
            <Command size={18} />
          </span>
          <span>
            <strong>KAIZEN</strong>
            <small>{dark ? "CONTROL SYSTEM" : "DAILY EDITION"}</small>
          </span>
        </Link>
        <nav className="home-space-nav" aria-label="Spaces">
          {SPACES.map((space) => {
            const active = activeSpace === space.id,
              count = tasks.filter(
                (t) => t.space === space.id && !t.completed,
              ).length;
            return (
              <Link
                key={space.id}
                href={`/${space.id}`}
                className={`home-space-link ${active ? "is-active" : ""}`}
                style={{ "--space-color": space.color } as React.CSSProperties}
              >
                {active && (
                  <motion.span
                    layoutId="home-space-active"
                    className="home-space-active"
                    transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  />
                )}
                <SpaceIcon space={space.id} size={15} />
                <span>{space.name}</span>
                {count > 0 && <b>{count}</b>}
                <ArrowUpRight className="home-space-arrow" size={11} />
              </Link>
            );
          })}
        </nav>
        <div className="home-top-actions">
          <label className="home-search">
            <Search size={14} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                dark ? "Search command center" : "Search today’s edition"
              }
            />
          </label>
          <NotificationButton className="home-theme-toggle" size={16}/>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="home-theme-toggle"
          >
            <motion.span
              key={theme}
              initial={{ rotate: -40, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </motion.span>
          </button>
        </div>
      </div>
    </header>
  );
}
