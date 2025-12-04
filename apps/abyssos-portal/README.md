# AbyssOS Portal

A full-screen, cybernetic "remote desktop" environment for the Demiurge Blockchain.

## Features

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

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0 (or npm/yarn)

### Setup

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

The app will be available at `http://localhost:3001`

### Environment Variables

Create a `.env` file (optional):

```env
VITE_DEMIURGE_RPC_URL=https://rpc.demiurge.cloud/rpc
```

If not set, defaults to `https://rpc.demiurge.cloud/rpc`.

## Building for Production

```bash
# Build static assets
pnpm build
```

Output will be in the `dist/` directory, ready to be served by any static file server.

## Deployment

### Quick Deploy to Node0 Server

1. **Build locally:**
   ```bash
   pnpm install
   pnpm build
   ```

2. **Copy to server:**
   ```bash
   scp -r dist/* ubuntu@51.210.209.112:/var/www/abyssos-portal/
   ```

3. **Configure Nginx:**

   Create or update `/etc/nginx/sites-available/demiurge.cloud`:
   ```nginx
   server {
       listen 80;
       server_name demiurge.cloud;

       root /var/www/abyssos-portal;
       index index.html;

       location / {
           try_files $uri /index.html;
       }

       # Optional: Add security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
   }
   ```

4. **Enable site and reload:**
   ```bash
   sudo ln -sf /etc/nginx/sites-available/demiurge.cloud /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Set up SSL (optional, using Let's Encrypt):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d demiurge.cloud
   ```

### Server Setup (First Time)

If `/var/www/abyssos-portal` doesn't exist on the server:

```bash
# SSH into server
ssh ubuntu@51.210.209.112

# Create directory
sudo mkdir -p /var/www/abyssos-portal
sudo chown -R ubuntu:ubuntu /var/www/abyssos-portal
```

## Project Structure

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
├── dist/                 # Build output (gitignored)
└── package.json
```

## Extending AbyssOS

### Adding a New App

1. **Create app component** in `src/components/desktop/apps/`:
   ```tsx
   export function MyNewApp() {
     return <div>My App Content</div>;
   }
   ```

2. **Add to desktop store** (`src/state/desktopStore.ts`):
   ```ts
   export type AppId = 'chainOps' | 'miner' | 'wallet' | 'myNewApp';
   ```

3. **Register in Desktop** (`src/routes/Desktop.tsx`):
   ```tsx
   import { MyNewApp } from '../components/desktop/apps/MyNewApp';
   
   const appComponents: Record<string, React.ComponentType> = {
     // ... existing apps
     myNewApp: MyNewApp,
   };
   ```

4. **Add to dock** (`src/components/desktop/CircularDock.tsx`):
   ```tsx
   const apps = [
     // ... existing apps
     { id: 'myNewApp' as const, label: 'My App', icon: '🎮' },
   ];
   ```

### Integrating External Apps (e.g., Mandelbrot Miner)

If you have an external app running at a URL, you can embed it in a window:

```tsx
export function MinerApp() {
  return (
    <iframe
      src="https://miner.demiurge.cloud"
      className="w-full h-full border-0"
      title="Mandelbrot Miner"
    />
  );
}
```

### Customizing RPC Endpoint

The RPC client automatically uses `VITE_DEMIURGE_RPC_URL` from environment variables. To change it:

1. Set in `.env` file during development
2. Set as environment variable during build:
   ```bash
   VITE_DEMIURGE_RPC_URL=https://custom-rpc.example.com/rpc pnpm build
   ```

## Troubleshooting

### RPC Connection Issues

- Check that the RPC endpoint is accessible
- Verify CORS settings on the RPC server
- Check browser console for errors

### Build Issues

- Ensure Node.js version >= 18
- Clear `node_modules` and reinstall: `rm -rf node_modules && pnpm install`

### Deployment Issues

- Verify nginx config: `sudo nginx -t`
- Check file permissions: `ls -la /var/www/abyssos-portal`
- Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`

## License

Part of the Demiurge Blockchain ecosystem.

