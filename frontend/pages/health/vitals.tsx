/**
 * /health/vitals — Vitals section: HR, BP, HRV, temp, SpO2, symptoms,
 * illness/injury/meds/allergies, orthostatic test.
 */
import HealthPage from "../../components/health/HealthPage";
import VitalsSection from "../../components/health/VitalsSection";

export default function Page() {
  return (
    <HealthPage section="vitals">
      <VitalsSection />
    </HealthPage>
  );
}
