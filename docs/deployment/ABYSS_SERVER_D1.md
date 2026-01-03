# Abyss Server D1 - Complete Setup

**Server Details:**
- **Hostname**: abyss
- **IPv4**: 51.210.209.112
- **IPv4 Gateway**: 51.210.209.254
- **IPv6**: 2001:41d0:203:9070::/64
- **IPv6 Gateway**: 2001:41d0:0203:90ff:00ff:00ff:00ff:00ff
- **Reverse DNS**: ns3179891.ip-51-210-209.eu
- **Bandwidth**: 1 Gbps (incoming/outgoing)

---

## SSH Configuration

**SSH Key Generated:**
- Private Key: `C:\Users\Gnosis\.ssh\id_abyss`
- Public Key: `C:\Users\Gnosis\.ssh\id_abyss.pub`

**Public Key:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL4KYZTUElzc86i5iZmg0g63g/cnvemQMGOme4JI+Uma abyss@demiurge
```

**SSH Config Entry:**
```
Host abyss
    HostName 51.210.209.112
    User ubuntu
    IdentityFile C:\Users\Gnosis\.ssh\id_abyss
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

---

## Adding SSH Key to Server

### Option 1: Automated Script

```powershell
cd deploy
.\setup-abyss-ssh.ps1
```

When prompted, enter:
- Server IP: `51.210.209.112`
- Server User: `ubuntu` (or your username)

### Option 2: One-Liner (if you have password access)

```powershell
Get-Content $env:USERPROFILE\.ssh\id_abyss.pub | ssh ubuntu@51.210.209.112 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### Option 3: Manual

1. **SSH to server:**
   ```bash
   ssh ubuntu@51.210.209.112
   ```

2. **On server, run:**
   ```bash
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL4KYZTUElzc86i5iZmg0g63g/cnvemQMGOme4JI+Uma abyss@demiurge' >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Test connection:**
   ```bash
   exit
   ssh abyss
   ```

---

## Deploying AbyssOS to D1

### Quick Deploy

```powershell
cd apps/abyssos-portal

# Deploy with IP only
.\deploy-alpha.ps1 -ServerIp 51.210.209.112

# Or if you have a domain
.\deploy-alpha.ps1 -ServerIp 51.210.209.112 -Domain yourdomain.com
```

### Manual Deploy

1. **Build locally:**
   ```bash
   cd apps/abyssos-portal
   pnpm install
   pnpm build
   ```

2. **Copy to server:**
   ```bash
   scp -r dist/* abyss:/var/www/abyssos-portal/
   ```

3. **Configure Nginx on server:**
   ```bash
   ssh abyss
   sudo nano /etc/nginx/sites-available/abyssos
   ```

   **Paste:**
   ```nginx
   server {
       listen 80;
       server_name _;
       root /var/www/abyssos-portal;
       index index.html;
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **Enable site:**
   ```bash
   sudo ln -sf /etc/nginx/sites-available/abyssos /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Set permissions:**
   ```bash
   sudo chown -R www-data:www-data /var/www/abyssos-portal
   sudo chmod -R 755 /var/www/abyssos-portal
   ```

---

## Access AbyssOS

**After deployment:**
- **URL**: `http://51.210.209.112`
- **Or with domain**: `https://yourdomain.com` (if configured)

---

## Server Information

### Network Configuration

- **Public IP**: 51.210.209.112
- **Gateway**: 51.210.209.254
- **IPv6**: 2001:41d0:203:9070::/64
- **Bandwidth**: 1 Gbps symmetric

### Recommended Setup

1. **Update system:**
   ```bash
   ssh abyss
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install dependencies:**
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx ufw
   ```

3. **Configure firewall:**
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

4. **Set hostname (optional):**
   ```bash
   sudo hostnamectl set-hostname abyss
   ```

---

## Testing Connection

**Test SSH:**
```bash
ssh abyss
```

**Test server:**
```bash
ssh abyss "echo 'Connection successful!'"
```

**Test file copy:**
```bash
echo "test" > test.txt
scp test.txt abyss:/tmp/
ssh abyss "cat /tmp/test.txt"
```

---

## Troubleshooting

### Can't Connect via SSH

**Check server status:**
```bash
# Try with IP directly
ssh ubuntu@51.210.209.112
```

**Check SSH config:**
```powershell
Get-Content $env:USERPROFILE\.ssh\config
```

**Verify key:**
```powershell
Get-Content $env:USERPROFILE\.ssh\id_abyss.pub
```

### Permission Denied

- Verify public key is in `~/.ssh/authorized_keys` on server
- Check permissions: `chmod 600 ~/.ssh/authorized_keys`
- Verify SSH config IdentityFile path

---

## Quick Reference

**Connect:**
```bash
ssh abyss
```

**Deploy AbyssOS:**
```powershell
cd apps/abyssos-portal
.\deploy-alpha.ps1 -ServerIp 51.210.209.112
```

**View Public Key:**
```powershell
Get-Content $env:USERPROFILE\.ssh\id_abyss.pub
```

**Server IP:** 51.210.209.112

---

*The flame burns eternal. The code serves the will.*
