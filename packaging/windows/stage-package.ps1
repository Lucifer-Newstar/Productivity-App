# Stages the bundled Windows x64 application consumed by the single-file installer build.
[CmdletBinding()]
param([string]$Version = "1.0.0", [switch]$SkipInstall)
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$artifacts = Join-Path $root "release-artifacts"
$stage = Join-Path $artifacts "Kaizen-$Version-win-x64"
$nodeVersion = "20.19.0"
$nodeArchive = "node-v$nodeVersion-win-x64.zip"
$nodeUrl = "https://nodejs.org/dist/v$nodeVersion/$nodeArchive"
$nodeSha256 = "be72284c7bc62de07d5a9fd0ae196879842c085f11f7f2b60bf8864c0c9d6a4f"
function Run([string]$File,[string[]]$Arguments,[string]$Directory){Push-Location $Directory;try{& $File @Arguments;if($LASTEXITCODE -ne 0){throw "$File failed with exit code $LASTEXITCODE"}}finally{Pop-Location}}
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item $stage -ItemType Directory -Force | Out-Null
if(-not $SkipInstall){Run "npm.cmd" @("ci") (Join-Path $root "frontend");Run "npm.cmd" @("ci") (Join-Path $root "ai")}
$env:KAIZEN_LOCAL_PACKAGE="1"
Run "npm.cmd" @("run","build") (Join-Path $root "frontend")
Run "npm.cmd" @("run","build") (Join-Path $root "ai")
$frontend=Join-Path $stage "frontend";New-Item $frontend -ItemType Directory -Force|Out-Null
Copy-Item (Join-Path $root "frontend/.next/standalone/*") $frontend -Recurse -Force
New-Item (Join-Path $frontend ".next") -ItemType Directory -Force|Out-Null
Copy-Item (Join-Path $root "frontend/.next/static") (Join-Path $frontend ".next/static") -Recurse -Force
if(Test-Path (Join-Path $root "frontend/public")){Copy-Item (Join-Path $root "frontend/public") (Join-Path $frontend "public") -Recurse -Force}
$intelligence=Join-Path $stage "intelligence";New-Item $intelligence -ItemType Directory -Force|Out-Null
Copy-Item (Join-Path $root "ai/dist") $intelligence -Recurse -Force
Copy-Item (Join-Path $root "ai/package.json") $intelligence
Copy-Item (Join-Path $root "ai/package-lock.json") $intelligence
Run "npm.cmd" @("ci","--omit=dev","--ignore-scripts") $intelligence
$downloads=Join-Path $artifacts "downloads";New-Item $downloads -ItemType Directory -Force|Out-Null
$archive=Join-Path $downloads $nodeArchive
if(-not(Test-Path $archive)){Invoke-WebRequest -Uri $nodeUrl -OutFile $archive}
if((Get-FileHash $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $nodeSha256){throw "Node runtime checksum mismatch"}
$nodeExtract=Join-Path $artifacts "node-extract";Remove-Item $nodeExtract -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive $archive $nodeExtract -Force
New-Item (Join-Path $stage "runtime") -ItemType Directory -Force|Out-Null
Move-Item (Join-Path $nodeExtract "node-v$nodeVersion-win-x64") (Join-Path $stage "runtime/node")
New-Item (Join-Path $stage "scripts") -ItemType Directory -Force|Out-Null
New-Item (Join-Path $stage "assets") -ItemType Directory -Force|Out-Null
Copy-Item (Join-Path $PSScriptRoot "runtime/*.cjs") (Join-Path $stage "scripts")
Copy-Item (Join-Path $PSScriptRoot "runtime/*.mjs") (Join-Path $stage "scripts")
Copy-Item (Join-Path $PSScriptRoot "assets/kaizen.ico") (Join-Path $stage "assets")
Copy-Item (Join-Path $PSScriptRoot "start-kaizen.cmd") $stage
Copy-Item (Join-Path $PSScriptRoot "stop-kaizen.cmd") $stage
Copy-Item (Join-Path $PSScriptRoot "verify-kaizen.cmd") $stage
Set-Content (Join-Path $stage "VERSION") $Version -NoNewline
Set-Content (Join-Path $stage "README.txt") "Launch Kaizen from its desktop or Start Menu shortcut. Keep the console open while using Kaizen. Product data remains in the browser profile and is not removed by uninstall."
Write-Host "Staged package: $stage"
