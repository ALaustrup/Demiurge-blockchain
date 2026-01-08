"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Check, X, ExternalLink } from "lucide-react";

interface NftPromoCardProps {
  userAddress: string;
  username?: string;
}

export function NftPromoCard({ userAddress, username }: NftPromoCardProps) {
  const [optedIn, setOptedIn] = useState(() => {
    // Check localStorage for opt-in status
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`nft_promo_${userAddress}`) === 'true';
    }
    return false;
  });
  const [showDetails, setShowDetails] = useState(false);

  const handleOptIn = () => {
    setOptedIn(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`nft_promo_${userAddress}`, 'true');
      localStorage.setItem(`nft_promo_timestamp_${userAddress}`, Date.now().toString());
    }
  };

  const handleOptOut = () => {
    setOptedIn(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`nft_promo_${userAddress}`);
      localStorage.removeItem(`nft_promo_timestamp_${userAddress}`);
    }
  };

  if (optedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden p-6 bg-gradient-to-br from-genesis-flame-orange/20 via-genesis-void-purple/20 to-genesis-cipher-cyan/20 border-2 border-genesis-flame-orange/50 rounded-2xl backdrop-blur-sm"
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(249,115,22,0.1),transparent)]" />
        
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-genesis-flame-orange to-genesis-flame-red shadow-lg">
              <Check className="h-6 w-6 text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-genesis-text-primary">
                  You're In! 🎉
                </h3>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="h-4 w-4 text-genesis-flame-orange" />
                </motion.div>
              </div>
              
              <p className="text-sm text-genesis-text-secondary mb-3">
                You're registered for the legendary Demiurge Genesis NFT drop on launch day!
              </p>
              
              <div className="flex flex-col gap-2 text-xs text-genesis-text-tertiary">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span>Wallet address confirmed: {userAddress.slice(0, 8)}...{userAddress.slice(-6)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span>NFT will be airdropped on Jan 10, 2026 at launch</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  <span>Limited to first 1,000 early adopters</span>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-3 text-xs text-genesis-cipher-cyan hover:text-genesis-cipher-cyan/80 underline"
              >
                {showDetails ? 'Hide' : 'View'} NFT Details
              </button>
            </div>
          </div>

          <button
            onClick={handleOptOut}
            className="flex-shrink-0 p-2 rounded-lg text-genesis-text-tertiary hover:text-genesis-text-primary hover:bg-genesis-glass-light transition-colors"
            title="Opt out"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* NFT Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-genesis-border-default"
            >
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-genesis-text-primary">
                  Demiurge Genesis NFT - "The Architect"
                </h4>
                
                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-genesis-glass-light rounded-lg border border-genesis-border-default">
                    <div className="text-genesis-text-tertiary mb-1">Collection</div>
                    <div className="text-genesis-text-primary font-semibold">Genesis Archons</div>
                  </div>
                  
                  <div className="p-3 bg-genesis-glass-light rounded-lg border border-genesis-border-default">
                    <div className="text-genesis-text-tertiary mb-1">Rarity</div>
                    <div className="text-genesis-flame-orange font-semibold">Legendary</div>
                  </div>
                  
                  <div className="p-3 bg-genesis-glass-light rounded-lg border border-genesis-border-default">
                    <div className="text-genesis-text-tertiary mb-1">Supply</div>
                    <div className="text-genesis-text-primary font-semibold">1,000 Total</div>
                  </div>
                  
                  <div className="p-3 bg-genesis-glass-light rounded-lg border border-genesis-border-default">
                    <div className="text-genesis-text-tertiary mb-1">Benefits</div>
                    <div className="text-genesis-cipher-cyan font-semibold">Archon Tier Access</div>
                  </div>
                </div>

                <div className="p-3 bg-genesis-glass-light rounded-lg border border-genesis-border-default">
                  <div className="text-genesis-text-tertiary mb-2 text-xs">Benefits Include:</div>
                  <ul className="text-xs text-genesis-text-secondary space-y-1">
                    <li>• Lifetime Archon premium tier (worth 100 CGT/month)</li>
                    <li>• 10x mining rewards multiplier</li>
                    <li>• Exclusive governance voting power</li>
                    <li>• Early access to all future features</li>
                    <li>• Unique on-chain badge and profile flair</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden p-6 bg-gradient-to-br from-genesis-void-purple/10 via-genesis-glass-light to-genesis-flame-orange/10 border-2 border-genesis-void-purple/30 rounded-2xl backdrop-blur-sm group hover:border-genesis-flame-orange/50 transition-all duration-300"
    >
      {/* Animated shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      
      <div className="relative">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-genesis-void-purple to-genesis-cipher-cyan shadow-lg">
            <Gift className="h-6 w-6 text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-genesis-text-primary">
                Exclusive Launch NFT
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-genesis-flame-orange/20 text-genesis-flame-orange border border-genesis-flame-orange/30 rounded">
                LIMITED
              </span>
            </div>
            
            <p className="text-sm text-genesis-text-secondary mb-3">
              Claim your legendary Demiurge Genesis NFT! Available only to early adopters who register before launch.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4 text-xs">
              <span className="px-2 py-1 bg-genesis-glass-light border border-genesis-border-default rounded text-genesis-text-tertiary">
                ✨ Lifetime Archon Tier
              </span>
              <span className="px-2 py-1 bg-genesis-glass-light border border-genesis-border-default rounded text-genesis-text-tertiary">
                🚀 10x Rewards Boost
              </span>
              <span className="px-2 py-1 bg-genesis-glass-light border border-genesis-border-default rounded text-genesis-text-tertiary">
                🎯 Governance Power
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleOptIn}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-genesis-flame-orange to-genesis-flame-red text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Claim My NFT
          </button>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-3 bg-genesis-glass-light border border-genesis-border-default text-genesis-text-secondary rounded-lg hover:bg-genesis-glass-medium hover:border-genesis-border-bright transition-colors"
            title="Learn more"
          >
            <ExternalLink className="h-5 w-5" />
          </button>
        </div>

        {/* Details Preview */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-genesis-border-default"
            >
              <div className="text-xs text-genesis-text-tertiary space-y-2">
                <p>
                  <strong className="text-genesis-text-primary">The Architect</strong> - A legendary Genesis NFT commemorating the first 1,000 members of the Demiurge ecosystem.
                </p>
                <p>
                  Holders receive permanent Archon tier benefits (100 CGT/month value), governance rights, and exclusive perks across the entire platform.
                </p>
                <p className="text-genesis-flame-orange">
                  ⚠️ Limited to 1,000 total. First come, first served on launch day (Jan 10, 2026).
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
