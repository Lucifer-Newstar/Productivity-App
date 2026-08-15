"use client";

/**
 * PlannerPanel — Wave 8C FUEL planning.
 *
 *  - Recipe storage + Nutrition Analyzer: ingredients (name/qty/kcal/macros),
 *    portions, auto totals + per-serving; "LOG SERVING" pre-fills a meal item.
 *  - Weekly Meal Planner: 7 days × 4 slots grid. "EXECUTE DAY" copies the
 *    day's planned meals into today's log. Cells can pull from recipes.
 *  - Meal-Prep mode: check off cells when prepped; progress bar; Sunday
 *    prep-day template hint.
 *  - Restaurant Mode 🌏: save meals per eatery (Saravana Bhavan, Murugan
 *    Idli…); one tap re-logs with rough kcal, usage count tracked.
 *
 * All three write into health.recipes / health.mealPlan / health.restaurantMeals.
 */

import { useMemo, useState } from "react";
import {
  BookOpen, CalendarDays, Store, Plus, Trash2, ChefHat, CheckCircle2, Play, X,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { recipeNutrition, isoDow, planForDow, prepProgress } from "../../lib/healthAnalytics";
import type { Recipe, RecipeIngredient, PlannedMeal, RestaurantMeal, MealEntry } from "../../lib/healthTypes";

function todayIso() { return new Date().toISOString().slice(0, 10); }
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

const DOWS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const SLOT_IDS: PlannedMeal["slot"][] = ["breakfast", "lunch", "dinner", "snack"];
const SLOT_SHORT: Record<PlannedMeal["slot"], string> = { breakfast: "BRK", lunch: "LUN", dinner: "DIN", snack: "SNK" };
const SLOT_COLOR: Record<PlannedMeal["slot"], string> = { breakfast: "#f59e0b", lunch: "#ef4444", dinner: "#818cf8", snack: "#10b981" };

const inputStyle: React.CSSProperties = {
  background: "var(--hlth-card2)", color: "var(--hlth-fg)",
  border: "1px solid var(--hlth-border-soft)", borderRadius: 4,
  padding: "4px 6px", fontFamily: "var(--hlth-font-mono)", fontSize: 11,
};

type Tab = "recipes" | "planner" | "restaurant";

// ---------------- Recipes ----------------

function RecipeEditor({ onSave, onCancel, initial }: { onSave: (r: Recipe) => void; onCancel: () => void; initial?: Recipe }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [portions, setPortions] = useState(initial?.portions ?? 2);
  const [prepMin, setPrepMin] = useState(initial?.prepTimeMin ?? 30);
  const [ings, setIngs] = useState<RecipeIngredient[]>(initial?.ingredients ?? []);
  const [iName, setIName] = useState(""); const [iQty, setIQty] = useState("");
  const [iKcal, setIKcal] = useState(0); const [iC, setIC] = useState(0); const [iP, setIP] = useState(0); const [iF, setIF] = useState(0);

  const nut = recipeNutrition({ ingredients: ings, portions });

  const addIng = () => {
    if (!iName.trim() || iKcal <= 0) return;
    setIngs([...ings, { id: uid(), name: iName.trim(), qty: iQty.trim() || "1 unit", kcal: iKcal, carbsG: iC || undefined, proteinG: iP || undefined, fatG: iF || undefined }]);
    setIName(""); setIQty(""); setIKcal(0); setIC(0); setIP(0); setIF(0);
  };
  const save = () => {
    if (!name.trim() || ings.length === 0) return;
    onSave({ id: initial?.id ?? uid(), name: name.trim(), ingredients: ings, portions: Math.max(1, portions), prepTimeMin: prepMin || undefined, createdAt: initial?.createdAt ?? Date.now() });
  };

  return (
    <div style={{ padding: 12, background: "var(--hlth-card2)", borderRadius: 8, border: "1px dashed var(--hlth-border)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 3, fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", flex: "2 1 160px" }}>
          RECIPE NAME
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. chicken curry meal-prep" style={inputStyle} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 3, fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" }}>
          PORTIONS
          <input type="number" min={1} value={portions} onChange={e => setPortions(Math.max(1, +e.target.value || 1))} style={{ ...inputStyle, width: 64 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 3, fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" }}>
          PREP MIN
          <input type="number" min={0} value={prepMin} onChange={e => setPrepMin(+e.target.value || 0)} style={{ ...inputStyle, width: 64 }} />
        </label>
      </div>

      {ings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {ings.map(ing => (
            <div key={ing.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6, background: "var(--hlth-card)", border: "1px solid var(--hlth-border-soft)", fontSize: 11 }}>
              <span style={{ flex: 1, color: "var(--hlth-fg)", fontWeight: 600 }}>{ing.name} <span style={{ color: "var(--hlth-muted)", fontWeight: 400 }}>· {ing.qty}</span></span>
              <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-accent-glow)" }}>{ing.kcal} kcal</span>
              <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)" }}>C{ing.carbsG ?? 0}·P{ing.proteinG ?? 0}·F{ing.fatG ?? 0}</span>
              <button onClick={() => setIngs(ings.filter(x => x.id !== ing.id))} style={{ background: "transparent", border: "none", color: "var(--hlth-muted)", cursor: "pointer", padding: 2 }}><Trash2 size={11} /></button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr repeat(4, 0.7fr) auto", gap: 6, alignItems: "end" }}>
        {([
          ["INGREDIENT", <input key="n" value={iName} onChange={e => setIName(e.target.value)} placeholder="chicken breast" style={inputStyle} />],
          ["QTY", <input key="q" value={iQty} onChange={e => setIQty(e.target.value)} placeholder="500g" style={inputStyle} />],
          ["KCAL", <input key="k" type="number" min={0} value={iKcal || ""} onChange={e => setIKcal(+e.target.value)} style={inputStyle} />],
          ["C g", <input key="c" type="number" min={0} value={iC || ""} onChange={e => setIC(+e.target.value)} style={inputStyle} />],
          ["P g", <input key="p" type="number" min={0} value={iP || ""} onChange={e => setIP(+e.target.value)} style={inputStyle} />],
          ["F g", <input key="f" type="number" min={0} value={iF || ""} onChange={e => setIF(+e.target.value)} style={inputStyle} />],
        ] as [string, React.ReactNode][]).map(([lab, el]) => (
          <label key={lab} style={{ display: "flex", flexDirection: "column", gap: 3, fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)" }}>
            {lab}{el}
          </label>
        ))}
        <button className="hlth-btn hlth-btn-ghost" onClick={addIng} style={{ padding: "5px 10px", fontSize: 10 }}><Plus size={10} /></button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" }}>
          ANALYZER → total <b style={{ color: "var(--hlth-accent-glow)" }}>{nut.total.kcal} kcal</b> ·
          per serving <b style={{ color: "var(--hlth-accent-glow)" }}>{nut.perServing.kcal} kcal</b> (C{nut.perServing.carbsG} P{nut.perServing.proteinG} F{nut.perServing.fatG})
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="hlth-btn" onClick={save} style={{ padding: "6px 12px", fontSize: 10 }}>SAVE RECIPE</button>
          <button className="hlth-btn hlth-btn-ghost" onClick={onCancel} style={{ padding: "6px 10px", fontSize: 10 }}><X size={10} /></button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Main panel ----------------

export default function PlannerPanel({ onLogItem }: {
  /** Log a food item into today's meals (slot, name, kcal, macros). */
  onLogItem: (slot: MealEntry["slot"], name: string, kcal: number, c: number, p: number, f: number) => void;
}) {
  const { health, updateHealth } = useStore();
  const [tab, setTab] = useState<Tab>("planner");
  const [editing, setEditing] = useState(false);
  const todayDow = isoDow(todayIso());

  // ----- planner state -----
  const [cellFor, setCellFor] = useState<{ dow: number; slot: PlannedMeal["slot"] } | null>(null);
  const [cellName, setCellName] = useState(""); const [cellKcal, setCellKcal] = useState(0);
  const [cellRecipe, setCellRecipe] = useState("");

  // ----- restaurant state -----
  const [rRest, setRRest] = useState(""); const [rName, setRName] = useState(""); const [rKcal, setRKcal] = useState(0);

  const prep = useMemo(() => prepProgress(health.mealPlan), [health.mealPlan]);

  const saveRecipe = (r: Recipe) => {
    updateHealth(h => ({ recipes: [...h.recipes.filter(x => x.id !== r.id), r] }));
    setEditing(false);
  };

  const saveCell = () => {
    if (!cellFor) return;
    const rec = health.recipes.find(r => r.id === cellRecipe);
    const nut = rec ? recipeNutrition(rec).perServing : null;
    const name = rec ? rec.name : cellName.trim();
    if (!name) return;
    const cell: PlannedMeal = {
      id: uid(), dow: cellFor.dow, slot: cellFor.slot, name,
      kcal: nut?.kcal ?? (cellKcal || undefined),
      carbsG: nut?.carbsG, proteinG: nut?.proteinG, fatG: nut?.fatG,
      recipeId: rec?.id,
    };
    updateHealth(h => ({
      mealPlan: [...h.mealPlan.filter(p => !(p.dow === cellFor.dow && p.slot === cellFor.slot)), cell],
    }));
    setCellFor(null); setCellName(""); setCellKcal(0); setCellRecipe("");
  };

  const removeCell = (id: string) => updateHealth(h => ({ mealPlan: h.mealPlan.filter(p => p.id !== id) }));
  const togglePrepped = (id: string) => updateHealth(h => ({
    mealPlan: h.mealPlan.map(p => p.id === id ? { ...p, prepped: !p.prepped } : p),
  }));

  const executeDay = (dow: number) => {
    const cells = planForDow(health.mealPlan, dow);
    for (const c of cells) onLogItem(c.slot, c.name, c.kcal ?? 0, c.carbsG ?? 0, c.proteinG ?? 0, c.fatG ?? 0);
  };

  const saveRestaurantMeal = () => {
    if (!rRest.trim() || !rName.trim() || rKcal <= 0) return;
    const rm: RestaurantMeal = { id: uid(), restaurant: rRest.trim(), name: rName.trim(), kcal: rKcal, timesUsed: 0 };
    updateHealth(h => ({ restaurantMeals: [...h.restaurantMeals, rm] }));
    setRName(""); setRKcal(0);
  };

  const logRestaurantMeal = (rm: RestaurantMeal) => {
    onLogItem("dinner", `${rm.name} @ ${rm.restaurant}`, rm.kcal, rm.carbsG ?? 0, rm.proteinG ?? 0, rm.fatG ?? 0);
    updateHealth(h => ({
      restaurantMeals: h.restaurantMeals.map(x => x.id === rm.id ? { ...x, timesUsed: x.timesUsed + 1, lastUsed: todayIso() } : x),
    }));
  };

  const restaurants = useMemo(() => {
    const by = new Map<string, RestaurantMeal[]>();
    for (const rm of health.restaurantMeals) {
      if (!by.has(rm.restaurant)) by.set(rm.restaurant, []);
      by.get(rm.restaurant)!.push(rm);
    }
    return Array.from(by.entries());
  }, [health.restaurantMeals]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "planner", label: "WEEKLY PLANNER", icon: <CalendarDays size={11} /> },
    { id: "recipes", label: `RECIPES (${health.recipes.length})`, icon: <BookOpen size={11} /> },
    { id: "restaurant", label: "RESTAURANT 🌏", icon: <Store size={11} /> },
  ];

  return (
    <div className="hlth-card" style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ChefHat size={12} /> MEAL PLANNING
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {tabs.map(t => (
            <button key={t.id} className="hlth-btn hlth-btn-ghost" onClick={() => setTab(t.id)}
              style={{
                padding: "5px 10px", fontSize: 9, display: "inline-flex", alignItems: "center", gap: 5,
                ...(tab === t.id ? { borderColor: "var(--hlth-accent)", color: "var(--hlth-accent-glow)", background: "rgba(163,230,53,0.08)" } : {}),
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- PLANNER ---------------- */}
      {tab === "planner" && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", letterSpacing: "0.08em" }}>
              MEAL PREP {prep.done}/{prep.total}
            </span>
            <div style={{ flex: "1 1 120px", maxWidth: 220, height: 5, borderRadius: 3, background: "rgba(148,163,184,0.15)", overflow: "hidden" }}>
              <div style={{ width: `${prep.pct}%`, height: "100%", background: "var(--hlth-accent)", transition: "width 0.3s" }} />
            </div>
            <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)" }}>
              🌏 sunday = classic prep day — cook once, pack 4-5 dabbas
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(120px, 1fr))", gap: 6, minWidth: 880 }}>
              {DOWS.map((d, dow) => (
                <div key={d} style={{
                  borderRadius: 8, border: `1px solid ${dow === todayDow ? "var(--hlth-accent)" : "var(--hlth-border-soft)"}`,
                  background: dow === todayDow ? "rgba(163,230,53,0.04)" : "var(--hlth-card2)", padding: 8,
                  display: "flex", flexDirection: "column", gap: 6,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--hlth-font-display)", fontWeight: 900, fontSize: 12, letterSpacing: "0.1em", color: dow === todayDow ? "var(--hlth-accent-glow)" : "var(--hlth-fg)" }}>{d}</span>
                    <button title="Copy this day's plan into today's log" onClick={() => executeDay(dow)}
                      style={{ background: "transparent", border: "1px solid var(--hlth-border-soft)", borderRadius: 4, color: "var(--hlth-accent-glow)", cursor: "pointer", padding: "2px 6px", display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "var(--hlth-font-mono)", fontSize: 8 }}>
                      <Play size={8} /> EXEC
                    </button>
                  </div>
                  {SLOT_IDS.map(slot => {
                    const cell = health.mealPlan.find(p => p.dow === dow && p.slot === slot);
                    return (
                      <div key={slot}>
                        {cell ? (
                          <div style={{ borderRadius: 6, border: `1px solid ${SLOT_COLOR[slot]}44`, background: `${SLOT_COLOR[slot]}0d`, padding: "5px 7px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                              <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 8, color: SLOT_COLOR[slot], fontWeight: 700 }}>{SLOT_SHORT[slot]}</span>
                              <span style={{ display: "inline-flex", gap: 3 }}>
                                <button title={cell.prepped ? "Prepped ✓" : "Mark prepped"} onClick={() => togglePrepped(cell.id)}
                                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, color: cell.prepped ? "var(--hlth-accent-glow)" : "var(--hlth-muted)", display: "inline-flex" }}>
                                  <CheckCircle2 size={11} />
                                </button>
                                <button onClick={() => removeCell(cell.id)}
                                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, color: "var(--hlth-muted)", display: "inline-flex" }}>
                                  <Trash2 size={10} />
                                </button>
                              </span>
                            </div>
                            <div style={{ fontSize: 10, color: "var(--hlth-fg)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cell.name}>{cell.name}</div>
                            {cell.kcal ? <div style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 8, color: "var(--hlth-muted)" }}>{cell.kcal} kcal{cell.recipeId ? " · recipe" : ""}</div> : null}
                          </div>
                        ) : (
                          <button onClick={() => { setCellFor({ dow, slot }); setCellName(""); setCellKcal(0); setCellRecipe(""); }}
                            style={{ width: "100%", borderRadius: 6, border: "1px dashed var(--hlth-border-soft)", background: "transparent", color: "var(--hlth-muted)", cursor: "pointer", padding: "5px 0", fontFamily: "var(--hlth-font-mono)", fontSize: 8, letterSpacing: "0.08em" }}>
                            + {SLOT_SHORT[slot]}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {cellFor && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 8, border: "1px dashed var(--hlth-border)", background: "var(--hlth-card2)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-accent-glow)", letterSpacing: "0.08em", alignSelf: "center" }}>
                {DOWS[cellFor.dow]} · {SLOT_SHORT[cellFor.slot]}
              </span>
              <label style={{ display: "flex", flexDirection: "column", gap: 3, fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)", flex: "2 1 140px" }}>
                MEAL NAME
                <input value={cellName} onChange={e => setCellName(e.target.value)} placeholder="e.g. curd rice + poriyal" style={inputStyle} disabled={!!cellRecipe} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 3, fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)" }}>
                KCAL
                <input type="number" min={0} value={cellKcal || ""} onChange={e => setCellKcal(+e.target.value)} style={{ ...inputStyle, width: 70 }} disabled={!!cellRecipe} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 3, fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)" }}>
                OR FROM RECIPE
                <select value={cellRecipe} onChange={e => setCellRecipe(e.target.value)} style={inputStyle}>
                  <option value="">—</option>
                  {health.recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
              <button className="hlth-btn" onClick={saveCell} style={{ padding: "6px 12px", fontSize: 10 }}>PLAN</button>
              <button className="hlth-btn hlth-btn-ghost" onClick={() => setCellFor(null)} style={{ padding: "6px 10px", fontSize: 10 }}><X size={10} /></button>
            </div>
          )}
        </div>
      )}

      {/* ---------------- RECIPES ---------------- */}
      {tab === "recipes" && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {!editing && (
            <button className="hlth-btn hlth-btn-ghost" onClick={() => setEditing(true)}
              style={{ alignSelf: "flex-start", padding: "6px 12px", fontSize: 10, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Plus size={10} /> NEW RECIPE
            </button>
          )}
          {editing && <RecipeEditor onSave={saveRecipe} onCancel={() => setEditing(false)} />}
          {health.recipes.length === 0 && !editing && (
            <div style={{ padding: 16, textAlign: "center", fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", letterSpacing: "0.1em", border: "1px dashed var(--hlth-border-soft)", borderRadius: 8 }}>
              no recipes yet — store your meal-prep staples with auto nutrition per serving
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
            {health.recipes.map(r => {
              const nut = recipeNutrition(r);
              return (
                <div key={r.id} style={{ borderRadius: 8, border: "1px solid var(--hlth-border-soft)", background: "var(--hlth-card2)", padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--hlth-fg)" }}>{r.name}</div>
                    <button onClick={() => updateHealth(h => ({ recipes: h.recipes.filter(x => x.id !== r.id) }))}
                      style={{ background: "transparent", border: "none", color: "var(--hlth-muted)", cursor: "pointer", padding: 2 }}><Trash2 size={11} /></button>
                  </div>
                  <div style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)", margin: "4px 0" }}>
                    {r.ingredients.length} ingredients · {r.portions} servings{r.prepTimeMin ? ` · ${r.prepTimeMin}min` : ""}
                  </div>
                  <div style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-accent-glow)" }}>
                    {nut.perServing.kcal} kcal/serving · C{nut.perServing.carbsG} P{nut.perServing.proteinG} F{nut.perServing.fatG}
                  </div>
                  <button className="hlth-btn" onClick={() => onLogItem("lunch", `${r.name} (1 serving)`, nut.perServing.kcal, nut.perServing.carbsG, nut.perServing.proteinG, nut.perServing.fatG)}
                    style={{ marginTop: 8, padding: "5px 10px", fontSize: 9, width: "100%" }}>
                    LOG 1 SERVING → LUNCH
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- RESTAURANT ---------------- */}
      {tab === "restaurant" && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", padding: 10, borderRadius: 8, border: "1px dashed var(--hlth-border)", background: "var(--hlth-card2)" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 3, fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)", flex: "1 1 140px" }}>
              RESTAURANT
              <input value={rRest} onChange={e => setRRest(e.target.value)} placeholder="Saravana Bhavan / Murugan Idli / mess…" style={inputStyle} list="hlth-rest-names" />
              <datalist id="hlth-rest-names">
                {restaurants.map(([name]) => <option key={name} value={name} />)}
                <option value="Saravana Bhavan" /><option value="Murugan Idli Shop" /><option value="A2B" />
                <option value="College mess" /><option value="Domino's" /><option value="KFC" />
              </datalist>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 3, fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)", flex: "1 1 140px" }}>
              DISH
              <input value={rName} onChange={e => setRName(e.target.value)} placeholder="mini tiffin / ghee roast…" style={inputStyle} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 3, fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)" }}>
              ROUGH KCAL
              <input type="number" min={0} value={rKcal || ""} onChange={e => setRKcal(+e.target.value)} style={{ ...inputStyle, width: 80 }} />
            </label>
            <button className="hlth-btn" onClick={saveRestaurantMeal} style={{ padding: "6px 12px", fontSize: 10 }}>SAVE</button>
          </div>

          {restaurants.length === 0 && (
            <div style={{ padding: 16, textAlign: "center", fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", letterSpacing: "0.1em", border: "1px dashed var(--hlth-border-soft)", borderRadius: 8 }}>
              no saved eatery meals — save your usual orders once, re-log in one tap next visit 🌏
            </div>
          )}
          {restaurants.map(([name, rows]) => (
            <div key={name}>
              <div style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", letterSpacing: "0.12em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <Store size={10} /> {name.toUpperCase()}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {rows.map(rm => (
                  <span key={rm.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--hlth-card2)", border: "1px solid var(--hlth-border-soft)", borderRadius: 999, padding: "4px 6px 4px 10px", fontSize: 11 }}>
                    <button onClick={() => logRestaurantMeal(rm)} title="Log to dinner"
                      style={{ background: "transparent", border: "none", color: "var(--hlth-fg)", cursor: "pointer", fontWeight: 600, fontSize: 11, padding: 0, fontFamily: "inherit" }}>
                      {rm.name} <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-accent-glow)" }}>{rm.kcal}kc{rm.timesUsed ? `·×${rm.timesUsed}` : ""}</span>
                    </button>
                    <button onClick={() => updateHealth(h => ({ restaurantMeals: h.restaurantMeals.filter(x => x.id !== rm.id) }))}
                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: "var(--hlth-muted)", display: "inline-flex" }}>
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
