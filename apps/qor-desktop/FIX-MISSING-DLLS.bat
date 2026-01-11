@echo off
REM Fix missing DLLs by running windeployqt

title Fix Missing Qt DLLs

echo.
echo ========================================
echo     FIX MISSING Qt DLLs
echo ========================================
echo.
echo This will copy all required Qt DLLs
echo to the build folder using windeployqt.
echo.
pause

cd /d "%~dp0build"

if not exist "QOR.exe" (
    echo [ERROR] QOR.exe not found!
    pause
    exit /b 1
)

echo.
echo Running windeployqt...
echo.

REM Try to find windeployqt in PATH
where windeployqt >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] windeployqt found in PATH
    windeployqt --qmldir ../src/qml QOR.exe
    goto :done
)

REM Try common Qt installation path
set QT_PATH=C:\Qt\6.10.0\mingw_64\bin\windeployqt.exe
if exist "%QT_PATH%" (
    echo [OK] Found at: %QT_PATH%
    "%QT_PATH%" --qmldir ../src/qml QOR.exe
    goto :done
)

REM Not found
echo.
echo ========================================
echo     ERROR: windeployqt not found!
echo ========================================
echo.
echo Please add Qt bin folder to PATH:
echo   C:\Qt\6.10.0\mingw_64\bin
echo.
echo Or run this manually:
echo   cd build
echo   C:\Qt\6.10.0\mingw_64\bin\windeployqt --qmldir ../src/qml QOR.exe
echo.
pause
exit /b 1

:done
echo.
echo ========================================
echo     DLLs COPIED SUCCESSFULLY!
echo ========================================
echo.
echo Now try launching QOR with:
echo   Launch-QOR.bat
echo.
pause
