# Runs only the two authorized I1 preflights in frozen order; it never runs full or operations stages.
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Config,
  [Parameter(Mandatory = $true)][switch]$ConfirmExecution
)
$ErrorActionPreference = 'Stop'
if (-not $ConfirmExecution) { throw 'ConfirmExecution is required for the authorized target preflight.' }
$AiRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$ConfigPath = (Resolve-Path $Config).Path
if (-not $ConfigPath.EndsWith('.local.json', [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Config must be an ignored *.local.json file.' }
$ResultsLocal = Join-Path $PSScriptRoot 'results-local'
$ResultsPublic = Join-Path $PSScriptRoot 'results-public'
New-Item -ItemType Directory -Force -Path $ResultsLocal | Out-Null
$Base = Get-Content -Raw -LiteralPath $ConfigPath | ConvertFrom-Json
$Frozen = @('qwen3-4b-instruct-2507-q4km', 'phi-4-mini-instruct-q4km')
$Actual = @($Base.candidates | ForEach-Object { $_.id })
if (($Actual -join ',') -ne ($Frozen -join ',')) { throw 'Candidate order differs from I1-CANDIDATES-1.' }
Push-Location $AiRoot
try {
  & npm run qa:v0.1.1:model-design
  if ($LASTEXITCODE -ne 0) { throw 'Model-design QA failed.' }
  & npm run qa:v0.1.1:model-harness
  if ($LASTEXITCODE -ne 0) { throw 'Model-harness QA failed.' }
  $Decisions = @()
  foreach ($CandidateId in $Frozen) {
    $Candidate = $Base.candidates | Where-Object { $_.id -eq $CandidateId }
    if (-not $Candidate) { throw "Missing candidate $CandidateId." }
    if (-not $Candidate.licenseVerified -or [string]::IsNullOrWhiteSpace($Candidate.license)) { throw "License is not verified for $CandidateId." }
    $Active = $Base | ConvertTo-Json -Depth 30 | ConvertFrom-Json
    $Active.executionEnabled = $true
    foreach ($Item in $Active.candidates) { $Item.enabled = ($Item.id -eq $CandidateId) }
    $ActivePath = Join-Path $PSScriptRoot ("config\i1-active-{0}.local.json" -f $CandidateId)
    $PublicPath = Join-Path $ResultsPublic ("{0}-preflight.json" -f $CandidateId)
    if (Test-Path -LiteralPath $PublicPath) { throw "Public preflight result already exists for $CandidateId; refusing to overwrite evidence." }
    $Before = @((Get-ChildItem -LiteralPath $ResultsLocal -Directory -ErrorAction SilentlyContinue).Name)
    try {
      $Active | ConvertTo-Json -Depth 30 | Set-Content -Encoding UTF8 -LiteralPath $ActivePath
      $env:KAIZEN_I1_EXECUTION_ACK = 'I1-RUN-1'
      & npm run run:v0.1.1:model -- --config $ActivePath --candidate $CandidateId --stage preflight --execute
      if ($LASTEXITCODE -ne 0) { throw "Runner failed or intake was invalid for $CandidateId. Do not continue or infer a candidate result." }
    } finally {
      Remove-Item Env:KAIZEN_I1_EXECUTION_ACK -ErrorAction SilentlyContinue
      Remove-Item -Force -LiteralPath $ActivePath -ErrorAction SilentlyContinue
    }
    $NewRuns = @(Get-ChildItem -LiteralPath $ResultsLocal -Directory | Where-Object { $Before -notcontains $_.Name -and $_.Name.StartsWith("$CandidateId-preflight-") })
    if ($NewRuns.Count -ne 1) { throw "Expected one retained preflight run for $CandidateId; found $($NewRuns.Count)." }
    $RunDir = $NewRuns[0].FullName
    $ScorePath = Join-Path $RunDir 'preflight-score.local.json'
    & npm run score:v0.1.1:model -- --attempts (Join-Path $RunDir 'attempts.local.jsonl') --run (Join-Path $RunDir 'run.local.json') --output $ScorePath
    if ($LASTEXITCODE -ne 0) { throw "Scoring was invalid for $CandidateId." }
    & npm run sanitize:v0.1.1:model -- --score $ScorePath --run (Join-Path $RunDir 'run.local.json') --lifecycle (Join-Path $RunDir 'lifecycle.local.json') --output $PublicPath
    if ($LASTEXITCODE -ne 0) { throw "Sanitization failed for $CandidateId." }
    $Public = Get-Content -Raw -LiteralPath $PublicPath | ConvertFrom-Json
    $Decisions += [pscustomobject]@{ candidateId = $CandidateId; outcome = $Public.outcome; publicResult = $PublicPath }
  }
  Write-Host ''
  Write-Host 'I1-PREFLIGHT complete. Safe public outcomes:'
  $Decisions | Format-Table -AutoSize candidateId, outcome
  Write-Host 'Do not run the full corpus or operations stage. Commit only reviewed sanitized aggregates and synchronized documentation.'
} finally {
  Remove-Item Env:KAIZEN_I1_EXECUTION_ACK -ErrorAction SilentlyContinue
  Pop-Location
}
