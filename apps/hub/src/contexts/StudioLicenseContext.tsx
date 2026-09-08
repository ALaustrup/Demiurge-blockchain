'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { useAuth } from '@/contexts/AuthContext';
import {
  editionLabel,
  hasFeature,
  type StudioEdition,
  type StudioFeature,
} from '@/lib/studio/features';
import {
  fetchLicenseStatus,
  getCachedLicenseStatus,
  type StudioLicenseStatus,
} from '@/lib/studio-license';

interface StudioLicenseContextValue {
  edition: StudioEdition;
  editionName: string;
  features: string[];
  loading: boolean;
  can: (feature: StudioFeature) => boolean;
  refresh: () => Promise<void>;
}

const StudioLicenseContext = createContext<StudioLicenseContextValue | null>(null);

export function StudioLicenseProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<StudioLicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = qorAuth.getToken();
    if (!token) {
      setStatus(getCachedLicenseStatus());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const next = await fetchLicenseStatus(token);
      setStatus(next);
    } catch {
      setStatus(getCachedLicenseStatus());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setStatus(null);
      setLoading(false);
    }
  }, [isAuthenticated, refresh]);

  const edition = (status?.edition || 'free') as StudioEdition;
  const features = status?.features || [];

  const value: StudioLicenseContextValue = {
    edition,
    editionName: editionLabel(edition),
    features,
    loading,
    can: (feature) => hasFeature(edition, feature),
    refresh,
  };

  return (
    <StudioLicenseContext.Provider value={value}>{children}</StudioLicenseContext.Provider>
  );
}

export function useStudioLicense() {
  const ctx = useContext(StudioLicenseContext);
  if (!ctx) {
    return {
      edition: 'free' as StudioEdition,
      editionName: 'Free',
      features: [] as string[],
      loading: false,
      can: () => true,
      refresh: async () => {},
    };
  }
  return ctx;
}
