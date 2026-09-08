# WebSocket Plugin Installation

## Quick Install

### Option 1: GitHub (Recommended)

1. **Download from:**
   ```
   https://github.com/feixuwu/UnrealEngineWebSocket
   ```
   OR
   ```
   https://github.com/Phyronnaz/WebSockets
   ```

2. **Extract to:**
   ```
   x:\Demiurge-Blockchain\client\DemiurgeClient\Plugins\WebSockets\
   ```

3. **Structure should be:**
   ```
   Plugins/
   └── WebSockets/
       ├── WebSockets.uplugin
       ├── Source/
       │   └── WebSockets/
       │       ├── WebSockets.Build.cs
       │       └── ...
       └── Resources/
   ```

4. **Restart Unreal Editor**

### Option 2: Marketplace

1. Open Epic Games Launcher
2. Unreal Engine → Marketplace
3. Search "WebSocket"
4. Install to project

---

## Verification

After installation, verify in Editor:
- **Edit** → **Plugins** → Search "WebSocket" → Should show **Enabled** ✓
- **Window** → **Developer Tools** → **Modules** → Look for `WebSockets` module

---

## If Plugin Not Available

The code can be modified to use HTTP polling instead, but WebSockets are preferred for real-time RPC.
