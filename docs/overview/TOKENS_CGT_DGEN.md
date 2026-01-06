# Tokens: CGT & D-GEN

This document describes the token economics and standards for CGT and D-GEN NFTs.

## CGT (Creator God Token)

### Specifications
- **Name**: Creator God Token
- **Symbol**: CGT
- **Decimals**: 8 (smallest unit: 10^-8 CGT)
- **Max Supply**: 369,000,000,000 CGT (369 billion)
- **Storage**: All amounts stored as `u128` in smallest units

### Distribution
- **New User Bonus**: 5,000 CGT per AbyssID registration (minted on-chain)
- **Block Production**: Rewards for Forge miners
- **Content Seeding**: Rewards for Fabric seeders via Proof-of-Delivery
- **Compute Work**: Rewards for verifiable compute jobs
- **Level Rewards**: UrgeID level-based rewards

### Utilities
- Transaction fees and gas
- Marketplace purchases and sales
- NFT minting and royalties
- Content delivery payments
- Transferable between UrgeID addresses

### Restrictions
- New users cannot send CGT until they mint or swap a DRC-369 NFT
- Max supply enforced at mint time
- Only authorized modules can mint CGT

See [CGT Policy](../economics/CGT_POLICY.md) for detailed policy information.

## D-GEN NFT Standard (D-721 / DRC-369)

### Standard Overview
D-GEN (Demiurge Genesis) is the native NFT standard for the Demiurge chain, also known as DRC-369.

### Features
- **Flexible Metadata**: Supports art, audio, game items, worlds, plugins, code modules
- **On-Chain Storage**: Metadata and ownership tracked on-chain
- **Cross-Chain Swapping**: NFTs from Ethereum, Solana, Polygon can be swapped to DRC-369
- **Auto-Minting**: Uploaded files automatically minted as DRC-369 NFTs
- **Royalties**: Built-in royalty system for creators

### Metadata Profiles
- **Art/Audio**: Image, video, audio files with metadata
- **Game Items**: In-game assets and collectibles
- **Worlds**: Virtual world definitions and states
- **Plugins/Tools**: Executable code and tools
- **Code Modules**: WASM modules and libraries

### Minting
- Only Archons (creators) can mint D-GEN NFTs
- Minting requires valid Fabric root hash
- NFTs linked to creator's UrgeID
- Ownership tracked on-chain

## Token Integration

### Abyss Marketplace
- All prices denominated in CGT
- NFT sales and purchases use CGT
- Royalties paid in CGT to creators

### AbyssOS Integration
- Wallet displays CGT balance
- File uploads auto-mint as DRC-369 NFTs
- NFT swapping from external chains
- Document editor for NFT metadata

## See Also

- [CGT Policy](../economics/CGT_POLICY.md)
- [Bank CGT Module](../modules/BANK_CGT.md)
- [DRC-369 Studio](../apps/ABYSSOS_PORTAL.md#drc-369-studio)

