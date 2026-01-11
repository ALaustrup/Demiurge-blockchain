@echo off
REM QOR Desktop Debug Launcher - Keeps console open to show errors

title QOR Desktop - DEBUG MODE

echo.
echo ============================================
echo     QOR DESKTOP - DEBUG LAUNCHER
echo ============================================
echo.

cd /d "%~dp0build"

if not exist "QOR.exe" (
    echo [ERROR] QOR.exe not found!
    echo.
    pause
    exit /b 1
)

echo [DEBUG] Working directory: %CD%
echo [DEBUG] Launching QOR.exe...
echo.
echo ============================================
echo     APPLICATION OUTPUT:
echo ============================================
echo.

REM Run QOR and keep console open
QOR.exe

echo.
echo ============================================
echo     APPLICATION EXITED
echo ============================================
echo Exit code: %ERRORLEVEL%
echo.
echo Press any key to close this window...
pause >nul
