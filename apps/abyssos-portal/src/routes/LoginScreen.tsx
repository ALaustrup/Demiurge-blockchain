import { useState } from 'react';
import { motion } from 'framer-motion';
import { FullscreenContainer } from '../components/layout/FullscreenContainer';
import { AbyssBackground } from '../components/layout/AbyssBackground';
import { AbyssIDLoginForm } from '../components/auth/AbyssIDLoginForm';
import { AbyssIDSignupModal } from '../components/auth/AbyssIDSignupModal';
import { useAuthStore } from '../state/authStore';

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [showSignup, setShowSignup] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // If authenticated, trigger login callback
  if (isAuthenticated) {
    onLogin();
    return null;
  }

  const handleSignupSuccess = (_username: string, _publicKey: string) => {
    // Account already logged in via signup, just trigger onLogin
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
        <AbyssIDLoginForm onSignupClick={() => setShowSignup(true)} />
      </motion.div>

      <AbyssIDSignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSuccess={handleSignupSuccess}
      />
    </FullscreenContainer>
  );
}

