"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useReactiveMotion } from "@/lib/fracture/motion/useReactiveMotion";
import { useState } from "react";
import { AbyssIDDialog } from "./AbyssIDDialog";
import Link from "next/link";

interface HeroPanelProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  showCTAs?: boolean;
}

export function HeroPanel({ 
  title = "[ alpha v1.0 }", 
  subtitle, 
  children,
  showCTAs = false 
}: HeroPanelProps) {
  const { panelJitter, glyphPulse } = useReactiveMotion();
  const [showAbyssID, setShowAbyssID] = useState(false);

  // Default dark subtitle if not provided
  const defaultSubtitle = "Demiuge Blockchain";

  return (
    <>
      <motion.div
        className="max-w-3xl mx-auto py-8 px-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] relative mb-8"
        style={{
          transform: `translate(${panelJitter.x}px, ${panelJitter.y}px) rotate(${panelJitter.rotation}deg)`,
          boxShadow: `0 0 80px rgba(0,255,255,0.15), 0 0 60px rgba(0,0,0,0.8)`,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Overline */}
        <div className="text-xs sm:text-sm text-zinc-500 font-mono tracking-widest mb-4 text-center">
          A B Y S S  OS
        </div>

        {/* Main Title */}
        <motion.h1
          className="text-3xl sm:text-4xl lg:text-5xl font-display mb-4 text-center"
          style={{
            transform: `scale(${1 + glyphPulse * 0.5})`,
            textShadow: "0 0 30px rgba(34, 211, 238, 0.3), 0 0 20px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.6)",
            letterSpacing: "0.15em",
            fontFamily: "var(--font-bebas), sans-serif",
            fontWeight: 400,
          }}
        >
          <span className="text-zinc-100">{title}</span>
        </motion.h1>

        {/* Subtitle */}
        {(subtitle || showCTAs) && (
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto text-center leading-relaxed mb-8">
            {subtitle || defaultSubtitle}
          </p>
        )}

        {/* CTAs */}
        {showCTAs && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setShowAbyssID(true)}
              className="px-8 py-3 bg-white/5 border border-cyan-500/30 text-cyan-300 font-bold-display rounded-lg hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 text-sm tracking-wider"
              style={{
                boxShadow: "0 0 20px rgba(6, 182, 212, 0.2)",
                fontFamily: "var(--font-oswald), sans-serif",
                fontWeight: 700,
              }}
            >
              Enter the Abyss
            </button>
            <Link
              href="/scrolls"
              className="px-8 py-3 bg-white/5 border border-white/10 text-zinc-300 font-bold-display rounded-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 text-sm tracking-wider"
              style={{
                fontFamily: "var(--font-oswald), sans-serif",
                fontWeight: 700,
              }}
            >
              Read the Scrolls
            </Link>
          </div>
        )}

        {/* Children */}
        {children && (
          <div className="mt-8">
            {children}
          </div>
        )}
      </motion.div>

      {/* AbyssID Dialog */}
      {showAbyssID && (
        <AbyssIDDialog
          open={showAbyssID}
          onClose={() => setShowAbyssID(false)}
        />
      )}
    </>
  );
}

