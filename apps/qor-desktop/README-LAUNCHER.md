# 🚀 QOR Desktop - Launch Scripts

Quick reference for launching and building QOR Desktop without crashes!

---

## 🎮 **Quick Launch** (Recommended)

### **Option 1: Double-Click Batch File**
```
Launch-QOR.bat
```
**Just double-click this file!** No terminal needed.

### **Option 2: PowerShell Script**
```powershell
.\Launch-QOR.ps1
```
More verbose output, shows build info.

### **Option 3: Direct Executable**
Navigate to `build\QOR.exe` and double-click it.

---

## 🖥️ **Desktop Shortcut**

Want QOR on your desktop?

1. Double-click: `Create-Desktop-Shortcut.ps1`
2. A shortcut appears on your desktop
3. Double-click the shortcut anytime!

---

## 🔨 **Rebuild QOR** (When Code Changes)

⚠️ **IMPORTANT: Close Cursor IDE before rebuilding!**

### **Clean Rebuild**
```powershell
.\Rebuild-QOR.ps1 -Clean
```
Deletes build folder and rebuilds from scratch.

### **Incremental Rebuild**
```powershell
.\Rebuild-QOR.ps1
```
Only rebuilds changed files (faster).

### **Fast Rebuild (Single Core)**
```powershell
.\Rebuild-QOR.ps1 -Jobs 1
```
Uses only 1 CPU core (slowest but safest).

---

## ⌨️ **Keyboard Shortcuts** (Inside QOR)

Once launched, use these shortcuts:

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | Open Terminal |
| `Ctrl+W` | Open Wallet |
| `Ctrl+S` | Open Settings |
| `Ctrl+E` | Open Explorer |
| `Ctrl+Shift+S` | System Monitor |
| `Ctrl+Q` | Quit Application |

---

## 🐛 **Troubleshooting**

### **"Nothing appeared in front of me"**
- Check your **taskbar** - QOR might be minimized
- Press `Alt+Tab` to cycle through windows
- Look for a QOR icon in system tray

### **"Cursor keeps crashing"**
- **Never build inside Cursor!**
- Close Cursor completely
- Open separate PowerShell
- Run `.\Rebuild-QOR.ps1`

### **"QOR.exe not found"**
Run rebuild script:
```powershell
.\Rebuild-QOR.ps1
```

### **Build fails with errors**
1. Close Cursor
2. Clean rebuild:
   ```powershell
   .\Rebuild-QOR.ps1 -Clean
   ```

---

## 📁 **File Overview**

| File | Purpose |
|------|---------|
| `Launch-QOR.bat` | Simple double-click launcher |
| `Launch-QOR.ps1` | PowerShell launcher with details |
| `Rebuild-QOR.ps1` | Build script (close Cursor first!) |
| `Create-Desktop-Shortcut.ps1` | Creates desktop shortcut |
| `build\QOR.exe` | The actual executable |

---

## 💡 **Pro Tips**

1. **Always close Cursor before building** - Prevents crashes
2. **Use batch file for daily use** - Quickest method
3. **Create desktop shortcut** - One-time setup, convenient forever
4. **Only rebuild when code changes** - Executable persists between sessions

---

## 🎨 **What You'll See**

When QOR launches successfully:

- **Background**: Deep void gradient
- **Top Bar**: "QOR" logo + CPU/RAM stats + time
- **Workspace**: Empty glass canvas (ready for widgets)
- **Bottom Dock**: 5 colorful icons with magnification

**Hover over dock icons** → They magnify!  
**Click any icon** → Widget spawns!  
**Drag widgets** → Smooth physics!

---

## ✅ **Launch Checklist**

- [ ] Executable exists at `build\QOR.exe`
- [ ] Cursor is closed (if rebuilding)
- [ ] Double-click `Launch-QOR.bat`
- [ ] Watch for window on screen/taskbar
- [ ] Try `Ctrl+T` to spawn terminal widget

---

**🎉 Enjoy your glassmorphic desktop environment!**
