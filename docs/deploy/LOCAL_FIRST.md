# Local-First Stack

This repository powers **[Demiurge Studio](../DEMIURGE_STUDIO.md)** — local hosting is the primary operating model.

Prefer `npm run studio:*` scripts (aliases of `local:*` and `qor-auth:*`). See the [Studio guide](../DEMIURGE_STUDIO.md) for the creator workflow.

## Core stack

Run these services locally:

1. `demiurge-node` on `127.0.0.1:9944`
2. Postgres on `127.0.0.1:5432`
3. Valkey/Redis on `127.0.0.1:6379`
4. `qor-auth` on `127.0.0.1:8080`
5. Hub (Demiurge Studio UI) on `127.0.0.1:3000`

Optional add-ons:

- `marketing-site` on `127.0.0.1:3001`
- `Sophia` on `127.0.0.1:3003`

## Startup order

From the repo root:

```powershell
npm run qor-auth:infra
npm run local:node
npm run qor-auth:run
npm run local:hub
```

Optional:

```powershell
npm run local:marketing
npm run local:sophia
```

If Hub warns that wallet WASM artifacts are incomplete, run:

```powershell
npm run wallet-wasm:build
```

## Health checks

Use:

```powershell
npm run local:health
```

Expected ports:

- `9944` node RPC
- `30333` node P2P
- `5432` Postgres
- `6379` Valkey/Redis
- `8080` `qor-auth`
- `3000` Hub
- `3001` marketing-site (optional)
- `3003` Sophia (optional)

## Reboot checklist

After a reboot:

1. Start WSL and re-run `npm run qor-auth:infra`
2. Start the node with `npm run local:node`
3. Start `qor-auth` with `npm run qor-auth:run`
4. Start Hub with `npm run local:hub`
5. Run `npm run local:health`

## Optional external services

The local core stack does not require a remote blockchain server.

These integrations are still optional and external:

- LLM API keys for Sophia
- Stripe for donations/subscriptions
- Pinata / IPFS providers for decentralized uploads

## Known limitations

- `apps/nft/drc-369portal` is not part of the supported local-first stack yet.
- Hub wallet WASM requires a one-time `wasm-pack` build if `packages/wallet-wasm/pkg/wallet_wasm_bg.wasm`
  is missing.
- Some marketing and developer-facing copy may still mention historical hosted domains as examples.
