# AbyssOS Portal

**AbyssOS** is a full-screen, cybernetic "remote desktop" environment for the Demiurge Blockchain, served at `https://demiurge.cloud`.

## Overview

AbyssOS provides a complete desktop-style interface for interacting with the Demiurge ecosystem, featuring:

- **Boot Screen**: Animated "A B Y S S OS" intro with glitch effects
- **AbyssID Authentication**: Login and signup flow with local account management
- **Desktop Environment**: Full-screen desktop with circular dock launcher
- **Chain Ops**: Real-time Demiurge blockchain status and metrics
- **Window Management**: Draggable, resizable windows for apps
- **Live RPC Integration**: Connects to Demiurge RPC endpoint for chain data

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Zustand** for state management

## Architecture

### Project Structure

```
apps/abyssos-portal/
├── src/
│   ├── routes/           # Main screens (BootScreen, LoginScreen, Desktop)
│   ├── components/
│   │   ├── layout/       # FullscreenContainer, AbyssBackground
│   │   ├── auth/         # LoginForm, SignupModal
│   │   ├── desktop/      # Dock, WindowFrame, StatusBar, Apps
│   │   └── shared/       # Button, Card, GlitchText
│   ├── state/            # Zustand stores (authStore, desktopStore)
│   ├── lib/              # RPC client, AbyssID client
│   └── styles/           # Global CSS
├── dist/                 # Build output
└── package.json
```

### Core Components

#### Boot Screen
- Animated glitch text effect
- Auto-transitions to login/desktop after 2.5 seconds
- Skips if user is already authenticated

#### AbyssID Authentication
- **Login**: Username + public key/code authentication
- **Signup**: Username availability check, secret code generation, backup flow
- **Storage**: LocalStorage-based account management (ready for real AbyssID SDK integration)

#### Desktop Environment
- **Circular Dock**: Central launcher with app icons
- **Window System**: Draggable windows with title bars and close buttons
- **Status Bar**: Real-time chain height, online status, username
- **Background**: Animated cosmic abyss with glitch effects

#### Apps

**Chain Ops**
- Real-time chain height from `cgt_getChainInfo` RPC call
- Network status indicator
- RPC endpoint display
- Auto-refreshes every 10 seconds

**Mandelbrot Miner** (Placeholder)
- Ready for future integration
- Can embed external apps via iframe

**Accounts / Wallet**
- Display username and public key
- Mock CGT balance (ready for real wallet integration)
- AbyssID Wallet connection button

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0 (or npm/yarn)

### Setup

```bash
cd apps/abyssos-portal
pnpm install
pnpm dev
```

The app will be available at `http://localhost:3001`

### Environment Variables

Create a `.env` file (optional):

```env
VITE_DEMIURGE_RPC_URL=https://rpc.demiurge.cloud/rpc
```

If not set, defaults to `https://rpc.demiurge.cloud/rpc`.

### Building

```bash
pnpm build
```

Output will be in the `dist/` directory, ready to be served by any static file server.

## Deployment

### Production Deployment

AbyssOS is currently deployed at `https://demiurge.cloud` on Node0 (51.210.209.112).

#### Deployment Steps

1. **Build locally:**
   ```bash
   cd apps/abyssos-portal
   pnpm install
   pnpm build
   ```

2. **Copy to server:**
   ```bash
   scp -r dist/* ubuntu@51.210.209.112:/var/www/abyssos-portal/
   ```

3. **Nginx Configuration:**
   - Config file: `/etc/nginx/sites-available/demiurge.cloud`
   - Serves from: `/var/www/abyssos-portal`
   - HTTPS enabled with Let's Encrypt certificates
   - HTTP redirects to HTTPS

4. **SSL Certificates:**
   - Managed by certbot
   - Auto-renewal configured
   - Valid for: `demiurge.cloud`, `www.demiurge.cloud`, `rpc.demiurge.cloud`

See [Deployment Guide](../deployment/README_NODE0.md) for complete server setup instructions.

## RPC Integration

### DemiurgeRPC Client

The `DemiurgeRPC` client (`src/lib/demiurgeRpcClient.ts`) provides:

- **getChainInfo()**: Fetches current chain height
- **request()**: Generic JSON-RPC method caller
- **Error Handling**: Graceful fallbacks for network failures

### RPC Endpoint

- **Production**: `https://rpc.demiurge.cloud/rpc`
- **Development**: Configurable via `VITE_DEMIURGE_RPC_URL`
- **CORS**: Enabled on RPC proxy server

## Extending AbyssOS

### Adding a New App

1. Create app component in `src/components/desktop/apps/`
2. Add app ID to `desktopStore.ts`
3. Register in `Desktop.tsx` app components map
4. Add icon to `CircularDock.tsx`

See [AbyssOS README](../../apps/abyssos-portal/README.md) for detailed instructions.

### Integrating External Apps

External apps can be embedded via iframe:

```tsx
export function ExternalApp() {
  return (
    <iframe
      src="https://external-app.demiurge.cloud"
      className="w-full h-full border-0"
      title="External App"
    />
  );
}
```

## Future Integration Points

### AbyssID Wallet SDK
- Current: LocalStorage-based mock implementation
- Future: Replace `abyssIdClient.ts` with real SDK
- Integration point: `src/lib/abyssIdClient.ts`

### Real Wallet Connection
- Current: Mock CGT balance display
- Future: Connect to AbyssID Wallet extension
- Integration point: `src/components/desktop/apps/WalletApp.tsx`

### Mandelbrot Miner
- Current: Placeholder component
- Future: Embed or integrate mining game
- Integration point: `src/components/desktop/apps/MinerApp.tsx`

## Troubleshooting

### RPC Connection Issues
- Verify RPC endpoint is accessible
- Check CORS settings on RPC server
- Review browser console for errors

### Build Issues
- Ensure Node.js version >= 18
- Clear `node_modules` and reinstall

### Deployment Issues
- Verify nginx config: `sudo nginx -t`
- Check file permissions
- Review nginx error logs

## Related Documentation

- [AbyssOS README](../../apps/abyssos-portal/README.md) - Detailed development guide
- [Deployment Guide](../deployment/README_NODE0.md) - Server setup and deployment
- [RPC API](../api/RPC.md) - Demiurge RPC methods

