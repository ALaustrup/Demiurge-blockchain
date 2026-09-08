# 🧙‍♀️ PROJECT SOPHIA - Next-Generation Mainnet Portal

**Status**: Design & Architecture Phase  
**Last Updated**: January 22, 2026  
**Version**: 1.0 (Specification)

---

## 📋 Executive Overview

Project Sophia is a comprehensive, immersive mainnet portal that serves as the **central gateway** to the Demiurge Blockchain ecosystem. It combines cutting-edge UI/UX with intelligent AI-powered navigation and account management, positioning Sophia as the "gatekeeper" of all ecosystem systems.

### Vision Statement
> Create a professional yet futuristic portal experience where users immerse themselves in the Demiurge ecosystem through an intelligent, responsive interface that adapts to their needs while maintaining security and performance.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   demiurge.cloud                            │
│  (Landing Page → Auth Gate → Home → System Selection)       │
└────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
   ┌─────────┐         ┌─────────┐        ┌──────────┐
   │ Sophia  │         │  QOR ID │        │  Smart   │
   │ Portal  │         │  Auth   │        │  Router  │
   │ (UI)    │         │ Service │        │ (Nav)    │
   └────┬────┘         └────┬────┘        └────┬─────┘
        │                   │                  │
        └───────────────────┼──────────────────┘
                            ↓
    ┌───────────────────────────────────────────────────┐
    │  Ecosystem Systems (via iframe or API bridge)    │
    ├──────────────────────────────────────────────────┤
    │  • Mining Portal          • Game Launcher        │
    │  • Wallet (CGT Balance)    • Game Development    │
    │  • NFT Portal (DRC-369)   • Chain Development    │
    │  • Staking Interface       • Knowledgebase       │
    │  • Account Settings        • Sophia Chat         │
    └───────────────────────────────────────────────────┘
                            ↓
            ┌───────────────────────────────┐
            │  Blockchain RPC Layer         │
            │  (framework/rpc/)             │
            └───────────────────────────────┘
```

---

## 🎯 User Flow

### Phase 1: Entry & Authentication
```
1. User visits: demiurge.cloud
   ↓
2. Landing Page (3-5s intro animation)
   - Beautiful 3D/animated background
   - Compelling tagline: "From Monad to Pleroma"
   - Call-to-action: "Enter the Realm"
   ↓
3. QOR ID Authentication Gate
   - Existing Users: Username + Password
   - New Users: Sign-up Form
   - Session created (JWT + HttpOnly cookie)
   ↓
4. Home Page (Game Launcher Aesthetic)
   - Welcome message with user's username
   - Latest ecosystem updates/news ticker
   - "What would you like to explore?" (Sophia prompt)
   - Quick-access cards for frequent systems
```

### Phase 2: System Selection & Navigation
```
5. User sees system selection dashboard:
   ┌─ Gaming ────────────┐
   │ • Game Launcher     │
   │ • My Characters     │
   │ • Leaderboards      │
   └─────────────────────┘
   
   ┌─ Assets & Wallet ───┐
   │ • Wallet (CGT)      │
   │ • NFT Collection    │
   │ • Staking           │
   │ • Yield NFTs        │
   └─────────────────────┘
   
   ┌─ Development ───────┐
   │ • Game Dev SDK      │
   │ • Chain Dev         │
   │ • Testnet Access    │
   └─────────────────────┘
   
   ┌─ Knowledge ─────────┐
   │ • Knowledgebase     │
   │ • Documentation     │
   │ • Community Forum   │
   └─────────────────────┘
   
   ┌─ Account ──────────┐
   │ • Profile Settings │
   │ • Security         │
   │ • Preferences      │
   └────────────────────┘

6. User selects system → Sophia provides contextual guidance
   "Heading to Wallet? Let me load your CGT balance first..."
   ↓
7. System loads (embedded portal, tab nav, or iframe)
```

### Phase 3: Sophia Integration Points
```
8. Floating Sophia Button (Always Available)
   - Appears bottom-right
   - Click to open Sophia chat
   - Context-aware suggestions
   
9. Sophia Can:
   - Answer questions about blockchain/ecosystem
   - Navigate user to specific systems
   - Verify account changes (2FA required)
   - Check transaction status
   - Provide real-time ecosystem stats
   
10. Account Modifications (with 2FA verification):
    - Change password
    - Update profile
    - Manage session keys
    - Configure security settings
