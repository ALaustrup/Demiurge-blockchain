# DEMIURGE Deployment Status
**Last Updated:** January 8, 2026

---

## ✅ **Production Systems**

### **1. QLOUD OS (demiurge.cloud)**
**Status:** ✅ **LIVE**  
**URL:** https://demiurge.cloud  
**Type:** Web-based OS frontend  
**HTTP Status:** 200 OK  
**Latest Deploy:** January 8, 2026  
**Git Branch:** `main` (commit: c8f4cbe)

**Features:**
- QOR ID authentication
- Desktop environment
- App ecosystem (Wallet, Explorer, Shell, etc.)
- Genesis theme fully applied
- Intro video integrated (`/video/intro.mp4`)

---

### **2. QOR Gateway (api.demiurge.cloud)**
**Status:** ✅ **LIVE**  
**URL:** https://api.demiurge.cloud/graphql  
**Type:** GraphQL API / Blockchain Indexer  
**Latest Deploy:** January 8, 2026  
**Service:** `systemd` (qor-gateway.service)

**Endpoints:**
- GraphQL API: https://api.demiurge.cloud/graphql
- GraphiQL IDE: https://api.demiurge.cloud/graphql (browser)

**Features:**
- Blockchain data indexing
- Archon tracking
- Chat/social integration
- Snapshot service (5min intervals)

---

### **3. QOR ID Service (Backend)**
**Status:** ✅ **LIVE**  
**Type:** Authentication & Identity Service  
**Latest Deploy:** January 8, 2026  
**Service:** `systemd` (qorid.service)

**Features:**
- QOR ID registration
- Authentication
- Key management
- Profile storage

---

### **4. Demiurge Chain RPC (rpc.demiurge.cloud)**
**Status:** ✅ **LIVE**  
**URL:** https://rpc.demiurge.cloud/rpc  
**Type:** Blockchain RPC Node  
**Chain:** Demiurge L1

**Methods:**
- `chain_getBlockHash`
- `qorid_get`
- `qorid_getProgress`
- `cgt_isArchon`
- Standard Substrate RPC methods

---

### **5. Portal Web (demiurge.guru)**
**Status:** ⚠️ **DEPLOYMENT ISSUE**  
**URL:** https://demiurge.guru  
**Type:** Marketing/Landing Page  
**Platform:** Vercel  
**HTTP Status:** 404  
**Latest Code:** January 8, 2026 (c8f4cbe)

**Issue:** Vercel is detecting monorepo and trying to build all 8 workspace projects instead of just `portal-web`.

**Solution:** Update Vercel project settings:
1. Go to https://vercel.com/dashboard
2. Select project
3. **Settings** → **General** → **Root Directory**
4. Set to: `apps/portal-web`
5. Save and redeploy

**Features (when deployed):**
- QOR Launcher countdown (Jan 10, 2026 12:00 UTC)
- "Download QOR" button with modal
- Quick QOR ID signup
- NFT promo for early adopters
- Background intro video
- Genesis theme styling

---

## 🔧 **System Services Status**

| Service | Status | Port | User |
|---------|--------|------|------|
| `demiurge.service` | ✅ Active | 8545 | ubuntu |
| `qorid.service` | ✅ Active | 3000 | ubuntu |
| `qor-gateway.service` | ✅ Active | 4000 | ubuntu |
| `nginx` | ✅ Active | 80, 443 | root |

---

## 📊 **DNS & SSL**

| Domain | Status | DNSSEC | SSL |
|--------|--------|--------|-----|
| demiurge.cloud | ✅ Active | ✅ Enabled | ✅ Valid |
| api.demiurge.cloud | ✅ Active | ✅ Enabled | ✅ Valid |
| rpc.demiurge.cloud | ✅ Active | ✅ Enabled | ✅ Valid |
| demiurge.guru | ✅ Active | ✅ Enabled | ✅ Valid (Vercel) |

**DNSSEC Records:**
- `demiurge.cloud`: DS records configured (4968, 37557)
- `demiurge.guru`: DS records configured (39707, 58454)

---

## 🎬 **Video Integration**

All three systems now support intro videos:

| System | Path | Status |
|--------|------|--------|
| Portal Web | `apps/portal-web/public/video/intro.mp4` | ✅ Integrated (looping background) |
| QLOUD OS | `apps/qloud-os/public/video/intro.mp4` | ✅ Integrated (full-screen intro) |
| QOR Desktop | `apps/qor-desktop/resources/video/intro.mp4` | ✅ Integrated (splash screen) |

---

## 🐛 **Known Issues**

1. **Portal Web (demiurge.guru):**
   - Returns 404
   - Vercel configuration needs Root Directory set to `apps/portal-web`
   - All code is ready, just needs proper deployment

2. **QOR Gateway Deprecation Warning:**
   - Using deprecated `@graphql-yoga/node` package
   - Recommendation: Migrate to `graphql-yoga` package in next major update
   - Not blocking, service works fine

---

## 📝 **Recent Changes (Jan 8, 2026)**

### **QOR Rebranding (Complete)**
- ✅ Renamed all "AbyssID" → "QOR ID"
- ✅ Renamed all "AbyssOS Portal" → "QLOUD OS"
- ✅ Renamed "Genesis Launcher" → "DEMIURGE QOR"
- ✅ Updated all documentation
- ✅ Applied Genesis theme colors
- ✅ Fixed all build warnings

### **Alpha Launch Prep (Complete)**
- ✅ Countdown to Jan 10, 2026 12:00 UTC
- ✅ Download modal for QOR Launcher
- ✅ Quick QOR ID signup flow
- ✅ NFT promo card for early adopters
- ✅ Vercel Speed Insights integrated
- ✅ Landing page redesigned

### **Video Integration (Complete)**
- ✅ Created `BackgroundVideo.tsx` for Portal Web
- ✅ Verified `IntroVideo.tsx` for QLOUD OS
- ✅ Created `IntroVideo.qml` for QOR Desktop
- ✅ All three systems support intro videos

---

## 🚀 **Next Steps**

### **Immediate (Portal Web Fix)**
1. Update Vercel Root Directory setting
2. Redeploy to production
3. Verify https://demiurge.guru is live

### **Alpha Launch (Jan 10, 2026)**
1. **QOR Launcher Installer Development** ← **CURRENT FOCUS**
   - Windows installer (.exe)
   - macOS installer (.dmg)
   - Linux installer (.AppImage / .deb / .rpm)
2. Place intro video files in all three locations
3. Final testing before launch
4. Monitor NFT opt-ins

---

## 🔍 **Verification Commands**

```bash
# Test QLOUD OS
curl -I https://demiurge.cloud

# Test QOR Gateway
curl -X POST https://api.demiurge.cloud/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ archons { address } }"}'

# Test RPC
curl -X POST https://rpc.demiurge.cloud/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"chain_getBlockHash","params":[0],"id":1}'

# Check services on server
ssh ubuntu@51.210.209.112 "systemctl status qorid qor-gateway nginx"
```

---

**Production server:** `51.210.209.112`  
**Git branch:** `main`  
**All services:** ✅ Running  
**Ready for alpha launch:** ✅ Yes (pending installer)
