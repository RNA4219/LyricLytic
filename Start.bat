@echo off
setlocal

cd /d "%~dp0"
title LyricLytic Dev Launcher
set "DEV_PORT=1420"
set "APP_EXE=%CD%\src-tauri\target\debug\lyriclytic.exe"

echo [LyricLytic] Starting development app...

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [LyricLytic] npm.cmd was not found in PATH.
  echo Please install Node.js and try again.
  echo.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo [LyricLytic] package.json was not found.
  echo Make sure Start.bat is placed in the LyricLytic project root.
  echo.
  pause
  exit /b 1
)

echo [LyricLytic] Working directory: %CD%
netstat -ano | findstr /R /C:":%DEV_PORT% .*LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo [LyricLytic] Detected an existing dev server on port %DEV_PORT%.
  if exist "%APP_EXE%" (
    tasklist /FI "IMAGENAME eq lyriclytic.exe" | find /I "lyriclytic.exe" >nul 2>nul
    if not errorlevel 1 (
      echo [LyricLytic] LyricLytic is already running.
      set EXIT_CODE=0
      goto :after_run
    )
    echo [LyricLytic] Reusing the running dev server and launching the desktop app only.
    start "" "%APP_EXE%"
    set EXIT_CODE=0
    goto :after_run
  ) else (
    echo [LyricLytic] Desktop executable was not found:
    echo   %APP_EXE%
    echo [LyricLytic] Run "npm run tauri:dev" once to build the desktop binary.
    echo.
    pause
    exit /b 1
  )
)

echo [LyricLytic] Launch command: npm run tauri:dev
echo.

call npm.cmd run tauri:dev
set EXIT_CODE=%ERRORLEVEL%

:after_run

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [LyricLytic] Start failed with exit code %EXIT_CODE%.
  echo [LyricLytic] Check the error above, then press any key to close this window.
  pause >nul
  exit /b %EXIT_CODE%
)

endlocal
