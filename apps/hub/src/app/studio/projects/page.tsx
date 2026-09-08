'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStudioLicense } from '@/contexts/StudioLicenseContext';
import type { StudioProjectSummary } from '@/lib/studio/project-types';

export default function StudioProjectsPage() {
  const { editionName } = useStudioLicense();
  const [projects, setProjects] = useState<StudioProjectSummary[]>([]);
  const [active, setActive] = useState<StudioProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, activeRes] = await Promise.all([
        fetch('/api/studio/projects'),
        fetch('/api/studio/projects/active'),
      ]);
      const listData = await listRes.json();
      const activeData = await activeRes.json();
      if (!listRes.ok) throw new Error(listData.error || 'Failed to load projects');
      setProjects(listData.projects || []);
      const activeSlug = activeData.active?.slug;
      setActive(
        (listData.projects || []).find((p: StudioProjectSummary) => p.slug === activeSlug) ||
          null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/studio/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');
      setNewName('');
      setNotice(data.message || 'Project created. Restart the node to use its chain data.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (slug: string) => {
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/studio/projects/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Activate failed');
      setNotice(data.message || 'Active project updated. Restart demiurge-node.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Activate failed');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="font-mono text-[10px] tracking-[0.25em] text-text-tertiary uppercase mb-2">
            Demiurge Studio · {editionName}
          </p>
          <h1 className="font-display text-3xl md:text-4xl tracking-wide text-text-primary">
            Your projects
          </h1>
          <p className="text-text-tertiary mt-2 max-w-xl">
            Each project has its own local chain data. Set the active project, then restart{' '}
            <code className="text-neon-cyan text-sm">demiurge-node</code> to switch worlds.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 mb-10">
          <section className="p-6 rounded-lg border border-white/[0.08] bg-void-surface/60">
            <h2 className="font-display text-sm tracking-widest uppercase text-text-secondary mb-4">
              New project
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                className="w-full px-4 py-3 bg-[#151A21] border border-[#333] text-text-primary rounded-sm focus:outline-none focus:border-neon-cyan/50"
                placeholder="My RPG"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 font-display text-xs tracking-widest uppercase bg-gradient-to-r from-[#FF6A00] to-[#CC5500] text-void rounded-sm disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create project'}
              </button>
            </form>
          </section>

          <section className="p-6 rounded-lg border border-neon-cyan/20 bg-neon-cyan/5">
            <h2 className="font-display text-sm tracking-widest uppercase text-neon-cyan mb-3">
              Active project
            </h2>
            {active ? (
              <div>
                <p className="text-xl font-display text-text-primary">{active.displayName}</p>
                <p className="font-mono text-xs text-text-tertiary mt-1">{active.slug}</p>
                <p className="font-mono text-[10px] text-text-muted mt-3 break-all">
                  {active.chainDataDir}
                </p>
              </div>
            ) : (
              <p className="text-sm text-text-tertiary">No active project — create or open one.</p>
            )}
            <Link
              href="/"
              className="inline-block mt-4 text-sm text-neon-cyan hover:underline"
            >
              Open Studio dashboard →
            </Link>
          </section>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-sm bg-status-error/10 border border-status-error/30 text-sm text-status-error">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 px-4 py-3 rounded-sm bg-neon-cyan/10 border border-neon-cyan/25 text-sm text-text-secondary">
            {notice}
          </div>
        )}

        <section>
          <h2 className="font-display text-sm tracking-widest uppercase text-text-secondary mb-4">
            All projects
          </h2>
          {loading ? (
            <p className="text-text-tertiary text-sm">Loading…</p>
          ) : projects.length === 0 ? (
            <p className="text-text-tertiary text-sm">No projects yet. Create your first game above.</p>
          ) : (
            <ul className="space-y-3">
              {projects.map((p) => (
                <li
                  key={p.slug}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border ${
                    p.isActive
                      ? 'border-neon-cyan/40 bg-neon-cyan/5'
                      : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
                >
                  <div>
                    <p className="font-display text-lg text-text-primary">{p.displayName}</p>
                    <p className="font-mono text-xs text-text-tertiary">{p.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    {!p.isActive && (
                      <button
                        type="button"
                        onClick={() => handleActivate(p.slug)}
                        className="px-4 py-2 font-display text-[10px] tracking-widest uppercase border border-white/10 rounded-sm hover:border-neon-cyan/40 text-text-secondary hover:text-neon-cyan transition-colors"
                      >
                        Set active
                      </button>
                    )}
                    {p.isActive && (
                      <span className="px-4 py-2 font-mono text-[10px] uppercase text-neon-cyan">
                        Active
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
