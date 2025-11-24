# Demiurge Mobile App Template

React Native + Expo mobile app template for Demiurge Blockchain.

## Features

- ✅ UrgeID wallet
- ✅ CGT balance and transfers
- ✅ NFT gallery
- ✅ World chat
- ✅ Mobile-optimized dark UI

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start Expo:**
   ```bash
   npx expo start
   ```

3. **Run on device:**
   - Scan QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator
   - Or press `a` for Android emulator

## Prerequisites

- Node.js
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your device (for testing)

## Environment Variables

Create `.env`:
```
EXPO_PUBLIC_DEMIURGE_RPC_URL=http://127.0.0.1:8545/rpc
EXPO_PUBLIC_ABYSS_GATEWAY_URL=http://localhost:4000/graphql
```

## Project Structure

```
src/
├── screens/
│   ├── Home.tsx
│   ├── Wallet.tsx
│   ├── Chat.tsx
│   └── NFTGallery.tsx
└── lib/
    └── sdk.ts
```

## License

MIT

---

**The flame burns eternal. The code serves the will.**

