"use client";
/**
 * /projects/p/[id] — PROJECT DRILLDOWN.
 *
 * Renders ProjectDrill inside the Foundry shell (section="foundry" keeps the
 * rail numeral highlighted on §01 since drilldown is a child of Foundry).
 * ProjectDrill is the deepest Forge view: brief/why/success-metrics, budget,
 * stakeholders (power/interest matrix), milestones + Gantt-ish timeline,
 * risks/premortems, issues, quality metrics + checks, comms log, change
 * requests, weekly reports, task list filtered to the project, critical-path
 * slip gauge, and SHIP/KILL actions (which trigger skill-bumps to Career and
 * update the audit log).
 *
 * Page.fullScreen = FULLSCREEN.
 */
import ForgePage, { FULLSCREEN } from "../../../components/forge/ForgePage";
import ProjectDrill from "../../../components/forge/sections/ProjectDrill";

export default function Page() {
  // Drilldown lives under §01 Foundry since it is "inside" a specific heat.
  return <ForgePage section="foundry"><ProjectDrill/></ForgePage>;
}
Page.fullScreen = FULLSCREEN;
