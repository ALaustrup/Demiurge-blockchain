"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, ArrowRight, Home, Code, Network, BookOpen, Sparkles } from "lucide-react";
import { GENESIS_CONFIG } from "@/config/genesis";

export function GenesisOnboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!GENESIS_CONFIG.enabled) return;

    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem("genesis_onboarding_seen") === "true";
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("genesis_onboarding_seen", "true");
    setIsOpen(false);
    router.push("/void");
  };

  if (!GENESIS_CONFIG.enabled || !isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-2xl mx-4 glass-dark rounded-xl border border-white/20 p-8 space-y-6"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="space-y-4">
              <h2 className="text-3xl font-oswald text-white mb-2">Welcome to Fracture Portal</h2>
              <p className="text-gray-300 leading-relaxed">
                The Fracture Portal is your command center for the Demiurge ecosystem. Here you can manage rituals,
                monitor the Fabric network, interact with ArchonAI, and explore system history through time travel.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-oswald text-white">Haven</h3>
                  </div>
                  <p className="text-xs text-gray-400">Your home and profile. Manage your AbyssID, view CGT balance, and browse NFTs.</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-5 h-5 text-purple-400" />
                    <h3 className="font-oswald text-white">Void</h3>
                  </div>
                  <p className="text-xs text-gray-400">Developer HQ. Run rituals, manage Dev Capsules, and control the Ritual Engine.</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Network className="w-5 h-5 text-fuchsia-400" />
                    <h3 className="font-oswald text-white">Nexus</h3>
                  </div>
                  <p className="text-xs text-gray-400">P2P analytics and network visualization. Monitor Fabric topology and system health.</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-oswald text-white">Conspire</h3>
                  </div>
                  <p className="text-xs text-gray-400">Interact with ArchonAI. Review proposals and get AI-powered assistance.</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
                <h3 className="font-oswald text-white mb-2">Genesis Mode</h3>
                <p className="text-xs text-gray-300">
                  You're in <span className="text-purple-400 font-medium">Genesis Mode</span> - a cinematic demo experience.
                  The network data you see is synthetic, scripted to demonstrate the Portal's capabilities.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <motion.button
                onClick={handleDismiss}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-medium flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Begin Genesis Run
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={handleDismiss}
                className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Enter Void
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

