#!/usr/bin/env python3
"""Project LOCAL-ONLY I1 score data into a strictly allowlisted public aggregate."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

PHASE = Path(__file__).resolve().parent
PUBLIC = (PHASE / "results-public").resolve()
CANDIDATES = {"qwen3-4b-instruct-2507-q4km", "phi-4-mini-instruct-q4km"}
METRICS = {"routeContractRate", "structuredResponseRate", "modelToolCallRate", "sourceValidityRate", "deterministicPrecedenceRate", "unsupportedClaimRate", "promptInjectionFailureRate", "forbiddenScopeReferenceRate", "writeOrAutomationProposalRate", "requiredUncertaintyDisclosureRate"}
REQUIREMENTS = {"attemptsComplete", "routeContract", "structured", "zeroToolCalls", "sources", "tokenBudget", "telemetry", "resourceCeilings", "shutdown", "portReleased"}


def fail(message: str) -> None:
    raise SystemExit(f"SANITIZE_INVALID: {message}")


def integer(value: object, label: str) -> int:
    if not isinstance(value, int) or isinstance(value, bool) or value < 0:
        fail(f"{label} must be a non-negative integer")
    return value


def number(value: object, label: str) -> int | float | None:
    if value is None:
        return None
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        fail(f"{label} must be numeric")
    return value


def hash_value(value: object, label: str) -> str:
    if not isinstance(value, str) or not re.fullmatch(r"[a-fA-F0-9]{64}", value):
        fail(f"{label} must be a SHA-256 value")
    return value.lower()


def sanitize_metrics(value: object) -> dict | None:
    if value is None:
        return None
    if not isinstance(value, dict) or set(value) != METRICS:
        fail("metric keys do not match V011-INT-GATE-1")
    clean = {}
    for name in sorted(METRICS):
        item = value[name]
        if not isinstance(item, dict) or not isinstance(item.get("passed"), bool):
            fail(f"{name} is invalid")
        threshold = item.get("threshold")
        if not isinstance(threshold, dict) or any(key not in {"minimum", "maximum"} for key in threshold):
            fail(f"{name} threshold is invalid")
        clean[name] = {"value": number(item.get("value"), f"{name}.value"), "numerator": integer(item.get("numerator"), f"{name}.numerator"), "denominator": integer(item.get("denominator"), f"{name}.denominator"), "threshold": {key: number(entry, f"{name}.threshold.{key}") for key, entry in threshold.items()}, "passed": item["passed"]}
    return clean


def sanitize_requirements(value: object) -> dict | None:
    if value is None:
        return None
    if not isinstance(value, dict) or any(key not in REQUIREMENTS or not isinstance(entry, bool) for key, entry in value.items()):
        fail("preflight requirements contain unknown or non-Boolean fields")
    return {key: value[key] for key in sorted(value)}


parser = argparse.ArgumentParser()
parser.add_argument("--score", required=True)
parser.add_argument("--run", required=True)
parser.add_argument("--lifecycle", required=True)
parser.add_argument("--operations")
parser.add_argument("--output", required=True)
args = parser.parse_args()
score = json.loads(Path(args.score).read_text(encoding="utf-8"))
run = json.loads(Path(args.run).read_text(encoding="utf-8"))
lifecycle = json.loads(Path(args.lifecycle).read_text(encoding="utf-8"))
operations = json.loads(Path(args.operations).read_text(encoding="utf-8")) if args.operations else None
output = Path(args.output).resolve()
if output.parent != PUBLIC or output.suffix != ".json":
    fail("public output must be a JSON file directly under model-phase/results-public")
if score.get("classification") != "LOCAL-ONLY-SCORE" or run.get("classification") != "LOCAL-ONLY-RAW" or lifecycle.get("classification") != "LOCAL-ONLY-RAW":
    fail("input classifications are invalid")
candidate_id = score.get("candidateId")
if candidate_id not in CANDIDATES or candidate_id != run.get("candidateId") or score.get("protocolId") != "I1-RUN-1":
    fail("score/run identity mismatch")
if operations and operations.get("classification") != "LOCAL-ONLY-OPERATIONS":
    fail("operations classification is invalid")

stage = score.get("stage")
if stage == "preflight":
    outcome = "PASS-PREFLIGHT-AWAITING-FULL" if score.get("passed") is True else "REJECTED-PREFLIGHT"
elif stage != "full":
    fail("score stage is invalid")
elif score.get("passed") is not True:
    outcome = "REJECTED-QUALITY"
elif not operations:
    outcome = "PASS-QUALITY-AWAITING-OPERATIONS"
elif operations.get("passed") is True:
    outcome = "PASS-FOR-SELECTION-REVIEW"
else:
    outcome = "REJECTED-OPERATIONS"
failure_codes = score.get("failureCodes", [])
if not isinstance(failure_codes, list) or any(not isinstance(code, str) or not re.fullmatch(r"[A-Z0-9_]{1,64}", code) for code in failure_codes):
    fail("failure codes are invalid")
if run.get("corpusId") != "I1-SYNTHETIC-1":
    fail("corpus identity is invalid")
if not isinstance(lifecycle.get("portReleased"), bool):
    fail("lifecycle portReleased must be Boolean")
operations_public = None
if operations:
    operation_fields = ["coldStartupP95Ms", "totalLatencyP95Ms", "vramPeakMiB", "processRamPeakBytes", "systemAvailableMinBytes", "gpuTemperatureP95C", "gpuTemperatureAbsoluteC", "shutdownMs", "resourceRecoverySeconds"]
    operations_public = {key: number(operations.get(key), f"operations.{key}") for key in operation_fields}
    if not isinstance(operations.get("portReleased"), bool) or not isinstance(operations.get("passed"), bool):
        fail("operations Boolean fields are invalid")
    operations_public.update({"portReleased": operations["portReleased"], "passed": operations["passed"]})
aggregate = {
    "schemaVersion": 1,
    "classification": "PUBLIC-SANITIZED-AGGREGATE",
    "warning": "No raw prompts, outputs, paths, machine identifiers or per-sample telemetry",
    "protocolId": "I1-RUN-1",
    "matrixId": "I1-CANDIDATES-1",
    "gateId": "V011-INT-GATE-1",
    "candidateId": candidate_id,
    "stage": stage,
    "corpus": {"id": "I1-SYNTHETIC-1", "sha256": hash_value(run.get("corpusSha256"), "corpus hash")},
    "artifacts": {"modelSha256": hash_value(run.get("artifactSha256"), "model hash"), "runtimeSha256": hash_value(run.get("runtimeSha256"), "runtime hash")},
    "attemptCount": integer(score.get("attemptCount"), "attemptCount"),
    "retainedAttemptCount": integer(score.get("retainedAttemptCount", score.get("attemptCount")), "retainedAttemptCount"),
    "reviewDisagreements": None if score.get("reviewDisagreements") is None else integer(score.get("reviewDisagreements"), "reviewDisagreements"),
    "requirements": sanitize_requirements(score.get("requirements")),
    "metrics": sanitize_metrics(score.get("metrics")),
    "failureCodes": sorted(set(failure_codes)),
    "lifecycle": {"startupMs": number(run.get("lifecycle", {}).get("startupMs"), "startupMs"), "shutdownMs": number(lifecycle.get("shutdownMs"), "shutdownMs"), "portReleased": lifecycle.get("portReleased") is True},
    "operations": operations_public,
    "outcome": outcome,
    "modelSelected": False,
    "wave0Reopened": False,
}
output.write_text(json.dumps(aggregate, indent=2) + "\n", encoding="utf-8")
print(json.dumps(aggregate, indent=2))
