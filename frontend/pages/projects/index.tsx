"use client";
/**
 * /projects (the.foundry) — FORGE LANDING.
 *
 * Wraps FoundrySection (dashboard of active heats, velocity, calendar, streak,
 * cross-links) in ForgePage which provides:
 *   - HammerStrike intro animation (vertical sweep on first visit only)
 *   - ForgeShell chrome (left I-beam rail, thick top beam w/ hazard stripe,
 *     temp gauge, UTC clock, rotating gears, diamond-plate footer, settings)
 *   - Global hotkeys (goto chords, ⌘K STRIKE, ? help, `t` theme toggle)
 *
 * Page.fullScreen = FULLSCREEN tells _app.tsx to skip the shared TopNav so the
 * Forge can render edge-to-edge under its own shell.
 */
import ForgePage, { FULLSCREEN } from "../../components/forge/ForgePage";
import COMP from "../../components/forge/sections/FoundrySection";

export default function Page() {
  // Route §01: Foundry — command deck.
  return <ForgePage section="foundry"><COMP/></ForgePage>;
}
Page.fullScreen = FULLSCREEN;
