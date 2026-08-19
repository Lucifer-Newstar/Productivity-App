/** Regression coverage for the contracts.test Intelligence Engine boundary. */
import assert from "node:assert/strict";
import test from "node:test";
import { GET_TODAY_TOOL } from "../src/contracts/tools.js";
import { CONSTITUTION_VERSION, KAIZEN_CONSTITUTION } from "../src/prompts/constitution.js";
import { parseAndValidateIntelligence, validateToolArguments } from "../src/validation/schema.js";

test("Constitution is versioned and forbids invented facts", () => {
  assert.equal(CONSTITUTION_VERSION, "KAC-1");
  assert.match(KAIZEN_CONSTITUTION, /Never invent facts/);
  assert.match(KAIZEN_CONSTITUTION, /read-only/);
});

test("get_today contract is bounded and read-only", () => {
  assert.equal(GET_TODAY_TOOL.permission, "read");
  assert.equal(GET_TODAY_TOOL.outputContract, "core.today");
  assert.equal(validateToolArguments("get_today", "1.0", { maximumItems: 50 }).ok, true);
  assert.equal(validateToolArguments("get_today", "1.0", { maximumItems: 500 }).ok, false);
  assert.equal(validateToolArguments("delete_task", "1.0", {}).ok, false);
});

test("structured response validation rejects arbitrary output", () => {
  const valid = JSON.stringify({ type: "recommendation", title: "Focus", summary: "Start the current task.", rationale: [], confidence: .8, uncertainty: [], assumptions: [], sourceIds: ["t1"] });
  assert.equal(parseAndValidateIntelligence(valid).ok, true);
  assert.equal(parseAndValidateIntelligence("not json").ok, false);
  assert.equal(parseAndValidateIntelligence(JSON.stringify({ type: "recommendation", title: "x", summary: "x", rationale: [], confidence: 9, uncertainty: [], assumptions: [], sourceIds: [], injected: true })).ok, false);
});
