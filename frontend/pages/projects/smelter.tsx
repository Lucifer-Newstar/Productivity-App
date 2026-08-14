"use client";
/**
 * /projects/smelter (the.smelter) — BRAINSTORMING / STRATEGY / RETRO.
 *
 * Wraps SmelterSection in ForgePage. Houses 30+ tabs including the core
 * scratchpad and all strategic/PM/research canvases:
 *   · FREEFORM:   Scratch, Ideas (normal/worst/reverse/mood/Kano)
 *   · THINKING:   Decisions, Decision-Matrix, 6-Hats, SCAMPER, Fishbone, 5-Whys,
 *                Scenarios, SWOT, Pro/Con
 *   · AGILE:      Sprints, Retrospective, Lessons-Learned, Personas
 *   · STRATEGY:   BMC, VPC, Lean Canvas, Porter's 5 Forces, PESTEL
 *   · UX/RESEARCH:User Stories, Affinity, Buy-a-Feature, Paired Comparison,
 *                Journey Map, Service Blueprint, Event Storming, Mindmap,
 *                Freeform Canvas, Wireframe, Voice Notes
 *
 * Page.fullScreen = FULLSCREEN for edge-to-edge ForgeShell.
 */
import ForgePage, { FULLSCREEN } from "../../components/forge/ForgePage";
import COMP from "../../components/forge/sections/SmelterSection";

export default function Page() {
  // Route §03: Smelter — melt the ore into insight.
  return <ForgePage section="smelter"><COMP/></ForgePage>;
}
Page.fullScreen = FULLSCREEN;
