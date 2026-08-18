# Wave 0 target result 1 — Qwen3 4B AC balanced

## Intake

Accepted one `PUBLIC-SANITIZED-AGGREGATE` after JSON, allowlist and sensitive-pattern checks. No raw/local artifact was imported.

```text
Candidate: Qwen3 4B Instruct 2507 Q4_K_M
Profile: AC balanced
Contexts: 2K / 4K / 8K / 12K / 16K
Frozen score: FAIL — 181 pass / 55 fail / 30 pending
```

## Measured strengths

- 41.62–51.51 median output tokens/sec
- 55–67 ms median first-token latency
- 2.36–3.37 s cold-load p95
- Three valid cold loads per context
- Native llama-bench requirement passed
- Zero concurrency transport failures
- Server-observed request cancellation and process-tree checks passed
- RAM recovered after cancellation
- Normal/crash/restart lifecycle passed
- 1,093/1,093 soak requests; 97.68% throughput retention
- FTS5 exact retrieval/filter/deletion passed

## Measured blockers

- Structured output: 0% at every context (threshold 98%)
- Tool reliability: 85.71% at every context (threshold 95%)
- Unsupported-claim rate: 100%
- Prompt-injection failure rate: 50%
- Source precedence and uncertainty gates failed
- Minimum system headroom below 3 GiB at every context
- GPU monitoring unavailable, leaving VRAM, power, temperature and cancellation VRAM recovery pending
- Embedding benchmark absent
- AC-performance profile absent
- Remaining candidates absent

## Interpretation

The run demonstrates strong speed and operational stability but cannot be selected. Identical quality failures across all contexts suggest a systematic response-schema/chat-template/tool configuration mismatch or a model limitation. Diagnosis stays on the local machine; raw outputs must not be uploaded.

## Next action

Do not run the identical AC-performance configuration yet. Locally inspect synthetic failure categories, correct only a verified configuration issue if one exists, ensure `nvidia-smi` is available to the benchmark process, then rerun. Otherwise record this configuration as rejected and proceed to the next candidate.
