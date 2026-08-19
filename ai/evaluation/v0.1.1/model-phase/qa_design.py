#!/usr/bin/env python3
"""Validate the frozen interpreter-model design without starting a runtime or model."""
from __future__ import annotations

import json
from pathlib import Path

AI_ROOT = Path(__file__).resolve().parents[3]
REPO_ROOT = AI_ROOT.parent
PHASE = AI_ROOT / "evaluation" / "v0.1.1" / "model-phase"
DOCS = REPO_ROOT / "docs" / "ai" / "v0.1.1-model-evaluation"
checks: list[tuple[str, bool]] = []


def check(label: str, condition: bool) -> None:
    checks.append((label, condition))
    print(f"{'PASS' if condition else 'FAIL'}: {label}")


candidates = json.loads((PHASE / "candidates.v1.json").read_text(encoding="utf-8"))
protocol = json.loads((PHASE / "protocol.v1.json").read_text(encoding="utf-8"))
authorization = json.loads((PHASE / "authorization.v2.json").read_text(encoding="utf-8"))
template = json.loads((PHASE / "config" / "candidates.local.example.json").read_text(encoding="utf-8"))
included = [candidate["id"] for candidate in candidates["included"]]
excluded = [candidate["id"] for candidate in candidates["excluded"]]
strata_total = sum(stratum["scenarios"] for stratum in protocol["dataset"]["strata"])

check("candidate matrix is frozen and disabled", candidates["status"] == "FROZEN-BEFORE-MODEL-EXECUTION" and candidates["executionEnabled"] is False)
check("candidate order is exactly Qwen3 then Phi", included == ["qwen3-4b-instruct-2507-q4km", "phi-4-mini-instruct-q4km"])
check("Gemma and larger control are explicitly excluded", excluded == ["gemma-3-4b-it-qat-q4", "qwen2.5-7b-instruct-q4km-control"])
check("protocol is frozen and public execution stays disabled", protocol["status"] == "FROZEN-BEFORE-MODEL-EXECUTION" and protocol["executionEnabled"] is False)
check("authorization closes every stage after both rejections", authorization["status"] == "CLOSED-NO-PASSING-CANDIDATE" and authorization["candidateOrder"] == included and authorization["stages"] == {"preflight": False, "full": False, "operations": False} and set(authorization["outcomes"].values()) == {"REJECTED-PREFLIGHT"})
check("protocol references the frozen matrix", protocol["matrixId"] == candidates["matrixId"] == "I1-CANDIDATES-1")
check("V011 gate is unchanged", protocol["qualityGate"] == {"id": "V011-INT-GATE-1", "version": "1.0", "changeAllowed": False, "wave0GateReopened": False})
check("production route has zero provider tools", protocol["productionPath"]["providerToolDefinitions"] == 0 and protocol["productionPath"]["providerToolRounds"] == 0)
check("dataset freezes 50 scenarios and 100 responses", strata_total == protocol["dataset"]["scenarioCount"] == 50 and protocol["dataset"]["scoredResponsesPerCandidate"] == 100)
check("context and output budgets are fixed", protocol["productionPath"]["contextTokens"] == 4096 and protocol["productionPath"]["maximumOutputTokens"] == 512)
check("operational memory ceiling is not weakened", protocol["operationalCeilings"]["systemAvailableBytesMin"] == 3221225472)
check("local template is disabled", template["executionEnabled"] is False and all(not candidate["enabled"] for candidate in template["candidates"]))
check("local template candidates match matrix", [candidate["id"] for candidate in template["candidates"]] == included)
check("all design documents exist", all((DOCS / name).is_file() for name in ["README.md", "CANDIDATE-MATRIX.md", "RUN-PROTOCOL.md", "REPORT-TEMPLATE.md"]))
public_files = sorted(path.name for path in (PHASE / "results-public").iterdir())
allowed_public = {"README.md", "qwen3-4b-instruct-2507-q4km-preflight.json", "phi-4-mini-instruct-q4km-preflight.json"}
valid_public = set(public_files).issubset(allowed_public)
for name in public_files:
    if name.endswith(".json"):
        result = json.loads((PHASE / "results-public" / name).read_text(encoding="utf-8"))
        valid_public = valid_public and result.get("classification") == "PUBLIC-SANITIZED-AGGREGATE" and result.get("stage") == "preflight" and result.get("modelSelected") is False
check("public results follow the preflight-only authorization allowlist", valid_public)
check("report template cannot declare selection", "PASS-FOR-SELECTION-REVIEW" in (DOCS / "REPORT-TEMPLATE.md").read_text(encoding="utf-8") and "Model selected by this report: `NO`" in (DOCS / "REPORT-TEMPLATE.md").read_text(encoding="utf-8"))

failures = [label for label, passed in checks if not passed]
print(f"\n{len(checks) - len(failures)}/{len(checks)} interpreter-model design checks passed")
if failures:
    raise SystemExit(1)
