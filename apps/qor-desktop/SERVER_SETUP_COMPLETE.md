# ✅ QOR Desktop Remote Sync - Server Setup Complete

## 🎉 Status: PARTIALLY DEPLOYED

### What's Working
- ✅ QorID Service running on server (`51.210.209.112:8082`)
- ✅ SQLite database created (`/home/ubuntu/DEMIURGE/apps/qorid-service/data/qorid.sqlite`)
- ✅ API endpoints functional (tested locally on server)
- ✅ PM2 managing the service
- ✅ Auto-restart configured
- ✅ QOR Desktop client code updated with network sync

### What Needs Attention
- ⚠️ Port 8082 not accessible externally (firewall/UFW blocking)
- ⚠️ Need to configure Nginx reverse proxy for HTTPS

---

## 📡 Server Details

### Service Information
- **Server**: `51.210.209.112` (login as `ubuntu`, not `root`)
- **Service Port**: `8082`
- **Process Manager**: PM2
- **Database**: SQLite at `~/DEMIURGE/apps/qorid-service/data/qorid.sqlite`
- **Service File**: `~/DEMIURGE/apps/qorid-service/simple-server.cjs`

### API Endpoints
```
GET  http://51.210.209.112:8082/health
GET  http://51.210.209.112:8082/api/qorid/username-available?username={username}
POST http://51.210.209.112:8082/api/qorid/register
     Body: {"username": "...", "publicKey": "0x..."}
GET  http://51.210.209.112:8082/api/qorid/users
```

---

## 🔧 To Complete Setup

### Option 1: Open Port 8082 (Quick but not recommended for production)

SSH to server:
```bash
ssh ubuntu@51.210.209.112
sudo ufw allow 8082/tcp
sudo ufw status
```

Then test from your desktop:
```powershell
Invoke-RestMethod -Uri "http://51.210.209.112:8082/health"
```

### Option 2: Configure Nginx Reverse Proxy (Recommended)

This allows HTTPS access via subdomain.

**1. Create Nginx config:**
```bash
ssh ubuntu@51.210.209.112
sudo nano /etc/nginx/sites-available/api.demiurge.cloud
```

**2. Add configuration:**
```nginx
server {
    listen 80;
    server_name api.demiurge.cloud;
    
    location / {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**3. Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/api.demiurge.cloud /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**4. Install SSL certificate (Let's Encrypt):**
```bash
sudo certbot --nginx -d api.demiurge.cloud
```

**5. Update QOR Desktop to use HTTPS:**

Edit `apps/qor-desktop/src/QorIDManager.cpp`:
```cpp
QString m_apiUrl = "https://api.demiurge.cloud";  // Change from http://51.210.209.112:8082
```

Rebuild:
```powershell
cmake --build apps/qor-desktop/build --config Release
```

---

## ✅ Verification Steps

### 1. Check Service Status (on server)
```bash
ssh ubuntu@51.210.209.112
pm2 status
pm2 logs qorid-service --lines 20
```

### 2. Test Locally (on server)
```bash
curl http://localhost:8082/health
curl 'http://localhost:8082/api/qorid/username-available?username=test'
```

### 3. Test Registration (from desktop)
Once port/proxy is configured, test from QOR Desktop or:

```powershell
$body = @{
    username = "testuser"
    publicKey = "0x1234567890abcdef"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://51.210.209.112:8082/api/qorid/register" `
    -Method Post -Body $body -ContentType "application/json"
```

### 4. Check Database (on server)
```bash
# Install sqlite3 if needed
sudo apt-get install -y sqlite3

# View users
cd ~/DEMIURGE/apps/qorid-service
sqlite3 data/qorid.sqlite "SELECT * FROM abyssid_users;"
```

---

## 🎯 QOR Desktop Integration

The desktop client is already configured to sync with the remote server!

### How It Works

1. **User creates account** in QOR Desktop
2. **Client derives keypair** from username + password
3. **HTTP POST** sent to `http://51.210.209.112:8082/api/qorid/register`
4. **Server stores** account in SQLite database
5. **Response** confirms registration
6. **Client caches** credentials locally for offline access

### Testing in QOR Desktop

1. Launch QOR Desktop (`apps/qor-desktop/build/QOR.exe`)
2. Click "Sign Up"
3. Enter username and password
4. Check debug output for network requests
5. Verify account appears in server database

---

## 📊 Database Schema

```sql
CREATE TABLE abyssid_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  public_key TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME
);

CREATE INDEX idx_username ON abyssid_users(username);
```

---

## 🔒 Security Notes

- **Private keys NEVER sent to server** - only public keys stored
- **Keys derived deterministically** from username + password
- **Username case-insensitive** for consistency
- **HTTPS recommended** for production (use Nginx + Let's Encrypt)

---

## 🚀 Next Steps

1. **Choose setup option** (open port or Nginx proxy)
2. **Test external connectivity** from desktop
3. **Create test account** in QOR Desktop
4. **Verify in database** on server
5. **Optional**: Add monitoring/logging

---

**Date**: January 10, 2026  
**Status**: Service running, awaiting firewall/proxy configuration  
**Contact**: Check PM2 logs for debugging
