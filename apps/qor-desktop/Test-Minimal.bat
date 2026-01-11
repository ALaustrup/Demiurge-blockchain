@echo off
REM Test minimal QML file to verify Qt setup

title QOR - Minimal Test

echo.
echo ========================================
echo     TESTING MINIMAL QML
echo ========================================
echo.
echo This will test if Qt can load QML at all.
echo.
pause

cd /d "%~dp0build"

if not exist "QOR.exe" (
    echo [ERROR] QOR.exe not found!
    pause
    exit /b 1
)

echo.
echo Running QOR with minimal test QML...
echo.

REM Try to find qml.exe to test the QML file directly
set QML_TOOL=C:\Qt\6.10.0\mingw_64\bin\qml.exe

if exist "%QML_TOOL%" (
    echo [OK] Found qml tool
    "%QML_TOOL%" ../test-minimal.qml
) else (
    echo [ERROR] qml.exe not found at: %QML_TOOL%
    echo.
    echo Cannot run minimal test without qml.exe
)

echo.
pause
