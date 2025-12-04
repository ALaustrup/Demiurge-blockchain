"use client";

import { FractureShell } from "@/components/fracture/FractureShell";
import { HeroPanel } from "@/components/fracture/HeroPanel";
import { GenesisOnboarding } from "@/components/genesis/GenesisOnboarding";

/**
 * Fracture Landing Page
 * 
 * The dark, ancient, hostile entry point to the Demiurge chain.
 * Showcases the full Fracture v1 experience:
 * - Video background
 * - Audio-reactive effects
 * - Glass cathedral aesthetic
 * - AbyssID ritual entry
 */
export default function HomePage() {
  return (
    <>
      <GenesisOnboarding />
      <FractureShell>
      <div className="flex flex-col items-center justify-center min-h-[80vh] py-12">
        <HeroPanel 
          showCTAs={true}
        />
        
        {/* Additional hook content can go here */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-zinc-600 font-mono">
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-zinc-500 mb-1">HAVEN</div>
              <div className="text-zinc-400">Identity & Profile</div>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-zinc-500 mb-1">VOID</div>
              <div className="text-zinc-400">Developer HQ</div>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-zinc-500 mb-1">NEXUS</div>
              <div className="text-zinc-400">P2P Analytics</div>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-zinc-500 mb-1">SCROLLS</div>
              <div className="text-zinc-400">Knowledge</div>
            </div>
          </div>
        </div>
      </div>
    </FractureShell>
    </>
  );
}
