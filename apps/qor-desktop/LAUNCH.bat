@echo off
echo ========================================
echo   Launching QOR Desktop
echo ========================================
echo.

cd /d "%~dp0build"

if not exist QOR.exe (
    echo ERROR: QOR.exe not found in build directory!
    echo.
    echo Please build the application first:
    echo   cmake --build build --config Release
    echo.
    pause
    exit /b 1
)

echo Starting QOR.exe...
echo.

start "" QOR.exe

echo QOR Desktop launched!
echo.
echo ========================================
