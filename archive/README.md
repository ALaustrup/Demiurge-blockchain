# Archive

Code and scripts moved out of the active tree during the Phase 0 cleanup (September 2026).
Nothing here is built, tested, or maintained. It is kept for reference only.

| Path | What it was | Why it is here |
|------|-------------|----------------|
| `apps/sophia` | Standalone Next.js 16 Sophia AI app | A drifted fork of the Sophia implementation inside `apps/hub`. Build ignored TypeScript errors. Merge target is the Hub. |
| `apps/nft` | "DRC-369 Portal" web + Expo mobile app | Create.xyz-generated scaffold on a separate Neon Postgres, not connected to the chain. Admin console returned fabricated output. |
| `apps/guru` | `sophia-demo` CLI prototype | Early standalone experiment outside the npm workspace. |
| `packages/blockchain-wasm` | 33-line wasm stub | Returned hard-coded `"0"` balances and a zero hash. |
| `substrate-pallets/aeons` | `pallet-cgt`, `pallet-qor-id` (Substrate FRAME) | Real pallets from the Substrate era; no runtime builds them and they duplicate `framework/modules/balances` and identity. |
| `tools/` | `qor-installer`, `qor-launcher`, `spline-mcp-server` | README-only placeholders with no code. |
| `root-scripts/` | `ignite_demiurge.sh`, `demiurge-server.sh`, `.workspaces/` | Targeted the deleted `blockchain/` directory and the retired OVH host. |
| `scripts/` | 93 scripts | Substrate fork/patch surgery, OVH/SSH/SSL/Vercel deploy scripts, server setup guides. The active Studio scripts remain in `/scripts`. |

Research-grade protocol code (ZK, agentic, governance, sharding, modular consensus) was moved to `framework/research/`, not here, because it may return once the base protocol is real. See `framework/research/README.md`.

Inflated status and claim documents were moved to `docs/archive/claims-2026-02/`.
