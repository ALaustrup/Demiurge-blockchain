# Quick Start - Fracture Portal

## 🚀 Start Services

### **Option 1: Use Startup Script (Recommended)**

```powershell
.\start-fracture.ps1
```

This script will:
- ✅ Check and install dependencies
- ✅ Initialize AbyssID database
- ✅ Start AbyssID Backend (port 3001)
- ✅ Start Portal Web (port 3000)
- ✅ Open separate windows for each service

### **Option 2: Manual Start**

#### **1. Start AbyssID Backend**

```powershell
cd apps/abyssid-backend
npm install  # If first time
node src/db-init.js  # If first time
node src/server.js
```

**Expected Output:**
```
AbyssID Backend running on port 3001
Database: ./data/abyssid.db
```

#### **2. Start Portal Web**

Open a **new** PowerShell window:

```powershell
cd apps/portal-web
pnpm install  # If first time
pnpm dev
```

**Expected Output:**
```
- ready started server on 0.0.0.0:3000
- Local: http://localhost:3000
```

---

## 🌐 **Access the Portal**

Open your browser to:
```
http://localhost:3000
```

### **Test the Fracture Portal:**

1. **Navigate to Haven:**
   - Click "Haven" in navigation or go to `http://localhost:3000/haven`

2. **Create AbyssID:**
   - Click "Create AbyssID" button
   - Enter a username (e.g., `testuser`)
   - Click "Engage"
   - Complete the registration flow

3. **View Identity:**
   - After registration, you'll see your identity on the Haven page
   - Username, address, and public key are displayed

---

## 🔍 **Verify Services**

### **Check AbyssID Backend:**
```powershell
curl http://localhost:3001/health
# Expected: {"status":"ok","service":"abyssid-backend"}
```

### **Check Portal:**
```powershell
curl http://localhost:3000
# Should return HTML
```

---

## 🛑 **Stop Services**

Press `Ctrl+C` in each PowerShell window to stop the services.

---

## 🐛 **Troubleshooting**

### **Port Already in Use**

If you see "port already in use" errors:

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Find process using port 3001
netstat -ano | findstr :3001

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### **Dependencies Not Installed**

```powershell
# Backend
cd apps/abyssid-backend
npm install

# Portal
cd apps/portal-web
pnpm install
```

### **Database Errors**

```powershell
cd apps/abyssid-backend
# Delete and reinitialize
Remove-Item data\abyssid.db -ErrorAction SilentlyContinue
node src/db-init.js
```

### **Portal Won't Start**

- Check Node.js version: `node -v` (should be 18+)
- Check pnpm is installed: `pnpm -v`
- Clear Next.js cache: `Remove-Item .next -Recurse -Force`
- Reinstall: `pnpm install`

---

## 📝 **Next Steps**

1. ✅ **Test Registration Flow** - Create an AbyssID
2. ✅ **Explore Fracture Routes** - Visit `/haven`, `/void`, `/nexus`, `/scrolls`, `/conspire`
3. ⚠️ **Upload Media Files** - Add video backgrounds (see `MEDIA_FILES_SETUP.md`)
4. ⚠️ **Test Audio Reactivity** - Grant microphone access to test shader effects

---

**The flame burns eternal. The code serves the will.**

