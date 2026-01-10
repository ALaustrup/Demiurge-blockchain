import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { qorIdClient, type AbyssAccount } from '../../lib/qorIdClient';
import { useQorID } from '../../hooks/useAbyssID';
import { backgroundMusicService } from '../../services/backgroundMusic';

interface QorIDSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string, publicKey: string) => void;
}

export function QorIDSignupModal({ isOpen, onClose, onSuccess }: QorIDSignupModalProps) {
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [secret, setSecret] = useState('');
  const [hasBackedUp, setHasBackedUp] = useState(false);
  const [step, setStep] = useState<'username' | 'backup'>('username');
  const [createdAccount, setCreatedAccount] = useState<AbyssAccount | null>(null);
  const { login: qorIDLogin } = useQorID();
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced username checking on input change
  useEffect(() => {
    // Clear any pending check
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (!username.trim()) {
      setUsernameStatus('idle');
      return;
    }

    // Minimum length check
    if (username.trim().length < 3) {
      setUsernameStatus('idle');
      return;
    }

    // Debounce the check
    setUsernameStatus('checking');
    checkTimeoutRef.current = setTimeout(() => {
      const available = qorIdClient.checkUsernameAvailability(username);
      setUsernameStatus(available ? 'available' : 'taken');
    }, 500);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [username]);

  const checkUsername = () => {
    if (!username.trim()) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    setTimeout(() => {
      const available = qorIdClient.checkUsernameAvailability(username);
      setUsernameStatus(available ? 'available' : 'taken');
    }, 500);
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usernameStatus !== 'available') {
      return;
    }

    try {
      const account = await qorIdClient.signup(username);
      setSecret(account.abyssIdSecret || '');
      // Store the full created account for later use
      setCreatedAccount(account);
      setStep('backup');
    } catch (error) {
      console.error('Signup failed:', error);
      setUsernameStatus('taken');
    }
  };

  const handleBackupConfirm = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!hasBackedUp) {
      console.warn('Backup confirmation checkbox not checked');
      return;
    }
    
    try {
      // Use the stored account from signup
      let accountToUse = createdAccount;
      
      // If no createdAccount, try to find it from localStorage
      if (!accountToUse) {
        const normalizedUsername = username.toLowerCase().trim();
        const accounts = qorIdClient.getAllAccounts();
        accountToUse = accounts[normalizedUsername];
      }
      
      // Last resort: get current account (should be set by signup)
      if (!accountToUse) {
        accountToUse = await qorIdClient.getCurrentAccount();
      }
      
      if (!accountToUse || !accountToUse.username) {
        throw new Error('Account not found after signup. Please try signing up again.');
      }
      
      // Ensure account is properly stored in accounts list
      const normalizedUsername = accountToUse.username.toLowerCase().trim();
      const accounts = qorIdClient.getAllAccounts();
      if (!accounts[normalizedUsername]) {
        accounts[normalizedUsername] = accountToUse;
        localStorage.setItem('abyssos_accounts', JSON.stringify(accounts));
      }
      
      // Ensure account is set as current auth
      localStorage.setItem('abyssos_auth', JSON.stringify(accountToUse));
      
      // Create session directly in localStorage (bypass login to avoid any network calls)
      const session = {
        username: accountToUse.username,
        publicKey: accountToUse.publicKey,
      };
      localStorage.setItem('abyssid_session', JSON.stringify(session));
      
      // Trigger login callback to update React context
      // This will use the local provider which reads from localStorage
      try {
        // Use username login - should work since account is in localStorage
        await qorIDLogin(accountToUse.username.trim());
      } catch (loginError) {
        // If login still fails, try with secret as fallback
        if (accountToUse.abyssIdSecret) {
          try {
            await qorIDLogin(undefined, accountToUse.abyssIdSecret);
          } catch (secretError) {
            // Even if login fails, session is set in localStorage
            // The context will pick it up on next render
            console.warn('Login callbacks failed, but session is set directly:', secretError);
            // Force a page reload to pick up the session
            setTimeout(() => {
              window.location.reload();
            }, 500);
            return;
          }
        } else {
          console.warn('Login callback failed, but session is set:', loginError);
          // Force a page reload to pick up the session
          setTimeout(() => {
            window.location.reload();
          }, 500);
          return;
        }
      }
      
      // Start background music after successful signup
      backgroundMusicService.play();
      onSuccess(accountToUse.username, accountToUse.publicKey);
      handleClose();
    } catch (error) {
      console.error('Error during backup confirmation:', error);
      // Show error to user with more details
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to complete signup: ${errorMessage}. Please try again.`);
    }
  };

  const handleClose = () => {
    setUsername('');
    setSecret('');
    setHasBackedUp(false);
    setStep('username');
    setUsernameStatus('idle');
    setCreatedAccount(null);
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = null;
    }
    onClose();
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="signup-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            key="signup-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-4"
          >
            <Card className="p-8">
              {step === 'username' ? (
                <div key="username-step">
                  <h2 className="text-3xl font-bold mb-6 text-genesis-flame-orange font-genesis-display">Create QOR ID</h2>
                  
                  <form onSubmit={handleUsernameSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-genesis-text-primary">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          // Status will be updated by useEffect debounce
                        }}
                        onBlur={checkUsername}
                        className="genesis-input w-full px-4 py-2"
                        placeholder="Choose a username"
                      />
                      <div className="text-sm mt-1 min-h-[20px]">
                        {usernameStatus === 'checking' && (
                          <span className="text-genesis-text-tertiary">Checking...</span>
                        )}
                        {usernameStatus === 'available' && (
                          <span className="text-green-400">✓ Available</span>
                        )}
                        {usernameStatus === 'taken' && (
                          <span className="text-red-400">✗ Username taken</span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={usernameStatus !== 'available'}
                      className="w-full"
                    >
                      Continue
                    </Button>
                  </form>
                </div>
              ) : (
                <div key="backup-step">
                  <h2 className="text-2xl font-bold mb-4 text-genesis-flame-orange font-genesis-display">Back Up Your Secret</h2>
                  <p className="text-genesis-text-secondary mb-4 text-sm">
                    Save this code securely. You'll need it to access your QOR ID.
                  </p>
                  
                  {createdAccount && (
                    <div className="bg-genesis-glass-light border border-genesis-border-default rounded-lg p-4 mb-4">
                      <div className="text-xs text-genesis-text-tertiary mb-2">Your QOR ID Public Key:</div>
                      <div className="font-mono text-sm text-genesis-cipher-cyan break-all">{createdAccount.publicKey}</div>
                    </div>
                  )}
                  
                  <div className="bg-genesis-glass-light border border-genesis-border-default rounded-lg p-4 mb-4">
                    <div className="text-xs text-genesis-text-tertiary mb-2">Your Secret Code:</div>
                    <div className="font-mono text-sm text-genesis-cipher-cyan break-all">{secret}</div>
                  </div>

                  <Button onClick={copySecret} variant="secondary" className="w-full mb-4">
                    Copy Code
                  </Button>

                  <label className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      checked={hasBackedUp}
                      onChange={(e) => setHasBackedUp(e.target.checked)}
                      className="w-4 h-4 text-genesis-flame-orange bg-genesis-glass-light border-genesis-border-default rounded focus:ring-genesis-flame-orange"
                    />
                    <span className="text-sm text-genesis-text-secondary">I have backed up this code</span>
                  </label>

                  <Button
                    onClick={(e) => handleBackupConfirm(e)}
                    disabled={!hasBackedUp}
                    className="w-full"
                    type="button"
                  >
                    Continue
                  </Button>
                </div>
              )}

              <button
                onClick={handleClose}
                className="mt-4 text-genesis-text-tertiary hover:text-genesis-text-primary text-sm transition-colors"
              >
                Cancel
              </button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

