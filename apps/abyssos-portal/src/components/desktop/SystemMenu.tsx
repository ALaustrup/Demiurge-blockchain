import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDesktopStore, APP_INFOS, type AppId } from '../../state/desktopStore';

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
    id: 'development',
    label: 'Development',
    icon: '💻',
    apps: ['abyssRuntime', 'abyssShell', 'systemMonitor'],
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

interface SystemMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemMenu({ isOpen, onClose }: SystemMenuProps) {
  const { openApp } = useDesktopStore();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);

  const handleAppClick = (appId: AppId) => {
    openApp(appId);
    onClose();
  };

  const activeCategoryData = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Menu Container - Appears from top center */}
          <motion.div
            className="fixed top-12 left-1/2 transform -translate-x-1/2 w-[90vw] max-w-4xl h-[70vh] max-h-[600px] bg-abyss-navy/95 backdrop-blur-xl border border-abyss-cyan/30 rounded-b-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-abyss-cyan/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-abyss-cyan">Applications</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-abyss-dark hover:bg-abyss-cyan/20 text-abyss-cyan flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex min-h-0">
              {/* Category Tabs */}
              <div className="w-48 border-r border-abyss-cyan/20 bg-abyss-dark/50 overflow-y-auto">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      activeCategory === category.id
                        ? 'bg-abyss-cyan/20 text-abyss-cyan border-l-2 border-abyss-cyan'
                        : 'text-gray-300 hover:bg-abyss-cyan/10 hover:text-abyss-cyan'
                    }`}
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span className="font-medium">{category.label}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      {category.apps.length}
                    </span>
                  </button>
                ))}
              </div>

              {/* App Grid */}
              <div className="flex-1 p-6 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4"
                  >
                    {activeCategoryData.apps.map((appId) => {
                      const appInfo = APP_INFOS.find((a) => a.id === appId);
                      if (!appInfo) return null;

                      return (
                        <button
                          key={appId}
                          onClick={() => handleAppClick(appId)}
                          className="flex flex-col items-center gap-2 p-4 rounded-lg bg-abyss-dark/40 border border-abyss-cyan/20 hover:bg-abyss-cyan/10 hover:border-abyss-cyan/50 hover:shadow-[0_0_12px_rgba(0,255,255,0.3)] transition-all group"
                        >
                          <div className="text-4xl group-hover:scale-110 transition-transform">
                            {appInfo.icon}
                          </div>
                          <span className="text-xs text-gray-300 group-hover:text-abyss-cyan text-center font-medium">
                            {appInfo.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

