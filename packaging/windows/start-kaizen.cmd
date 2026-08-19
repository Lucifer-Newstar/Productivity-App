REM Starts the bundled Kaizen loopback services through the pinned Node runtime.
@echo off
setlocal
cd /d "%~dp0"
"runtime\node\node.exe" "scripts\launcher.cjs"
if errorlevel 1 pause
