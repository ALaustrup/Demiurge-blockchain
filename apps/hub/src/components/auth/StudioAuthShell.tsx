'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    title: 'Local sovereign chain',
    desc: 'Your game ledger runs on your machine — no cloud hosting required.',
  },
  {
    title: 'QOR identity',
    desc: 'One creator ID across worlds, wallets, and playtest sessions.',
  },
  {
    title: 'CGT economy & DRC-369',
    desc: 'Design currency, items, and persistent assets with real mechanics.',
  },
  {
    title: 'CD-key editions',
    desc: 'Activate Creator, Pro, or Enterprise when you are ready to upgrade.',
  },
] as const;

export function StudioAuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-void text-text-secondary flex flex-col lg:flex-row overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 bg-void-spotlight" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 106, 0, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 106, 0, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />

      {/* Brand panel */}
      <aside className="relative z-10 hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between p-12 xl:p-16 border-r border-white/[0.06]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4 mb-12"
          >
            <div className="relative w-14 h-14 flex items-center justify-center rounded-sm bg-white/[0.04] border border-neon-cyan/30 shadow-neon-cyan">
              <span className="font-display text-2xl font-bold text-neon-cyan">D</span>
              <span className="absolute top-0 left-0 w-2.5 h-2.5 border-l border-t border-neon-cyan/60" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b border-neon-cyan/60" />
            </div>
            <div>
              <p className="font-display text-xl tracking-[0.2em] text-text-primary">
                DEMIURGE <span className="text-text-tertiary font-normal">STUDIO</span>
              </p>
              <p className="font-mono text-[10px] tracking-[0.25em] text-text-tertiary uppercase mt-0.5">
                Local Game Creator Suite
              </p>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl xl:text-[2.75rem] leading-tight font-semibold text-text-primary tracking-wide mb-4"
          >
            Your game.
            <br />
            <span className="text-neon-gradient">Your chain.</span>
            <br />
            Your machine.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-text-tertiary text-base max-w-md leading-relaxed"
          >
            Build worlds with a full local stack — identity, economy, blockchain, and Unreal-ready
            assets. No email. No subscription server. Just create.
          </motion.p>
        </div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="space-y-5"
        >
          {FEATURES.map((f, i) => (
            <li key={f.title} className="flex gap-4 group">
              <span className="flex-shrink-0 w-8 h-8 rounded-sm bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center font-mono text-xs text-neon-cyan">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="font-display text-sm tracking-wide text-text-primary group-hover:text-neon-cyan transition-colors">
                  {f.title}
                </p>
                <p className="text-sm text-text-tertiary mt-0.5 leading-snug">{f.desc}</p>
              </div>
            </li>
          ))}
        </motion.ul>

        <p className="font-mono text-[10px] text-text-muted tracking-wider mt-10">
          OFFLINE-FIRST · QOR AUTH · localhost:9944
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative z-10 flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile header */}
        <div className="lg:hidden px-6 pt-8 pb-4 text-center border-b border-white/[0.06]">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-sm bg-white/[0.04] border border-neon-cyan/30 flex items-center justify-center">
              <span className="font-display text-lg font-bold text-neon-cyan">D</span>
            </div>
            <span className="font-display text-lg tracking-[0.15em] text-text-primary">
              DEMIURGE STUDIO
            </span>
          </div>
          <p className="text-xs text-text-tertiary font-mono tracking-widest uppercase">
            Local creator suite
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
