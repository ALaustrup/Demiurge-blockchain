import { useState } from 'react';
import { useAuthStore } from '../../../state/authStore';
import { Button } from '../../shared/Button';

export function WalletApp() {
  const account = useAuthStore((state) => state.account);
  const [isConnected, setIsConnected] = useState(false);
  const [cgtBalance] = useState(() => Math.random() * 1000); // Mock balance

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-4">Accounts / Wallet</h2>
        <p className="text-genesis-text-secondary text-sm mb-4">
          Manage your QorID account and CGT balance.
        </p>
      </div>

      {account ? (
        <div className="space-y-4">
          <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4">
            <div className="text-sm text-genesis-text-tertiary mb-1">Username</div>
            <div className="text-genesis-cipher-cyan font-medium">{account.username}</div>
          </div>

          <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4">
            <div className="text-sm text-genesis-text-tertiary mb-1">Public Key</div>
            <div className="text-xs font-mono text-genesis-text-secondary break-all">{account.publicKey}</div>
          </div>

          <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4">
            <div className="text-sm text-genesis-text-tertiary mb-1">CGT Balance</div>
            <div className="text-2xl font-mono text-genesis-cipher-cyan">
              {cgtBalance.toFixed(4)} <span className="text-sm text-genesis-text-tertiary">CGT</span>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={() => setIsConnected(!isConnected)}
              variant={isConnected ? 'secondary' : 'primary'}
            >
              {isConnected ? 'Connected (local session)' : 'Connect to QorID Wallet'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-genesis-text-tertiary">No account found. Please log in.</div>
      )}
    </div>
  );
}

