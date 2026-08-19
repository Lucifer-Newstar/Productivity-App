# Builds the portable package, then compiles the per-user Inno Setup installer.
[CmdletBinding()]
param([string]$Version = "1.0.0", [string]$Iscc = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe", [switch]$SkipPortableBuild)
$ErrorActionPreference = "Stop"
if (-not $SkipPortableBuild) { & (Join-Path $PSScriptRoot "build-portable.ps1") -Version $Version; if ($LASTEXITCODE -ne 0) { throw "Portable build failed" } }
if (-not (Test-Path $Iscc)) { throw "Inno Setup 6 compiler not found at $Iscc" }
& $Iscc "/DMyAppVersion=$Version" (Join-Path $PSScriptRoot "installer.iss")
if ($LASTEXITCODE -ne 0) { throw "Installer compilation failed" }
$setup = Join-Path $PSScriptRoot "../../release-artifacts/Kaizen-$Version-win-x64-setup.exe"
$hash = (Get-FileHash $setup -Algorithm SHA256).Hash.ToLowerInvariant(); Set-Content "$setup.sha256" "$hash  $(Split-Path $setup -Leaf)"
Write-Host "Installer: $setup"
