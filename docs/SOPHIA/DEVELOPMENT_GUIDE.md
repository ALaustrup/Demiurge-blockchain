# 🚀 Project Sophia - Development Roadmap

**Implementation Guide for AI Developers & Engineers**

## Quick Navigation

- **For Project Overview**: See [PROJECT_SOPHIA_SPEC.md](../../PROJECT_SOPHIA_SPEC.md)
- **For AI Integration**: See [SOPHIA_CAPABILITIES.md](./SOPHIA_CAPABILITIES.md)
- **For Architecture Details**: See [ARCHITECTURE.md](./ARCHITECTURE.md) (coming soon)
- **For API Reference**: See [API_REFERENCE.md](./API_REFERENCE.md) (coming soon)

## Phase 1: Foundation (Weeks 1-2)

### 1.1 Project Initialization

```bash
# From repo root
cd apps

# Create Next.js project with our specs
npx create-next-app@latest sophia \
  --typescript \
  --tailwind \
  --app-dir \
  --no-eslint \
  --no-git \
  --import-alias '@/*'

cd sophia
```

### 1.2 Configure for Turbo

Update `package.json`:
```json
{
  "name": "@demiurge/sophia",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings 0",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "16.1.3",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "@ai-sdk/openai": "^0.0.50",
    "ai": "^3.0.0",
    "framer-motion": "^11.0.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^4",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```

### 1.3 Environment Setup

Create `.env.example`:
```bash
# Landing & Auth
NEXT_PUBLIC_SITE_URL=http://localhost:3002
NEXT_PUBLIC_SITE_NAME=Demiurge Portal

# Authentication
NEXT_PUBLIC_QOR_AUTH_URL=http://localhost:3001
QOR_AUTH_SECRET=your_secret_here

# Blockchain RPC
NEXT_PUBLIC_RPC_URL=http://localhost:9944
NEXT_PUBLIC_RPC_WS_URL=ws://localhost:9944

# Systems
NEXT_PUBLIC_NFT_PORTAL_URL=http://localhost:4000
NEXT_PUBLIC_KNOWLEDGEBASE_URL=http://localhost:3000

# Sophia AI
OPENAI_API_KEY=sk-your-key-here
SOPHIA_MODEL=gpt-4-turbo

# Database (for session storage)
DATABASE_URL=postgresql://user:password@localhost:5432/sophia
REDIS_URL=redis://localhost:6379

# Deployment
VERCEL_ENV=development
```

### 1.4 Project Structure Setup

```bash
# Create directory structure
mkdir -p src/{app,components,lib,hooks,styles,types}
mkdir -p src/app/{auth,dashboard,systems,api}
mkdir -p src/components/{auth,landing,layout,sophia,systems,dashboard}
mkdir -p docs/{architecture,guides}
mkdir -p public/{animations,icons}

# Create placeholder files
touch src/app/layout.tsx
touch src/app/page.tsx
touch src/app/auth/{login,signup}/page.tsx
touch src/app/dashboard/page.tsx
touch src/lib/qor-auth.ts
touch src/lib/sophia-ai.ts
```

### 1.5 Landing Page Implementation

**`src/app/page.tsx`** (Landing):
```typescript
'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-cyan-900 flex items-center justify-center">
      <motion.div
        className="text-center max-w-2xl px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background animation placeholder */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <motion.div variants={itemVariants}>
          <h1 className="text-6xl font-bold text-white mb-4">
            Demiurge Portal
          </h1>
        </motion.div>

        <motion.p variants={itemVariants} className="text-xl text-gray-300 mb-8">
          From the Monad, all creation emanates. To the Pleroma, all value returns.
        </motion.p>

        <motion.div variants={itemVariants} className="mb-12">
          <p className="text-gray-400">Enter the next-generation blockchain ecosystem</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link
            href="/auth/login"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-lg hover:shadow-2xl transition-all"
          >
            Enter the Portal
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
```

### 1.6 Auth Integration

**`src/lib/qor-auth.ts`**:
```typescript
interface AuthConfig {
  baseUrl: string;
  secret: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export class QorAuthClient {
  constructor(private config: AuthConfig) {}

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.config.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  }

  async signup(email: string, username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.config.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error('Signup failed');
    return response.json();
  }

  async logout(): Promise<void> {
    await fetch(`${this.config.baseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  }
}

