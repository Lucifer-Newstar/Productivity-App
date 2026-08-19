#!/usr/bin/env python3
"""Exercise the disabled I1 corpus, runner gates, scorer, sanitizer, and privacy boundaries without a model."""
from __future__ import annotations

import csv
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

PHASE = Path(__file__).resolve().parent
AI_ROOT = PHASE.parents[2]
CONFIG_DIR = PHASE / "config"
LOCAL_QA = PHASE / "results-local" / "qa-harness"
PUBLIC_QA = PHASE / "results-public" / "qa-sanitizer-output.json"
RUNNER = PHASE / "runner.ts"
checks: list[tuple[str, bool]] = []


def check(label: str, condition: bool) -> None:
    checks.append((label, condition))
    print(f"{'PASS' if condition else 'FAIL'}: {label}")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str], *, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=AI_ROOT, text=True, capture_output=True, env=env, check=False)


try:
    before = digest(PHASE / "corpus.v1.json")
    built = run([sys.executable, str(PHASE / "build_corpus.py")])
    check("corpus builder succeeds deterministically", built.returncode == 0 and digest(PHASE / "corpus.v1.json") == before)
    corpus = json.loads((PHASE / "corpus.v1.json").read_text(encoding="utf-8"))
    manifest = json.loads((PHASE / "corpus.manifest.json").read_text(encoding="utf-8"))
    strata: dict[str, int] = {}
    for item in corpus["cases"]:
        strata[item["stratum"]] = strata.get(item["stratum"], 0) + 1
    check("corpus has exactly 50 frozen public synthetic cases", corpus["classification"] == "PUBLIC-SYNTHETIC" and corpus["scenarioCount"] == len(corpus["cases"]) == 50)
    check("corpus strata match I1-RUN-1", strata == {"deterministic-clear": 10, "empty-insufficient-contradictory": 8, "multiple-priorities": 8, "schedule-attention": 8, "untrusted-instruction": 8, "forbidden-scope-and-action-language": 8})
    check("corpus manifest hash and response count match", manifest["sha256"] == digest(PHASE / manifest["corpusFile"]) and manifest["scoredResponsesPerCandidate"] == 100)
    check("synthetic cases remain below conservative character budget", max(len(json.dumps(item, separators=(",", ":"))) for item in corpus["cases"]) < 12000)
    with (PHASE / "semantic-review-template.csv").open(newline="", encoding="utf-8") as handle:
        worksheet = list(csv.DictReader(handle))
    check("semantic worksheet has one blank row per planned attempt", len(worksheet) == 100 and len({row["attemptId"] for row in worksheet}) == 100 and all(not row["adjudicatedUnsupportedClaim"] for row in worksheet))

    template = json.loads((CONFIG_DIR / "candidates.local.example.json").read_text(encoding="utf-8"))
    disabled_config = CONFIG_DIR / "qa-disabled.local.json"
    sentinel = LOCAL_QA / "runtime-started.sentinel"
    template["runtime"]["llamaServerPath"] = str(sentinel)
    template["runtime"]["nvidiaSmiPath"] = str(sentinel)
    disabled_config.write_text(json.dumps(template), encoding="utf-8")
    tsx = AI_ROOT / "node_modules" / ".bin" / ("tsx.cmd" if os.name == "nt" else "tsx")
    probe_path = CONFIG_DIR / "qa-stream-hash.bin"; probe_path.write_bytes((b"kaizen-stream-hash\n" * 65536))
    expected_probe = digest(probe_path)
    probe = run([str(tsx), "-e", f"import('{(PHASE / 'fileHash.ts').as_uri()}').then(async m=>console.log(await m.sha256File({json.dumps(str(probe_path))})))"])
    check("streaming artifact hash matches SHA-256", probe.returncode == 0 and probe.stdout.strip() == expected_probe)
    runner_source = RUNNER.read_text(encoding="utf-8")
    check("runner hashes runtime/model artifacts through streaming utility", "await exactHash(config.runtime.llamaServerPath" in runner_source and "await exactHash(candidate.modelPath" in runner_source and "createReadStream" in (PHASE / "fileHash.ts").read_text(encoding="utf-8"))
    environment = {**os.environ, "KAIZEN_I1_EXECUTION_ACK": "I1-RUN-1"}
    disabled = run([str(tsx), str(RUNNER), "--config", str(disabled_config), "--candidate", "qwen3-4b-instruct-2507-q4km", "--stage", "preflight", "--execute"], env=environment)
    check("disabled runner exits before any runtime spawn", disabled.returncode == 2 and "I1_EXECUTION_DISABLED" in disabled.stderr and not sentinel.exists())
    remote = json.loads(json.dumps(template)); remote["runtime"]["endpoint"] = "https://example.invalid:18080"
    disabled_config.write_text(json.dumps(remote), encoding="utf-8")
    rejected = run([str(tsx), str(RUNNER), "--config", str(disabled_config), "--candidate", "qwen3-4b-instruct-2507-q4km", "--stage", "preflight"], env=environment)
    check("runner rejects non-loopback endpoints before execution", rejected.returncode == 2 and "ENDPOINT_INVALID" in rejected.stderr and not sentinel.exists())
    disabled_config.write_text(json.dumps(template), encoding="utf-8")
    full = run([str(tsx), str(RUNNER), "--config", str(disabled_config), "--candidate", "qwen3-4b-instruct-2507-q4km", "--stage", "full", "--execute"], env=environment)
    check("authorization hard-blocks full execution", full.returncode == 2 and "STAGE_NOT_AUTHORIZED" in full.stderr and not sentinel.exists())

    LOCAL_QA.mkdir(parents=True, exist_ok=True)
    attempts_path, run_path = LOCAL_QA / "attempts.local.jsonl", LOCAL_QA / "run.local.json"
    lifecycle_path, reviews_path, score_path = LOCAL_QA / "lifecycle.local.json", LOCAL_QA / "reviews.local.csv", LOCAL_QA / "score.local.json"
    attempts = []
    for item in corpus["cases"]:
        for repetition in (1, 2):
            attempts.append({"schemaVersion": 1, "classification": "LOCAL-ONLY-RAW", "attemptId": f"blind-candidate::{item['id']}::{repetition}", "candidateId": "qwen3-4b-instruct-2507-q4km", "stage": "full", "scenarioId": item["id"], "stratum": item["stratum"], "repetition": repetition, "status": "completed", "expected": item["expected"], "automatic": {"routeContractValid": True, "structuredValid": True, "modelToolCalls": 0, "sourceValid": True, "deterministicPrecedenceValid": True, "uncertaintyValid": True}})
    attempts_path.write_text("".join(json.dumps(item) + "\n" for item in attempts), encoding="utf-8")
    run_record = {"schemaVersion": 1, "classification": "LOCAL-ONLY-RAW", "candidateId": "qwen3-4b-instruct-2507-q4km", "stage": "full", "protocolId": "I1-RUN-1", "corpusId": "I1-SYNTHETIC-1", "corpusSha256": manifest["sha256"], "runtimeSha256": "a" * 64, "artifactSha256": "b" * 64, "lifecycle": {"startupMs": 1000}, "attemptCount": 100, "rawPath": "MUST_NOT_PUBLISH"}
    run_path.write_text(json.dumps(run_record), encoding="utf-8")
    lifecycle_path.write_text(json.dumps({"classification": "LOCAL-ONLY-RAW", "shutdownMs": 1000, "portReleased": True}), encoding="utf-8")
    with reviews_path.open("w", newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader((PHASE / "semantic-review-template.csv").open(newline="", encoding="utf-8")))
        writer = csv.DictWriter(handle, fieldnames=rows[0].keys()); writer.writeheader()
        for row in rows:
            for key in row:
                if key.startswith("reviewer") or key.startswith("adjudicated"):
                    row[key] = "false"
            writer.writerow(row)
    scored = run([sys.executable, str(PHASE / "scorer.py"), "--attempts", str(attempts_path), "--run", str(run_path), "--reviews", str(reviews_path), "--output", str(score_path)])
    score = json.loads(score_path.read_text(encoding="utf-8")) if score_path.exists() else {}
    check("scorer accepts a complete known-pass fixture", scored.returncode == 0 and score.get("passed") is True and score.get("retainedAttemptCount") == 100)
    failed_attempts = json.loads(json.dumps(attempts)); failed_attempts[0]["status"] = "failed"; failed_attempts[0]["automatic"]["structuredValid"] = False; failed_attempts[0]["automatic"]["sourceValid"] = False
    failed_path, failed_score_path = LOCAL_QA / "failed.local.jsonl", LOCAL_QA / "failed-score.local.json"
    failed_path.write_text("".join(json.dumps(item) + "\n" for item in failed_attempts), encoding="utf-8")
    failed_score_run = run([sys.executable, str(PHASE / "scorer.py"), "--attempts", str(failed_path), "--run", str(run_path), "--reviews", str(reviews_path), "--output", str(failed_score_path)])
    failed_score = json.loads(failed_score_path.read_text(encoding="utf-8")) if failed_score_path.exists() else {}
    check("failed attempts remain counted as gate failures", failed_score_run.returncode == 0 and failed_score.get("retainedAttemptCount") == 100 and failed_score.get("passed") is False and failed_score.get("metrics", {}).get("structuredResponseRate", {}).get("numerator") == 99)
    missing_path = LOCAL_QA / "missing.local.jsonl"; missing_path.write_text("".join(json.dumps(item) + "\n" for item in attempts[:-1]), encoding="utf-8")
    missing = run([sys.executable, str(PHASE / "scorer.py"), "--attempts", str(missing_path), "--run", str(run_path), "--reviews", str(reviews_path), "--output", str(LOCAL_QA / "missing-score.local.json")])
    check("scorer rejects a dropped attempt", missing.returncode != 0 and "expected 100 retained attempts" in (missing.stdout + missing.stderr))
    sanitized = run([sys.executable, str(PHASE / "sanitizer.py"), "--score", str(score_path), "--run", str(run_path), "--lifecycle", str(lifecycle_path), "--output", str(PUBLIC_QA)])
    aggregate = json.loads(PUBLIC_QA.read_text(encoding="utf-8")) if PUBLIC_QA.exists() else {}
    serialized = json.dumps(aggregate)
    check("sanitizer emits only a non-selecting public aggregate", sanitized.returncode == 0 and aggregate.get("classification") == "PUBLIC-SANITIZED-AGGREGATE" and aggregate.get("outcome") == "PASS-QUALITY-AWAITING-OPERATIONS" and aggregate.get("modelSelected") is False)
    check("sanitizer strips raw paths, prompts, outputs, and responses", all(term not in serialized for term in ["MUST_NOT_PUBLISH", "rawText", "server.log", "response"]))
    tampered_score = json.loads(json.dumps(score)); tampered_score["metrics"]["rawText"] = {"secret": "MUST_NOT_PUBLISH"}
    tampered_score_path = LOCAL_QA / "tampered-score.local.json"; tampered_score_path.write_text(json.dumps(tampered_score), encoding="utf-8"); PUBLIC_QA.unlink(missing_ok=True)
    tampered = run([sys.executable, str(PHASE / "sanitizer.py"), "--score", str(tampered_score_path), "--run", str(run_path), "--lifecycle", str(lifecycle_path), "--output", str(PUBLIC_QA)])
    check("sanitizer rejects unknown nested metric fields", tampered.returncode != 0 and "metric keys" in (tampered.stdout + tampered.stderr) and not PUBLIC_QA.exists())
finally:
    for path in [CONFIG_DIR / "qa-disabled.local.json", CONFIG_DIR / "qa-stream-hash.bin", PUBLIC_QA]:
        path.unlink(missing_ok=True)
    shutil.rmtree(LOCAL_QA, ignore_errors=True)
allowed_public = {"README.md", "qwen3-4b-instruct-2507-q4km-preflight.json", "phi-4-mini-instruct-q4km-preflight.json"}
check("public result directory contains only authorized evidence after QA cleanup", set(path.name for path in (PHASE / "results-public").iterdir()).issubset(allowed_public))

failures = [label for label, passed in checks if not passed]
print(f"\n{len(checks) - len(failures)}/{len(checks)} interpreter-model harness checks passed")
if failures:
    raise SystemExit(1)
