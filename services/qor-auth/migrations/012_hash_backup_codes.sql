-- Migration 012: stop storing backup codes in plaintext.
-- New column holds an Argon2id PHC string; the legacy plaintext column is kept
-- (nullable) for now but wiped. Existing username-only accounts lose their old
-- backup code and must obtain a new one (re-issue path is a follow-up).
ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_code_hash VARCHAR(255);

UPDATE users SET backup_code = NULL WHERE backup_code IS NOT NULL;

DROP INDEX IF EXISTS idx_users_backup_code;

COMMENT ON COLUMN users.backup_code IS 'DEPRECATED: legacy plaintext backup code; always NULL since migration 012. Use backup_code_hash.';
COMMENT ON COLUMN users.backup_code_hash IS 'Argon2id hash of the one-time backup code (username-only accounts)';
