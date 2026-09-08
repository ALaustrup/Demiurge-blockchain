# Building Demiurge Client in Visual Studio 2026

## Current Status
✅ Visual Studio solution opened  
✅ Ready to build C++ modules

---

## Step 1: Set Build Configuration

**Important:** Use **Development Editor** configuration for UE5 projects.

### EASIEST METHOD:

1. **Right-click** on **Solution 'DemiurgeClient'** (top item in Solution Explorer)
2. **Properties**
3. **Configuration Properties** → **Configuration** dropdown
4. **Select:** `Development Editor`
5. **Platform:** `Win64`
6. Click **OK**

### ALTERNATIVE: Configuration Manager

1. **Build** → **Configuration Manager**
2. **Active solution configuration:** Select `Development Editor`
3. **Active solution platform:** Select `Win64`
4. Click **Close**

**Why Development Editor?**
- Includes editor-specific code
- Enables hot-reload
- Optimized for development

**Note:** If you can't find the dropdown, just build anyway - VS will use default config.

---

## Step 2: Build Solution

### Option A: Build All Modules (Recommended)

1. **Build** → **Build Solution** (or press `Ctrl+Shift+B`)
2. **Wait** for compilation (may take 5-15 minutes first time)
3. **Watch Output** window for progress

### Option B: Build Individual Modules

If you want to build modules one at a time:

1. **Solution Explorer** → Right-click module (e.g., `DemiurgeClient`)
2. **Build** → **Build [ModuleName]**

**Build Order:**
1. `DemiurgeWeb3` (no dependencies)
2. `QorUI` (depends on DemiurgeWeb3)
3. `DemiurgeClient` (depends on both)

---

## Step 3: Monitor Build Output

### Check Output Window

1. **View** → **Output** (or `Ctrl+Alt+O`)
2. **Show output from:** `Build`
3. **Look for:**
   - ✅ `========== Build: 3 succeeded, 0 failed ==========`
   - ❌ Any red error messages

### Check Error List

1. **View** → **Error List** (or `Ctrl+\`, `E`)
2. **Filter:** Errors, Warnings, Messages
3. **Review** any issues

---

## Expected Build Output

### Successful Build

```
========== Build: 3 succeeded, 0 failed, 0 up-to-date, 0 skipped ==========
```

**Modules compiled:**
- ✅ `DemiurgeWeb3`
- ✅ `QorUI`
- ✅ `DemiurgeClient`

### Build Time

- **First build:** 5-15 minutes (compiles everything)
- **Subsequent builds:** 1-3 minutes (incremental)

---

## Common Build Issues

### Error: "Cannot open include file"

**Cause:** Missing module dependency

**Fix:**
1. Check `*.Build.cs` files for missing dependencies
2. Verify all modules are in solution
3. Rebuild solution

### Error: "LNK1104: cannot open file"

**Cause:** File locked by another process

**Fix:**
1. Close Unreal Editor if running
2. Close all Visual Studio instances
3. Kill `UnrealBuildTool.exe` processes
4. Rebuild

### Error: "Module 'WebSockets' not found"

**Cause:** WebSocket plugin not installed

**Fix:**
1. Install WebSocket plugin (see `WEBSOCKET_PLUGIN_SETUP.md`)
2. Regenerate project files
3. Rebuild

### Warning: "Unreferenced function"

**Safe to ignore** - Common in UE5 projects

---

## Step 4: Verify Build Success

### Check Binaries Folder

After successful build, verify:

```
x:\Demiurge-Blockchain\client\DemiurgeClient\Binaries\Win64\
```

Should contain:
- `DemiurgeClient.exe` (or `.dll` for modules)
- Module DLLs

### Check Output Log

Look for module initialization messages:
```
[Demiurge] Web3 module initialized - RPC bridge ready
[Demiurge] QorUI module initialized - Cyber Glass Design System ready
[Demiurge] Client module initialized
```

---

## Step 5: Launch Unreal Editor

### From Visual Studio

1. **Debug** → **Start Without Debugging** (or `Ctrl+F5`)
   - This launches Unreal Editor with the project

### From Epic Games Launcher

1. **Open Epic Games Launcher**
2. **Unreal Engine** → **Library** → **Launch UE 5.7.1**
3. **Browse** to project folder
4. **Open** `DemiurgeClient.uproject`

**First Launch:**
- Editor will detect compiled modules
- May prompt to rebuild (click **No** - already built)
- Modules should load automatically

---

## Step 6: Verify Modules Loaded

### In Unreal Editor

1. **Window** → **Developer Tools** → **Modules**
2. **Check status:**
   - ✅ `DemiurgeClient` - **Loaded**
   - ✅ `DemiurgeWeb3` - **Loaded**
   - ✅ `QorUI` - **Loaded**

### Check Output Log

1. **Window** → **Developer Tools** → **Output Log**
2. **Filter:** `Demiurge`
3. **Look for:**
   ```
   LogTemp: [Demiurge] Client module initialized
   LogTemp: [Demiurge] Web3 module initialized - RPC bridge ready
   LogTemp: [Demiurge] QorUI module initialized - Cyber Glass Design System ready
   ```

---

## Development Workflow

### Making Code Changes

1. **Edit** C++ files in Visual Studio
2. **Save** files (`Ctrl+S`)
3. **Build** solution (`Ctrl+Shift+B`)
4. **Switch** to Unreal Editor
5. **Hot Reload** (Editor will prompt automatically)
   - Click **Yes** to reload modules
   - Or **Compile** button in Editor

### Hot Reload vs Full Rebuild

- **Hot Reload:** Fast, for small changes (Editor → Compile)
- **Full Rebuild:** Complete recompilation (Visual Studio → Build Solution)

---

## Next Steps After Successful Build

1. ✅ **Verify modules loaded** in Editor
2. ✅ **Create Blueprint widgets** (see `BLUEPRINT_UI_GUIDE.md`)
3. ✅ **Test WebSocket connection** to Substrate node
4. ✅ **Create Game Mode Blueprint**

---

## Troubleshooting

### Build Succeeds But Editor Won't Launch

**Fix:**
1. Close Visual Studio
2. Run `CLEAN_BUILD.ps1`
3. Rebuild in Visual Studio
4. Launch Editor from Epic Games Launcher

### Modules Don't Appear in Editor

**Fix:**
1. Verify modules compiled successfully
2. Check `Binaries\Win64\` for DLL files
3. Restart Editor
4. Check Output Log for errors

### IntelliSense Not Working

**Fix:**
1. **Build** → **Rebuild Solution**
2. Wait for IntelliSense to update
3. Close and reopen Visual Studio if needed

---

## Quick Reference

| Action | Shortcut |
|--------|----------|
| Build Solution | `Ctrl+Shift+B` |
| Rebuild Solution | `Ctrl+Alt+F7` |
| Clean Solution | `Build` → `Clean Solution` |
| View Output | `Ctrl+Alt+O` |
| Error List | `Ctrl+\`, `E` |
| Start Without Debugging | `Ctrl+F5` |

---

*Last Updated: January 12, 2026*
