'use client';

import Link from 'next/link';
import { useStudioLicense } from '@/contexts/StudioLicenseContext';
import type { StudioFeature } from '@/lib/studio/features';
import { editionLabel } from '@/lib/studio/features';

const TIER_LABELS: Record<string, string> = {
  create_drc369: 'Creator',
  agents: 'Creator',
  unreal_plugin: 'Creator',
  analytics: 'Pro',
  scatter3d: 'Pro',
  white_label: 'Enterprise',
};

interface StudioFeatureGateProps {
  feature: StudioFeature;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function StudioFeatureGate({
  feature,
  children,
  title,
  description,
}: StudioFeatureGateProps) {
  const { can, edition, editionName, loading } = useStudioLicense();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (can(feature)) {
    return <>{children}</>;
  }

  const requiredTier = TIER_LABELS[feature] || 'Creator';

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center p-8 rounded-lg border border-white/[0.08] bg-void-surface/80">
        <div className="w-14 h-14 mx-auto mb-6 rounded-sm bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
          <span className="text-2xl">🔑</span>
        </div>
        <p className="font-mono text-[10px] tracking-[0.25em] text-text-tertiary uppercase mb-2">
          Studio {editionName} · Upgrade required
        </p>
        <h1 className="font-display text-2xl tracking-wide text-text-primary mb-3">
          {title || `${requiredTier} edition`}
        </h1>
        <p className="text-sm text-text-tertiary leading-relaxed mb-6">
          {description ||
            `This tool requires Studio ${requiredTier} or higher. You are on ${editionLabel(edition)}.`}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/activate"
            className="px-6 py-3 font-display text-xs tracking-widest uppercase bg-gradient-to-r from-[#FF6A00] to-[#CC5500] text-void rounded-sm hover:brightness-110 transition-all"
          >
            Activate license
          </Link>
          <Link
            href="/"
            className="px-6 py-3 font-display text-xs tracking-widest uppercase border border-white/10 text-text-secondary rounded-sm hover:border-white/25 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
        <p className="text-xs text-text-muted mt-6">
          Enter a CD-key from your purchase at{' '}
          <Link href="/activate" className="text-neon-cyan hover:underline">
            License activation
          </Link>
        </p>
      </div>
    </div>
  );
}
