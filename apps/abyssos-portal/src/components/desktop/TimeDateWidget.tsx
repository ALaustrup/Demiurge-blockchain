/**
 * Time & Date Widget
 * 
 * Widget-style component displaying current local time and date.
 * Ancient/futuristic cyber aesthetic.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TimeDateWidgetProps {
  className?: string;
}

export function TimeDateWidget({ className = '' }: TimeDateWidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      className={`px-4 py-2 rounded-lg border border-abyss-cyan/20 bg-abyss-dark/50 backdrop-blur-sm ${className}`}
      style={{
        background: `
          linear-gradient(135deg,
            rgba(0, 0, 0, 0.4) 0%,
            rgba(10, 5, 30, 0.3) 100%
          )
        `,
        boxShadow: '0 0 10px rgba(0, 255, 255, 0.1), inset 0 0 10px rgba(0, 0, 0, 0.3)',
      }}
      whileHover={{
        scale: 1.02,
        borderColor: 'rgba(0, 255, 255, 0.4)',
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col items-center gap-1">
        {/* Time */}
        <div className="text-abyss-cyan text-lg font-mono font-bold">
          {formatTime(currentTime)}
        </div>
        {/* Date */}
        <div className="text-gray-300 text-xs">
          {formatDate(currentTime)}
        </div>
      </div>
    </motion.div>
  );
}

