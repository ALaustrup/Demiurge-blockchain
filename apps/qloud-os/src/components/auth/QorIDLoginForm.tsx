import { useState } from 'react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { useQorID } from '../../hooks/useAbyssID';
import { backgroundMusicService } from '../../services/backgroundMusic';

interface QorIDLoginFormProps {
  onSignupClick: () => void;
}

export function QorIDLoginForm({ onSignupClick }: QorIDLoginFormProps) {
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [useSecret, setUseSecret] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useQorID();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (useSecret) {
      if (!secret.trim()) {
        setError('Please enter your secret code');
        return;
      }
    } else {
      if (!username.trim()) {
        setError('Please enter your username');
        return;
      }
    }

    setIsLoading(true);
    try {
      // Use unified QorID login - this will automatically initialize identity service
      if (useSecret) {
        await login(undefined, secret.trim());
      } else {
        await login(username.trim());
      }
      // Start background music after successful login
      backgroundMusicService.play();
      // Login success - identity service will handle wallet sync, etc.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 w-full max-w-md">
      <h2 className="text-3xl font-bold mb-6 text-genesis-flame-orange font-genesis-display">GENESIS</h2>
      <p className="text-sm text-genesis-text-secondary mb-6 text-center">Sign in with your QorID</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useSecret}
              onChange={(e) => setUseSecret(e.target.checked)}
              className="w-4 h-4 text-genesis-flame-orange bg-genesis-glass-light border-genesis-border-default rounded focus:ring-genesis-flame-orange"
            />
            <span className="text-sm text-genesis-text-secondary">Login with secret code</span>
          </label>
        </div>

        {useSecret ? (
          <div>
            <label className="block text-sm font-medium mb-2 text-genesis-text-primary">
              Secret Code
            </label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="genesis-input w-full px-4 py-2 font-mono text-sm"
              placeholder="Enter your secret code"
              disabled={isLoading}
            />
            <p className="text-xs text-genesis-text-tertiary mt-1">Use the secret code you saved during signup</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2 text-genesis-text-primary">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="genesis-input w-full px-4 py-2"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>
        )}


        {error && (
          <div className="text-genesis-error text-sm">{error}</div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="genesis-button-primary w-full"
        >
          {isLoading ? 'Logging in...' : 'SIGN IN'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onSignupClick}
          className="text-genesis-cipher-cyan hover:text-genesis-cipher-cyan-hover underline text-sm transition-colors"
        >
          Create new QorID
        </button>
      </div>
    </Card>
  );
}

