"use client";

import { ReactNode } from "react";
import { FractureNav } from "./FractureNav";
import { AudioReactiveLayer } from "./AudioReactiveLayer";

interface FractureShellProps {
  children: ReactNode;
  showNav?: boolean;
}

export function FractureShell({ children, showNav = true }: FractureShellProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover pointer-events-none z-0"
        poster="/media/fracture-bg-poster.jpg"
      >
        <source src="/media/fracture-bg.webm" type="video/webm" />
        <source src="/media/fracture-bg.mp4" type="video/mp4" />
        {/* Fallback gradient if video fails */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-black" />
      </video>

      {/* Dark Gradient Overlay - Darker, more menacing */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black z-10 pointer-events-none" />
      
      {/* Vignette Overlay - Subtle darkening at edges */}
      <div className="fixed inset-0 bg-radial-gradient from-transparent via-transparent to-black/40 z-11 pointer-events-none" 
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.4) 100%)"
        }}
      />
      
      {/* Subtle Noise Texture (CSS-based) */}
      <div 
        className="fixed inset-0 z-12 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Audio Reactive Layer */}
      <AudioReactiveLayer />

      {/* Navigation */}
      {showNav && <FractureNav />}

      {/* Content Area - Glass cathedral aesthetic */}
      <main className="relative z-20 min-h-screen flex flex-col">
        <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

