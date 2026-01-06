import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from './state/authStore';
import { AbyssIDProvider, useAbyssID } from './context/AbyssIDContext';
import { ThemeProvider } from './context/ThemeContext';
import { BlockListenerProvider } from './context/BlockListenerContext';
import { IntroVideo } from './components/IntroVideo';
import { LoginScreen } from './routes/LoginScreen';
import { Desktop } from './routes/Desktop';
import { WalletInitializer } from './components/WalletInitializer';
import { migrateOldDemiNFTData } from './services/abyssid/drc369';
import './styles/globals.css';

type Screen = 'intro' | 'login' | 'desktop';

function AppContent() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [showIntro, setShowIntro] = useState(true);
  const { session, isLoading: abyssIDLoading } = useAbyssID();
  const { initialize } = useAuthStore();
  const hasInitialized = useRef(false);
  
  // Sync authStore with AbyssID session
  useEffect(() => {
    if (session && !hasInitialized.current) {
      // Update authStore to reflect AbyssID session
      const account = {
        username: session.username,
        publicKey: session.publicKey,
      };
      useAuthStore.getState().login(account);
      hasInitialized.current = true;
    } else if (!session && hasInitialized.current) {
      // Clear authStore if AbyssID session is lost
      useAuthStore.getState().logout();
    }
  }, [session]);

  useEffect(() => {
    // Migrate old DemiNFT data to DRC-369 on app startup
    try {
      migrateOldDemiNFTData();
    } catch (error) {
      console.error('Migration error:', error);
    }
    
    // Initialize auth store (for backward compatibility)
    initialize().catch((error) => {
      console.error('Initialization error:', error);
      // Continue even if initialization fails
    });
  }, [initialize]);

  const handleIntroComplete = () => {
    setShowIntro(false);
    // After intro video, show login/signup (or desktop if already authenticated)
    if (session) {
      setScreen('desktop');
    } else {
      setScreen('login');
    }
  };

  const handleLogin = () => {
    setScreen('desktop');
  };

  if (abyssIDLoading) {
    return (
      <div className="w-screen h-screen bg-abyss-dark flex items-center justify-center">
        <div className="text-abyss-cyan">Loading...</div>
      </div>
    );
  }

  // Show intro video (no autoplay, muted, click-to-play only)
  if (showIntro && screen === 'intro') {
    return <IntroVideo onComplete={handleIntroComplete} />;
  }

  // Show login/signup screen after intro (or if already authenticated, skip to desktop)
  if (screen === 'login' || (!session && !showIntro)) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Show desktop for authenticated users
  return (
    <BlockListenerProvider>
      <WalletInitializer />
      <Desktop />
    </BlockListenerProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AbyssIDProvider>
        <AppContent />
      </AbyssIDProvider>
    </ThemeProvider>
  );
}

export default App;
