import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AppIconProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export function AppIcon({ icon, label, onClick }: AppIconProps) {
  return (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center space-y-2 group"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="w-16 h-16 rounded-2xl bg-abyss-navy/80 border border-abyss-cyan/30 flex items-center justify-center text-2xl group-hover:border-abyss-cyan group-hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all duration-200">
        {icon}
      </div>
      <span className="text-xs text-gray-300 group-hover:text-abyss-cyan transition-colors">
        {label}
      </span>
    </motion.button>
  );
}

