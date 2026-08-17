import { createRequire } from "node:module";
import type { ErrorObject, ValidateFunction } from "ajv";
import { INTELLIGENCE_RESPONSE_SCHEMA } from "../contracts/responses.js";
import { GET_TODAY_TOOL } from "../contracts/tools.js";

const require = createRequire(import.meta.url);
const Ajv2020 = (require("ajv/dist/2020") as { default: new (options: object) => { compile: (schema: object) => ValidateFunction } }).default;
const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: false });
const intelligenceValidator = ajv.compile(INTELLIGENCE_RESPONSE_SCHEMA);
const toolValidators = new Map<string, ValidateFunction>([
  [`${GET_TODAY_TOOL.name}@${GET_TODAY_TOOL.version}`, ajv.compile(GET_TODAY_TOOL.inputSchema)],
]);

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  errors: string[];
}

function messages(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map((error) => `${error.instancePath || "$"} ${error.message ?? "is invalid"}`);
}

export function parseAndValidateIntelligence(value: string): ValidationResult<Record<string, unknown>> {
  let parsed: unknown;
  try { parsed = JSON.parse(value); }
  catch { return { ok: false, errors: ["response is not valid JSON"] }; }
  if (!intelligenceValidator(parsed)) return { ok: false, errors: messages(intelligenceValidator.errors) };
  return { ok: true, value: parsed as Record<string, unknown>, errors: [] };
}

export function validateToolArguments(name: string, version: string, value: unknown): ValidationResult<unknown> {
  const validator = toolValidators.get(`${name}@${version}`);
  if (!validator) return { ok: false, errors: ["tool/version is not registered"] };
  if (!validator(value)) return { ok: false, errors: messages(validator.errors) };
  return { ok: true, value, errors: [] };
}
