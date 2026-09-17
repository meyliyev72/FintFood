@echo off
REM Stops the FintFood dev API server (and its sibling tasks).
schtasks /End /TN "FintFoodAPI" 2>nul
schtasks /Delete /TN "FintFoodAPI" /F 2>nul