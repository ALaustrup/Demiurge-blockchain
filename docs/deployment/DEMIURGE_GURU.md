# Demiurge.Guru Deployment

Configuration for deploying to https://demiurge.guru

## Deployment Strategy

| Component | Platform | URL |
|-----------|----------|-----|
| Portal Web | **Vercel** | https://demiurge.guru |
| QOR ID Service | Server (51.210.209.112) | https://api.demiurge.guru |
| QOR Gateway | Server | https://gateway.demiurge.guru |
| RPC Node | Server | https://rpc.demiurge.cloud |

## Domain Mapping

```
Demiurge.Guru
├── / (root)           → Portal Web (Vercel)
│   └── "Enter Abyss"  → QLOUD OS
├── api.demiurge.guru  → QOR ID Service (Server)
├── gateway.demiurge.guru → QOR Gateway (Server)
└── rpc.demiurge.cloud → RPC endpoint (existing)
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   demiurge.guru (Vercel)                │
│  ┌─────────────────────────────────────────────────┐    │
│  │           Portal Web (Landing Page)              │    │
│  │  - Project information                          │    │
│  │  - Feature showcase                             │    │
│  │  - "Enter the Abyss" button                     │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│              Click "Enter the Abyss"                    │
│                          ▼                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │              QLOUD OS                      │    │
│  │  - Intro video                                  │    │
│  │  - QorID login/signup                         │    │
│  │  - Full desktop environment                     │    │
│  │  - 2GB cloud storage per user                   │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│ api.demiurge│    │gateway.demiurge │    │rpc.demiurge │
│    .guru    │    │     .guru       │    │   .cloud    │
│  (QorID)  │    │  (GraphQL API)  │    │   (RPC)     │
└─────────────┘    └─────────────────┘    └─────────────┘
         └──────────────────┬──────────────────┘
                            ▼
                   ┌─────────────────┐
                   │  51.210.209.112 │
                   │  (Server)       │
                   └─────────────────┘
```

---

## Part 1: Vercel Deployment (Portal Web)

### Prerequisites

- Vercel account (https://vercel.com)
- GitHub repo connected to Vercel
- Domain `demiurge.guru` configured in your DNS provider

### Step 1: Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Select the **DEMIURGE** repository
4. Configure the project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/portal-web`
   - **Build Command:** `pnpm build`
   - **Install Command:** `pnpm install`

### Step 2: Configure Environment Variables

In Vercel Dashboard → Project → **Settings** → **Environment Variables**, add:

| Variable | Production Value |
|----------|-----------------|
| `NEXT_PUBLIC_QORID_API_URL` | `https://api.demiurge.guru` |
| `NEXT_PUBLIC_DEMIURGE_RPC_URL` | `https://rpc.demiurge.cloud/rpc` |
| `NEXT_PUBLIC_ABYSS_GATEWAY_URL` | `https://gateway.demiurge.guru/graphql` |
| `NEXT_PUBLIC_ARCHONAI_URL` | `https://archonai.demiurge.guru` |
| `NEXT_PUBLIC_GENESIS_MODE` | `false` |
| `NEXT_PUBLIC_FABRIC_MODE` | `prod` |
| `NEXT_PUBLIC_FABRIC_PROD_ENDPOINT` | `https://fabric.demiurge.xyz/api/fabric` |

### Step 3: Configure Domain

1. Go to **Settings** → **Domains**
2. Add `demiurge.guru`
3. Add `www.demiurge.guru` (redirect to apex)
4. Update DNS records as instructed by Vercel:
   ```
   Type  Name  Value
   A     @     76.76.21.21
   CNAME www   cname.vercel-dns.com
   ```

### Step 4: Deploy

```bash
# Push to trigger deployment
git push origin D2

# Or manually deploy from Vercel CLI
npx vercel --prod
```

### Vercel CLI (Optional)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from apps/portal-web
cd apps/portal-web
vercel --prod
```

---

## Part 2: Server Configuration (Backend Services)

Backend services remain on **51.210.209.112**.

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/api.demiurge.guru

# QOR ID Service API
server {
    listen 443 ssl http2;
    server_name api.demiurge.guru;

    ssl_certificate /etc/letsencrypt/live/api.demiurge.guru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.demiurge.guru/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8082;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS for Vercel
        add_header Access-Control-Allow-Origin "https://demiurge.guru" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    }
}

# QOR Gateway GraphQL
server {
    listen 443 ssl http2;
    server_name gateway.demiurge.guru;

    ssl_certificate /etc/letsencrypt/live/gateway.demiurge.guru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gateway.demiurge.guru/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS for Vercel
        add_header Access-Control-Allow-Origin "https://demiurge.guru" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    }
}

# HTTP redirect
server {
    listen 80;
    server_name api.demiurge.guru gateway.demiurge.guru;
    return 301 https://$server_name$request_uri;
}
```

### QOR ID Service Environment

```env
# apps/qorid-service/.env
PORT=8082
CORS_ORIGIN=https://demiurge.guru
NODE_ENV=production
```

### SSL Setup for Subdomains

```bash
# Get certificates for API subdomains
sudo certbot --nginx -d api.demiurge.guru -d gateway.demiurge.guru

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Start Services

```bash
# QOR ID Service
cd /opt/demiurge/apps/qorid-service
pnpm install --production
pm2 start dist/index.js --name qorid-service

# QOR Gateway (Indexer)
cd /opt/demiurge/indexer/qor-gateway
pnpm install --production
pm2 start dist/index.js --name qor-gateway

# Save PM2 config
pm2 save
pm2 startup
```

---

## Verification Checklist

| Check | Command/URL |
|-------|-------------|
| Portal Web | Visit https://demiurge.guru |
| QorID API | `curl https://api.demiurge.guru/healthz` |
| Gateway GraphQL | `curl https://gateway.demiurge.guru/graphql` |
| RPC Endpoint | `curl https://rpc.demiurge.cloud/rpc` |
| SSL Certificates | `curl -I https://demiurge.guru` |

---

## Troubleshooting

### Vercel Build Fails

```bash
# Test build locally
cd apps/portal-web
pnpm install
pnpm build
```

### CORS Errors

Check nginx CORS headers and ensure `CORS_ORIGIN` in QorID service matches `https://demiurge.guru`.

### Domain Not Resolving

1. Verify DNS propagation: `dig demiurge.guru`
2. Check Vercel domain settings
3. Wait up to 48h for DNS propagation

### API Connection Issues

```bash
# Test from server
curl http://127.0.0.1:8082/healthz

# Check service logs
pm2 logs qorid-service
```

---

*Last updated: January 7, 2026*