```

---

## 📁 Project Structure

```
apps/
└── sophia/                          # NEW PROJECT
    ├── package.json                 # Turbo-managed monorepo app
    ├── tsconfig.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── .env.example
    ├── postcss.config.mjs
    ├── eslint.config.mjs
    │
    ├── public/
    │   ├── favicon.ico
    │   ├── animations/               # Landing intro animations
    │   │   ├── demiurge-intro.json
    │   │   └── portal-transition.json
    │   └── icons/                    # System icons
    │       ├── mining.svg
    │       ├── wallet.svg
    │       ├── nft.svg
    │       ├── games.svg
    │       └── ...
    │
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx            # Root layout with providers
    │   │   ├── page.tsx              # Landing page
    │   │   ├── auth/
    │   │   │   ├── login/page.tsx    # Login page
    │   │   │   └── signup/page.tsx   # Sign-up page
    │   │   ├── dashboard/
    │   │   │   ├── page.tsx          # Main dashboard/home
    │   │   │   ├── settings/page.tsx # Account settings
    │   │   │   └── profile/page.tsx  # User profile
    │   │   ├── systems/              # Embedded system views
    │   │   │   ├── wallet/page.tsx
    │   │   │   ├── mining/page.tsx
    │   │   │   ├── nft/page.tsx
    │   │   │   ├── games/page.tsx
    │   │   │   ├── game-dev/page.tsx
    │   │   │   ├── chain-dev/page.tsx
    │   │   │   └── knowledge/page.tsx
    │   │   └── api/
    │   │       ├── auth/route.ts     # Auth endpoints
    │   │       ├── sophia/route.ts   # Sophia AI endpoints
    │   │       └── systems/route.ts  # System routing
    │   │
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── LoginForm.tsx
    │   │   │   └── SignupForm.tsx
    │   │   ├── landing/
    │   │   │   ├── IntroAnimation.tsx
    │   │   │   ├── CtaButton.tsx
    │   │   │   └── LandingHero.tsx
    │   │   ├── layout/
    │   │   │   ├── Header.tsx
    │   │   │   ├── Sidebar.tsx
    │   │   │   ├── BottomNav.tsx
    │   │   │   └── SophiaButton.tsx  # Floating action button
    │   │   ├── sophia/
    │   │   │   ├── SophiaChat.tsx    # Chat interface
    │   │   │   ├── SophiaGate.tsx    # 2FA gate for sensitive ops
    │   │   │   ├── ContextMenu.tsx   # Context-aware suggestions
    │   │   │   └── LoadingState.tsx
    │   │   ├── dashboard/
    │   │   │   ├── SystemGrid.tsx    # Card-based system selector
    │   │   │   ├── SystemCard.tsx    # Individual system card
    │   │   │   ├── NewsTicket.tsx    # Ecosystem updates
    │   │   │   └── QuickAccess.tsx   # Pinned favorites
    │   │   └── systems/
    │   │       ├── PortalEmbed.tsx   # Generic iframe wrapper
    │   │       ├── PortalBridge.tsx  # PostMessage communication
    │   │       └── SystemNav.tsx     # Tab-based navigation
    │   │
    │   ├── lib/
    │   │   ├── qor-auth.ts           # QOR ID auth client
    │   │   ├── sophia-ai.ts          # Sophia AI integration
    │   │   ├── system-router.ts      # Smart routing logic
    │   │   ├── auth-context.ts       # React context for auth
    │   │   └── api-client.ts         # HTTP client wrapper
    │   │
    │   ├── hooks/
    │   │   ├── useAuth.ts            # Auth state management
    │   │   ├── useSophia.ts          # Sophia chat state
    │   │   ├── useSystemRouter.ts    # System routing
    │   │   └── use2FA.ts             # 2FA verification
    │   │
    │   ├── styles/
    │   │   ├── globals.css           # Global Tailwind styles
    │   │   ├── animations.css        # Portal animations
    │   │   ├── themes.css            # Light/dark themes
    │   │   └── sophia-theme.css      # Sophia UI theme
    │   │
    │   └── types/
    │       ├── auth.ts               # Auth types
    │       ├── sophia.ts             # Sophia types
    │       ├── systems.ts            # System types
    │       └── rpc.ts                # RPC types from framework
    │
    └── docs/
        ├── ARCHITECTURE.md           # Technical architecture
        ├── SOPHIA_CAPABILITIES.md    # What Sophia can do
        ├── API_REFERENCE.md          # Backend API reference
        ├── DEPLOYMENT.md             # Deployment guide
        └── DEVELOPMENT.md            # Dev setup guide
