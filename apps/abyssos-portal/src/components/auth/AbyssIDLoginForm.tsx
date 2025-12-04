import { useState } from 'react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { useAuthStore } from '../../state/authStore';
import { abyssIdClient } from '../../lib/abyssIdClient';

interface AbyssIDLoginFormProps {
  onSignupClick: () => void;
}

export function AbyssIDLoginForm({ onSignupClick }: AbyssIDLoginFormProps) {
  const [username, setUsername] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !publicKey.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const account = await abyssIdClient.login(username, publicKey);
      if (account) {
        login(account);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 w-full max-w-md">
      <h2 className="text-3xl font-bold mb-6 text-abyss-cyan">AbyssID Login</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded-lg text-white focus:outline-none focus:border-abyss-cyan focus:ring-2 focus:ring-abyss-cyan/50"
            placeholder="Enter your username"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Public Key / AbyssID Code
          </label>
          <input
            type="text"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            className="w-full px-4 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded-lg text-white focus:outline-none focus:border-abyss-cyan focus:ring-2 focus:ring-abyss-cyan/50"
            placeholder="Enter your public key or code"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onSignupClick}
          className="text-abyss-cyan hover:text-abyss-cyan/80 underline text-sm"
        >
          Get an AbyssID
        </button>
      </div>
    </Card>
  );
}

