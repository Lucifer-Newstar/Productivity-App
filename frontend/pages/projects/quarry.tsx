"use client";
/**
 * /projects/quarry (the.quarry) — KANBAN / TASK BOARD.
 *
 * Wraps QuarrySection in ForgePage. Quarry supports four views:
 *   · KANBAN    - 5-column (or custom) swim with rich cards, drag, expand-edit
 *   · SWIMLANES - per-project mini 5-col boards
 *   · EISENHOWER - urgency × importance 4-quadrant
 *   · EFFORT    - effort × impact scatter (SVG)
 * Plus BATCH mode, recurring tasks, subtask tree, pomodoro quick-log, stuck marker.
 *
 * Page.fullScreen = FULLSCREEN opts out of the shared TopNav so ForgeShell can
 * paint edge-to-edge.
 */
import ForgePage, { FULLSCREEN } from "../../components/forge/ForgePage";
import COMP from "../../components/forge/sections/QuarrySection";

export default function Page() {
  // Route §02: Quarry — stone/ore/tasks.
  return <ForgePage section="quarry"><COMP/></ForgePage>;
}
Page.fullScreen = FULLSCREEN;
