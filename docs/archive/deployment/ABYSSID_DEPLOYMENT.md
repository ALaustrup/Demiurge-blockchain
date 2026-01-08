# QOR ID Service Deployment Guide

This guide covers deploying the QorID backend service alongside the Demiurge node and QOR OS portal.

## Overview

The QorID service provides:
- User identity management (registration, authentication, sessions)
- DRC-369 asset management (minting, importing, querying)
- REST API endpoints for QOR OS frontend

## Prerequisites

- Node.js 18+ installed
- SQLite3 (usually included with Node.js)
- Nginx (for reverse proxy)
- Existing Demiurge node running on port 8545
- QOR OS portal deployed at `/var/www/qloud-os`

## Backend Service Setup

### 1. Build the Service

From the monorepo root:

```bash
cd apps/qorid-service
pnpm install
pnpm build
```

This creates the `dist/` directory with compiled JavaScript.

### 2. Environment Configuration

Create `.env` file in `apps/qorid-service/`:

```env
PORT=8082
SQLITE_PATH=./data/abyssid.sqlite
CORS_ORIGIN=https://demiurge.cloud

# Optional: Demiurge RPC for future on-chain integration
DEMIURGE_RPC_URL=https://rpc.demiurge.cloud/rpc
```

### 3. Create Data Directory

```bash
mkdir -p apps/qorid-service/data
```

The database will be automatically initialized on first run.

### 4. Run the Service

**Development:**
```bash
pnpm dev
```

**Production:**
```bash
pnpm start
```

Or use a process manager like PM2:

```bash
pm2 start dist/index.js --name qorid-service
pm2 save
pm2 startup
```

## Nginx Configuration

Add the following to your nginx configuration (e.g., `/etc/nginx/sites-available/demiurge.cloud`):

```nginx
# QOR ID API reverse proxy
location /api/qorid/ {
    proxy_pass http://127.0.0.1:8082/api/qorid/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS headers (if not already set globally)
    add_header Access-Control-Allow-Origin "https://demiurge.cloud" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    
    if ($request_method = OPTIONS) {
        return 204;
    }
}

# DRC-369 API reverse proxy
location /api/drc369/ {
    proxy_pass http://127.0.0.1:8082/api/drc369/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    add_header Access-Control-Allow-Origin "https://demiurge.cloud" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    
    if ($request_method = OPTIONS) {
        return 204;
    }
}
```

Reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Systemd Service (Optional)

Create `/etc/systemd/system/qorid-service.service`:

```ini
[Unit]
Description=QorID Identity & DRC-369 Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/demiurge/apps/qorid-service
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable qorid-service
sudo systemctl start qorid-service
sudo systemctl status qorid-service
```

## Frontend Configuration

Update QOR OS portal environment variables:

Create or update `apps/qloud-os/.env.production`:

```env
VITE_QORID_MODE=remote
VITE_QORID_API_URL=https://demiurge.cloud/api/abyssid
VITE_DEMIURGE_RPC_URL=https://rpc.demiurge.cloud/rpc
```

Rebuild and deploy QOR OS:

```bash
cd apps/qloud-os
pnpm build
# Deploy dist/ to server
```

## API Endpoints

### Health Check

```bash
curl https://demiurge.cloud/api/qorid/healthz
```

### Register User

```bash
curl -X POST https://demiurge.cloud/api/qorid/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "publicKey": "0x1234..."
  }'
```

### Initialize Session

```bash
curl -X POST https://demiurge.cloud/api/qorid/session/init \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser"
  }'
```

### Confirm Session

```bash
curl -X POST https://demiurge.cloud/api/qorid/session/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": "...",
    "username": "testuser",
    "publicKey": "0x1234...",
    "signature": "..."
  }'
```

### Get Current User

```bash
curl https://demiurge.cloud/api/qorid/me \
  -H "Authorization: Bearer <sessionId>"
```

### Mint DRC-369 Asset

```bash
curl -X POST https://demiurge.cloud/api/drc369/assets/native \
  -H "Authorization: Bearer <sessionId>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Asset",
    "description": "Description",
    "uri": "https://example.com/asset.json",
    "contentType": "image"
  }'
```

## Database Management

The SQLite database is stored at the path specified in `SQLITE_PATH` (default: `./data/abyssid.sqlite`).

### Backup

```bash
cp data/abyssid.sqlite data/abyssid.sqlite.backup
```

### View Database

```bash
sqlite3 data/abyssid.sqlite
.tables
SELECT * FROM abyssid_users;
```

## Troubleshooting

### Service Not Starting

1. Check logs:
   ```bash
   journalctl -u qorid-service -f
   ```

2. Verify port is available:
   ```bash
   netstat -tulpn | grep 8082
   ```

3. Check database permissions:
   ```bash
   ls -la data/
   ```

### CORS Errors

Ensure `CORS_ORIGIN` in `.env` matches your frontend domain exactly.

### Session Issues

- Verify session expiration (default: 30 days)
- Check that `expires_at` in database is in the future
- Clear old sessions manually if needed

## Security Considerations

1. **Session Security**: Currently uses mock signatures. In production, implement proper cryptographic signature verification.

2. **Database**: SQLite is fine for devnet. For production, consider PostgreSQL with proper backups.

3. **HTTPS**: Always use HTTPS in production. The service should only be accessible via nginx reverse proxy.

4. **Rate Limiting**: Consider adding rate limiting middleware for production.

5. **Input Validation**: All endpoints use Zod validation, but additional sanitization may be needed.

## Future Enhancements

- Real cryptographic signature verification
- Integration with Demiurge chain for on-chain DRC-369 mints
- CGT accounting for file purchases and rewards
- WebSocket support for real-time updates
- Migration to PostgreSQL for production scale

