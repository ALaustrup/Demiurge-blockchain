@echo off
REM COMPLETE CLEAN REBUILD - Fixes wrong executable issue

title QOR - Complete Clean Rebuild

echo.
echo ========================================
echo     QOR COMPLETE CLEAN REBUILD
echo ========================================
echo.
echo This will:
echo   1. Delete old build folder
echo   2. Reconfigure CMake from scratch
echo   3. Build fresh executable
echo.
echo IMPORTANT: Close Cursor before continuing!
echo.
pause

cd /d "%~dp0"

echo.
echo [1/4] Deleting old build folder...
if exist "build" (
    rmdir /s /q "build"
    echo     [OK] Old build deleted
) else (
    echo     [SKIP] No build folder found
)

echo.
echo [2/4] Creating fresh build folder...
mkdir build
cd build

echo.
echo [3/4] Configuring CMake...
cmake .. -G "Ninja"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] CMake configuration failed!
    pause
    exit /b 1
)

echo.
echo [4/4] Building QOR Desktop...
cmake --build . --config Release

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo     BUILD COMPLETE!
echo ========================================
echo.

if exist "QOR.exe" (
    echo [SUCCESS] QOR.exe created
    for %%F in (QOR.exe) do echo Size: %%~zF bytes
    echo.
    echo To launch QOR:
    echo   1. cd ..
    echo   2. Double-click: Launch-QOR.bat
) else (
    echo [ERROR] QOR.exe not found!
)

echo.
pause
