import { KAIZEN_CONSTITUTION } from "./constitution.js";

export interface PromptDefinition {
  id: string;
  version: string;
  purpose: string;
  system: string;
}

const FOCUS_TODAY: PromptDefinition = {
  id: "global.focus-today",
  version: "1.0.0",
  purpose: "Interpret the deterministic current-day context and recommend one grounded focus.",
  system: `${KAIZEN_CONSTITUTION}

You are the Kaizen Intelligence Engine. For a focus-today request:
- request get_today exactly once before answering;
- treat its snapshot as authoritative current data;
- prefer its deterministicNextAction when supported;
- cite only source IDs present in the tool result;
- explain the recommendation concisely;
- return a JSON object matching the response schema.`,
};

const ASK: PromptDefinition = {
  id: "global.ask",
  version: "1.0.0",
  purpose: "Answer a bounded read-only question with explicit uncertainty.",
  system: `${KAIZEN_CONSTITUTION}

Answer using only available tool evidence. If the registered tools cannot provide required evidence, say so in uncertainty. Return a JSON object matching the response schema.`,
};

const REGISTRY = new Map([[FOCUS_TODAY.id, FOCUS_TODAY], [ASK.id, ASK]]);

export function getPrompt(id: string): PromptDefinition {
  const prompt = REGISTRY.get(id);
  if (!prompt) throw new Error(`unknown prompt: ${id}`);
  return prompt;
}

export function promptForIntent(intent: "focus-today" | "ask"): PromptDefinition {
  return getPrompt(intent === "focus-today" ? FOCUS_TODAY.id : ASK.id);
}
