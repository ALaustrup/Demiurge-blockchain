@echo off
REM Video Background Diagnostic and Rebuild Script

title QOR - Fix Video Background

echo.
echo ========================================
echo   QOR VIDEO BACKGROUND FIX
echo ========================================
echo.

cd /d "%~dp0"

REM Check if video exists
if not exist "assets\wallpapers\default.mp4" (
    echo [ERROR] Video file not found!
    echo Expected: assets\wallpapers\default.mp4
    echo.
    pause
    exit /b 1
)

echo [OK] Video file found
for %%A in ("assets\wallpapers\default.mp4") do (
    echo    Size: %%~zA bytes
    echo    Modified: %%~tA
)
echo.

REM Check if QOR.exe exists
if not exist "build\QOR.exe" (
    echo [ERROR] QOR.exe not found! Need to build first.
    echo.
    pause
    exit /b 1
)

echo [OK] QOR.exe found
for %%A in ("build\QOR.exe") do (
    echo    Modified: %%~tA
)
echo.

echo ========================================
echo   REBUILDING WITH VIDEO RESOURCE
echo ========================================
echo.
echo This will:
echo  1. Clean build cache
echo  2. Recompile resources (includes video)
echo  3. Link new QOR.exe
echo  4. Deploy Qt DLLs
echo.
pause

echo.
echo Step 1: Cleaning CMake cache...
cd build
if exist CMakeCache.txt del /Q CMakeCache.txt
if exist CMakeFiles rmdir /S /Q CMakeFiles
if exist qml.qrc.depends del /Q qml.qrc.depends

echo.
echo Step 2: Reconfiguring CMake...
cmake ..
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] CMake configuration failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Building with video resource...
echo (This may take a few minutes to compile the video into resources)
cmake --build . --config Release --parallel 2

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo Step 4: Deploying Qt DLLs...
where windeployqt >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    windeployqt QOR.exe --qmldir ..\src\qml
    echo [OK] Qt DLLs deployed
) else (
    echo [WARNING] windeployqt not found, you may need to run FIX-DLLS-AFTER-REBUILD.bat
)

cd ..

echo.
echo ========================================
echo   BUILD COMPLETE!
echo ========================================
echo.
echo The video should now be embedded in QOR.exe
echo.
echo Next: Launch QOR with debug output
echo   Run: Run-With-Errors.bat
echo.
echo Look for these messages:
echo   🎬 Loading video background: qrc:/assets/wallpapers/default.mp4
echo   📺 Video playback state: Playing
echo.
pause
