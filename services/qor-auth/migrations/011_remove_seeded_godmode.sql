-- Migration 011: remove the account created by the former 008 seed.
-- Matches only the exact seeded identity (username + fixed backup code) so a
-- legitimately bootstrapped 'godmode' account is never touched.
DELETE FROM users
WHERE username = 'godmode'
  AND backup_code = 'GODMODE-RECOVERY-2026';
