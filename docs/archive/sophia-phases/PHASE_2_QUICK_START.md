# Phase 2 Integration Quick Start

## Running the Sophia Portal with Phase 2 Systems

### Prerequisites
```bash
# Node.js 18+ with npm/yarn
# Git repository configured
# Environment variables set
```

### Quick Start

#### 1. Install Dependencies
```bash
cd x:\Demiurge-Blockchain
npm install

# Or from the sophia app directory
cd apps/sophia
npm install
```

#### 2. Development Server
```bash
# From workspace root
npm run dev

# Or specifically for Sophia
cd apps/sophia
npm run dev

# Sophia will run on: http://localhost:3000
```

#### 3. Access the Systems

**Dashboard (Home)**
```
http://localhost:3000/dashboard
```

**Individual Systems**
```
Mining:      http://localhost:3000/systems/mining
Wallet:      http://localhost:3000/systems/wallet
NFT Portal:  http://localhost:3000/systems/nft
Games:       http://localhost:3000/systems/games
Developer:   http://localhost:3000/systems/dev
```

### Environment Variables Required

Create `.env.local` in `apps/sophia/`:

```bash
# Blockchain RPC
NEXT_PUBLIC_DEMIURGE_RPC_URL=http://localhost:9944
NEXT_PUBLIC_DEMIURGE_URL=http://localhost:3000

# Auth Service
NEXT_PUBLIC_QOR_AUTH_URL=http://localhost:3001

# Optional: Production endpoints
# NEXT_PUBLIC_DEMIURGE_RPC_URL=https://rpc.demiurge.cloud
# NEXT_PUBLIC_DEMIURGE_URL=https://demiurge.cloud
# NEXT_PUBLIC_QOR_AUTH_URL=https://auth.demiurge.cloud
```

### Testing Authentication

The app requires authentication. For development:

1. **Navigate to**: `http://localhost:3000/auth`
2. **Login with**:
   - Email: `dev@example.com`
   - Password: `password123`
3. **Or**: Use mock auth in `lib/contexts/AuthContext.tsx`

### Building for Production

```bash
# From workspace root
npm run build

# Or from sophia app
cd apps/sophia
npm run build

# Run production build
npm run start
```

### Turbo Cache Management

```bash
# Clear Turbo cache if needed
npm run clean

# Rebuild everything
npm run build

# Watch mode with Turbo
npm run dev
```

---

## Component Integration Examples

### Using the Mining System Component

```tsx
import { MiningSystem } from '@components/systems/MiningSystem';

export default function MinePage() {
  return <MiningSystem />;
}
```

### Using Glass Panel in Your Component

```tsx
import { GlassPanel } from '@components/GlassPanel';

export default function MyComponent() {
  return (
    <GlassPanel blur="md" border="medium" className="p-6">
      <h2 className="text-white">My Content</h2>
    </GlassPanel>
  );
}
```

### Using Animated Background

```tsx
import { AnimatedBackground } from '@components/AnimatedBackground';

export default function MyPage() {
  return (
    <div className="relative min-h-screen bg-navy-900">
      <AnimatedBackground intensity="medium" />
      {/* Your content here */}
    </div>
  );
}
```

---

## API Integration Guide

### Making RPC Calls

```tsx
import { demiurgeRpc } from '@lib/api/demiurge-rpc';

// In a component or hook
const getBalance = async (qorId: string) => {
  try {
    const response = await demiurgeRpc.call('account_balance', {
      qor_id: qorId
    });
    return response;
  } catch (error) {
    console.error('Failed to fetch balance:', error);
  }
};
```

### Making Auth Calls

```tsx
import { qorAuth } from '@lib/api/qor-auth';

// Login
const login = async (email: string, password: string) => {
  try {
    const response = await qorAuth.login({
      email,
      password
    });
    localStorage.setItem('auth_token', response.token);
    return response;
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Get current user
const getCurrentUser = async () => {
  try {
    const response = await qorAuth.getCurrentUser();
    return response;
  } catch (error) {
    console.error('Failed to get user:', error);
  }
};
```

