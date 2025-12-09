import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { abyssIdClient, type AbyssAccount } from '../../lib/abyssIdClient';
import { useAbyssID } from '../../hooks/useAbyssID';
import { backgroundMusicService } from '../../services/backgroundMusic';

interface AbyssIDSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string, publicKey: string) => void;
}

export function AbyssIDSignupModal({ isOpen, onClose, onSuccess }: AbyssIDSignupModalProps) {
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [secret, setSecret] = useState('');
  const [hasBackedUp, setHasBackedUp] = useState(false);
  const [step, setStep] = useState<'username' | 'backup'>('username');
  const [createdAccount, setCreatedAccount] = useState<AbyssAccount | null>(null);
  const { login: abyssIDLogin } = useAbyssID();
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
      const available = abyssIdClient.checkUsernameAvailability(username);
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
      const available = abyssIdClient.checkUsernameAvailability(username);
      setUsernameStatus(available ? 'available' : 'taken');
    }, 500);
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usernameStatus !== 'available') {
      return;
    }

    try {
      const account = await abyssIdClient.signup(username);
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
      if (createdAccount) {
        // Login with unified AbyssID system - this will automatically initialize identity service
        await abyssIDLogin(createdAccount.username);
        // Start background music after successful signup
        backgroundMusicService.play();
        onSuccess(createdAccount.username, createdAccount.publicKey);
        handleClose();
      } else {
        // Fallback: look up account by normalized username
        const normalizedUsername = username.toLowerCase();
        const accounts = abyssIdClient.getAllAccounts();
        const account = accounts[normalizedUsername];
        if (account) {
          await abyssIDLogin(account.username);
          onSuccess(account.username, account.publicKey);
          handleClose();
        } else {
          console.error('Account not found after signup');
          // Try to get from current account as last resort
          const account = await abyssIdClient.getCurrentAccount();
          if (account) {
            await abyssIDLogin(account.username);
            onSuccess(account.username, account.publicKey);
            handleClose();
          } else {
            console.error('Failed to find account after signup');
          }
        }
      }
    } catch (error) {
      console.error('Error during backup confirmation:', error);
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-4"
          >
            <Card className="p-8">
              {step === 'username' ? (
                <>
                  <h2 className="text-3xl font-bold mb-6 text-abyss-cyan">Create AbyssID</h2>
                  
                  <form onSubmit={handleUsernameSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
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
                        className="w-full px-4 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded-lg text-white focus:outline-none focus:border-abyss-cyan focus:ring-2 focus:ring-abyss-cyan/50"
                        placeholder="Choose a username"
                      />
                      {usernameStatus === 'checking' && (
                        <div className="text-sm text-gray-400 mt-1">Checking...</div>
                      )}
                      {usernameStatus === 'available' && (
                        <div className="text-sm text-green-400 mt-1">✓ Available</div>
                      )}
                      {usernameStatus === 'taken' && (
                        <div className="text-sm text-red-400 mt-1">✗ Username taken</div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={usernameStatus !== 'available'}
                      className="w-full"
                    >
                      Continue
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-abyss-cyan">Back Up Your Secret</h2>
                  <p className="text-gray-300 mb-4 text-sm">
                    Save this code securely. You'll need it to access your AbyssID.
                  </p>
                  
                  {createdAccount && (
                    <div className="bg-abyss-dark border border-abyss-cyan/30 rounded-lg p-4 mb-4">
                      <div className="text-xs text-gray-400 mb-2">Your AbyssID Public Key:</div>
                      <div className="font-mono text-sm text-abyss-cyan break-all">{createdAccount.publicKey}</div>
                    </div>
                  )}
                  
                  <div className="bg-abyss-dark border border-abyss-cyan/30 rounded-lg p-4 mb-4">
                    <div className="text-xs text-gray-400 mb-2">Your Secret Code:</div>
                    <div className="font-mono text-sm text-abyss-cyan break-all">{secret}</div>
                  </div>

                  <Button onClick={copySecret} variant="secondary" className="w-full mb-4">
                    Copy Code
                  </Button>

                  <label className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      checked={hasBackedUp}
                      onChange={(e) => setHasBackedUp(e.target.checked)}
                      className="w-4 h-4 text-abyss-cyan bg-abyss-dark border-abyss-cyan rounded focus:ring-abyss-cyan"
                    />
                    <span className="text-sm text-gray-300">I have backed up this code</span>
                  </label>

                  <Button
                    onClick={(e) => handleBackupConfirm(e)}
                    disabled={!hasBackedUp}
                    className="w-full"
                    type="button"
                  >
                    Continue
                  </Button>
                </>
              )}

              <button
                onClick={handleClose}
                className="mt-4 text-gray-400 hover:text-white text-sm"
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

