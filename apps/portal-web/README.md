# Demiurge Portal Web

The Next.js web portal for the Demiurge blockchain ecosystem.

## Features

- **Live Chain Status**: Real-time chain height, CGT metadata, and total supply
- **UrgeID Onboarding**: Create your sovereign identity with Ed25519 keypair
- **UrgeID Dashboard**: 
  - Profile management (display name, bio, handle)
  - CGT balance display (human-readable + smallest units)
  - Syzygy score and badges
  - Transaction history (sent/received with status polling)
  - Send CGT with Ed25519 signing
  - Vault export/import (password-encrypted)
- **Genesis Archon Dashboard**: Balance, Archon status, and NFT display
- **Mint Test NFT**: Dev-only button for minting test NFTs

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Demiurge chain node running on `http://127.0.0.1:8545`

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
pnpm build
```

### Key Libraries

- **Next.js 16+**: App Router, React Server Components
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first styling
- **Framer Motion**: Animations
- **@noble/ed25519**: Ed25519 signing for transactions
- **react-qr-code**: QR code generation for UrgeID addresses
- **bech32**: Address encoding (for future use)

## Project Structure

```
apps/portal-web/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx      # Landing page
│   │   └── urgeid/       # UrgeID onboarding and dashboard
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   │   ├── rpc.ts        # RPC client helpers
│   │   ├── signing.ts    # Ed25519 signing
│   │   ├── transactions.ts # Transaction history
│   │   └── urgeid.ts     # UrgeID formatting
│   └── config/           # Configuration
└── public/               # Static assets
```

## Environment Variables

- `NEXT_PUBLIC_DEMIURGE_RPC_URL`: RPC endpoint (default: `http://127.0.0.1:8545/rpc`)

## Deploy on Vercel

The portal is configured for Vercel deployment. Ensure `.gitignore` excludes large build artifacts (`target/`, `node_modules/`, `.next/`, etc.) to avoid pushing unnecessary files.
