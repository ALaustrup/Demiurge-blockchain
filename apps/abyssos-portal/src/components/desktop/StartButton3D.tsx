/**
 * 3D Textured Start Button
 * 
 * Ancient yet futuristic cyber-themed 3D button with texture and depth.
 * Opens the personalized app store interface.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StartButton3DProps {
  onClick: () => void;
  isOpen: boolean;
}

export function StartButton3D({ onClick, isOpen }: StartButton3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const button = document.getElementById('start-button-3d');
      if (button) {
        const rect = button.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / (rect.width / 2),
          y: (e.clientY - rect.top - rect.height / 2) / (rect.height / 2),
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

  // Calculate 3D transform based on mouse position
  const rotateX = isHovered ? mousePosition.y * -15 : 0;
  const rotateY = isHovered ? mousePosition.x * 15 : 0;
  const translateZ = isHovered ? 10 : isOpen ? 5 : 0;

  return (
    <motion.button
      id="start-button-3d"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-14 h-14 rounded-lg overflow-hidden"
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      animate={{
        rotateX,
        rotateY,
        translateZ,
        scale: isOpen ? 1.05 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      {/* 3D Base Layer - Ancient stone/metal texture */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(20, 20, 40, 0.95) 0%,
              rgba(10, 10, 30, 0.98) 50%,
              rgba(5, 5, 20, 1) 100%
            ),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 255, 0.03) 2px,
              rgba(0, 255, 255, 0.03) 4px
            ),
            radial-gradient(circle at 30% 30%, rgba(138, 43, 226, 0.2), transparent 50%)
          `,
          boxShadow: `
            inset 0 2px 4px rgba(0, 0, 0, 0.8),
            inset 0 -2px 4px rgba(0, 255, 255, 0.1),
            0 0 20px rgba(0, 255, 255, ${isHovered ? 0.6 : isOpen ? 0.4 : 0.2}),
            0 0 40px rgba(138, 43, 226, ${isHovered ? 0.4 : isOpen ? 0.2 : 0.1}),
            0 8px 16px rgba(0, 0, 0, 0.6)
          `,
          border: `1px solid rgba(0, 255, 255, ${isHovered ? 0.6 : 0.3})`,
          transform: 'translateZ(0px)',
        }}
      />

      {/* Top face - Futuristic tech texture */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(0, 255, 255, ${isHovered ? 0.15 : 0.08}) 0%,
              transparent 30%,
              transparent 70%,
              rgba(138, 43, 226, ${isHovered ? 0.12 : 0.06}) 100%
            ),
            radial-gradient(circle at center, rgba(0, 255, 255, ${isHovered ? 0.1 : 0.05}), transparent 70%)
          `,
          transform: `translateZ(${translateZ + 2}px)`,
          mixBlendMode: 'screen',
        }}
        animate={{
          opacity: isHovered ? 1 : 0.7,
        }}
      />

      {/* Ancient runic/geometric pattern overlay */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0, 255, 255, 0.05) 8px, rgba(0, 255, 255, 0.05) 9px),
            repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0, 255, 255, 0.05) 8px, rgba(0, 255, 255, 0.05) 9px)
          `,
          transform: `translateZ(${translateZ + 1}px)`,
          opacity: isHovered ? 0.6 : 0.3,
        }}
      />

      {/* Center symbol - Ancient/futuristic hybrid */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-10"
        style={{
          transform: `translateZ(${translateZ + 3}px)`,
        }}
        animate={{
          scale: isHovered ? 1.2 : 1,
          filter: isHovered ? 'brightness(1.5) drop-shadow(0 0 10px rgba(0, 255, 255, 0.8))' : 'brightness(1)',
        }}
      >
        <div
          className="text-2xl font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 255, 1), rgba(138, 43, 226, 1), rgba(255, 20, 147, 1))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: isHovered
              ? '0 0 20px rgba(0, 255, 255, 0.8), 0 0 40px rgba(138, 43, 226, 0.6)'
              : '0 0 10px rgba(0, 255, 255, 0.5)',
          }}
        >
          {isOpen ? '✕' : '◆'}
        </div>
      </motion.div>

      {/* Edge highlights for 3D effect */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(0, 255, 255, ${isHovered ? 0.3 : 0.15}) 0%,
              transparent 20%,
              transparent 80%,
              rgba(138, 43, 226, ${isHovered ? 0.25 : 0.12}) 100%
            )
          `,
          transform: `translateZ(${translateZ + 1}px)`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Animated energy particles */}
      {isHovered && (
        <div className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: `rgba(${Math.random() > 0.5 ? '0, 255, 255' : '138, 43, 226'}, 0.8)`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: '0 0 6px currentColor',
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                x: (Math.random() - 0.5) * 40,
                y: (Math.random() - 0.5) * 40,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Bottom shadow for depth */}
      <motion.div
        className="absolute -inset-2 rounded-lg pointer-events-none blur-xl"
        style={{
          background: `radial-gradient(circle, rgba(0, 255, 255, ${isHovered ? 0.4 : 0.2}), transparent 70%)`,
          transform: 'translateZ(-10px)',
          opacity: isHovered ? 0.8 : 0.4,
        }}
      />
    </motion.button>
  );
}

