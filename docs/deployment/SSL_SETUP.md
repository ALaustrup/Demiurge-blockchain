# 🔒 SSL Setup for rpc.demiurge.cloud

**Complete guide for setting up SSL/TLS for the RPC endpoint**

---

## 🎯 Overview

This guide will help you set up SSL certificates for `rpc.demiurge.cloud` using Let's Encrypt and Certbot.

---

## 📋 Prerequisites

- DNS record for `rpc.demiurge.cloud` pointing to server IP (`127.0.0.1`)
- Root or sudo access to the server
- Ports 80 and 443 open in firewall
- Nginx installed and configured

---

## 🚀 Quick Setup (Automated)

### Option 1: Use Setup Script

```bash
# On server (127.0.0.1)
cd /opt/demiurge-blockchain
sudo bash scripts/setup-rpc-ssl.sh
```

The script will:
1. Install certbot if needed
2. Obtain SSL certificate for `rpc.demiurge.cloud`
3. Copy certificates to nginx directory
4. Set up auto-renewal

### Option 2: Manual Setup

#### Step 1: Install Certbot

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

#### Step 2: Obtain Certificate

```bash
# Stop nginx temporarily (certbot will use standalone mode)
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone \
  -d rpc.demiurge.cloud \
  --email admin@demiurge.cloud \
  --agree-tos \
  --non-interactive

# Start nginx
sudo systemctl start nginx
```

#### Step 3: Copy Certificates

```bash
# Create directory
sudo mkdir -p /etc/nginx/ssl/rpc.demiurge.cloud

# Copy certificates
sudo cp /etc/letsencrypt/live/rpc.demiurge.cloud/fullchain.pem /etc/nginx/ssl/rpc.demiurge.cloud/
sudo cp /etc/letsencrypt/live/rpc.demiurge.cloud/privkey.pem /etc/nginx/ssl/rpc.demiurge.cloud/

# Set permissions
sudo chmod 644 /etc/nginx/ssl/rpc.demiurge.cloud/*.pem
sudo chmod 600 /etc/nginx/ssl/rpc.demiurge.cloud/privkey.pem
```

#### Step 4: Update Nginx Configuration

The nginx configuration in `docker/nginx.conf` is already set up. Verify the SSL paths:

```nginx
ssl_certificate /etc/nginx/ssl/rpc.demiurge.cloud/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/rpc.demiurge.cloud/privkey.pem;
```

#### Step 5: Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## 🔄 Auto-Renewal Setup

### Enable Certbot Timer

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Create Renewal Hook

```bash
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy

sudo cat > /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh << 'EOF'
#!/bin/bash
# Copy certificates after renewal
cp /etc/letsencrypt/live/rpc.demiurge.cloud/fullchain.pem /etc/nginx/ssl/rpc.demiurge.cloud/
cp /etc/letsencrypt/live/rpc.demiurge.cloud/privkey.pem /etc/nginx/ssl/rpc.demiurge.cloud/
chmod 644 /etc/nginx/ssl/rpc.demiurge.cloud/*.pem
chmod 600 /etc/nginx/ssl/rpc.demiurge.cloud/privkey.pem
systemctl reload nginx
EOF

sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh
```

---

## ✅ Verification

### Test HTTPS Endpoint

```bash
# Test RPC endpoint
curl -X POST https://rpc.demiurge.cloud \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"chain_getHealth","params":[],"id":1}'

# Check SSL certificate
openssl s_client -connect rpc.demiurge.cloud:443 -servername rpc.demiurge.cloud
```

### Check Certificate Expiry

```bash
sudo certbot certificates
```

### Test Auto-Renewal

```bash
# Dry run renewal
sudo certbot renew --dry-run
```

---

## 🔧 Troubleshooting

### Certificate Not Obtained

**Error**: `Failed to obtain certificate`

**Solutions**:
1. Verify DNS is pointing to server:
   ```bash
   dig rpc.demiurge.cloud
   ```
2. Check port 80 is open:
   ```bash
   sudo ufw allow 80/tcp
   ```
3. Ensure nginx is stopped during certificate request (for standalone mode)

### Nginx Won't Start

**Error**: `nginx: [emerg] SSL certificate not found`

**Solutions**:
1. Verify certificate paths in nginx.conf
2. Check file permissions:
   ```bash
   ls -la /etc/nginx/ssl/rpc.demiurge.cloud/
   ```
3. Ensure certificates exist:
   ```bash
   sudo ls -la /etc/letsencrypt/live/rpc.demiurge.cloud/
   ```

### Certificate Expired

**Solution**: Renew manually:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## 📚 Additional Resources

- [Certbot Documentation](https://certbot.eff.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)

---

## 🔗 Certificate Locations

- **Let's Encrypt**: `/etc/letsencrypt/live/rpc.demiurge.cloud/`
- **Nginx SSL**: `/etc/nginx/ssl/rpc.demiurge.cloud/`

---

**After SSL setup, test the endpoint**: `https://rpc.demiurge.cloud`
