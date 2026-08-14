/**
 * /health/nutrition — Fuel (meals, macros, food library, repeat-yesterday).
 */
import HealthPage from "../../components/health/HealthPage";
import FuelSection from "../../components/health/FuelSection";

export default function NutritionPage() {
  return (
    <HealthPage section="fuel">
      <FuelSection />
    </HealthPage>
  );
}
