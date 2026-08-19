REM Stops the process tree recorded by the Kaizen package launcher.
@echo off
setlocal
cd /d "%~dp0"
"runtime\node\node.exe" "scripts\stop.cjs"
