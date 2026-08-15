/**
 * /health/supplements — Apothecary (supp stack, deficiency badges, sunlight).
 */
import HealthPage from "../../components/health/HealthPage";
import ApothecarySection from "../../components/health/ApothecarySection";

export default function Page() {
  return (
    <HealthPage section="apothecary">
      <ApothecarySection />
    </HealthPage>
  );
}

// FULLSCREEN — VITAL-SIGN shell paints edge-to-edge (skips shared TopNav, like /workout /projects /career)
Page.fullScreen = true;
