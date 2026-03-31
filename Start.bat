@echo off
setlocal

cd /d "%~dp0"

echo [LyricLytic] Starting development app...

where npm >nul 2>nul
if errorlevel 1 (
  echo [LyricLytic] npm was not found in PATH.
  echo Please install Node.js and try again.
  exit /b 1
)

if not exist "package.json" (
  echo [LyricLytic] package.json was not found.
  echo Make sure Start.bat is placed in the LyricLytic project root.
  exit /b 1
)

call npm run tauri:dev
set EXIT_CODE=%ERRORLEVEL%

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [LyricLytic] Start failed with exit code %EXIT_CODE%.
  exit /b %EXIT_CODE%
)

endlocal
