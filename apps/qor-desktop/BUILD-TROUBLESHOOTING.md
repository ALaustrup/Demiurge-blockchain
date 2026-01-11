# Quick Troubleshooting Guide

## 🔍 **Common Build Errors & Solutions**

### **Error: "CMake not found" or "Ninja not found"**

**Solution 1: Use MinGW Make instead**
```powershell
cd build
cmake --build . --config Release
```

**Solution 2: Configure with different generator**
```powershell
cd build
cmake .. -G "MinGW Makefiles"
cmake --build . --config Release
```

---

### **Error: "qml.qrc: No such file or directory"**

**Solution:** Reconfigure CMake from scratch
```powershell
# Delete build folder
Remove-Item -Recurse -Force build

# Create fresh build
mkdir build
cd build
cmake .. -G "Ninja"
cmake --build . --config Release
```

---

### **Error: "MultiEffect is not a type"**

**Solution:** Already fixed! Just need to rebuild.

---

### **Error: Build folder doesn't exist**

**Solution:** Initial CMake configuration
```powershell
# From qor-desktop folder
mkdir build
cd build
cmake .. -G "Ninja"
cd ..
.\Simple-Rebuild.bat
```

---

## 🛠️ **Step-by-Step Manual Build**

If scripts don't work, try manual commands:

```powershell
# 1. Navigate to project
cd C:\Repos\DEMIURGE\apps\qor-desktop

# 2. Remove old build (if exists)
if (Test-Path build) { Remove-Item -Recurse -Force build }

# 3. Create build directory
mkdir build
cd build

# 4. Configure (try each until one works)
cmake .. -G "Ninja"                    # Try this first
# OR
cmake .. -G "MinGW Makefiles"          # Try this if Ninja fails
# OR  
cmake .. -G "Unix Makefiles"           # Try this if MinGW fails

# 5. Build
cmake --build . --config Release

# 6. Check result
ls QOR.exe
```

---

## ✅ **What To Tell Me**

Copy and paste the **exact error message** you see. Look for lines like:

- `CMake Error: ...`
- `fatal error: ...`
- `undefined reference to ...`
- `No such file or directory`

---

## 🎯 **Alternative: Pre-built Binary**

If building continues to fail, I can:
1. Guide you through downloading Qt tools
2. Create a minimal test build
3. Help debug your Qt installation

**What error do you see when running `.\Rebuild-QOR.ps1 -Jobs 1`?**
