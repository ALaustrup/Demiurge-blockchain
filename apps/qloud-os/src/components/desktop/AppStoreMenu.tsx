/**
 * App Store Menu with Nano Profile
 * 
 * Personalized app store interface showing:
 * - Nano profile with QorID details and stats
 * - App categories and grid
 * - Ancient/futuristic cyber aesthetic
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDesktopStore, APP_INFOS, type AppId } from '../../state/desktopStore';
import { useAbyssIDIdentity, useAbyssIDUserData } from '../../hooks/useAbyssIDIdentity';
import { useWalletStore } from '../../state/walletStore';

interface Category {
  id: string;
  label: string;
  icon: string;
  apps: AppId[];
}

const CATEGORIES: Category[] = [
  {
    id: 'blockchain',
    label: 'Blockchain',
    icon: '⛓️',
    apps: ['chainOps', 'blockExplorer', 'wallet', 'miner', 'drc369Studio'],
  },
  {
    id: 'media',
    label: 'Media',
    icon: '🎬',
    apps: ['neonPlayer', 'neonRadio', 'onChainFiles', 'documentEditor'],
  },
  {
    id: 'social',
    label: 'Social',
    icon: '💬',
    apps: ['vybSocial'],
  },
  {
    id: 'productivity',
    label: 'Productivity',
    icon: '📝',
    apps: ['abyssWriter', 'abyssCalc'],
  },
  {
    id: 'development',
    label: 'Development',
    icon: '💻',
    apps: ['craft', 'appMarketplace', 'archonAI', 'miningAccounting', 'abyssRuntime', 'abyssShell', 'systemMonitor'],
  },
  {
    id: 'network',
    label: 'Network',
    icon: '🌐',
    apps: ['abyssBrowser', 'abyssTorrent', 'dnsConsole', 'abyssGridMonitor'],
  },
  {
    id: 'systems',
    label: 'Systems',
    icon: '🌀',
    apps: [
      'abyssSpiritConsole',
      'cogFabricConsole',
      'cogSingularity',
      'genesisConsole',
      'temporalObservatory',
      'aweConsole',
      'aweAtlas',
    ],
  },
];

interface AppStoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppStoreMenu({ isOpen, onClose }: AppStoreMenuProps) {
  const { openApp } = useDesktopStore();
  const { identity, username, demiurgePublicKey, isAuthenticated } = useAbyssIDIdentity();
  const { balance, assets } = useAbyssIDUserData();
  const { transactions } = useWalletStore();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);

  const handleAppClick = (appId: AppId) => {
    openApp(appId);
    onClose();
  };

  const activeCategoryData = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  // Calculate stats
  const totalTransactions = transactions.length;
  const totalAssets = assets.length;
  const accountAge = identity ? Math.floor((Date.now() - (identity as any).createdAt || Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  // Generate avatar color from username
  const getAvatarColor = (username: string) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Menu Container - Attached to taskbar, full width */}
          <motion.div
            className="fixed top-8 left-0 right-0 w-full h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] z-50 flex flex-col sm:flex-row overflow-hidden"
            style={{
              margin: '0',
              maxWidth: '100vw',
            }}
            style={{
              background: `
                linear-gradient(135deg,
                  rgba(0, 0, 20, 0.98) 0%,
                  rgba(10, 5, 30, 0.95) 50%,
                  rgba(0, 0, 20, 0.98) 100%
                )
              `,
              border: '1px solid rgba(0, 255, 255, 0.3)',
              borderRadius: '16px',
              boxShadow: `
                0 0 40px rgba(0, 255, 255, 0.3),
                0 0 80px rgba(138, 43, 226, 0.2),
                inset 0 0 40px rgba(0, 0, 0, 0.5)
              `,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Left Sidebar - Nano Profile (hidden on mobile, shown on larger screens) */}
            <div
              className="hidden sm:flex w-64 sm:w-80 border-r border-genesis-border-default/20 flex flex-col"
              style={{
                background: `
                  linear-gradient(180deg,
                    rgba(0, 0, 20, 0.8) 0%,
                    rgba(10, 5, 30, 0.6) 100%
                  )
                `,
              }}
            >
              {/* Profile Header */}
              <div className="p-6 border-b border-genesis-border-default/20">
                <div className="flex items-center gap-4 mb-4">
                  {/* Avatar */}
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold text-white relative overflow-hidden"
                    style={{
                      backgroundColor: isAuthenticated && username ? getAvatarColor(username) : '#666',
                      boxShadow: `
                        0 0 20px rgba(0, 255, 255, 0.4),
                        inset 0 0 20px rgba(0, 0, 0, 0.3)
                      `,
                    }}
                  >
                    {isAuthenticated && username ? getInitials(username) : 'G'}
                    {/* Animated border */}
                    <motion.div
                      className="absolute inset-0 rounded-lg"
                      style={{
                        border: '2px solid rgba(0, 255, 255, 0.6)',
                      }}
                      animate={{
                        boxShadow: [
                          '0 0 10px rgba(0, 255, 255, 0.4)',
                          '0 0 20px rgba(0, 255, 255, 0.6)',
                          '0 0 10px rgba(0, 255, 255, 0.4)',
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-1">
                      {isAuthenticated && username ? username : 'Guest'}
                    </h3>
                    <p className="text-xs text-genesis-text-tertiary">
                      {isAuthenticated ? 'QorID Account' : 'Not logged in'}
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-genesis-glass-light/50 hover:bg-abyss-cyan/20 text-genesis-cipher-cyan flex items-center justify-center transition-colors border border-genesis-border-default/20"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Stats Section */}
              {isAuthenticated && (
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                  {/* Balance Card */}
                  <div
                    className="p-4 rounded-lg border border-genesis-border-default/20"
                    style={{
                      background: `
                        linear-gradient(135deg,
                          rgba(0, 255, 255, 0.05) 0%,
                          rgba(138, 43, 226, 0.05) 100%
                        )
                      `,
                    }}
                  >
                    <div className="text-xs text-genesis-text-tertiary mb-2">CGT Balance</div>
                    <div className="text-2xl font-mono font-bold text-genesis-cipher-cyan">
                      {typeof balance === 'number' ? balance.toFixed(8) : String(balance)}
                      <span className="text-sm text-genesis-text-tertiary ml-1">CGT</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="p-3 rounded-lg border border-genesis-border-default/10"
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      <div className="text-xs text-genesis-text-tertiary mb-1">Transactions</div>
                      <div className="text-lg font-bold text-genesis-cipher-cyan">{totalTransactions}</div>
                    </div>
                    <div
                      className="p-3 rounded-lg border border-genesis-border-default/10"
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      <div className="text-xs text-genesis-text-tertiary mb-1">Assets</div>
                      <div className="text-lg font-bold text-genesis-cipher-cyan">{totalAssets}</div>
                    </div>
                    <div
                      className="p-3 rounded-lg border border-genesis-border-default/10"
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      <div className="text-xs text-genesis-text-tertiary mb-1">Account Age</div>
                      <div className="text-lg font-bold text-genesis-cipher-cyan">{accountAge}d</div>
                    </div>
                    <div
                      className="p-3 rounded-lg border border-genesis-border-default/10"
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      <div className="text-xs text-genesis-text-tertiary mb-1">Status</div>
                      <div className="text-lg font-bold text-green-400">● Active</div>
                    </div>
                  </div>

                  {/* Public Key */}
                  {demiurgePublicKey && (
                    <div
                      className="p-3 rounded-lg border border-genesis-border-default/10"
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      <div className="text-xs text-genesis-text-tertiary mb-2">Demiurge Address</div>
                      <div className="text-xs font-mono text-genesis-cipher-cyan break-all">
                        {demiurgePublicKey.slice(0, 16)}...
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Guest Message */}
              {!isAuthenticated && (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <p className="text-genesis-text-tertiary mb-4">Log in to view your profile</p>
                    <p className="text-xs text-gray-500">Create an QorID to get started</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Content - App Store */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Header */}
              <div className="px-6 py-4 border-b border-genesis-border-default/20 flex items-center justify-between">
                <h2 className="text-xl font-bold text-genesis-cipher-cyan">App Store</h2>
                <div className="text-sm text-genesis-text-tertiary">
                  {activeCategoryData.apps.length} apps
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex min-h-0">
                {/* Category Tabs - Responsive: horizontal on mobile, vertical on desktop */}
                <div className="w-full sm:w-48 sm:border-r border-b sm:border-b-0 border-genesis-border-default/20 bg-genesis-glass-light/30 overflow-x-auto sm:overflow-y-auto flex sm:flex-col">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`flex-shrink-0 sm:w-full px-3 sm:px-4 py-2 sm:py-3 text-left flex items-center gap-2 sm:gap-3 transition-all ${
                        activeCategory === category.id
                          ? 'bg-abyss-cyan/20 text-genesis-cipher-cyan border-l-2 sm:border-l-2 border-b-2 sm:border-b-0 border-genesis-border-default'
                          : 'text-genesis-text-secondary hover:bg-abyss-cyan/10 hover:text-genesis-cipher-cyan'
                      }`}
                      style={{
                        background: activeCategory === category.id
                          ? 'linear-gradient(90deg, rgba(0, 255, 255, 0.2), transparent)'
                          : undefined,
                      }}
                    >
                      <span className="text-lg sm:text-xl">{category.icon}</span>
                      <span className="font-medium text-xs sm:text-sm">{category.label}</span>
                      <span className="ml-auto text-xs text-gray-500">
                        {category.apps.length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* App Grid - Responsive sizing */}
                <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeCategory}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4"
                    >
                      {activeCategoryData.apps.map((appId) => {
                        const appInfo = APP_INFOS.find((a) => a.id === appId);
                        if (!appInfo) return null;

                        return (
                          <button
                            key={appId}
                            onClick={() => handleAppClick(appId)}
                            className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 rounded-lg border border-genesis-border-default/20 bg-black/40 hover:border-genesis-border-default/60 hover:bg-abyss-cyan/10 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all group relative overflow-hidden"
                          >
                            {/* Subtle hover glow */}
                            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              style={{
                                background: 'radial-gradient(circle, rgba(0, 255, 255, 0.15), transparent)',
                              }}
                            />

                            <div className="text-2xl sm:text-3xl md:text-4xl relative z-10">
                              {appInfo.icon}
                            </div>
                            <span className="text-[10px] sm:text-xs text-genesis-text-secondary group-hover:text-genesis-cipher-cyan text-center font-medium relative z-10 leading-tight transition-colors">
                              {appInfo.label}
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

