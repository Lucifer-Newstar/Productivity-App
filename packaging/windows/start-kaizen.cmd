REM Starts Kaizen in its native desktop window; the desktop process owns all loopback services.
@echo off
setlocal
cd /d "%~dp0"
start "" "desktop\electron.exe" "desktop\main.cjs"
