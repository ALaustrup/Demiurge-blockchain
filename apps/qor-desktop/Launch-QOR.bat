@echo off
REM QOR Desktop Quick Launcher (Batch Version)
REM Double-click this file to launch QOR Desktop

title QOR Desktop Launcher

echo.
echo ============================================
echo     QOR DESKTOP LAUNCHER
echo ============================================
echo.

REM Check if executable exists
if not exist "build\QOR.exe" (
    echo [ERROR] QOR.exe not found!
    echo.
    echo Please build the project first.
    echo.
    pause
    exit /b 1
)

echo [OK] Executable found: build\QOR.exe
echo.
echo Launching QOR Desktop...
echo.
echo Keyboard shortcuts:
echo   Ctrl+T         - Terminal
echo   Ctrl+W         - Wallet
echo   Ctrl+S         - Settings
echo   Ctrl+E         - Explorer
echo   Ctrl+Shift+S   - System Monitor
echo   Ctrl+Q         - Quit
echo.

REM Launch in background
start "" "build\QOR.exe"

echo [OK] QOR Desktop launched!
echo.
echo The window should appear shortly...
echo Check your taskbar if you don't see it.
echo.
echo This window will close in 3 seconds...
timeout /t 3 >nul
