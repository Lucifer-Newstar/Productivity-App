# Re-scores retained preflight attempts locally to replace generic failure codes without running inference.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$AiRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$ResultsLocal = Join-Path $PSScriptRoot 'results-local'
$ResultsPublic = Join-Path $PSScriptRoot 'results-public'
$Candidates = @('qwen3-4b-instruct-2507-q4km', 'phi-4-mini-instruct-q4km')
Push-Location $AiRoot
try {
  & npm run qa:v0.1.1:model-harness
  if ($LASTEXITCODE -ne 0) { throw 'Updated harness QA failed; no evidence was changed.' }
  $Outcomes = @()
  foreach ($CandidateId in $Candidates) {
    $RunDir = Get-ChildItem -LiteralPath $ResultsLocal -Directory |
      Where-Object { $_.Name.StartsWith("$CandidateId-preflight-") -and (Test-Path (Join-Path $_.FullName 'run.local.json')) } |
      Sort-Object LastWriteTimeUtc -Descending |
      Select-Object -First 1
    if (-not $RunDir) { throw "No retained preflight run exists for $CandidateId." }
    $PublicPath = Join-Path $ResultsPublic ("{0}-preflight.json" -f $CandidateId)
    if (-not (Test-Path -LiteralPath $PublicPath)) { throw "Missing sanitized preflight aggregate for $CandidateId." }
    $Before = Get-Content -Raw -LiteralPath $PublicPath | ConvertFrom-Json
    if ($Before.stage -ne 'preflight' -or $Before.outcome -ne 'REJECTED-PREFLIGHT' -or -not ($Before.failureCodes -contains 'UNCLASSIFIED')) {
      throw "Existing public result for $CandidateId is not the expected UNCLASSIFIED preflight rejection."
    }
    $ScorePath = Join-Path $RunDir.FullName 'preflight-score.local.json'
    & npm run score:v0.1.1:model -- --attempts (Join-Path $RunDir.FullName 'attempts.local.jsonl') --run (Join-Path $RunDir.FullName 'run.local.json') --output $ScorePath
    if ($LASTEXITCODE -ne 0) { throw "Local re-scoring failed for $CandidateId." }
    $Score = Get-Content -Raw -LiteralPath $ScorePath | ConvertFrom-Json
    if ($Score.failureCodes -contains 'UNCLASSIFIED' -or $Score.failureCodes.Count -eq 0) {
      throw "Private failure evidence for $CandidateId could not be safely classified. Public evidence was not changed."
    }
    & npm run sanitize:v0.1.1:model -- --score $ScorePath --run (Join-Path $RunDir.FullName 'run.local.json') --lifecycle (Join-Path $RunDir.FullName 'lifecycle.local.json') --output $PublicPath
    if ($LASTEXITCODE -ne 0) { throw "Sanitization failed for $CandidateId." }
    $After = Get-Content -Raw -LiteralPath $PublicPath | ConvertFrom-Json
    if ($After.outcome -ne $Before.outcome -or $After.attemptCount -ne $Before.attemptCount -or $After.retainedAttemptCount -ne $Before.retainedAttemptCount -or (($After.requirements | ConvertTo-Json -Depth 20 -Compress) -ne ($Before.requirements | ConvertTo-Json -Depth 20 -Compress))) {
      throw "Reclassification changed non-classification evidence for $CandidateId; stop and review locally."
    }
    $Outcomes += [pscustomobject]@{ candidateId = $CandidateId; outcome = $After.outcome; failureCodes = ($After.failureCodes -join ',') }
  }
  Write-Host ''
  Write-Host 'Local failure reclassification complete. Safe public evidence:'
  $Outcomes | Format-Table -AutoSize
  Write-Host 'No inference was run. Do not share results-local or local configuration.'
} finally {
  Pop-Location
}
