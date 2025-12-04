import { ReactNode } from 'react';

interface FullscreenContainerProps {
  children: ReactNode;
  className?: string;
}

export function FullscreenContainer({ children, className = '' }: FullscreenContainerProps) {
  return (
    <div className={`w-screen h-screen overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

