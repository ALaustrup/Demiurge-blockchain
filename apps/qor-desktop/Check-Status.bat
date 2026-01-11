@echo off
REM Diagnostic script to check QOR build status

echo.
echo ========================================
echo     QOR DESKTOP - DIAGNOSTICS
echo ========================================
echo.

cd /d "%~dp0"

echo [1] Checking current location...
echo    Location: %CD%
echo.

echo [2] Checking if build folder exists...
if exist "build" (
    echo    [OK] Build folder found
    echo.
    
    echo [3] Checking if QOR.exe exists...
    if exist "build\QOR.exe" (
        echo    [OK] QOR.exe found!
        for %%F in (build\QOR.exe) do (
            echo    Size: %%~zF bytes
            echo    Date: %%~tF
        )
        echo.
        echo    You can try launching it with: Launch-QOR.bat
    ) else (
        echo    [MISSING] QOR.exe not found
        echo    You need to build the project first
    )
    echo.
    
    echo [4] Checking build configuration...
    if exist "build\CMakeCache.txt" (
        echo    [OK] CMake configured
        findstr /C:"CMAKE_BUILD_TYPE" build\CMakeCache.txt 2>nul
        findstr /C:"CMAKE_GENERATOR" build\CMakeCache.txt 2>nul
    ) else (
        echo    [MISSING] CMake not configured
    )
) else (
    echo    [MISSING] Build folder not found
    echo    You need to run CMake configuration first
    echo.
    echo    Try this:
    echo      mkdir build
    echo      cd build  
    echo      cmake .. -G "Ninja"
)

echo.
echo [5] Checking for Qt installation...
where cmake >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo    [OK] CMake found
    cmake --version | findstr /C:"version"
) else (
    echo    [MISSING] CMake not found in PATH
)

echo.
echo [6] Checking for build tools...
where ninja >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo    [OK] Ninja found
) else (
    echo    [MISSING] Ninja not found
    
    where mingw32-make >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo    [OK] MinGW Make found (can use as alternative)
    ) else (
        echo    [MISSING] No build tool found
    )
)

echo.
echo ========================================
echo     DIAGNOSTIC COMPLETE
echo ========================================
echo.
pause
