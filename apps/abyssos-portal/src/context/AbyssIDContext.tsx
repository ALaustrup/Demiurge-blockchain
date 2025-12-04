import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { AbyssIDSession, AbyssIDProvider } from '../services/abyssid/types';
import { localAbyssIDProvider } from '../services/abyssid/localProvider';

interface AbyssIDContextValue {
  session: AbyssIDSession | null;
  isLoading: boolean;
  login: (username?: string) => Promise<void>;
  logout: () => Promise<void>;
  signMessage: (message: Uint8Array | string) => Promise<string>;
}

const AbyssIDContext = createContext<AbyssIDContextValue | undefined>(undefined);

interface AbyssIDProviderProps {
  children: ReactNode;
  provider?: AbyssIDProvider;
}

export function AbyssIDProvider({ children, provider = localAbyssIDProvider }: AbyssIDProviderProps) {
  const [session, setSession] = useState<AbyssIDSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    provider
      .getSession()
      .then((s) => {
        setSession(s);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [provider]);

  const login = async (username?: string) => {
    const newSession = await provider.login(username);
    setSession(newSession);
  };

  const logout = async () => {
    await provider.logout();
    setSession(null);
  };

  const signMessage = async (message: Uint8Array | string) => {
    return provider.signMessage(message);
  };

  return (
    <AbyssIDContext.Provider value={{ session, isLoading, login, logout, signMessage }}>
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

