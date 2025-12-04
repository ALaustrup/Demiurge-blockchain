import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlitchTextProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function GlitchText({ children, className = '', delay = 0 }: GlitchTextProps) {
  return (
    <motion.div
      className={`glitch-text ${className}`}
      data-text={children}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay }}
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      {children}
    </motion.div>
  );
}

