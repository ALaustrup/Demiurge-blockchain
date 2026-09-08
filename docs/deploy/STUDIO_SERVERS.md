# Studio servers (post-OVH)

The OVH VPS formerly called Monad/Pleroma is **unlinked**. It is not a runtime target.

Monad is the **local node identity**. Pleroma is **this machine**.

## Local servers (canonical)

| Service | Bind | Start |
|---------|------|--------|
| Postgres | `127.0.0.1:5432` | `npm run studio:servers` |
| Valkey | `127.0.0.1:6379` | `npm run studio:servers` |
| `demiurge-node` | `127.0.0.1:9944` | `npm run studio:node` |
| `qor-auth` | `127.0.0.1:8080` | `npm run studio:auth` |
| Hub | `127.0.0.1:3000` | `npm run studio:hub` |

Full stack:

```powershell
npm run studio:servers
npm run studio:start
```

Compose file: `docker-compose.studio.yml`. Start Docker Desktop first; if the engine is down, Studio falls back to WSL (`Ubuntu`). If WSL `sudo` prompts, run `wsl -d Ubuntu -- bash scripts/setup-qor-auth-wsl.sh` once in a terminal.

## Cloud (new, optional)

| Resource | Status |
|----------|--------|
| Neon project (hosted Postgres, optional) | Created for hosted qor-auth Postgres |
| Vercel team `astramatrix` | Available; Studio Hub stays local-first (needs local RPC) |
| Render | Not authorized in this environment |

Do not point Hub production env at the retired IP or at `rpc.demiurge.cloud` unless a **new** public node is provisioned.

## Retired

Remote SSH/systemd deploy scripts abort on purpose. Historical docs may still mention OVH; they are not operational.
