# qor-auth migration notes

## 008_seed_godmode.sql was rewritten (checksum change)

Migration 008 used to seed `godmode#0001` with a documented password and the
fixed backup code `GODMODE-RECOVERY-2026`. It is now a no-op containing only a
comment. sqlx records a checksum per applied migration, so any database that
already applied the old 008 will refuse to start with
`migration 8 was previously applied but has been modified`.

Fix on a **dev** database, either:

1. Reset the database (recommended):
   ```sh
   dropdb qor_auth && createdb qor_auth   # or: sqlx database reset
   ```
2. Or update the stored checksum for version 8 to match the new file:
   ```sql
   -- compute the new checksum: sha384 of the file bytes
   -- (sqlx uses SHA-384 of the migration SQL)
   UPDATE _sqlx_migrations
      SET checksum = decode('<sha384-hex-of-migrations/008_seed_godmode.sql>', 'hex')
    WHERE version = 8;
   ```
   On Linux/macOS: `sha384sum migrations/008_seed_godmode.sql`.
   On Windows PowerShell: `(Get-FileHash -Algorithm SHA384 migrations\008_seed_godmode.sql).Hash`.

## 011_remove_seeded_godmode.sql

Deletes any user with `username = 'godmode' AND backup_code = 'GODMODE-RECOVERY-2026'`
(i.e. exactly the account the old seed created). A bootstrapped god account is
never matched because it has no plaintext backup code.

## 012_hash_backup_codes.sql

Adds `users.backup_code_hash` (Argon2id PHC string) and NULLs out the legacy
plaintext `users.backup_code` column. Existing username-only accounts therefore
lose their old backup code; issuing replacements is a follow-up task.

## Admin bootstrap (replaces the seed)

Set `QOR_AUTH_BOOTSTRAP_GOD_PASSWORD` in the environment for one start. If no
user with role `god` exists, the service creates `godmode#0001` with that
password (Argon2id) and logs a warning. If a god user already exists the
variable is ignored (with a warning). Unset it afterwards.
