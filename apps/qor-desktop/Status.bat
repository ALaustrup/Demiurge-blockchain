@echo off
REM QOR Status Check - Stays Open

title QOR Desktop Status Check

echo.
echo ========================================
echo     QOR DESKTOP - STATUS CHECK
echo ========================================
echo.

cd /d "%~dp0"

echo Current folder: %CD%
echo.

echo Checking for QOR.exe...
if exist "build\QOR.exe" (
    echo [FOUND] build\QOR.exe exists!
    echo.
    echo You can launch it by double-clicking: Launch-QOR.bat
    echo.
) else (
    echo [NOT FOUND] build\QOR.exe does NOT exist
    echo You need to rebuild the project
    echo.
)

echo.
echo Checking for build folder...
if exist "build" (
    echo [FOUND] build folder exists
) else (
    echo [NOT FOUND] build folder does NOT exist
    echo You need to configure CMake first
)

echo.
echo ========================================
echo.
echo This window will stay open.
echo You can close it anytime.
echo.
echo To try launching QOR, double-click:
echo    Launch-QOR.bat
echo.
cmd /k
