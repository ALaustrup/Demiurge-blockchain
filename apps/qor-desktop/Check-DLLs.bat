@echo off
REM Check for missing Qt DLLs

title QOR Dependency Checker

echo.
echo ========================================
echo     CHECKING QOR DEPENDENCIES
echo ========================================
echo.

cd /d "%~dp0build"

if not exist "QOR.exe" (
    echo [ERROR] QOR.exe not found!
    pause
    exit /b 1
)

echo [OK] QOR.exe found
echo.
echo Checking for required Qt DLLs...
echo.

set missing=0

REM Check for essential Qt DLLs
if exist "Qt6Core.dll" (
    echo [OK] Qt6Core.dll
) else (
    echo [MISSING] Qt6Core.dll
    set missing=1
)

if exist "Qt6Gui.dll" (
    echo [OK] Qt6Gui.dll
) else (
    echo [MISSING] Qt6Gui.dll
    set missing=1
)

if exist "Qt6Quick.dll" (
    echo [OK] Qt6Quick.dll
) else (
    echo [MISSING] Qt6Quick.dll
    set missing=1
)

if exist "Qt6Qml.dll" (
    echo [OK] Qt6Qml.dll
) else (
    echo [MISSING] Qt6Qml.dll
    set missing=1
)

echo.
if %missing%==1 (
    echo ========================================
    echo     PROBLEM FOUND: Missing Qt DLLs!
    echo ========================================
    echo.
    echo QOR.exe needs Qt DLL files to run.
    echo They are NOT in the build folder.
    echo.
    echo SOLUTION: Run windeployqt to copy them.
    echo.
    echo See: FIX-MISSING-DLLS.bat
    echo.
) else (
    echo ========================================
    echo     All Qt DLLs found!
    echo ========================================
    echo.
    echo The crash might be due to:
    echo  - Graphics driver issue
    echo  - QML import errors
    echo  - Missing system libraries
    echo.
)

pause
