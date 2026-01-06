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
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 relative';
  
  const variantClasses = {
    primary: 'bg-abyss-cyan/20 border border-abyss-cyan/40 text-abyss-cyan hover:bg-abyss-cyan/30 hover:border-abyss-cyan/60 hover:shadow-[0_0_15px_rgba(0,255,255,0.4)]',
    secondary: 'bg-abyss-purple/20 border border-abyss-purple/40 text-abyss-purple hover:bg-abyss-purple/30 hover:border-abyss-purple/60 hover:shadow-[0_0_15px_rgba(157,0,255,0.4)]',
    ghost: 'bg-transparent/50 border border-abyss-cyan/30 text-abyss-cyan hover:bg-abyss-cyan/20 hover:border-abyss-cyan/50 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      {children}
    </button>
  );
}

