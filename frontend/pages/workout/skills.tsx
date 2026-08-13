"use client";

/**
 * pages/workout/skills — progressive bodyweight skills tracker.
 */

import WorkoutPage, { FULLSCREEN } from "../../components/workout/WorkoutPage";
import WorkoutSkills from "../../components/workout/WorkoutSkills";

export default function WorkoutSkillsPage() {
  return (
    <WorkoutPage section="skills">
      <WorkoutSkills />
    </WorkoutPage>
  );
}
WorkoutSkillsPage.fullScreen = FULLSCREEN;
