# Fixing "Failed to Launch Editor" Error

## Common Causes

1. **Missing or corrupted binaries**
2. **Engine association mismatch**
3. **Missing Visual Studio components**
4. **Corrupted intermediate files**
5. **Missing plugins**
6. **Permission issues**
7. **Conflicting processes**

---

## Quick Fix: Run Diagnostic Script

```powershell
cd x:\Demiurge-Blockchain\client\DemiurgeClient
.\DIAGNOSE_EDITOR_FAILURE.ps1
```

This will identify the specific issue causing the launch failure.

---

## Solution 1: Clean Build (Most Common Fix)

### Step 1: Clean All Build Artifacts

```powershell
cd x:\Demiurge-Blockchain\client\DemiurgeClient
.\CLEAN_BUILD.ps1
```

**OR manually:**
```powershell
Remove-Item -Recurse -Force Binaries -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force Intermediate -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force Saved -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .vs -ErrorAction SilentlyContinue
Remove-Item -Force *.sln -ErrorAction SilentlyContinue
```

### Step 2: Kill Any Running Processes

```powershell
Stop-Process -Name "UnrealEditor*" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "UnrealBuildTool*" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "UE5Editor*" -Force -ErrorAction SilentlyContinue
```

### Step 3: Launch from Epic Games Launcher

1. **Open Epic Games Launcher**
2. **Unreal Engine** → **Library**
3. **Launch** UE 5.7.1
4. **Browse** to `x:\Demiurge-Blockchain\client\DemiurgeClient\`
5. **Open** `DemiurgeClient.uproject`

---

## Solution 2: Verify Engine Association

### Check Project File

The `.uproject` file should have a valid engine association:

```json
"EngineAssociation": "{BEAE441A-4B27-F9F7-E02E-179D2D0B9575}"
```

**If missing or incorrect:**

1. Right-click `DemiurgeClient.uproject`
2. **Open With** → **Unreal Engine Version Selector**
3. Select **UE 5.7.1**
4. This will update the EngineAssociation

---

## Solution 3: Generate Project Files First

If the editor won't launch, generate project files first:

```powershell
cd x:\Demiurge-Blockchain\client\DemiurgeClient
.\GENERATE_PROJECT_FILES.ps1
```

Then try launching again.

---

## Solution 4: Check Visual Studio Installation

### Required Components

- ✅ **Desktop development with C++**
- ✅ **Windows 10/11 SDK**
- ✅ **.NET Framework 4.8**

### Verify Installation

1. Open **Visual Studio Installer**
2. Click **Modify** on Visual Studio 2026
3. Ensure **Desktop development with C++** is checked
4. Click **Modify** to install missing components

---

## Solution 5: Missing WebSocket Plugin

If the error mentions WebSocket plugin:

1. **Install Plugin** (see `WEBSOCKET_PLUGIN_SETUP.md`):
   - Option 1: Epic Games Marketplace
   - Option 2: GitHub (extract to `Plugins/WebSockets/`)

2. **Verify Installation:**
   - Check `Plugins/WebSockets/WebSockets.uplugin` exists
   - Restart Epic Games Launcher
   - Try launching again

---

## Solution 6: Launch from Command Line

If Launcher fails, try direct launch:

```powershell
# Find your UE5 installation
$UE5Editor = "C:\Program Files\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe"

# Launch with project
& $UE5Editor "x:\Demiurge-Blockchain\client\DemiurgeClient\DemiurgeClient.uproject"
```

**Check Output:**
- Look for specific error messages
- Note any missing DLLs or modules

---

## Solution 7: Check Windows Event Viewer

If the editor crashes immediately:

1. **Open Event Viewer** (Windows + R → `eventvwr`)
2. **Windows Logs** → **Application**
3. Look for **UnrealEditor** errors
4. Check error details for missing DLLs or permissions

---

## Solution 8: Verify File Permissions

### Check Project Directory

```powershell
cd x:\Demiurge-Blockchain\client\DemiurgeClient

# Test write permission
"test" | Out-File "test_write.tmp"
Remove-Item "test_write.tmp" -ErrorAction SilentlyContinue
```

**If permission denied:**
- Right-click project folder → **Properties** → **Security**
- Ensure your user has **Full Control**
- Apply to all subfolders

---

## Solution 9: Check Antivirus/Firewall

Some antivirus software blocks UE5:

1. **Add Exception** for:
   - `C:\Program Files\Epic Games\UE_5.7\`
   - `x:\Demiurge-Blockchain\client\DemiurgeClient\`

2. **Temporarily disable** antivirus to test

---

## Solution 10: Reinstall UE5 (Last Resort)

If nothing works:

1. **Uninstall** UE5.7.1 from Epic Games Launcher
2. **Delete** leftover folders:
   ```
   C:\Program Files\Epic Games\UE_5.7\
   ```
3. **Reinstall** UE5.7.1 from Launcher
4. **Open project** again

---

## Error-Specific Solutions

### "Module was built with a different engine version"

**Fix:** Run `CLEAN_BUILD.ps1` and regenerate project files

### "Cannot find module 'WebSockets'"

**Fix:** Install WebSocket plugin (see `WEBSOCKET_PLUGIN_SETUP.md`)

### "Failed to load module 'DemiurgeClient'"

**Fix:** 
1. Generate project files
2. Compile C++ modules in Visual Studio
3. Then launch editor

### "Access Denied" or Permission Errors

**Fix:** Check file permissions (Solution 8)

### Editor Crashes Immediately

**Fix:** 
1. Check Event Viewer for errors
2. Clean build artifacts
3. Verify Visual Studio installation

---

## Prevention

To avoid launch failures:

1. ✅ **Always clean build** when switching engine versions
2. ✅ **Don't manually edit** `.uproject` file
3. ✅ **Keep Visual Studio** components up to date
4. ✅ **Install plugins** before launching
5. ✅ **Close all UE5 processes** before launching

---

## Still Not Working?

1. **Run diagnostic:** `.\DIAGNOSE_EDITOR_FAILURE.ps1`
2. **Check Epic Games Launcher logs:**
   ```
   %LOCALAPPDATA%\EpicGamesLauncher\Saved\Logs\
   ```
3. **Check UE5 logs:**
   ```
   %LOCALAPPDATA%\UnrealEngine\Common\Logs\
   ```

---

*Last Updated: January 12, 2026*
