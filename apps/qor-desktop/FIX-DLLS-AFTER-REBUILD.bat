@echo off
REM Copy Qt DLLs after clean rebuild

title Fix Qt DLLs - Post Clean Rebuild

echo.
echo ========================================
echo     COPYING Qt DLLs TO BUILD FOLDER
echo ========================================
echo.
echo After a clean rebuild, the Qt DLLs are missing.
echo This will copy them using windeployqt.
echo.
pause

cd /d "%~dp0build"

if not exist "QOR.exe" (
    echo [ERROR] QOR.exe not found!
    echo Please run CLEAN-REBUILD.bat first
    pause
    exit /b 1
)

echo.
echo Running windeployqt...
echo.

REM Try to find windeployqt
set WINDEPLOYQT=C:\Qt\6.10.0\mingw_64\bin\windeployqt.exe

if exist "%WINDEPLOYQT%" (
    echo [OK] Found windeployqt at: %WINDEPLOYQT%
    echo.
    "%WINDEPLOYQT%" --qmldir ../src/qml QOR.exe
    
    if %ERRORLEVEL% equ 0 (
        echo.
        echo ========================================
        echo     DLLs COPIED SUCCESSFULLY!
        echo ========================================
        echo.
        echo QOR.exe is now ready to run!
        echo.
        echo Launch it with: Launch-QOR.bat
        echo.
    ) else (
        echo.
        echo [ERROR] windeployqt failed!
        echo.
    )
) else (
    echo [ERROR] windeployqt not found at: %WINDEPLOYQT%
    echo.
    echo Please update the path in this script or run manually:
    echo   cd build
    echo   C:\Qt\YOUR_VERSION\mingw_64\bin\windeployqt --qmldir ../src/qml QOR.exe
    echo.
)

pause
