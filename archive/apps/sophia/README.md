# Project Sophia - Initial Project Scaffold

This directory will contain the Next-Generation Mainnet Portal for Demiurge Blockchain.

## Quick Start

```bash
# Navigate to project
cd apps/sophia

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Start development server
npm run dev
```

Development server runs on `http://localhost:3002` (reserved to avoid conflicts with hub:3000, ai-website:3000).

## Project Status

🚧 **Phase**: Architecture & Planning  
📋 **Template**: Next.js 16+ with App Router, TypeScript, Tailwind CSS  
🎯 **Goal**: Main entry portal for demiurge.cloud

## Key Files & Components

### Pages
- **`src/app/page.tsx`** - Landing page with intro animation
- **`src/app/auth/login/page.tsx`** - Login page
- **`src/app/auth/signup/page.tsx`** - Sign-up page
- **`src/app/dashboard/page.tsx`** - Main home/dashboard
- **`src/app/systems/[system]/page.tsx`** - Dynamic system pages

### Components
- **`src/components/landing/IntroAnimation.tsx`** - 3D/animated intro
- **`src/components/auth/LoginForm.tsx`** - Auth form
- **`src/components/dashboard/SystemGrid.tsx`** - System card grid
- **`src/components/sophia/SophiaChat.tsx`** - Floating AI chat
- **`src/components/systems/PortalEmbed.tsx`** - Iframe wrapper

### Services
- **`src/lib/qor-auth.ts`** - QOR ID integration
- **`src/lib/sophia-ai.ts`** - Sophia AI integration
- **`src/lib/system-router.ts`** - Smart routing logic

## Documentation

See `PROJECT_SOPHIA_SPEC.md` in repo root for:
- Complete architecture
- User flows
- Component specifications
- Development phases
- Integration points

## Environment Setup

```bash
# .env.local template
NEXT_PUBLIC_QOR_AUTH_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_RPC_URL=http://localhost:9944
NEXT_PUBLIC_NFT_PORTAL_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

## Turbo Integration

This project is managed by Turbo monorepo. Key tasks:

```bash
# From repo root
turbo run dev          # Watch all workspaces including sophia
turbo run build        # Build all including sophia
turbo run lint         # Lint all workspaces
```

## Next Steps

1. ✅ Create project structure
2. ⏳ Implement landing page & animations
3. ⏳ Integrate QOR ID authentication
4. ⏳ Build dashboard & system grid
5. ⏳ Implement Sophia AI integration
6. ⏳ Test cross-portal embedding

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Turbo Docs**: https://turbo.build/repo/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Framer Motion** (for animations): https://www.framer.com/motion/
- **Vercel AI SDK**: https://sdk.vercel.ai/

---

**Created**: January 22, 2026  
**Status**: Scaffold ready for implementation
