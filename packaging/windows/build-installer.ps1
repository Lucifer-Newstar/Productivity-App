# Builds one signed-ready per-user installer executable containing the complete local Kaizen runtime.
[CmdletBinding()]
param([string]$Version="1.0.0",[string]$Iscc="${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",[switch]$SkipStage,[switch]$SkipInstall,[switch]$SkipBuild)
$ErrorActionPreference="Stop"
if(-not $SkipStage){& (Join-Path $PSScriptRoot "stage-package.ps1") -Version $Version -SkipInstall:$SkipInstall -SkipBuild:$SkipBuild;if($LASTEXITCODE -ne 0){throw "Package staging failed"}}
if(-not(Test-Path $Iscc)){throw "Inno Setup 6 compiler not found at $Iscc"}
& $Iscc "/DMyAppVersion=$Version" (Join-Path $PSScriptRoot "installer.iss")
if($LASTEXITCODE -ne 0){throw "Installer compilation failed"}
$setup=Join-Path $PSScriptRoot "../../release-artifacts/Kaizen-$Version-win-x64-setup.exe"
$hash=(Get-FileHash $setup -Algorithm SHA256).Hash.ToLowerInvariant();Set-Content "$setup.sha256" "$hash  $(Split-Path $setup -Leaf)"
Write-Host "Single-file installer: $setup"
Write-Host "Windows registers the bundled uninstaller in Settings > Apps and the Start Menu."
