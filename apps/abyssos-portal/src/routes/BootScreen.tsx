import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlitchText } from '../components/shared/GlitchText';
import { FullscreenContainer } from '../components/layout/FullscreenContainer';
import { AbyssBackground } from '../components/layout/AbyssBackground';

interface BootScreenProps {
  onComplete: () => void;
}

export function BootScreen({ onComplete }: BootScreenProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // Wait for fade out
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <FullscreenContainer>
          <AbyssBackground />
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center space-y-4">
              <GlitchText delay={0} className="text-7xl font-bold">
                A B Y S S
              </GlitchText>
              <GlitchText delay={0.2} className="text-7xl font-bold ml-8">
                OS
              </GlitchText>
            </div>
          </motion.div>
        </FullscreenContainer>
      )}
    </AnimatePresence>
  );
}

