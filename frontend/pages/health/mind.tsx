/**
 * /health/mind — Mind section: mood/stress/energy/anxiety/focus/libido sliders,
 * daily journal, gratitude, meditation, burnout heuristic, Indian crisis helplines.
 */
import HealthPage from "../../components/health/HealthPage";
import MindSection from "../../components/health/MindSection";

export default function Page() {
  return (
    <HealthPage section="mind">
      <MindSection />
    </HealthPage>
  );
}

// FULLSCREEN — VITAL-SIGN shell paints edge-to-edge (skips shared TopNav, like /workout /projects /career)
Page.fullScreen = true;
