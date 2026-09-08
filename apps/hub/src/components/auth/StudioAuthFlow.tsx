'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { qorAuth } from '@demiurge/qor-sdk';
import { useAuth } from '@/contexts/AuthContext';
import { getStudioMachineId } from '@/lib/studio-license';
import { StudioAuthShell } from './StudioAuthShell';

interface StudioAuthFlowProps {
  onSuccess: () => void;
  initialStep?: 'login' | 'register';
}

type Step = 'login' | 'register-username' | 'register-pin' | 'register-license' | 'backup-code';

const REGISTER_STEPS = [
  { id: 'register-username', label: 'Identity' },
  { id: 'register-pin', label: 'Security' },
  { id: 'register-license', label: 'License' },
] as const;

const stepVariants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
};

function AuthField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block font-display text-[11px] tracking-[0.12em] uppercase text-text-tertiary">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-status-error">{error}</p>}
    </div>
  );
}

const inputClassName =
  'w-full px-4 py-3.5 bg-[#151A21] border border-[#333333] text-text-primary font-body text-[15px] placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-neon-cyan/60 focus:shadow-[0_0_0_1px_rgba(255,106,0,0.35)] rounded-sm';

function PrimaryButton({
  children,
  disabled,
  loading,
  type = 'button',
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className="relative w-full py-3.5 px-6 font-display text-sm font-semibold tracking-[0.15em] uppercase rounded-sm overflow-hidden transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-[#FF6A00] to-[#CC5500] text-void hover:shadow-neon-cyan-intense hover:brightness-110 active:scale-[0.99]"
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-void/30 border-t-void rounded-full animate-spin" />
          Processing…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function RegisterProgress({ step }: { step: Step }) {
  const currentIndex = REGISTER_STEPS.findIndex((s) => s.id === step);
  if (currentIndex < 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-2">
        {REGISTER_STEPS.map((s, i) => {
          const done = i < currentIndex;
          const active = s.id === step;
          return (
            <div key={s.id} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-full h-1 rounded-full transition-colors duration-300 ${
                  done || active ? 'bg-neon-cyan' : 'bg-white/[0.08]'
                }`}
              />
              <span
                className={`font-mono text-[10px] tracking-wider uppercase ${
                  active ? 'text-neon-cyan' : done ? 'text-text-tertiary' : 'text-text-dim'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StudioAuthFlow({ onSuccess, initialStep = 'login' }: StudioAuthFlowProps) {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<Step>(
    initialStep === 'register' ? 'register-username' : 'login'
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | 'invalid' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backupCode, setBackupCode] = useState<string | null>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeTab = useMemo<'signin' | 'register'>(() => {
    if (step === 'login') return 'signin';
    return 'register';
  }, [step]);

  useEffect(() => {
    if (step !== 'register-username' || !username) {
      setUsernameStatus(null);
      return;
    }

    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await qorAuth.checkUsername(username);
        setUsernameStatus(result.available ? 'available' : 'taken');
      } catch {
        setUsernameStatus('available');
      }
    }, 400);

    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, [username, step]);

  const switchTab = (tab: 'signin' | 'register') => {
    setError(null);
    if (tab === 'signin') setStep('login');
    else setStep('register-username');
  };

  const finishLogin = async (accessToken: string, refreshToken: string, expiresIn?: number) => {
    qorAuth.setToken(accessToken, refreshToken, expiresIn);
    try {
      await refreshUser();
    } catch {
      /* token set */
    }
    onSuccess();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await qorAuth.login(username, password);
      await finishLogin(res.token, res.refresh_token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const machineId = getStudioMachineId();
      const response = await qorAuth.register({
        username,
        password,
        license_key: licenseKey.trim() || undefined,
        machine_id: machineId,
      });

      if (response.backup_code) {
        setBackupCode(response.backup_code);
        setStep('backup-code');
        if (response.access_token && response.refresh_token) {
          qorAuth.setToken(
            response.access_token,
            response.refresh_token,
            response.expires_in
          );
        }
        return;
      }

      if (response.access_token && response.refresh_token) {
        await finishLogin(response.access_token, response.refresh_token, response.expires_in);
        return;
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StudioAuthShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-lg border border-white/[0.08] bg-void-surface/90 backdrop-blur-glass shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />

        <div className="p-6 sm:p-8">
          {step !== 'backup-code' && (
            <>
              <div className="flex p-1 mb-6 rounded-sm bg-void/60 border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => switchTab('signin')}
                  className={`flex-1 py-2.5 font-display text-xs tracking-[0.14em] uppercase rounded-sm transition-all duration-200 ${
                    activeTab === 'signin'
                      ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/25 shadow-neon-cyan'
                      : 'text-text-tertiary hover:text-text-secondary border border-transparent'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('register')}
                  className={`flex-1 py-2.5 font-display text-xs tracking-[0.14em] uppercase rounded-sm transition-all duration-200 ${
                    activeTab === 'register'
                      ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/25 shadow-neon-cyan'
                      : 'text-text-tertiary hover:text-text-secondary border border-transparent'
                  }`}
                >
                  Create account
                </button>
              </div>

              {(step === 'register-username' ||
                step === 'register-pin' ||
                step === 'register-license') && <RegisterProgress step={step} />}
            </>
          )}

          <AnimatePresence mode="wait">
            {step === 'login' && (
              <motion.div
                key="login"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <h2 className="font-display text-xl tracking-wide text-text-primary mb-1">
                  Welcome back
                </h2>
                <p className="text-sm text-text-tertiary mb-6">
                  Sign in with your QOR ID on this machine.
                </p>

                <form onSubmit={handleLogin} className="space-y-5">
                  <AuthField label="QOR username">
                    <input
                      className={inputClassName}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="creator_name"
                      autoComplete="username"
                      required
                    />
                  </AuthField>

                  <AuthField label="Safe word" hint="Your local passphrase — min. 6 characters">
                    <input
                      type="password"
                      className={inputClassName}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                  </AuthField>

                  {error && (
                    <div className="px-4 py-3 rounded-sm bg-status-error/10 border border-status-error/30 text-sm text-status-error">
                      {error}
                    </div>
                  )}

                  <PrimaryButton type="submit" loading={isLoading}>
                    Enter Studio
                  </PrimaryButton>
                </form>
              </motion.div>
            )}

            {step === 'register-username' && (
              <motion.div
                key="register-username"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <h2 className="font-display text-xl tracking-wide text-text-primary mb-1">
                  Choose your QOR ID
                </h2>
                <p className="text-sm text-text-tertiary mb-6">
                  This is your on-chain identity in every project you build.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (usernameStatus === 'available') setStep('register-pin');
                  }}
                  className="space-y-5"
                >
                  <AuthField
                    label="Username"
                    hint="3–20 characters · letters, numbers, underscore"
                    error={
                      usernameStatus === 'taken'
                        ? 'Already taken'
                        : usernameStatus === 'invalid'
                          ? 'Invalid format'
                          : undefined
                    }
                  >
                    <div className="relative">
                      <input
                        className={`${inputClassName} pr-10`}
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        placeholder="my_studio"
                        minLength={3}
                        maxLength={20}
                        required
                      />
                      {usernameStatus === 'checking' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
                      )}
                      {usernameStatus === 'available' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-status-success text-lg">
                          ✓
                        </span>
                      )}
                    </div>
                  </AuthField>

                  <PrimaryButton type="submit" disabled={usernameStatus !== 'available'}>
                    Continue
                  </PrimaryButton>
                </form>
              </motion.div>
            )}

            {step === 'register-pin' && (
              <motion.div
                key="register-pin"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <h2 className="font-display text-xl tracking-wide text-text-primary mb-1">
                  Set your safe word
                </h2>
                <p className="text-sm text-text-tertiary mb-6">
                  Stored only on this device. You will get a backup code — save it offline.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (password.length >= 6) setStep('register-license');
                  }}
                  className="space-y-5"
                >
                  <AuthField label="Safe word" hint="Minimum 6 characters">
                    <input
                      type="password"
                      className={inputClassName}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </AuthField>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('register-username')}
                      className="flex-1 py-3 font-display text-xs tracking-widest uppercase text-text-tertiary border border-white/[0.08] rounded-sm hover:border-white/20 hover:text-text-secondary transition-colors"
                    >
                      Back
                    </button>
                    <div className="flex-[2]">
                      <PrimaryButton type="submit" disabled={password.length < 6}>
                        Continue
                      </PrimaryButton>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'register-license' && (
              <motion.div
                key="register-license"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <h2 className="font-display text-xl tracking-wide text-text-primary mb-1">
                  Studio edition
                </h2>
                <p className="text-sm text-text-tertiary mb-6">
                  Start with <span className="text-text-secondary font-medium">Studio Free</span>,
                  or enter a CD-key from your purchase.
                </p>

                <div className="space-y-5">
                  <AuthField
                    label="License key"
                    hint="Optional · DS-CREATOR-XXXXX-XXXXX-XXXXX"
                  >
                    <input
                      className={`${inputClassName} font-mono text-sm tracking-wider uppercase`}
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                      placeholder="DS-CREATOR-XXXXX-XXXXX-XXXXX"
                    />
                  </AuthField>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {(['Free', 'Creator', 'Pro'] as const).map((tier) => (
                      <div
                        key={tier}
                        className={`py-2 px-1 rounded-sm border text-[10px] font-mono uppercase tracking-wider ${
                          tier === 'Free' && !licenseKey.trim()
                            ? 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan'
                            : 'border-white/[0.06] text-text-muted'
                        }`}
                      >
                        {tier}
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="px-4 py-3 rounded-sm bg-status-error/10 border border-status-error/30 text-sm text-status-error">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('register-pin')}
                      className="flex-1 py-3 font-display text-xs tracking-widest uppercase text-text-tertiary border border-white/[0.08] rounded-sm hover:border-white/20 transition-colors"
                    >
                      Back
                    </button>
                    <div className="flex-[2]">
                      <PrimaryButton loading={isLoading} onClick={handleRegister}>
                        {licenseKey.trim() ? 'Create & activate' : 'Start with Free'}
                      </PrimaryButton>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'backup-code' && backupCode && (
              <motion.div
                key="backup-code"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-status-warning/15 border border-status-warning/30 text-status-warning text-lg">
                    !
                  </span>
                  <div>
                    <h2 className="font-display text-xl tracking-wide text-text-primary">
                      Save your backup code
                    </h2>
                    <p className="text-sm text-text-tertiary">
                      Required to recover your account without email.
                    </p>
                  </div>
                </div>

                <div className="my-6 p-5 rounded-sm bg-void/80 border border-status-warning/25 text-center">
                  <p className="font-mono text-lg sm:text-xl tracking-[0.2em] text-status-warning break-all select-all">
                    {backupCode}
                  </p>
                </div>

                <PrimaryButton
                  onClick={async () => {
                    try {
                      await refreshUser();
                    } catch {
                      /* ok */
                    }
                    onSuccess();
                  }}
                >
                  I saved it — open Studio
                </PrimaryButton>

                <p className="text-xs text-text-muted text-center mt-4">
                  Upgrade later via{' '}
                  <Link href="/activate" className="text-neon-cyan hover:underline">
                    License activation
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-6 sm:px-8 py-4 border-t border-white/[0.06] bg-void/40 flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success shadow-[0_0_8px_#22C55E] animate-pulse" />
            <span className="font-mono text-[10px] text-text-muted tracking-wider">LOCAL STACK</span>
          </span>
          <span className="font-mono text-[10px] text-text-muted">No cloud · No email</span>
        </div>
      </motion.div>
    </StudioAuthShell>
  );
}
