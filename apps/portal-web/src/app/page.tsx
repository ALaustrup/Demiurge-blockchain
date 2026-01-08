"use client";

import { useState } from "react";
import { FractureShell } from "@/components/fracture/FractureShell";
import { GenesisOnboarding } from "@/components/genesis/GenesisOnboarding";
import { motion } from "framer-motion";
import { Download, Sparkles, Rocket, Shield } from "lucide-react";
import { LaunchCountdown } from "@/components/countdown/LaunchCountdown";
import { DownloadModal } from "@/components/modals/DownloadModal";
import { QorIDDialog } from "@/components/fracture/QorIDDialog";
import Link from "next/link";

/**
 * Fracture Landing Page
 * 
 * The entry point to the Demiurge chain with QOR Launcher promotion.
 */
export default function HomePage() {
  const [showDownload, setShowDownload] = useState(false);
  const [showQorID, setShowQorID] = useState(false);
  
  // Launch date: 3 days from Jan 7, 2026 = Jan 10, 2026 at 12:00 UTC
  const launchDate = new Date('2026-01-10T12:00:00Z');

  return (
    <>
      <GenesisOnboarding />
      <FractureShell>
        {/* Countdown Banner at Top */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl mx-auto mb-8 p-4 bg-gradient-to-r from-genesis-flame-orange/10 via-genesis-cipher-cyan/10 to-genesis-void-purple/10 border border-genesis-flame-orange/30 rounded-2xl backdrop-blur-sm"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-genesis-flame-orange/20">
                <Rocket className="h-5 w-5 text-genesis-flame-orange" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-genesis-text-primary">
                  DEMIURGE QOR Alpha Launch
                </h3>
                <p className="text-xs text-genesis-text-tertiary">
                  The ultimate blockchain launcher
                </p>
              </div>
            </div>
            <LaunchCountdown targetDate={launchDate} compact />
          </div>
        </motion.div>

        <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 space-y-12">
          {/* Hero Section */}
          <motion.div
            className="max-w-4xl mx-auto px-8 py-12 rounded-3xl bg-genesis-glass-light border-2 border-genesis-border-bright backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-genesis-flame-orange to-genesis-flame-red rounded-full text-xs font-bold text-white">
              ALPHA v1.0
            </div>

            {/* Overline */}
            <div className="text-xs sm:text-sm text-genesis-text-tertiary font-mono tracking-widest mb-4 text-center">
              DEMIURGE BLOCKCHAIN
            </div>

            {/* Main Title */}
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-display mb-6 text-center bg-gradient-to-br from-genesis-flame-orange via-genesis-cipher-cyan to-genesis-void-purple bg-clip-text text-transparent"
              style={{
                textShadow: "0 0 40px rgba(249, 115, 22, 0.3)",
                letterSpacing: "0.1em",
                fontFamily: "var(--font-bebas), sans-serif",
                fontWeight: 400,
              }}
            >
              SOVEREIGN DIGITAL PANTHEON
            </motion.h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-lg text-genesis-text-secondary max-w-2xl mx-auto text-center leading-relaxed mb-8">
              A sovereign L1 blockchain and creator economy for Archons and Nomads. 
              Built for autonomy, privacy, and true digital ownership.
            </p>

            {/* Download CTA - Prominent */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <motion.button
                onClick={() => setShowDownload(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-10 py-4 bg-gradient-to-r from-genesis-flame-orange to-genesis-flame-red rounded-xl font-bold text-white text-lg shadow-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-genesis-cipher-cyan to-genesis-void-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-3">
                  <Download className="h-6 w-6" />
                  <span>DOWNLOAD QOR LAUNCHER</span>
                  <Sparkles className="h-5 w-5" />
                </div>
              </motion.button>
              
              <p className="text-xs text-genesis-text-tertiary text-center">
                One-click node deployment • Integrated wallet • Mining & staking
              </p>
            </div>

            {/* Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowQorID(true)}
                className="px-8 py-3 bg-genesis-glass-light border border-genesis-cipher-cyan/30 text-genesis-cipher-cyan font-semibold rounded-lg hover:bg-genesis-cipher-cyan/10 hover:border-genesis-cipher-cyan/50 transition-all duration-300 hover:scale-105"
              >
                Create QOR ID
              </button>
              <Link
                href="/scrolls"
                className="px-8 py-3 bg-genesis-glass-light border border-genesis-border-default text-genesis-text-secondary font-semibold rounded-lg hover:bg-genesis-glass-medium hover:border-genesis-border-bright transition-all duration-300 hover:scale-105"
              >
                Read Documentation
              </Link>
            </div>
          </motion.div>

          {/* Quick Signup Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-4xl mx-auto px-4"
          >
            <div className="p-8 bg-gradient-to-br from-genesis-void-purple/10 via-genesis-glass-light to-genesis-cipher-cyan/10 border border-genesis-border-bright rounded-2xl backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0 p-4 rounded-2xl bg-gradient-to-br from-genesis-cipher-cyan/20 to-genesis-void-purple/20">
                  <Shield className="h-12 w-12 text-genesis-cipher-cyan" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-genesis-text-primary mb-2">
                    Reserve Your QOR ID Now
                  </h3>
                  <p className="text-sm text-genesis-text-secondary mb-4">
                    Secure your identity before the alpha launch. Early adopters get exclusive benefits 
                    and priority access to the QOR ecosystem.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-genesis-text-tertiary">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-genesis-glass-light rounded">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Free forever
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-genesis-glass-light rounded">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      2GB storage
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-genesis-glass-light rounded">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      On-chain wallet
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowQorID(true)}
                  className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-genesis-cipher-cyan to-genesis-void-purple text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Sign Up Free
                </button>
              </div>
            </div>
          </motion.div>

          {/* Features Grid */}
          <div className="mt-8 max-w-4xl mx-auto w-full px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/haven"
                className="group p-6 bg-genesis-glass-light border border-genesis-border-default rounded-xl backdrop-blur-sm hover:border-genesis-cipher-cyan/50 hover:bg-genesis-glass-medium transition-all duration-300"
              >
                <div className="text-genesis-cipher-cyan mb-2 group-hover:scale-110 transition-transform">
                  HAVEN
                </div>
                <div className="text-sm text-genesis-text-tertiary">
                  Identity & Profile
                </div>
              </Link>
              
              <Link
                href="/void"
                className="group p-6 bg-genesis-glass-light border border-genesis-border-default rounded-xl backdrop-blur-sm hover:border-genesis-void-purple/50 hover:bg-genesis-glass-medium transition-all duration-300"
              >
                <div className="text-genesis-void-purple mb-2 group-hover:scale-110 transition-transform">
                  VOID
                </div>
                <div className="text-sm text-genesis-text-tertiary">
                  Developer HQ
                </div>
              </Link>
              
              <Link
                href="/nexus"
                className="group p-6 bg-genesis-glass-light border border-genesis-border-default rounded-xl backdrop-blur-sm hover:border-genesis-flame-orange/50 hover:bg-genesis-glass-medium transition-all duration-300"
              >
                <div className="text-genesis-flame-orange mb-2 group-hover:scale-110 transition-transform">
                  NEXUS
                </div>
                <div className="text-sm text-genesis-text-tertiary">
                  P2P Analytics
                </div>
              </Link>
              
              <Link
                href="/scrolls"
                className="group p-6 bg-genesis-glass-light border border-genesis-border-default rounded-xl backdrop-blur-sm hover:border-genesis-text-primary/50 hover:bg-genesis-glass-medium transition-all duration-300"
              >
                <div className="text-genesis-text-primary mb-2 group-hover:scale-110 transition-transform">
                  SCROLLS
                </div>
                <div className="text-sm text-genesis-text-tertiary">
                  Knowledge Base
                </div>
              </Link>
            </div>
          </div>
        </div>
      </FractureShell>

      {/* Modals */}
      <DownloadModal 
        open={showDownload} 
        onClose={() => setShowDownload(false)}
        launchDate={launchDate}
      />
      
      <QorIDDialog
        open={showQorID}
        onClose={() => setShowQorID(false)}
      />
    </>
  );
}
