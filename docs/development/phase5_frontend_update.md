# Phase 5: Frontend Updates for AbyssID Backend

## Update AbyssStateMachine.ts

**File**: `apps/portal-web/src/components/fracture/AbyssStateMachine.ts`

**Change**: Replace the mock availability check with real API call

```typescript
const startChecking = useCallback(async () => {
  if (!context.username.trim()) {
    return;
  }

  setState("checking");

  try {
    // Call real backend API
    const response = await fetch('http://localhost:3001/api/abyssid/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: context.username.trim() }),
    });

    const data = await response.json();

    if (!data.available) {
      setState("reject");
      setContext((prev) => ({
        ...prev,
        error: data.error || "Username already taken",
      }));
    } else {
      setState("accept");
    }
  } catch (error: any) {
    console.error("Username check failed:", error);
    setState("reject");
    setContext((prev) => ({
      ...prev,
      error: "Failed to check username availability",
    }));
  }
}, [context.username]);
```

**Update startBinding** to register with backend:

```typescript
const startBinding = useCallback(async () => {
  setState("binding");

  try {
    const generated = await generateKeys(context.username);
    
    // Derive address from public key (simplified - use actual SDK method)
    const address = "0x" + generated.publicKey.substring(0, 40);

    // Register with backend
    const response = await fetch('http://localhost:3001/api/abyssid/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: context.username.trim(),
        publicKey: generated.publicKey,
        address: address,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    setContext((prev) => ({
      ...prev,
      seedPhrase: generated.seedPhrase,
      publicKey: generated.publicKey,
      address: address,
    }));
  } catch (error: any) {
    console.error("Key generation/registration failed:", error);
    setState("reject");
    setContext((prev) => ({
      ...prev,
      error: error.message || "Failed to generate keys",
    }));
  }
}, [context.username]);
```

## Environment Configuration

**File**: `apps/portal-web/.env.local` (create if doesn't exist)

```env
NEXT_PUBLIC_ABYSSID_API_URL=http://localhost:3001
```

**Update API calls to use environment variable:**

```typescript
const API_URL = process.env.NEXT_PUBLIC_ABYSSID_API_URL || 'http://localhost:3001';

// Use API_URL in fetch calls
const response = await fetch(`${API_URL}/api/abyssid/check`, { ... });
```

## Store Identity in Context

**File**: `apps/portal-web/src/lib/fracture/identity/AbyssIDContext.tsx` (NEW)

```typescript
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AbyssIdentity {
  username: string;
  address: string;
  publicKey: string;
}

interface AbyssIDContextType {
  identity: AbyssIdentity | null;
  setIdentity: (identity: AbyssIdentity | null) => void;
}

const AbyssIDContext = createContext<AbyssIDContextType | undefined>(undefined);

export function AbyssIDProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentityState] = useState<AbyssIdentity | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('abyssid_identity');
    if (stored) {
      try {
        setIdentityState(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load identity:', e);
      }
    }
  }, []);

  const setIdentity = (newIdentity: AbyssIdentity | null) => {
    setIdentityState(newIdentity);
    if (newIdentity) {
      localStorage.setItem('abyssid_identity', JSON.stringify(newIdentity));
    } else {
      localStorage.removeItem('abyssid_identity');
    }
  };

  return (
    <AbyssIDContext.Provider value={{ identity, setIdentity }}>
      {children}
    </AbyssIDContext.Provider>
  );
}

export function useAbyssID() {
  const context = useContext(AbyssIDContext);
  if (context === undefined) {
    throw new Error('useAbyssID must be used within AbyssIDProvider');
  }
  return context;
}
```

**Update layout.tsx** to wrap with AbyssIDProvider:

```typescript
import { AbyssIDProvider } from "@/lib/fracture/identity/AbyssIDContext";

// In RootLayout:
<AbyssIDProvider>
  <AudioContextProvider>
    {/* existing content */}
  </AudioContextProvider>
</AbyssIDProvider>
```

