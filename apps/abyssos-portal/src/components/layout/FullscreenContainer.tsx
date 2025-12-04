import { ReactNode } from 'react';

interface FullscreenContainerProps {
  children: ReactNode;
  className?: string;
}

export function FullscreenContainer({ children, className = '' }: FullscreenContainerProps) {
  return (
    <div 
      className={`w-screen overflow-hidden ${className}`}
      style={{
        height: '100dvh', // Dynamic viewport height for mobile
        minHeight: '100vh', // Fallback for older browsers
      }}
    >
      {children}
    </div>
  );
}

