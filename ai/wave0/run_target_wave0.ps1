param(
  [Parameter(Mandatory=$true)][ValidateSet("AC balanced","AC performance","Battery balanced")][string]$ProfileLabel,
  [string]$CandidateConfig = "config/candidates.local.json",
  [string]$HardwareConfig = "config/hardware.local.json",
  [int]$SoakSeconds = 1800,
  [string]$EmbeddingBaseUrl = "",
  [switch]$SkipSoak
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Invoke-Step([string]$Name, [scriptblock]$Action) {
  Write-Host "`n=== $Name ===" -ForegroundColor Cyan
  & $Action
  if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE" }
}

if (-not (Test-Path $CandidateConfig)) {
  throw "Missing LOCAL-ONLY candidate config: $CandidateConfig. Copy candidates.local.example.json and fill it locally."
}
if (-not (Test-Path $HardwareConfig)) {
  throw "Missing LOCAL-ONLY hardware config: $HardwareConfig. Copy hardware.local.example.json and fill it locally."
}

$config = Get-Content $CandidateConfig -Raw | ConvertFrom-Json
$enabled = @($config.candidates | Where-Object { $_.enabled -eq $true })
if ($enabled.Count -ne 1) {
  throw "Exactly one candidate must be enabled per target run; found $($enabled.Count)."
}
$candidate = $enabled[0]
$safeCandidate = ($candidate.id -replace '[^A-Za-z0-9._-]', '-')
$safeProfile = ($ProfileLabel -replace '[^A-Za-z0-9._-]', '-')
$runId = "$safeCandidate-$safeProfile"
$local = Join-Path $PSScriptRoot "results-local/$runId"
$public = Join-Path $PSScriptRoot "results-public/$runId.json"
New-Item -ItemType Directory -Force -Path $local | Out-Null

Write-Host "Wave 0 target run: $runId" -ForegroundColor Green
Write-Host "Raw LOCAL-ONLY directory: $local"
Write-Host "Public aggregate candidate: $public"
Write-Host "Confirm Windows/ASUS power profile is already set to: $ProfileLabel" -ForegroundColor Yellow
$confirm = Read-Host "Type RUN to continue"
if ($confirm -ne "RUN") { throw "Cancelled before benchmark execution." }

Invoke-Step "Privacy gate before execution" {
  python scripts/privacy_scan.py --mode tracked
}
Invoke-Step "Authoritative hardware capture" {
  python scripts/capture_hardware.py --expected $HardwareConfig --profile-label $ProfileLabel --output "$local/hardware.json"
}
Invoke-Step "SQLite FTS5 baseline" {
  python scripts/benchmark_retrieval.py --output "$local/retrieval.json"
}
Invoke-Step "SSE versus WebSocket protocol probe" {
  python scripts/transport_probe.py --messages 200 --runs 50 --output "$local/transport.json"
}
Invoke-Step "Pairing security prototype" {
  python prototypes/pairing_server.py --self-test --output "$local/pairing.json"
}
Invoke-Step "Revision and snapshot prototype" {
  node prototypes/revision-coordinator.mjs --output "$local/revision.json"
}
Invoke-Step "Generation and tool benchmark" {
  python scripts/run_benchmarks.py --config $CandidateConfig --output "$local/model.json"
}
Invoke-Step "Process lifecycle and crash recovery" {
  python scripts/probe_lifecycle.py --config $CandidateConfig --candidate $candidate.id --context 4096 --output "$local/lifecycle.json"
}

$soakPath = ""
if (-not $SkipSoak) {
  $soakPath = "$local/soak.json"
  Invoke-Step "Sustained thermal and throughput soak" {
    python scripts/soak_model.py --config $CandidateConfig --candidate $candidate.id --context 4096 --duration $SoakSeconds --output $soakPath
  }
} else {
  Write-Warning "Thermal soak skipped. Final gate will remain incomplete."
}

$embeddingPath = ""
if ($EmbeddingBaseUrl) {
  $embeddingPath = "$local/embeddings.json"
  Invoke-Step "Embedding paraphrase benchmark" {
    python scripts/benchmark_embeddings.py --base-url $EmbeddingBaseUrl --output $embeddingPath
  }
} else {
  Write-Warning "No embedding endpoint supplied. Embedding gates will remain pending."
}

$scoreArgs = @(
  "scripts/score_results.py",
  "--models", "$local/model.json",
  "--retrieval", "$local/retrieval.json",
  "--lifecycle", "$local/lifecycle.json",
  "--pairing", "$local/pairing.json",
  "--revision", "$local/revision.json",
  "--output", "$local/score.json"
)
if ($soakPath) { $scoreArgs += @("--soak", $soakPath) }
if ($embeddingPath) { $scoreArgs += @("--embeddings", $embeddingPath) }
Invoke-Step "Frozen W0-GATE-1 scoring" { python @scoreArgs }

$sanitizeArgs = @(
  "scripts/sanitize_results.py",
  "--hardware", "$local/hardware.json",
  "--models", "$local/model.json",
  "--retrieval", "$local/retrieval.json",
  "--lifecycle", "$local/lifecycle.json",
  "--pairing", "$local/pairing.json",
  "--revision", "$local/revision.json",
  "--score", "$local/score.json",
  "--transport", "$local/transport.json",
  "--output", $public
)
if ($soakPath) { $sanitizeArgs += @("--soak", $soakPath) }
if ($embeddingPath) { $sanitizeArgs += @("--embeddings", $embeddingPath) }
Invoke-Step "Allowlist public sanitization" { python @sanitizeArgs }
Invoke-Step "Public review bundle coverage" {
  python scripts/build_review_bundle.py --input-dir results-public --output results-public/wave0-review-bundle.json
}

Write-Host "`nTARGET RUN COMPLETE" -ForegroundColor Green
Write-Host "Raw results remain LOCAL-ONLY: $local"
Write-Host "Review this sanitized aggregate manually before staging: $public"
Write-Host "Do not start Wave 1. Update docs/ai/WAVE-0-REPORT.md and stop for review."