```

---

## 🔑 Core Components

### 1. Landing Page (`src/app/page.tsx`)
**Purpose**: First impression, drive conversion to login/signup
- **Features**:
  - 3D animated intro (Framer Motion or Three.js)
  - Tagline: "From the Monad, all creation emanates..."
  - Brief ecosystem overview
  - Call-to-action: "Enter the Portal"
  - Soft background music (toggle mute)
- **Transitions**: After CTA, fade to auth gate with slide-in effect

### 2. QOR ID Auth Gate (`src/app/auth/`)
**Purpose**: Secure entry to ecosystem
- **Login** (`login/page.tsx`):
  - Username + Password form
  - Remember me toggle
  - "Forgot password?" link
  - Social login (future integration)
  - Redirect to dashboard on success
  
- **Signup** (`signup/page.tsx`):
  - Username, Email, Password fields
  - Password strength meter
  - Terms acceptance checkbox
  - Email verification (optional)
  - Redirect to dashboard on success

- **Integration**: 
  - Call `qor-auth` service endpoints
  - Store JWT in secure HttpOnly cookie
  - Set user context in React

### 3. Dashboard/Home (`src/app/dashboard/page.tsx`)
**Purpose**: Main hub, system discovery
- **Layout**:
  - Header: User greeting, notifications
  - Welcome section with Sophia prompt
  - System grid (4-6 cards per row, responsive)
  - Sidebar: Quick access, favorites, settings
  - Bottom nav: Mobile-friendly system access
  
- **Interactivity**:
  - Cards have hover effects (scale, shadow, info reveal)
  - "Customize layout" option
  - Pinned favorites (drag-to-organize)
  - Search/filter systems

### 4. System Embedding (`src/components/systems/`)
**Purpose**: Seamlessly integrate existing portals
- **PortalEmbed.tsx**:
  - Wraps iframe for external systems
  - Handles loading states
  - Error boundaries
  - Exit/return button
  
- **PortalBridge.tsx**:
  - PostMessage communication layer
  - Passes auth token to embedded system
  - Handles cross-origin communication
  - Event forwarding (navigate, notify, etc.)
  
- **Supported Systems**:
  - NFT Portal (drc-369portal) → `<iframe src="http://localhost:4000">`
  - Mining Portal → `<iframe src="..."`
  - Games Launcher → Tab-based navigation
  - Knowledgebase → Embedded or link-based

### 5. Sophia AI Integration (`src/components/sophia/`)
**Purpose**: Intelligent assistant for navigation & account management
- **SophiaChat.tsx**:
  - Always-accessible floating button (bottom-right)
  - Opens modal/panel with chat interface
  - Real-time streaming responses (Vercel AI SDK)
  - Context-aware suggestions based on user activity
  
- **SophiaCapabilities**:
  - **Navigation**: "I want to check my NFTs" → Directs to NFT Portal
  - **Info**: "What's staking?" → Fetches from knowledgebase
  - **Account Ops** (with 2FA):
    - Change password
    - Update profile settings
    - Manage session keys
    - Configure notifications
  - **Status**: "How's the network?" → Calls RPC health check
  - **Suggestions**: "Since you're into gaming, check out..."
  
- **2FA Gate**:
  - For sensitive operations, Sophia triggers `SophiaGate.tsx`
  - User must verify via email or SMS
  - After verification, operation proceeds

---

## 🔐 Security & Authentication

### Authentication Flow
```
1. User logs in via QOR ID
   ↓
2. qor-auth service validates credentials
   ↓
3. JWT token created + stored in HttpOnly cookie
   ↓
4. User context loaded (username, user_id, permissions)
   ↓
5. Dashboard accessible, token refreshed on expiry
```

### Session Management
- **Access Token**: 15 minutes
- **Refresh Token**: 30 days (stored securely)
- **Max Concurrent Sessions**: 3 (per user)
- **Logout**: Clear cookies + invalidate token

### 2FA for Sensitive Operations
- **Triggers**: Password change, security settings, account modifications
- **Methods**: Email code, SMS (future)
- **Verification Endpoint**: `/api/auth/verify-2fa`

### CORS & Security Headers
```
Content-Security-Policy: iframe-src 'self' https://*.demiurge.cloud
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
```

---

## 🎨 Design System

### Color Palette
- **Primary**: `#7C3AED` (Violet/Purple - Gnostic mystique)
- **Secondary**: `#0F172A` (Deep Navy - Ground)
- **Accent**: `#06B6D4` (Cyan - Energy)
- **Success**: `#10B981` (Emerald - Gaming)
- **Warning**: `#F59E0B` (Amber)
- **Error**: `#EF4444` (Red)

