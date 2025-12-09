import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StartButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function StartButton({ onClick, isOpen }: StartButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const button = document.getElementById('start-button');
      if (button) {
        const rect = button.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left - rect.width / 2,
          y: e.clientY - rect.top - rect.height / 2,
        });
      }
    };

    if (isHovered) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHovered]);

  return (
    <motion.button
      id="start-button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
      animate={{
        scale: isHovered ? 1.1 : isOpen ? 1.05 : 1,
        boxShadow: isHovered
          ? '0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(0, 255, 255, 0.2)'
          : isOpen
          ? '0 0 15px rgba(0, 255, 255, 0.4), 0 0 30px rgba(0, 255, 255, 0.2)'
          : '0 0 10px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(0, 255, 255, 0.1)',
      }}
      transition={{ duration: 0.3 }}
      style={{
        background: isHovered
          ? 'radial-gradient(circle at center, rgba(0, 255, 255, 0.3), rgba(0, 100, 150, 0.5), rgba(0, 0, 50, 0.8))'
          : 'radial-gradient(circle at center, rgba(0, 50, 100, 0.6), rgba(0, 0, 50, 0.9), rgba(0, 0, 20, 1))',
      }}
    >
      {/* Glitter/Sparkle effect */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-abyss-cyan rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Hover light effect following cursor */}
      {isHovered && (
        <motion.div
          className="absolute w-20 h-20 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, rgba(0, 255, 255, 0.4) 0%, transparent 70%)`,
            x: mousePosition.x - 40,
            y: mousePosition.y - 40,
          }}
          animate={{
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      )}

      {/* Inner glow */}
      <motion.div
        className="absolute inset-2 rounded-full"
        animate={{
          background: isHovered
            ? 'radial-gradient(circle, rgba(0, 255, 255, 0.5), transparent)'
            : 'radial-gradient(circle, rgba(0, 255, 255, 0.2), transparent)',
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Center icon/symbol */}
      <motion.div
        className="relative z-10 text-abyss-cyan text-lg font-bold"
        animate={{
          scale: isHovered ? 1.2 : 1,
          filter: isHovered ? 'brightness(1.5)' : 'brightness(1)',
        }}
        transition={{ duration: 0.2 }}
      >
        {isOpen ? '✕' : '◆'}
      </motion.div>

      {/* Outer ring glow */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 pointer-events-none"
        animate={{
          borderColor: isHovered
            ? 'rgba(0, 255, 255, 0.8)'
            : 'rgba(0, 255, 255, 0.3)',
          boxShadow: isHovered
            ? '0 0 15px rgba(0, 255, 255, 0.6), inset 0 0 15px rgba(0, 255, 255, 0.3)'
            : '0 0 5px rgba(0, 255, 255, 0.3)',
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}

