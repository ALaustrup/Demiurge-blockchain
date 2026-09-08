# 🧙‍♀️ Project Sophia - Overview

**Demiurge's Next-Generation Mainnet Portal**

## What is Project Sophia?

Project Sophia is the **central hub** for the Demiurge Blockchain ecosystem, serving as:

1. **Entry Point** - `demiurge.cloud` landing with immersive intro animations
2. **Authentication Gate** - Secure QOR ID login/signup system
3. **Navigation Hub** - Smart dashboard with system selection and routing
4. **AI Assistant** - Sophia, the intelligent gatekeeper directing users through the ecosystem
5. **Account Management** - Unified interface for all user settings and operations

## Core Philosophy

Sophia embodies the **Gnostic principle** of the Demiurge:
- **Monad** (physical server) ↔ **Pleroma** (destination)
- Sophia as the wisdom that guides users through creation
- Clean, organized, yet immersive and futuristic

## Three Pillars

### 🎨 User Experience
- Landing page with 3D/animated intro (first impression)
- Game launcher-like dashboard (familiar, immersive)
- Seamless system discovery and navigation
- Responsive design (desktop, tablet, mobile)

### 🤖 AI Intelligence
- Sophia chat as context-aware assistant
- Natural language navigation ("I want to check my NFTs")
- Smart account management with 2FA security
- Personalized ecosystem suggestions

### 🔐 Security & Trust
- QOR ID username-based identity (not wallet-dependent)
- Secure JWT authentication with refresh tokens
- 2FA verification for sensitive operations
- All user data in PostgreSQL with encryption

## Architecture

```
demiurge.cloud
    ↓
Landing Page (Intro Animation)
    ↓
QOR ID Auth Gate
    ↓
Sophia Dashboard (Main Hub)
    ├─ System Grid (Cards for each ecosystem service)
    ├─ Sophia Chat (Floating AI button)
    ├─ Account Settings
    └─ Quick Access Favorites
    ↓
System Selection
    ├─ Wallet (CGT Balance)
    ├─ NFT Portal (DRC-369)
    ├─ Mining Portal
    ├─ Games Launcher
    ├─ Game Dev SDK
    ├─ Chain Dev Tools
    ├─ Knowledgebase
    └─ Community Forum
```

## User Journey Example

### New User
```
1. Visit demiurge.cloud → See intro animation
2. Click "Enter Portal" → Fade to auth gate
3. Click "Sign Up" → Create account
4. Email verification (optional)
5. Land on dashboard → Welcome from Sophia
6. Click system card (e.g., "Wallet") or ask Sophia
7. System loads (embedded or new tab)
```

### Existing User
```
1. Visit demiurge.cloud → Redirect to dashboard (already authenticated)
2. See dashboard with system grid
3. Ask Sophia: "What's new?" → Gets ecosystem updates
4. Click "NFT Portal" → Loads embedded portal
5. Return to dashboard → Continue exploring
```

## Key Features

### Landing Page
- ✨ 3D/animated intro (Framer Motion or Three.js)
- 🎯 Clear value proposition
- 📱 Responsive design
- 🔊 Optional background music

### Authentication
- 👤 Username + Password login
- ✍️ New user signup with validation
- 🔐 JWT + HttpOnly cookies
- 🔄 Token refresh mechanism
- 📧 Optional 2FA for sensitive operations

### Dashboard
- 🏠 Personalized greeting
- 📊 Ecosystem stats ticker
- 🎮 System grid (4-6 responsive cards)
- ⭐ Pinned favorites
- 🔍 Search/filter systems
- 🎨 Light/dark theme toggle

### Sophia AI
- 💬 Always-accessible chat (floating button)
- 🧠 Context-aware suggestions
- 🗺️ Smart navigation ("Take me to gaming")
- 🔑 Account operations with verification
- 📈 Real-time ecosystem insights
- 🎯 Personalized recommendations

### System Integration
- 📦 Embedded portals (iframe for NFT, mining, etc.)
- 🌈 Cross-origin communication bridge
- 🔀 Tab-based navigation for internal systems
- ↩️ Seamless return to dashboard
- 🔗 Deep linking support

## Integration with Ecosystem

### Connected Systems
| System | Type | Status | Integration |
|--------|------|--------|-------------|
| NFT Portal (drc-369) | Embedded | ✅ Existing | Iframe + bridge |
| Mining Portal | TBD | 🚧 Dev | Iframe or link |
| Wallet | Internal | ✅ Ready | React component |
| Games Launcher | TBD | 🚧 Dev | Tab-based nav |
| Knowledgebase | Hybrid | ✅ Existing | ai-website link |
| QOR Auth | Backend | ✅ Production | REST API |
| Blockchain RPC | Backend | ✅ Production | JSON-RPC calls |

## Development & Deployment

### Development
- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State**: React Context + Hooks
- **Building**: Turbo monorepo
- **Package Manager**: npm/pnpm

### Deployment
- **Target**: `demiurge.cloud` (primary)
- **Backup**: Vercel or Netlify
- **CDN**: Cloudflare (global)
- **Database**: PostgreSQL (QOR auth data)
- **Cache**: Redis (session store)
- **RPC**: Custom blockchain endpoints

## Security Considerations

- ✅ HTTPS only
- ✅ CORS headers configured
- ✅ CSP (Content Security Policy) enforced
- ✅ HttpOnly cookies for auth
- ✅ 2FA for account modifications
- ✅ Rate limiting on auth endpoints
- ✅ SQL injection prevention
- ✅ XSS protection (Next.js built-in)
- ✅ CSRF tokens on forms

## Success Metrics

### Performance
- Landing → Login: < 10 seconds
- Login → Dashboard: < 3 seconds
- System load: < 2 seconds
- Sophia response: < 2 seconds (streamed)

### User Engagement
- Daily Active Users (DAU)
- System discovery rate
- Sophia chat engagement
- Return visit frequency

### Technical
- 99.9% uptime
- Core Web Vitals: LCP < 2.5s
- Zero auth failures
- < 1% RPC error rate

## Roadmap

### Phase 1: Foundation (Weeks 1-2)
- Project scaffold
- Landing page
- Auth integration
- Dashboard layout

### Phase 2: Integration (Weeks 3-4)
- System embedding
- Portal bridges
- Sophia basic chat

### Phase 3: Enhancement (Weeks 5-6)
- Sophia AI chain
- Account management
- 2FA verification

### Phase 4: Launch (Week 7+)
- Animations & polish
- Testing & QA
- Deployment to production
- Monitoring & observability

## Related Documentation

- [PROJECT_SOPHIA_SPEC.md](../../PROJECT_SOPHIA_SPEC.md) - Complete specification
- [SOPHIA_CAPABILITIES.md](./SOPHIA_CAPABILITIES.md) - AI capabilities
- [API_REFERENCE.md](./API_REFERENCE.md) - Backend API docs
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

---

**Version**: 1.0 (Overview)  
**Date**: January 22, 2026  
**Status**: Design Phase Complete
