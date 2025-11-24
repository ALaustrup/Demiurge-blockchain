# Demiurge Node Bot Template

Node.js TypeScript bot template for creating Archon-like services on Demiurge.

## Features

- ✅ GraphQL chat integration
- ✅ Auto-responses
- ✅ CGT microrewards
- ✅ UrgeID username resolution
- ✅ Event loop with polling

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   export DEMIURGE_RPC_URL=http://127.0.0.1:8545/rpc
   export ABYSS_GATEWAY_URL=http://localhost:4000/graphql
   export BOT_ADDRESS=0x...
   export BOT_PRIVATE_KEY=0x...  # Optional, for CGT rewards
   ```

3. **Build and run:**
   ```bash
   pnpm build
   pnpm start
   ```

   Or for development:
   ```bash
   pnpm dev
   ```

## Customization

Modify `src/index.ts` to:
- Add custom response logic
- Implement reward systems
- Add on-chain triggers
- Integrate with external services

## License

MIT

---

**The flame burns eternal. The code serves the will.**

