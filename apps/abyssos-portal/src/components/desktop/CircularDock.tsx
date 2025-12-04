import { motion } from 'framer-motion';
import { AppIcon } from './AppIcon';
import { useDesktopStore } from '../../state/desktopStore';

const apps = [
  { id: 'chainOps' as const, label: 'Chain Ops', icon: '⚡' },
  { id: 'miner' as const, label: 'Miner', icon: '🔷' },
  { id: 'wallet' as const, label: 'Wallet', icon: '💎' },
  { id: 'abyssBrowser' as const, label: 'Browser', icon: '🌐' },
  { id: 'abyssTorrent' as const, label: 'Torrent', icon: '📤' },
  { id: 'onChainFiles' as const, label: 'Files', icon: '📁' },
];

export function CircularDock() {
  const openApp = useDesktopStore((state) => state.openApp);

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-10">
      <motion.div
        className="flex items-center space-x-8 px-8 py-6 bg-abyss-navy/60 backdrop-blur-md border border-abyss-cyan/20 rounded-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {apps.map((app) => (
          <AppIcon
            key={app.id}
            icon={<span>{app.icon}</span>}
            label={app.label}
            onClick={() => openApp(app.id)}
          />
        ))}
      </motion.div>
    </div>
  );
}

