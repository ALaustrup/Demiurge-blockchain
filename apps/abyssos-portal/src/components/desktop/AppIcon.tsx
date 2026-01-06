import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AppIconProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export function AppIcon({ icon, label, onClick }: AppIconProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center space-y-2 group relative"
    >
      <div className="w-16 h-16 rounded-2xl bg-abyss-navy/60 border border-abyss-cyan/30 flex items-center justify-center text-2xl group-hover:border-abyss-cyan/60 group-hover:bg-abyss-cyan/10 group-hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all duration-200 relative">
        {icon}
      </div>
      <span className="text-xs text-gray-300 group-hover:text-abyss-cyan transition-colors">
        {label}
      </span>
    </button>
  );
}

