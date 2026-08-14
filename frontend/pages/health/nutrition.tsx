/**
 * /health/nutrition.tsx — Fuel section.
 * Wave 1 placeholder. Functional UI ships in later waves per FEATURES.md.
 */
import HealthPage from "../../components/health/HealthPage";

export default function Page() {
  return (
    <HealthPage section="fuel">
      <div className="hlth-card" style={{maxWidth: 720}}>
        <div className="hlth-card-h">// Fuel</div>
        <h2 style={{
          fontFamily: "var(--hlth-font-display)",
          fontSize: 26, fontWeight: 900, letterSpacing: "0.04em",
          margin: "4px 0 8px", color: "var(--hlth-accent-glow)",
        }}>Fuel</h2>
        <p className="hlth-subtle" style={{fontSize: 13, margin: 0}}>
          Meals, macros, intermittent fasting, food library and recipes.
        </p>
        <div className="hlth-subtle" style={{marginTop: 16, fontSize: 11, letterSpacing: "0.15em"}}>
          // section shell online — content ships in upcoming wave
        </div>
      </div>
    </HealthPage>
  );
}
