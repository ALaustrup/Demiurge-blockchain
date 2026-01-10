# QorID Service - Verification & Deployment Guide

## Current Status: ⚠️ NEEDS VERIFICATION

The QOR Desktop now attempts to connect to the QorID service, but we need to verify:
1. Is the service running on the server?
2. What URL should the desktop client use?
3. Is the database properly initialized?

## 🔍 Step 1: Check if Service is Running

SSH to server and check:

```bash
ssh root@51.210.209.112

# Check if QorID service is running
pm2 list | grep qorid

# Or check process
ps aux | grep qorid

# Check port
netstat -tulpn | grep 8082
```

## 🚀 Step 2: Deploy QorID Service (if not running)

### Option A: Using PM2 (Recommended)

```bash
cd /opt/qorid-service  # Or wherever the service is
npm install
npm run build

# Start with PM2
pm2 start dist/index.js --name qorid-service
pm2 save
```

### Option B: Manual Start

```bash
cd apps/qorid-service
npm install
npm run dev
```

## 🌐 Step 3: Configure URL

The QorID service can be accessed via:

### Option 1: Direct IP (Current Default)
```
http://51.210.209.112:8082
```

### Option 2: Subdomain (Recommended)
```
https://api.demiurge.cloud  (proxied via Nginx)
```

### Configure Nginx Proxy (if using subdomain)

```nginx
# /etc/nginx/sites-available/api.demiurge.cloud
server {
    listen 80;
    server_name api.demiurge.cloud;
    
    location / {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then:
```bash
sudo ln -s /etc/nginx/sites-available/api.demiurge.cloud /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## ✅ Step 4: Test API Endpoints

### Test from Desktop (PowerShell)
```powershell
# Check username availability
Invoke-RestMethod -Uri "http://51.210.209.112:8082/api/qorid/username-available?username=testuser"

# Should return:
# @{available=True}  # or False if username exists
```

### Test from Server (bash)
```bash
# Check username
curl "http://localhost:8082/api/qorid/username-available?username=testuser"

# Register account (test)
curl -X POST http://localhost:8082/api/qorid/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123","publicKey":"0x1234567890abcdef"}'
```

## 📊 Step 5: Verify Database

```bash
cd /opt/qorid-service/data  # Or wherever SQLITE_PATH points
sqlite3 abyssid.sqlite

# Check tables
.tables

# View users
SELECT * FROM abyssid_users LIMIT 5;

# Count users
SELECT COUNT(*) as total_users FROM abyssid_users;
```

## 🔧 Step 6: Update Desktop Client URL (if needed)

If using different URL, update in QOR Desktop:

**File**: `apps/qor-desktop/src/QorIDManager.cpp`

```cpp
QString m_apiUrl = "https://api.demiurge.cloud";  // Or your URL
```

Then rebuild:
```powershell
cmake --build apps/qor-desktop/build --config Release
```

## 🎯 Expected Behavior

When working correctly:

1. **User creates account in QOR Desktop**
2. **Desktop logs**: "Registering account: {username} to remote server"
3. **HTTP POST** sent to server
4. **Server creates** entry in `abyssid_users` table
5. **Server responds** with success
6. **Desktop logs**: "Registration successful! Account created on remote server."
7. **Desktop stores** credentials locally for offline access

## 🐛 Troubleshooting

### "Network error: Connection refused"
- QorID service not running
- Port 8082 not open
- Firewall blocking

### "Network error: Connection timeout"
- Server not reachable
- Wrong URL
- Network issue

### "Username already taken" (when it shouldn't be)
- Database already has that username
- Check: `SELECT * FROM abyssid_users WHERE username = 'youruser';`

---

**Next Action**: Verify service is running and update URL if needed!
