# Demiurge Chain Node - Quick Reference

## ⚠️ **Important Note**

The **Fracture Portal** (Haven, Void, Nexus, Scrolls, Conspire) does **NOT** require the chain node. Only the legacy `/urgeid` page needs it.

---

## 🚀 **Starting the Chain Node**

### **Option 1: Using Updated Script**

The `start-fracture.ps1` script now asks if you want to start the chain node:

```powershell
.\start-fracture.ps1
# When prompted: "Start Demiurge Chain node? (required for /urgeid page) [y/N]"
# Type 'y' to start it
```

### **Option 2: Manual Start**

Open a new PowerShell window:

```powershell
cd C:\Repos\DEMIURGE
cargo run -p demiurge-chain
```

**Note:** First run will compile Rust code (may take 5-10 minutes)

---

## ✅ **Verify Chain is Running**

```powershell
# Test RPC endpoint
$body = @{
  jsonrpc = "2.0"
  method = "cgt_getChainInfo"
  params = @{}
  id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" -Method Post -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "height": 0,
    "totalSupply": "100000000000000000",
    ...
  },
  "id": 1
}
```

---

## 📍 **What Needs the Chain Node**

### **Requires Chain Node:**
- ❌ `/urgeid` - Legacy UrgeID dashboard (needs chain for CGT balance, transactions, etc.)

### **Does NOT Need Chain Node:**
- ✅ `/haven` - Fracture Portal identity home
- ✅ `/void` - Developer HQ
- ✅ `/nexus` - P2P analytics
- ✅ `/scrolls` - Documentation
- ✅ `/conspire` - AI chat
- ✅ AbyssID registration (uses AbyssID backend on port 3001)

---

## 🔧 **Prerequisites**

To run the chain node, you need:

1. **Rust** installed:
   ```powershell
   # Check if installed
   cargo --version
   
   # If not installed, download from:
   # https://rustup.rs/
   ```

2. **Compilation** (first time only):
   - First build takes 5-10 minutes
   - Subsequent builds are faster (~1-2 minutes)

---

## 🐛 **Troubleshooting**

### **"cargo: command not found"**
- Install Rust from https://rustup.rs/
- Restart PowerShell after installation

### **Port 8545 Already in Use**
```powershell
# Find process using port
netstat -ano | findstr :8545

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### **Compilation Errors**
- Make sure you're in the project root
- Try: `cargo clean` then `cargo run -p demiurge-chain`

### **Chain Node Won't Start**
- Check for errors in the chain window
- Verify RocksDB can be created in `.demiurge/data`
- Check disk space

---

## 💡 **Recommendation**

**For Fracture Portal development:**
- ✅ **Don't start chain node** - Not needed for Haven, Void, Nexus, etc.
- ✅ **Use `/haven`** instead of `/urgeid` for identity management
- ✅ **Faster startup** - No Rust compilation needed

**For legacy UrgeID features:**
- ⚠️ **Start chain node** - Required for `/urgeid` page
- ⚠️ **Longer startup** - Rust compilation on first run

---

**The flame burns eternal. The code serves the will.**

