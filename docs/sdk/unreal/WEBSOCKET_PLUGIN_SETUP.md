# WebSocket Plugin Setup for UE5

## Issue
The project requires the **WebSockets** plugin for blockchain RPC communication, but it may not be installed.

## Solution: Install WebSocket Plugin

### Option 1: Install from Epic Games Marketplace (Recommended)

1. **Open Epic Games Launcher**
2. **Unreal Engine** tab → **Marketplace**
3. Search for: **"WebSockets"** or **"WebSocket"**
4. Install the plugin (usually free)
5. **Restart Unreal Editor**

### Option 2: Install from GitHub (If Marketplace Unavailable)

1. **Download Plugin:**
   - Repository: `https://github.com/feixuwu/UnrealEngineWebSocket`
   - OR: `https://github.com/Phyronnaz/WebSockets`
   - Download ZIP and extract

2. **Install to Project:**
   ```
   x:\Demiurge-Blockchain\client\DemiurgeClient\Plugins\WebSockets\
   ```
   - Create `Plugins` folder if it doesn't exist
   - Extract plugin files there

3. **Verify Structure:**
   ```
   Plugins/
   └── WebSockets/
       ├── WebSockets.uplugin
       ├── Source/
       └── ...
   ```

4. **Restart Unreal Editor**

### Option 3: Use Built-in WebSocket (UE5.7+)

UE5.7+ may have WebSocket support built-in. Check:

1. **Edit** → **Plugins**
2. Search for "WebSocket"
3. Enable if found
4. Restart Editor

---

## Verify Installation

### In Unreal Editor:

1. **Edit** → **Plugins**
2. Search for **"WebSocket"**
3. Verify it shows as **Enabled** ✓

### Check Module Loading:

1. **Window** → **Developer Tools** → **Modules**
2. Look for `WebSockets` module
3. Status should be **Loaded**

---

## Alternative: Use HTTP Instead (Temporary Workaround)

If WebSocket plugin is unavailable, we can modify `DemiurgeNetworkManager` to use HTTP polling instead. However, WebSockets are preferred for real-time RPC.

**To use HTTP workaround:**
- Modify `DemiurgeNetworkManager.cpp` to use `FHttpModule` instead
- Less efficient but will work for testing

---

## Current Code Requirements

The `DemiurgeNetworkManager` uses:
- `IWebSocket` interface
- `FWebSocketsModule` 
- `WebSocketsModule.h` header

These come from the WebSocket plugin.

---

## Troubleshooting

### Error: "WebSockets module not available"

**Solution:**
1. Verify plugin is installed in `Plugins/` folder
2. Check `WebSockets.uplugin` exists
3. Restart Editor
4. Recompile C++ modules

### Error: "Cannot find WebSocketsModule.h"

**Solution:**
1. Ensure plugin is in `Plugins/WebSockets/`
2. Regenerate Visual Studio project files
3. Rebuild C++ modules

### Plugin Not Showing in Editor

**Solution:**
1. Check plugin is in correct location
2. Verify `WebSockets.uplugin` file exists
3. Check plugin is compatible with UE5.7
4. Restart Editor

---

*Last Updated: January 12, 2026*
