@echo off
REM Add your background video to QOR Desktop

title QOR - Add Background Video

echo.
echo ========================================
echo     ADD BACKGROUND VIDEO TO QOR
echo ========================================
echo.
echo This script will help you add your background video.
echo.
echo STEP 1: Place your video file
echo   Location: %~dp0
echo   Filename: default.mp4
echo.
echo STEP 2: Run this script
echo.
pause

set VIDEO_PATH=%~dp0default.mp4

if exist "%VIDEO_PATH%" (
    echo.
    echo [OK] Found video: default.mp4
    echo.
    
    REM Get file size
    for %%A in ("%VIDEO_PATH%") do set VIDEO_SIZE=%%~zA
    set /a VIDEO_MB=%VIDEO_SIZE% / 1048576
    
    echo Video size: %VIDEO_MB% MB
    echo.
    echo Video is ready! Now rebuild QOR:
    echo.
    echo   cd C:\Repos\DEMIURGE\apps\qor-desktop\build
    echo   cmake --build . --config Release
    echo.
    echo Or use: Simple-Rebuild.bat
    echo.
) else (
    echo.
    echo [ERROR] Video not found!
    echo.
    echo Please copy your .mp4 file to:
    echo   %~dp0
    echo.
    echo And name it: default.mp4
    echo.
    echo Then run this script again.
    echo.
)

pause
