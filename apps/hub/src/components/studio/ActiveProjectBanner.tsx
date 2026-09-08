'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { StudioProjectSummary } from '@/lib/studio/project-types';

export function ActiveProjectBanner() {
  const [active, setActive] = useState<StudioProjectSummary | null>(null);

  useEffect(() => {
    fetch('/api/studio/projects/active')
      .then((r) => r.json())
      .then((d) => {
        const slug = d.active?.slug;
        if (!slug) return setActive(null);
        return fetch('/api/studio/projects')
          .then((r2) => r2.json())
          .then((d2) => {
            const p = (d2.projects || []).find(
              (x: StudioProjectSummary) => x.slug === slug
            );
            setActive(p || null);
          });
      })
      .catch(() => setActive(null));
  }, []);

  if (!active) {
    return (
      <div className="mb-4 px-4 py-2 rounded-sm border border-status-warning/30 bg-status-warning/5 text-sm text-status-warning flex flex-wrap items-center justify-between gap-2">
        <span>No active project — create one to isolate chain data.</span>
        <Link href="/studio/projects" className="text-neon-cyan hover:underline font-display text-xs uppercase tracking-wider">
          Open projects →
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-4 px-4 py-2 rounded-sm border border-neon-cyan/20 bg-neon-cyan/5 flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="text-text-secondary">
        Active project:{' '}
        <strong className="text-text-primary font-display tracking-wide">
          {active.displayName}
        </strong>
        <span className="font-mono text-text-muted text-xs ml-2">{active.slug}</span>
      </span>
      <Link
        href="/studio/projects"
        className="text-neon-cyan hover:underline font-display text-xs uppercase tracking-wider"
      >
        Switch project
      </Link>
    </div>
  );
}