### Typography
- **Headings**: `Geist Mono` (Future-forward, clean)
- **Body**: `Geist` (Readable, modern)
- **Code**: `Fira Code` (Technical precision)

### UI Principles
- **Dark mode first** (gaming/immersive)
- **Glass-morphism effects** on cards (floating glass panels)
- **Gradient accents** (energy flows)
- **Micro-interactions** (hover, click, transition animations)
- **Accessibility**: WCAG 2.1 AA minimum

---

## 🚀 Development Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Project scaffold & Turbo integration
- [ ] Landing page + auth pages
- [ ] QOR ID integration
- [ ] Dashboard layout
- [ ] Sophia basic chat interface

### Phase 2: Systems Integration (Weeks 3-4)
- [ ] NFT Portal embedding
- [ ] Portal bridge communication
- [ ] System routing logic
- [ ] Sidebar + system grid

### Phase 3: Sophia Enhancement (Weeks 5-6)
- [ ] Sophia AI chain (Claude/GPT integration)
- [ ] Context awareness (user activity tracking)
- [ ] Account modification endpoints
- [ ] 2FA verification

### Phase 4: Polish & Launch (Week 7+)
- [ ] Animations & transitions (Framer Motion)
- [ ] Performance optimization
- [ ] Testing (Jest, Playwright)
- [ ] Deployment to demiurge.cloud
- [ ] Monitoring & observability

---

## 🔗 Integration Points

### External Services
| Service | Endpoint | Purpose |
|---------|----------|---------|
| QOR Auth | `https://qor-auth.demiurge.cloud` | User authentication |
| Blockchain RPC | `https://rpc.demiurge.cloud` | On-chain data |
| Sophia AI | (On-device or API) | Chat intelligence |
| NFT Portal | `https://nft-portal.demiurge.cloud` | Embedded portal |

### Environment Variables
```bash
# .env.local (development)
NEXT_PUBLIC_QOR_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_RPC_URL=http://localhost:9944
NEXT_PUBLIC_NFT_PORTAL_URL=http://localhost:4000
NEXT_PUBLIC_SOPHIA_API_URL=http://localhost:3000/api/sophia
NEXT_PUBLIC_SITE_URL=http://localhost:3002

# .env.production
NEXT_PUBLIC_QOR_AUTH_URL=https://qor-auth.demiurge.cloud
NEXT_PUBLIC_RPC_URL=https://rpc.demiurge.cloud
NEXT_PUBLIC_NFT_PORTAL_URL=https://nft-portal.demiurge.cloud
NEXT_PUBLIC_SITE_URL=https://demiurge.cloud
```

---

## 📊 Metrics & Success Criteria

### User Experience
- [ ] Landing → Login: < 10 seconds
- [ ] Login → Dashboard: < 3 seconds
- [ ] System navigation: 1 click from dashboard
- [ ] Sophia response time: < 2 seconds (streamed)

### Technical
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] 99.9% uptime
- [ ] Zero authentication failures
- [ ] < 1% RPC error rate

### Adoption
- [ ] Track daily active users (DAU)
- [ ] System access frequency
- [ ] Sophia chat engagement rate
- [ ] Account modification success rate

---

## 📚 Documentation Structure

```
docs/
└── SOPHIA/
    ├── PROJECT_SOPHIA_SPEC.md     # This file
    ├── ARCHITECTURE.md             # Technical deep-dive
    ├── API_REFERENCE.md            # Backend endpoints
    ├── COMPONENT_GUIDE.md          # UI component library
    ├── SOPHIA_AI_GUIDE.md          # Sophia capabilities
    ├── DEPLOYMENT.md               # Production deployment
    ├── TROUBLESHOOTING.md          # Common issues
    └── ROADMAP.md                  # Future enhancements
```

---

## 🎯 Future Enhancements

- **Multiplayer Lobby**: Real-time user activity feed
- **Sophia Learning**: Personalized recommendations based on user behavior
- **Advanced 2FA**: Biometric auth, hardware key support
- **API Gateway**: Third-party app integration
- **WebSocket Support**: Real-time notifications & events
- **Mobile App**: React Native companion app
- **Analytics Dashboard**: User engagement insights (admin only)
- **Internationalization**: Multi-language support

---

## 📞 Contact & Support

- **Project Lead**: [TBD]
- **Design Lead**: [TBD]
- **Questions**: Refer to docs/ or open GitHub issue

---

**Document Version**: 1.0  
**Last Updated**: January 22, 2026  
**Next Review**: After Phase 1 completion
