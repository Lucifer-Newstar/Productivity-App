/**
 * /health/hydration — water, caffeine, electrolytes.
 */
import HealthPage from "../../components/health/HealthPage";
import HydrationSection from "../../components/health/HydrationSection";

export default function HydrationPage() {
  return (
    <HealthPage section="hydration">
      <HydrationSection />
    </HealthPage>
  );
}

// FULLSCREEN — VITAL-SIGN shell paints edge-to-edge (skips shared TopNav, like /workout /projects /career)
HydrationPage.fullScreen = true;
