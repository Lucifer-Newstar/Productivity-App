REM Runs the privacy-safe packaged route, CSP, security, pairing, and shutdown verification.
@echo off
setlocal
cd /d "%~dp0"
"runtime\node\node.exe" "scripts\verify-package.mjs" --report "package-verification.json"
if errorlevel 1 pause
