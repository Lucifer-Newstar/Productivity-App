/**
 * /health/reports — Reports: 90-day heatmap, weekly/monthly aggregates,
 * habit streaks, timeline, CSV/JSON export, Workout bridge analytics.
 */
import HealthPage from "../../components/health/HealthPage";
import ReportsSection from "../../components/health/ReportsSection";

export default function Page() {
  return (
    <HealthPage section="reports">
      <ReportsSection />
    </HealthPage>
  );
}
