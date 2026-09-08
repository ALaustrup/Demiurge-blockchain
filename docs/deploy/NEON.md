# Neon — QOR Auth database (Phase 3)

**Project:** `demiurge-qor-auth`  
**Project ID:** stored in the gitignored `services/qor-auth/.env.neon` only  
**Branch:** `main` (`br-soft-grass-ajx8s2qu`)  
**Region:** `us-east-2` (AWS)

## Connection

Use the **pooler** URI from the Neon console (Connection details → Pooler → `psql`).

Format:

```text
postgresql://USER:PASSWORD@ep-XXXX-pooler.region.aws.neon.tech/neondb?sslmode=require
```

Set as:

- Fly: `fly secrets set QOR_AUTH__DATABASE__URL="..." -a demiurge-qor-auth`
- Vercel Hub: `DATABASE_URL` (same DB; Hub VYB tables coexist in `neondb`)

Migrations run automatically when `qor-auth` starts.

## Security

- Do not commit connection strings to git.
- Rotate credentials in Neon if exposed.
- Prefer a dedicated DB role with least privilege for production.
