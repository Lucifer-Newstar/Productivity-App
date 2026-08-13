"use client";

/**
 * pages/workout/tools — global tools (timer, heatmap, journal, challenges).
 * "global" in the nav data maps to /workout/tools (a URL-safe slug).
 */

import WorkoutPage, { FULLSCREEN } from "../../components/workout/WorkoutPage";
import WorkoutGlobal from "../../components/workout/WorkoutGlobal";

export default function WorkoutToolsPage() {
  return (
    <WorkoutPage section="global">
      <WorkoutGlobal />
    </WorkoutPage>
  );
}
WorkoutToolsPage.fullScreen = FULLSCREEN;
