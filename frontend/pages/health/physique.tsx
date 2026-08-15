/**
 * /health/physique — Soma (measurements, Navy BF%, photos, S:W ratios).
 */
import HealthPage from "../../components/health/HealthPage";
import SomaSection from "../../components/health/SomaSection";

export default function Page() {
  return (
    <HealthPage section="soma">
      <SomaSection />
    </HealthPage>
  );
}

// FULLSCREEN — VITAL-SIGN shell paints edge-to-edge (skips shared TopNav, like /workout /projects /career)
Page.fullScreen = true;
