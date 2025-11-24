# Demiurge Web App Template

Full-featured Next.js + TypeScript dApp template for building on Demiurge Blockchain.

## Features

- ✅ UrgeID generation and login
- ✅ CGT balance viewing and transfers
- ✅ NFT collection viewer
- ✅ Marketplace integration
- ✅ World chat integration
- ✅ Transaction signing with Ed25519
- ✅ SDK integration

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your RPC and GraphQL URLs
   ```

3. **Start development server:**
   ```bash
   pnpm dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Prerequisites

- **Demiurge Chain Node** running at `http://127.0.0.1:8545/rpc`
- **Abyss Gateway** running at `http://localhost:4000/graphql` (for chat)

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Home page
│   ├── urgeid/            # UrgeID page
│   ├── wallet/             # Wallet page
│   ├── nfts/               # NFT gallery
│   ├── marketplace/        # Marketplace
│   └── chat/               # Chat interface
├── hooks/
│   └── useUrgeID.ts        # UrgeID hook
└── lib/
    └── sdk.ts              # SDK initialization
```

## Customization

This template is a starting point. Customize it for your needs:

1. **Add new pages** in `src/app/`
2. **Create custom hooks** in `src/hooks/`
3. **Add components** in `src/components/`
4. **Modify styling** in `tailwind.config.ts`

## SDK Usage

All chain interactions use the Demiurge TypeScript SDK:

```typescript
import { sdk } from "@/lib/sdk";

// Get balance
const balance = await sdk.cgt.getBalanceFormatted(address);

// Get NFTs
const nfts = await sdk.nft.getNftsByOwner(address);

// Send transaction
const { unsignedTxHex } = await sdk.cgt.buildTransfer(from, to, amount);
const signature = await signTransactionHex(unsignedTxHex, privateKey);
await sdk.cgt.sendRawTransaction(unsignedTxHex);
```

## Deployment

This template is ready for deployment to Vercel, Netlify, or any Next.js-compatible platform.

```bash
pnpm build
pnpm start
```

## License

MIT

---

**The flame burns eternal. The code serves the will.**

