import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import type { AbyssIDSession, AbyssIDProvider } from '../services/abyssid/types';
import { localAbyssIDProvider } from '../services/abyssid/localProvider';
import { remoteAbyssIDProvider } from '../services/abyssid/remoteProvider';

interface AbyssIDContextValue {
  session: AbyssIDSession | null;
  isLoading: boolean;
  login: (username?: string, secret?: string) => Promise<void>;
  logout: () => Promise<void>;
  signMessage: (message: Uint8Array | string) => Promise<string>;
  mode: 'local' | 'remote';
}

const AbyssIDContext = createContext<AbyssIDContextValue | undefined>(undefined);

interface AbyssIDProviderProps {
  children: ReactNode;
  provider?: AbyssIDProvider;
}

// Determine mode from environment - FORCE LOCAL MODE for now
const getMode = (): 'local' | 'remote' => {
  // Always use local mode to avoid "Failed to fetch" errors
  // Remote mode can be enabled later when API is ready
  return 'local';
};

// Get the appropriate provider based on mode
const getProvider = (): AbyssIDProvider => {
  const mode = getMode();
  return mode === 'remote' ? remoteAbyssIDProvider : localAbyssIDProvider;
};

export function AbyssIDProvider({ children, provider }: AbyssIDProviderProps) {
  const mode = useMemo(() => getMode(), []);
  const activeProvider = useMemo(() => provider || getProvider(), [provider]);
  const [session, setSession] = useState<AbyssIDSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    activeProvider
      .getSession()
      .then((s) => {
        setSession(s);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [activeProvider]);

  const login = async (username?: string, secret?: string) => {
    const newSession = await activeProvider.login(username, secret);
    setSession(newSession);
  };

  const logout = async () => {
    await activeProvider.logout();
    setSession(null);
  };

  const signMessage = async (message: Uint8Array | string) => {
    return activeProvider.signMessage(message);
  };

  return (
    <AbyssIDContext.Provider value={{ session, isLoading, login, logout, signMessage, mode }}>
      {children}
    </AbyssIDContext.Provider>
  );
}

export function useAbyssID() {
  const context = useContext(AbyssIDContext);
  if (context === undefined) {
    throw new Error('useAbyssID must be used within an AbyssIDProvider');
  }
  return context;
}