### Using Auth Context

```tsx
import { useAuth } from '@lib/contexts/AuthContext';

export default function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      Welcome, {user?.email}!
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## Extending Phase 2

### Adding a New System

1. **Create component file**:
   ```bash
   # components/systems/MySystem.tsx
   ```

2. **Create route page**:
   ```bash
   # app/systems/mysystem/page.tsx
   ```

3. **Add to dashboard**:
   Edit `components/dashboard/Dashboard.tsx` and add to systems array:
   ```tsx
   {
     id: "mysystem",
     name: "My System",
     description: "My awesome system",
     icon: "🚀",
     color: "from-primary-500 to-primary-600",
     url: "/systems/mysystem",
   }
   ```

### Adding a New Glass Panel Variant

Edit `components/GlassPanel.tsx` and modify the blur options:

```tsx
blur?: "sm" | "md" | "lg" | "xl" | "xxl"; // Add "xxl"
```

Then add corresponding Tailwind class:

```tsx
const blurClasses = {
  // ... existing
  "xxl": "backdrop-blur-3xl"
};
```

### Adding New Animations

Use Framer Motion in any component:

```tsx
import { motion } from 'framer-motion';

<motion.div
  animate={{ y: [0, -10, 0] }}
  transition={{ duration: 3, repeat: Infinity }}
>
  Animated Content
</motion.div>
```

---

## Debugging

### Enable React DevTools
Install React DevTools browser extension:
- [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

### Console Logging

```tsx
// Use in components
console.log('Component mounted:', props);
console.debug('Debug info:', data);
console.warn('Warning:', issue);
console.error('Error:', error);
```

### Check Build Errors

```bash
# Run TypeScript checker
npm run type-check

# Run linter
npm run lint

# Run tests
npm run test
```

### Network Debugging

Open DevTools > Network tab to see:
- API calls to RPC and Auth services
- iframe PostMessage communications
- WebSocket connections (if using real blockchain)

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Cache Issues

```bash
# Clear Next.js cache
rm -rf apps/sophia/.next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Auth Token Issues

```bash
# Clear localStorage in browser console
localStorage.clear()
```

### Hot Reload Not Working

```bash
# Restart dev server
npm run dev

# If still stuck, clear and rebuild
npm run clean
npm run dev
```

---

## Performance Optimization Tips

### Reduce Animation Intensity

In `components/AnimatedBackground.tsx`:
```tsx
// Change particle count
const particles = generateParticles(30); // was 60
```

### Lazy Load Components

```tsx
import dynamic from 'next/dynamic';

const MiningSystem = dynamic(
  () => import('@components/systems/MiningSystem'),
  { loading: () => <p>Loading...</p> }
);
```

### Image Optimization

Next.js automatically optimizes images, but use:
```tsx
import Image from 'next/image';

<Image 
  src="/image.png" 
  width={800} 
  height={600} 
  alt="Description"
/>
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Auth service running
- [ ] Blockchain RPC accessible
- [ ] Database migrations complete (if needed)
- [ ] Build passes without errors
- [ ] No console warnings
- [ ] Performance budget met
- [ ] Security scan passed
- [ ] Accessibility audit passed
- [ ] Responsiveness tested on mobile/tablet/desktop

---

## Support Resources

- **Documentation**: See `PHASE_2_SYSTEM_SPECIFICATIONS.md`
- **Architecture**: See `SOPHIA_ARCHITECTURE_VISUAL.md`
- **Design System**: See `SOPHIA_DESIGN_SYSTEM.md`
- **Code**: Check comments in component files
- **Discord**: https://discord.gg/demiurge (community help)

---

**Quick Reference**
```
Dashboard:  http://localhost:3000/dashboard
Mining:     http://localhost:3000/systems/mining
Wallet:     http://localhost:3000/systems/wallet
NFT:        http://localhost:3000/systems/nft
Games:      http://localhost:3000/systems/games
Developer:  http://localhost:3000/systems/dev
```

---

**Status**: Ready for Development  
**Version**: Phase 2 Complete  
**Last Updated**: January 2025

