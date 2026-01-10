import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FullscreenContainer } from '../components/layout/FullscreenContainer';
import { AbyssBackground } from '../components/layout/AbyssBackground';
import { QorIDLoginForm } from '../components/auth/QorIDLoginForm';
import { QorIDSignupModal } from '../components/auth/QorIDSignupModal';
import { useQorID } from '../hooks/useAbyssID';
import { backgroundMusicService } from '../services/backgroundMusic';
import { loginVoiceService } from '../services/loginVoice';

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [showSignup, setShowSignup] = useState(false);
  const { session, isLoading } = useQorID();

  // Play login voice when screen appears (after intro video ends)
  useEffect(() => {
    loginVoiceService.play();
  }, []);

  // If authenticated, trigger login callback and start background music
  useEffect(() => {
    if (!isLoading && session) {
      // Start background music after successful login
      backgroundMusicService.play();
      onLogin();
    }
  }, [session, isLoading, onLogin]);

  if (isLoading) {
    return (
      <FullscreenContainer>
        <AbyssBackground />
        <div className="absolute inset-0 flex items-center justify-center text-genesis-cipher-cyan">
          Loading...
        </div>
      </FullscreenContainer>
    );
  }

  if (session) {
    return null; // Will trigger onLogin via useEffect
  }

  const handleSignupSuccess = (_username: string, _publicKey: string) => {
    // Account already logged in via signup, just trigger onLogin
    // Background music will start automatically after login
    onLogin();
  };

  return (
    <FullscreenContainer>
      <AbyssBackground />
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <QorIDLoginForm onSignupClick={() => setShowSignup(true)} />
      </motion.div>

      <QorIDSignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSuccess={handleSignupSuccess}
      />
    </FullscreenContainer>
  );
}

