'use client';

import { useAuth } from '@/contexts/AuthContext';
import { StudioAuthFlow } from './StudioAuthFlow';
import { StudioLicenseProvider } from '@/contexts/StudioLicenseContext';

/**
 * AuthGate — blocks Hub until QOR sign-in.
 * Unauthenticated users see the full Studio auth experience.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, refreshUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div
              className="absolute inset-0 border border-neon-cyan/30 rounded-sm animate-spin"
              style={{ animationDuration: '2.5s' }}
            />
            <div className="absolute inset-3 bg-neon-cyan/10 rounded-sm animate-pulse" />
          </div>
          <p className="font-display text-xs tracking-[0.2em] text-text-tertiary uppercase">
            Initializing Studio…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <StudioAuthFlow onSuccess={() => refreshUser()} />;
  }

  return <StudioLicenseProvider>{children}</StudioLicenseProvider>;
}
