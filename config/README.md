# Demiurge Configuration

This directory contains all deployment configurations for the Demiurge ecosystem.

## Directory Structure

```
config/
├── production/           # Production server configs
│   ├── demiurge-node.service    # Systemd for blockchain node
│   ├── demiurge-hub.service     # Systemd for Hub app
│   ├── qor-auth.service         # Systemd for Auth service
│   ├── nginx.conf               # Nginx reverse proxy config
│   ├── qor-auth.toml            # Auth service configuration
│   ├── .env.hub                 # Hub environment variables
│   └── .secrets                 # NEVER COMMIT - generated secrets
└── README.md
```

## Security Notes

**NEVER commit these files:**
- `config/production/.secrets` - Contains JWT secrets and passwords
- Any file with real database passwords

## Generating Secrets

Before first deployment, generate secure secrets:

```bash
./scripts/deploy.sh generate-secrets
```

This creates `config/production/.secrets` with:
- JWT access token secret (64 bytes, base64)
- JWT refresh token secret (64 bytes, base64)
- Database password (32 chars, alphanumeric)

## Deployment

```bash
# Deploy everything
./scripts/deploy.sh all

# Deploy specific component
./scripts/deploy.sh node   # Blockchain node
./scripts/deploy.sh hub    # Web frontend
./scripts/deploy.sh auth   # Auth service
./scripts/deploy.sh nginx  # Nginx config

# Health check
./scripts/deploy.sh health
```

## Server Requirements

- Ubuntu 22.04+
- Node.js 20+
- Rust 1.80+
- PostgreSQL 16+
- Redis 7+
- Nginx with SSL certificates
