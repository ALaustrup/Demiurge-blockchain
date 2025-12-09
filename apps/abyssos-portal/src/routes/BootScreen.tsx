import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FullscreenContainer } from '../components/layout/FullscreenContainer';
import { AbyssBackground } from '../components/layout/AbyssBackground';

interface BootScreenProps {
  onComplete: () => void;
}

export function BootScreen({ onComplete }: BootScreenProps) {
  const [phase, setPhase] = useState<'abyss' | 'demiurge' | 'complete'>('abyss');

  useEffect(() => {
    // Phase 1: Show "ABYSS OS" and "Alpha v.1.1"
    const timer1 = setTimeout(() => {
      setPhase('demiurge');
    }, 3000);

    // Phase 2: Show "D E M I U R G E" then complete
    const timer2 = setTimeout(() => {
      setPhase('complete');
      setTimeout(onComplete, 1000);
    }, 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <FullscreenContainer>
        <div className="absolute inset-0 bg-black/80" />
        <AbyssBackground />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Phase 1: ABYSS OS */}
          {phase === 'abyss' && (
            <motion.div
              className="text-center space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="text-7xl font-bold text-abyss-cyan"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                ABYSS OS
              </motion.div>
              <motion.div
                className="text-xl text-gray-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                Alpha v.1.1
              </motion.div>
            </motion.div>
          )}

          {/* Phase 2: D E M I U R G E */}
          {phase === 'demiurge' && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <motion.div
                className="text-6xl font-bold tracking-widest"
                style={{
                  color: '#1a1a1a',
                  textShadow: '0 0 20px rgba(0, 255, 255, 0.3), 0 0 40px rgba(0, 255, 255, 0.2)',
                  fontFamily: 'serif',
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2 }}
              >
                D E M I U R G E
              </motion.div>
            </motion.div>
          )}
        </div>
      </FullscreenContainer>
    </AnimatePresence>
  );
}