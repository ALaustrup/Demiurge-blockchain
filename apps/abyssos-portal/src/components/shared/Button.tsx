import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
}: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-full font-medium transition-all duration-200';
  
  const variantClasses = {
    primary: 'bg-abyss-cyan text-abyss-dark hover:bg-abyss-cyan/80 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]',
    secondary: 'bg-abyss-purple text-white hover:bg-abyss-purple/80 hover:shadow-[0_0_20px_rgba(157,0,255,0.5)]',
    ghost: 'bg-transparent border border-abyss-cyan text-abyss-cyan hover:bg-abyss-cyan/10',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      {children}
    </motion.button>
  );
}

