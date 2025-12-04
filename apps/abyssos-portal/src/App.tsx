import { useEffect, useState } from 'react';
import { useAuthStore } from './state/authStore';
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
    return <BootScreen onComplete={handleBootComplete} />;
  }

  if (screen === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Desktop />;
}

export default App;

