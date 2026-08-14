/**
 * /health/sleep — Somnium (sleep journal, bank, routines, circadian).
 */
import HealthPage from "../../components/health/HealthPage";
import SomniumSection from "../../components/health/SomniumSection";

export default function Page() {
  return (
    <HealthPage section="somnium">
      <SomniumSection />
    </HealthPage>
  );
}
