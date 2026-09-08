//! Authentication service.

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use sqlx::PgPool;

use crate::error::{AppError, AppResult};
use crate::models::User;

/// Authentication service
pub struct AuthService {
    db: PgPool,
}

impl AuthService {
    /// Create new auth service
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    /// Hash a password using Argon2id
    pub fn hash_password(password: &str) -> AppResult<String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        
        let hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| AppError::InternalError(anyhow::anyhow!("Password hashing failed: {}", e)))?;
        
        Ok(hash.to_string())
    }

    /// Verify a password against a hash
    pub fn verify_password(password: &str, hash: &str) -> AppResult<bool> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|e| AppError::InternalError(anyhow::anyhow!("Invalid hash format: {}", e)))?;
        
        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }

    /// Generate a unique discriminator for a username
    pub async fn generate_discriminator(&self, username: &str) -> AppResult<i16> {
        // Find existing discriminators for this username
        let existing: Vec<i16> = sqlx::query_scalar(
            "SELECT discriminator FROM users WHERE LOWER(username) = LOWER($1)"
        )
        .bind(username)
        .fetch_all(&self.db)
        .await?;

        // Find first available discriminator (1-9999)
        for d in 1..=9999i16 {
            if !existing.contains(&d) {
                return Ok(d);
            }
        }

        Err(AppError::ValidationError(
            "No available discriminators for this username".into()
        ))
    }

    /// Find user by email
    pub async fn find_by_email(&self, email: &str) -> AppResult<Option<User>> {
        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE LOWER(email) = LOWER($1)"
        )
        .bind(email)
        .fetch_optional(&self.db)
        .await?;

        Ok(user)
    }

    /// Find user by Qor ID
    pub async fn find_by_qor_id(&self, username: &str, discriminator: i16) -> AppResult<Option<User>> {
        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND discriminator = $2"
        )
        .bind(username)
        .bind(discriminator)
        .fetch_optional(&self.db)
        .await?;

        Ok(user)
    }

    /// Increment login attempts and lock if needed
    pub async fn increment_login_attempts(&self, user_id: uuid::Uuid, max_attempts: u32, lockout_secs: i64) -> AppResult<()> {
        sqlx::query(
            r#"
            UPDATE users 
            SET 
                login_attempts = login_attempts + 1,
                locked_until = CASE 
                    WHEN login_attempts + 1 >= $2 
                    THEN NOW() + INTERVAL '1 second' * $3
                    ELSE locked_until
                END
            WHERE id = $1
            "#
        )
        .bind(user_id)
        .bind(max_attempts as i32)
        .bind(lockout_secs)
        .execute(&self.db)
        .await?;

        Ok(())
    }

    /// Reset login attempts after successful login
    pub async fn reset_login_attempts(&self, user_id: uuid::Uuid) -> AppResult<()> {
        sqlx::query(
            "UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = $1"
        )
        .bind(user_id)
        .execute(&self.db)
        .await?;

        Ok(())
    }

    /// Find user by username (any discriminator)
    pub async fn find_by_username(&self, username: &str) -> AppResult<Option<User>> {
        // Find user with lowest discriminator (primary account)
        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE LOWER(username) = LOWER($1) ORDER BY discriminator ASC LIMIT 1"
        )
        .bind(username)
        .fetch_optional(&self.db)
        .await?;

        Ok(user)
    }

    /// Check if identifier is an email
    pub fn is_email(identifier: &str) -> bool {
        identifier.contains('@') && identifier.contains('.')
    }

    /// Generate a secure backup code (32 characters)
    pub fn generate_backup_code() -> String {
        use rand::Rng;
        const CHARSET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
        let mut rng = rand::thread_rng();
        (0..32)
            .map(|_| {
                let idx = rng.gen_range(0..CHARSET.len());
                CHARSET[idx] as char
            })
            .collect()
    }

    /// Hash a backup code with Argon2id (same scheme as passwords).
    pub fn hash_backup_code(code: &str) -> AppResult<String> {
        Self::hash_password(&Self::normalize_backup_code(code))
    }

    /// Verify a backup code against its Argon2id hash. Argon2 verification is
    /// constant-time by construction; a missing hash still costs one hash to
    /// avoid a timing oracle on "has backup code".
    pub fn verify_backup_code(code: &str, hash: Option<&str>) -> AppResult<bool> {
        match hash {
            Some(h) => Self::verify_password(&Self::normalize_backup_code(code), h),
            None => {
                let _ = Self::hash_password("dummy");
                Ok(false)
            }
        }
    }

    /// Backup codes are case-insensitive and ignore whitespace/dashes.
    fn normalize_backup_code(code: &str) -> String {
        code.chars()
            .filter(|c| c.is_ascii_alphanumeric())
            .map(|c| c.to_ascii_uppercase())
            .collect()
    }

    /// Admin bootstrap. If `QOR_AUTH_BOOTSTRAP_GOD_PASSWORD` is set and no user
    /// with role `god` exists, create `godmode#0001` with that password
    /// (Argon2id) and log a warning. Privileged accounts are never seeded by
    /// migrations.
    pub async fn bootstrap_god_if_requested(&self) -> AppResult<()> {
        let Ok(password) = std::env::var("QOR_AUTH_BOOTSTRAP_GOD_PASSWORD") else {
            return Ok(());
        };
        if password.trim().is_empty() {
            return Ok(());
        }

        let god_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE role = 'god'")
            .fetch_one(&self.db)
            .await?;
        if god_count > 0 {
            tracing::warn!(
                "QOR_AUTH_BOOTSTRAP_GOD_PASSWORD is set but a god-role user already exists; ignoring. Unset the variable."
            );
            return Ok(());
        }

        if password.len() < 12 {
            return Err(AppError::ValidationError(
                "QOR_AUTH_BOOTSTRAP_GOD_PASSWORD must be at least 12 characters".into(),
            ));
        }

        let hash = Self::hash_password(&password)?;
        let discriminator = self.generate_discriminator("godmode").await?;
        let id: uuid::Uuid = sqlx::query_scalar(
            r#"
            INSERT INTO users (username, discriminator, password_hash, email_verified, role, status, auth_method, account_type)
            VALUES ('godmode', $1, $2, TRUE, 'god', 'active', 'password', 'human')
            RETURNING id
            "#,
        )
        .bind(discriminator)
        .bind(&hash)
        .fetch_one(&self.db)
        .await?;

        tracing::warn!(
            "BOOTSTRAP: created god account godmode#{:04} (id={}) from QOR_AUTH_BOOTSTRAP_GOD_PASSWORD. Unset the variable now.",
            discriminator,
            id
        );
        Ok(())
    }

    /// Generate email verification token
    pub fn generate_verification_token() -> String {
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(uuid::Uuid::new_v4().as_bytes());
        hasher.update(std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs().to_be_bytes());
        hex::encode(hasher.finalize())[..32].to_string()
    }

    /// Generate a deterministic on-chain address from a seed string
    /// Returns 64 hex characters (32 bytes) suitable for blockchain address
    pub fn hash_to_address(seed: &str) -> String {
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(b"demiurge:address:");
        hasher.update(seed.as_bytes());
        hex::encode(hasher.finalize())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hash_and_verify() {
        let password = "SecureP@ssw0rd!123";
        let hash = AuthService::hash_password(password).unwrap();
        
        assert!(AuthService::verify_password(password, &hash).unwrap());
        assert!(!AuthService::verify_password("wrong_password", &hash).unwrap());
    }

    #[test]
    fn test_backup_code_hash_and_verify() {
        let code = AuthService::generate_backup_code();
        let hash = AuthService::hash_backup_code(&code).unwrap();
        assert!(AuthService::verify_backup_code(&code, Some(&hash)).unwrap());
        assert!(AuthService::verify_backup_code(&code.to_lowercase(), Some(&hash)).unwrap());
        assert!(!AuthService::verify_backup_code("NOPE", Some(&hash)).unwrap());
        assert!(!AuthService::verify_backup_code(&code, None).unwrap());
    }
}
