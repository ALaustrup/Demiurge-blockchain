# Fixing "Components Built with Another Version" Error

## Problem
UE5 reports that components were built with a different engine version, preventing compilation or loading.

## Root Causes
1. **Engine Version Mismatch**: Project targets `5.7` but UE5 `5.7.1` is installed
2. **Stale Build Artifacts**: Old binaries/intermediate files from previous builds
3. **Module Version Conflicts**: C++ modules compiled with different compiler/engine

---

## Solution: Clean Build

### Step 1: Clean All Build Artifacts

**Option A: Use PowerShell Script (Recommended)**
```powershell
cd x:\Demiurge-Blockchain\client\DemiurgeClient
.\CLEAN_BUILD.ps1
```

**Option B: Manual Clean**
```powershell
cd x:\Demiurge-Blockchain\client\DemiurgeClient

# Remove build directories
Remove-Item -Recurse -Force Binaries -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force Intermediate -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force Saved -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .vs -ErrorAction SilentlyContinue

# Remove project files
Remove-Item -Force *.sln -ErrorAction SilentlyContinue
Remove-Item -Force *.suo -ErrorAction SilentlyContinue
Remove-Item -Force *.user -ErrorAction SilentlyContinue
```

### Step 2: Verify Engine Association

The `.uproject` file should match your installed engine version:

```json
"EngineAssociation": "5.7.1"
```

✅ **Already fixed** - The project now targets `5.7.1`

### Step 3: Regenerate Project Files

**In Unreal Editor:**
1. Right-click `DemiurgeClient.uproject`
2. Select **"Generate Visual Studio project files"**
3. Wait for generation to complete

**OR via Command Line:**
```powershell
# Find your UE5 installation (usually in Epic Games Launcher folder)
$UE5Path = "C:\Program Files\Epic Games\UE_5.7\Engine\Build\BatchFiles\Build.bat"

# Generate project files
& "$UE5Path" -projectfiles -project="$PWD\DemiurgeClient.uproject" -game -rocket -progress
```

### Step 4: Rebuild All Modules

**Option A: In Unreal Editor (Recommended)**
1. Open `DemiurgeClient.uproject` in Unreal Editor
2. If prompted, click **"Yes"** to rebuild modules
3. Wait for compilation to complete
4. Check **Output Log** for any errors

**Option B: In Visual Studio**
1. Open `DemiurgeClient.sln` in Visual Studio 2026
2. **Build** → **Rebuild Solution**
3. Wait for all modules to compile
4. Check **Error List** for issues

---

## Verification

After rebuilding, verify modules load correctly:

1. **In Unreal Editor:**
   - **Window** → **Developer Tools** → **Modules**
   - Check that all modules show **"Loaded"** status:
     - ✅ `DemiurgeClient`
     - ✅ `DemiurgeWeb3`
     - ✅ `QorUI`

2. **Check Output Log:**
   - Look for: `LogModuleManager: Module 'DemiurgeClient' is now loaded`
   - No errors about version mismatch

---

## Common Issues

### Error: "Module was built with a different engine version"

**Solution:**
- Ensure you cleaned `Binaries` and `Intermediate` folders
- Regenerate project files
- Rebuild all modules

### Error: "Cannot find module 'WebSockets'"

**Solution:**
- Verify WebSocket plugin is installed (see `WEBSOCKET_PLUGIN_SETUP.md`)
- Check `Plugins/WebSockets/WebSockets.uplugin` exists
- Restart Editor after plugin installation

### Error: "LNK1104: cannot open file"

**Solution:**
- Close Unreal Editor and Visual Studio
- Kill any lingering build processes:
  ```powershell
  Stop-Process -Name "UnrealEditor*" -Force -ErrorAction SilentlyContinue
  Stop-Process -Name "UnrealBuildTool*" -Force -ErrorAction SilentlyContinue
  ```
- Retry build

---

## Prevention

To avoid version mismatch issues:

1. **Always use the same UE version** for the entire project
2. **Clean build artifacts** when switching engine versions
3. **Commit `.uproject`** with correct `EngineAssociation`
4. **Don't commit** `Binaries/`, `Intermediate/`, `Saved/` folders

---

*Last Updated: January 12, 2026*
