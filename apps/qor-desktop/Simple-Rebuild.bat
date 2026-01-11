@echo off
REM Simple rebuild script for QOR Desktop
REM Run this from a separate PowerShell/CMD window (NOT in Cursor!)

echo.
echo ============================================
echo     QOR DESKTOP - SIMPLE REBUILD
echo ============================================
echo.
echo IMPORTANT: Make sure Cursor is closed!
echo.
pause

cd /d "%~dp0"

REM Check if build directory exists
if not exist "build" (
    echo [ERROR] Build directory not found!
    echo.
    echo Please run CMake configuration first:
    echo   mkdir build
    echo   cd build
    echo   cmake .. -G "Ninja"
    echo.
    pause
    exit /b 1
)

echo [1/3] Navigating to build directory...
cd build

echo.
echo [2/3] Building QOR Desktop (this may take 30-60 seconds)...
echo.

cmake --build . --config Release -j 1

if %ERRORLEVEL% neq 0 (
    echo.
    echo ============================================
    echo     BUILD FAILED!
    echo ============================================
    echo.
    echo Check the error messages above.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo     BUILD SUCCESSFUL!
echo ============================================
echo.

if exist "QOR.exe" (
    echo Executable created: QOR.exe
    for %%F in (QOR.exe) do echo Size: %%~zF bytes
) else (
    echo [WARNING] QOR.exe not found!
)

echo.
echo To launch QOR Desktop:
echo   1. Go back to parent folder: cd ..
echo   2. Run: Launch-QOR.bat
echo.
pause
