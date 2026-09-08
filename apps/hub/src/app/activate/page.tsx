'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { qorAuth } from '@demiurge/qor-sdk';
import {
  activateLicenseKey,
  editionLabel,
  fetchLicenseStatus,
  type StudioLicenseStatus,
} from '@/lib/studio-license';

export default function ActivatePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [licenseKey, setLicenseKey] = useState('');
  const [status, setStatus] = useState<StudioLicenseStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const token = qorAuth.getToken();
    if (!token) return;
    fetchLicenseStatus(token)
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [loading, isAuthenticated]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = qorAuth.getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const next = await activateLicenseKey(token, licenseKey);
      setStatus(next);
      setLicenseKey('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Activation failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-tertiary">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-text-secondary">Sign in to activate your Studio license.</p>
        <Link href="/login" className="text-neon-cyan hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#0B0C10' }}>
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="font-display text-2xl tracking-widest text-white">STUDIO LICENSE</h1>
          <p className="text-sm text-text-tertiary mt-2 font-mono">
            Enter your CD-key to unlock Creator, Pro, or Enterprise features.
          </p>
        </div>

        {status && (
          <div className="p-4 border border-white/10 bg-white/[0.02] rounded-lg">
            <p className="text-xs text-text-tertiary uppercase tracking-widest">Current edition</p>
            <p className="text-lg text-neon-cyan font-display mt-1">{editionLabel(status.edition)}</p>
            {status.expires_at && (
              <p className="text-xs text-text-tertiary mt-2">
                Expires: {new Date(status.expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleActivate} className="space-y-4">
          <input
            className="w-full p-3 bg-[#151A21] border border-[#333] text-white font-mono text-sm tracking-wide"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
            placeholder="DS-PRO-XXXXX-XXXXX-XXXXX"
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 font-display tracking-widest uppercase bg-neon-cyan/90 text-void disabled:opacity-50"
          >
            {isLoading ? 'Activating…' : 'Activate license'}
          </button>
        </form>

        <p className="text-center text-xs text-text-tertiary">
          <Link href="/" className="text-neon-cyan hover:underline">
            ← Back to Studio
          </Link>
        </p>
      </div>
    </div>
  );
}
