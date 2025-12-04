import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-abyss-navy/80 backdrop-blur-sm border border-abyss-cyan/20 rounded-2xl shadow-xl ${className}`}
    >
      {children}
    </div>
  );
}