export const qorAuth = new QorAuthClient({
  baseUrl: process.env.NEXT_PUBLIC_QOR_AUTH_URL!,
  secret: process.env.QOR_AUTH_SECRET!
});
```

### 1.7 Auth Context

**`src/lib/auth-context.ts`**:
```typescript
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Fetch user from /api/auth/me
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          setUser(await response.json());
        }
      } catch {
        // User not authenticated
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    // Implementation
  };

  const signup = async (email: string, username: string, password: string) => {
    // Implementation
  };

  const logout = async () => {
    // Implementation
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

## Phase 2: Systems Integration (Weeks 3-4)

### 2.1 Dashboard Layout

**`src/app/dashboard/page.tsx`**:
- Welcome message
- System grid (Mining, Wallet, NFT, Games, Dev, Knowledge)
- News ticker
- Sophia greeting

### 2.2 System Embedding

**`src/components/systems/PortalEmbed.tsx`**:
- Generic iframe wrapper
- Loading states
- Error boundaries
- Exit button

### 2.3 Portal Bridge

**`src/components/systems/PortalBridge.tsx`**:
- PostMessage communication
- Auth token passing
- Event forwarding

## Phase 3: Sophia Enhancement (Weeks 5-6)

### 3.1 Sophia Chat Component

**`src/components/sophia/SophiaChat.tsx`**:
```typescript
'use client';
import { useState } from 'react';
import { useChat } from 'ai/react';

export function SophiaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/sophia/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Hi! I\'m Sophia. How can I help you explore Demiurge today?'
      }
    ]
  });

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 w-16 h-16 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center text-2xl z-40"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 w-96 h-[32rem] bg-slate-900 border border-purple-500 rounded-lg shadow-2xl flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`${
                  msg.role === 'user'
                    ? 'text-right'
                    : 'text-left'
                }`}
              >
                <div
                  className={`inline-block px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-gray-300'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-slate-700 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask Sophia..."
              className="flex-1 bg-slate-800 text-white px-3 py-2 rounded border border-slate-700 focus:border-cyan-500 outline-none"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 rounded hover:shadow-lg transition-all"
            >
              →
            </button>
          </form>
        </div>
      )}
    </>
  );
}
```

### 3.2 Sophia API Endpoint

**`src/app/api/sophia/chat/route.ts`**:
```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const sophiaSystemPrompt = `You are Sophia, the intelligent assistant of the Demiurge Blockchain ecosystem.

You are:
- Professional yet friendly
- Deeply knowledgeable about blockchain and Demiurge
- Able to navigate users to relevant systems
- Capable of explaining complex concepts simply
- Security-conscious (never suggest bypassing verification)

You can:
1. Navigate users: "Take you to Wallet", "Show games", etc.
2. Educate: Explain CGT, DRC-369, staking, etc.
3. Guide account operations: Password change (with verification)
4. Provide status: Network health, ecosystem stats
5. Personalize: Remember user preferences

Always be concise, helpful, and focus on what the user needs.`;

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: openai(process.env.SOPHIA_MODEL || 'gpt-4-turbo'),
    system: sophiaSystemPrompt,
    messages,
    tools: {
      navigateToSystem: {
        description: 'Navigate user to a specific system',
        parameters: {
          type: 'object',
          properties: {
            system: {
              type: 'string',
              enum: ['wallet', 'nft', 'mining', 'games', 'dev', 'knowledge'],
              description: 'Target system'
            }
          }
        }
      },
      getSystemStatus: {
        description: 'Get current blockchain/ecosystem status',
        parameters: {
          type: 'object',
          properties: {
            metric: { type: 'string' }
          }
        }
      }
    }
  });

  return result.toDataStream();
}
```

## Phase 4: Polish & Launch (Week 7+)

### 4.1 Testing
- [ ] Unit tests (Jest)
- [ ] E2E tests (Playwright)
- [ ] Auth flow validation
- [ ] RPC integration tests
- [ ] Portal embedding tests

### 4.2 Deployment
- [ ] Environment setup on server
- [ ] DNS pointing demiurge.cloud
- [ ] SSL certificate (Let's Encrypt)
- [ ] GitHub Actions CI/CD
- [ ] Monitoring setup (Vercel Analytics, Sentry)

### 4.3 Documentation
- [ ] API reference
- [ ] Component library
- [ ] Deployment guide
- [ ] Troubleshooting

## Key Integration Points

### QOR Auth Service
```
POST /auth/login → Get JWT token
POST /auth/signup → Create account
POST /auth/verify-2fa → Verify email code
GET /auth/me → Get current user
```

### Blockchain RPC
```
GET /system_health → Network status
GET /account/balance → User CGT balance
GET /staking/info → Staking data
GET /nft/collection → User NFTs
```

### Existing Systems
- NFT Portal: `http://localhost:4000` (iframe)
- Knowledgebase: `http://localhost:3000` (link)
- Games: TBD (system routing)
- Mining: TBD (system routing)

## Dependencies

**Key Packages**:
- `next@16.1.3` - Framework
- `react@19.2.3` - UI library
- `tailwindcss@4` - Styling
- `framer-motion@11` - Animations
- `ai@3.0.0` - Vercel AI SDK
- `zustand@4` - State management
- `swr@2` - Data fetching

## Commands

```bash
# Development
npm run dev          # Start dev server (port 3002)

# Building
npm run build        # Build for production
npm run start        # Run production build

# Quality
npm run type-check   # TypeScript check
npm run lint         # ESLint

# Testing
npm run test         # Jest tests
npm run test:e2e     # Playwright tests
```

## Success Criteria

- [ ] Landing page loads in < 3 seconds
- [ ] Auth flow works seamlessly
- [ ] Dashboard displays system grid
- [ ] Sophia chat responds in < 2 seconds
- [ ] All systems embed correctly
- [ ] Mobile responsive (tested on iPhone/Android)
- [ ] 99.9% uptime maintained
- [ ] 0 console errors

---

**Document Version**: 1.0  
**Last Updated**: January 22, 2026  
**Next Steps**: Begin Phase 1 implementation
