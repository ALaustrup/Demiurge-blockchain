@echo off
REM Run QOR and capture error output

title QOR Desktop - With Error Messages

echo.
echo ========================================
echo     QOR DESKTOP - DEBUG MODE
echo ========================================
echo.
echo This will run QOR and show error messages.
echo The window will stay open after crash.
echo.
pause

cd /d "%~dp0build"

echo.
echo Starting QOR.exe...
echo.
echo ----------------------------------------
echo     APPLICATION OUTPUT:
echo ----------------------------------------
echo.

REM Run QOR.exe with output redirection
QOR.exe 2>&1

echo.
echo ----------------------------------------
echo     APPLICATION CLOSED
echo ----------------------------------------
echo Exit Code: %ERRORLEVEL%
echo.

if %ERRORLEVEL% neq 0 (
    echo.
    echo The application crashed or exited with an error.
    echo.
    echo LIKELY CAUSE: QML import errors
    echo.
    echo SOLUTION: You need to rebuild with the fixed imports!
    echo.
    echo 1. Close Cursor
    echo 2. Open PowerShell
    echo 3. cd C:\Repos\DEMIURGE\apps\qor-desktop\build
    echo 4. cmake --build . --config Release
    echo.
)

echo.
echo This window will stay open.
echo Check for error messages above.
echo.
pause
