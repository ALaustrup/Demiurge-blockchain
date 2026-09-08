# Local-first migration note

The old Vercel/Fly/Monad split is no longer the primary deployment model for this repository.

`Monad` / `Pleroma` have been retired as active infrastructure targets. The supported path is now a
single-machine local stack on Windows + WSL:

- `demiurge-node` on `localhost:9944`
- Postgres on `localhost:5432`
- Valkey/Redis on `localhost:6379`
- `qor-auth` on `localhost:8080`
- Hub on `localhost:3000`

Use the local runbook instead:

- [LOCAL_FIRST.md](./LOCAL_FIRST.md)

## Historical note

Cloud-specific files such as `apps/*/vercel.json`, `services/qor-auth/fly.toml`, and the
`.env.vercel.example` / `.env.fly.example` files remain in the repository as optional references,
but they are no longer the source of truth for bringing the ecosystem up.

Before using any hosted deployment flow, first verify the local stack from
[LOCAL_FIRST.md](./LOCAL_FIRST.md).
