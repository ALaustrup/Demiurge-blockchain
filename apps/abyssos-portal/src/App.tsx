import { useEffect, useState } from 'react';
import { useAuthStore } from './state/authStore';
import { AbyssIDProvider } from './context/AbyssIDContext';
import { ThemeProvider } from './context/ThemeContext';
import { BootScreen } from './routes/BootScreen';
import { LoginScreen } from './routes/LoginScreen';
import { Desktop } from './routes/Desktop';
import './styles/globals.css';

type Screen = 'boot' | 'login' | 'desktop';

function App() {
  const [screen, setScreen] = useState<Screen>('boot');
  const [showBoot, setShowBoot] = useState(true);
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize().then(() => {
      // After auth init, check if we should skip boot
      if (isAuthenticated) {
        setShowBoot(false);
        setScreen('desktop');
      }
    });
  }, [initialize, isAuthenticated]);

  const handleBootComplete = () => {
    if (isAuthenticated) {
      setScreen('desktop');
    } else {
      setScreen('login');
    }
  };

  const handleLogin = () => {
    setScreen('desktop');
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-abyss-dark flex items-center justify-center">
        <div className="text-abyss-cyan">Loading...</div>
      </div>
    );
  }

  if (showBoot && screen === 'boot') {
    return (
      <ThemeProvider>
        <AbyssIDProvider>
          <BootScreen onComplete={handleBootComplete} />
        </AbyssIDProvider>
      </ThemeProvider>
    );
  }

  if (screen === 'login') {
    return (
      <ThemeProvider>
        <AbyssIDProvider>
          <LoginScreen onLogin={handleLogin} />
        </AbyssIDProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AbyssIDProvider>
        <Desktop />
      </AbyssIDProvider>
    </ThemeProvider>
  );
}

export default App;

