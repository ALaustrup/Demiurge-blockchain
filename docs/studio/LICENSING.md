# Demiurge Studio licensing

Offline registration plus CD-key activation for sellable Studio editions.

## Editions

| Edition | CD-key prefix | Typical use |
|---------|---------------|-------------|
| **Free** | (none) | Default after offline signup |
| **Creator** | `DS-CREATOR-…` | DRC-369, Unreal plugin, agents |
| **Pro** | `DS-PRO-…` | + analytics, Scatter3D |
| **Enterprise** | `DS-ENTERPRISE-…` | + white-label, team seats |

Keys look like: `DS-CREATOR-A7K9M-X2P4Q-R8N3W`

Only a **SHA-256 hash** is stored in Postgres — plaintext keys cannot be recovered from the database.

## User flow

1. **Create account** — http://localhost:3000/register (no email required)
2. **Optional CD-key** — enter during signup or later at http://localhost:3000/activate
3. **Machine binding** — each key allows `max_activations` machines (default 2)

## Generate keys (you, the vendor)

1. Set in `services/qor-auth/.env`:

```env
STUDIO_MODE=true
STUDIO_LICENSE_ADMIN_SECRET=your-long-random-secret
```

2. Restart qor-auth, then:

```powershell
.\scripts\generate-studio-keys.ps1 -Edition creator -Count 10
```

3. Distribute keys to customers (email, Gumroad, etc.). They activate inside Studio while offline.

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `STUDIO_MODE` | `true` | Enable Studio licensing APIs |
| `STUDIO_REQUIRE_LICENSE` | `false` | If `true`, block features until a paid key is activated |
| `STUDIO_LICENSE_ADMIN_SECRET` | (unset) | Required to call `/studio/admin/generate-keys` |

## API

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/studio/editions` | Public |
| POST | `/api/v1/studio/activate` | Bearer token |
| GET | `/api/v1/studio/license` | Bearer token |
| POST | `/api/v1/studio/admin/generate-keys` | `X-Studio-Admin-Secret` header |
