"use client";

/** pages/workout/charts — analytics sub-page. */

import WorkoutPage, { FULLSCREEN } from "../../components/workout/WorkoutPage";
import WorkoutCharts from "../../components/workout/WorkoutCharts";

export default function WorkoutChartsPage() {
  return (
    <WorkoutPage section="charts">
      <WorkoutCharts />
    </WorkoutPage>
  );
}
WorkoutChartsPage.fullScreen = FULLSCREEN;
