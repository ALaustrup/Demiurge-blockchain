//! Session management service.

use chrono::{Duration, Utc};
use deadpool_redis::Pool as RedisPool;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use uuid::Uuid;

use crate::config::JwtConfig;
use crate::error::{AppError, AppResult};
use crate::models::{Claims, Scope, Session, TokenPair, TOKEN_AUDIENCE};

/// Session management service
pub struct SessionService {
    redis: RedisPool,
    jwt_config: JwtConfig,
}

impl SessionService {
    /// Create new session service
    pub fn new(redis: RedisPool, jwt_config: JwtConfig) -> Self {
        Self { redis, jwt_config }
    }

    /// Create a new session and generate tokens
    pub async fn create_session(
        &self,
        user_id: Uuid,
        qor_id: &str,
        role: Option<&str>, // User role: 'user', 'moderator', 'admin', 'god'
        device_id: &str,
        ip_address: &str,
        user_agent: Option<&str>,
        scopes: Vec<Scope>,
    ) -> AppResult<(Session, TokenPair)> {
        let session_id = Uuid::new_v4();
        let now = Utc::now();
        let expires_at = now + Duration::seconds(self.jwt_config.refresh_expiry_secs);

        let session = Session {
            session_id,
            user_id,
            qor_id: qor_id.to_string(),
            device_id: device_id.to_string(),
            ip_address: ip_address.to_string(),
            user_agent: user_agent.map(|s| s.to_string()),
            scopes: scopes.clone(),
            created_at: now,
            last_activity: now,
            expires_at,
        };

        // Store session in Redis
        self.store_session(&session).await?;

        // Generate tokens with role
        let tokens = self.generate_tokens(&session, role)?;

        Ok((session, tokens))
    }

    /// Generate JWT access and refresh tokens
    pub fn generate_tokens(&self, session: &Session, role: Option<&str>) -> AppResult<TokenPair> {
        let now = Utc::now();

        // Access token claims
        let access_claims = Claims {
            sub: session.user_id.to_string(),
            qor_id: session.qor_id.clone(),
            sid: session.session_id.to_string(),
            role: role.map(|r| r.to_string()),
            scopes: session.scopes.clone(),
            iss: self.jwt_config.issuer.clone(),
            aud: TOKEN_AUDIENCE.to_string(),
            iat: now.timestamp(),
            nbf: now.timestamp(),
            exp: (now + Duration::seconds(self.jwt_config.access_expiry_secs)).timestamp(),
        };

        // Refresh token claims (longer expiry, fewer claims)
        let refresh_claims = Claims {
            sub: session.user_id.to_string(),
            qor_id: session.qor_id.clone(),
            sid: session.session_id.to_string(),
            role: role.map(|r| r.to_string()),
            scopes: vec![], // Refresh tokens don't carry scopes
            iss: self.jwt_config.issuer.clone(),
            aud: TOKEN_AUDIENCE.to_string(),
            iat: now.timestamp(),
            nbf: now.timestamp(),
            exp: (now + Duration::seconds(self.jwt_config.refresh_expiry_secs)).timestamp(),
        };

        let access_token = encode(
            &Header::default(),
            &access_claims,
            &EncodingKey::from_secret(self.jwt_config.access_secret.as_bytes()),
        )
        .map_err(|e| AppError::InternalError(anyhow::anyhow!("Token generation failed: {}", e)))?;

        let refresh_token = encode(
            &Header::default(),
            &refresh_claims,
            &EncodingKey::from_secret(self.jwt_config.refresh_secret.as_bytes()),
        )
        .map_err(|e| AppError::InternalError(anyhow::anyhow!("Token generation failed: {}", e)))?;

        Ok(TokenPair {
            access_token,
            refresh_token,
            expires_in: self.jwt_config.access_expiry_secs,
            token_type: "Bearer".into(),
        })
    }

    /// Validation rules shared by access and refresh tokens:
    /// HS256, exp, nbf, iss == config issuer, aud == TOKEN_AUDIENCE.
    fn validation(&self) -> Validation {
        let mut v = Validation::default();
        v.set_required_spec_claims(&["exp", "nbf", "iss", "aud", "sub"]);
        v.validate_nbf = true;
        v.set_issuer(&[self.jwt_config.issuer.as_str()]);
        v.set_audience(&[TOKEN_AUDIENCE]);
        v
    }

    /// Validate an access token (signature + registered claims only; see
    /// `session_exists` for revocation).
    pub fn validate_access_token(&self, token: &str) -> AppResult<Claims> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_config.access_secret.as_bytes()),
            &self.validation(),
        )
        .map_err(|e| match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => AppError::TokenExpired,
            _ => AppError::InvalidToken,
        })?;

        Ok(token_data.claims)
    }

    /// Validate a refresh token
    pub fn validate_refresh_token(&self, token: &str) -> AppResult<Claims> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_config.refresh_secret.as_bytes()),
            &self.validation(),
        )
        .map_err(|e| match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => AppError::TokenExpired,
            _ => AppError::InvalidToken,
        })?;

        Ok(token_data.claims)
    }

    /// Store session in Redis
    async fn store_session(&self, session: &Session) -> AppResult<()> {
        let mut conn = self.redis.get().await?;
        
        let session_key = format!("session:{}", session.session_id);
        let session_json = serde_json::to_string(session)
            .map_err(|e| AppError::InternalError(anyhow::anyhow!("Serialization failed: {}", e)))?;

        // Store session with expiry
        let ttl = (session.expires_at - Utc::now()).num_seconds().max(0) as u64;
        
        deadpool_redis::redis::cmd("SETEX")
            .arg(&session_key)
            .arg(ttl)
            .arg(&session_json)
            .query_async::<()>(&mut conn)
            .await
            .map_err(|e| AppError::InternalError(anyhow::anyhow!("Redis error: {}", e)))?;

        // Add to user's session set
        let user_sessions_key = format!("user_sessions:{}", session.user_id);
        deadpool_redis::redis::cmd("SADD")
            .arg(&user_sessions_key)
            .arg(session.session_id.to_string())
            .query_async::<()>(&mut conn)
            .await
            .map_err(|e| AppError::InternalError(anyhow::anyhow!("Redis error: {}", e)))?;

        Ok(())
    }

    /// Check whether a session is still live in Redis (one EXISTS). Used for
    /// access-token revocation: logout/ban delete the key, so tokens carrying
    /// that `sid` stop working immediately.
    pub async fn session_exists(&self, session_id: &str) -> AppResult<bool> {
        let mut conn = self.redis.get().await?;
        let session_key = format!("session:{}", session_id);
        let exists: i64 = deadpool_redis::redis::cmd("EXISTS")
            .arg(&session_key)
            .query_async(&mut conn)
            .await
            .map_err(|e| AppError::InternalError(anyhow::anyhow!("Redis error: {}", e)))?;
        Ok(exists == 1)
    }

    /// Get session by ID
    pub async fn get_session(&self, session_id: Uuid) -> AppResult<Option<Session>> {
        let mut conn = self.redis.get().await?;
        
        let session_key = format!("session:{}", session_id);
        let result: Option<String> = deadpool_redis::redis::cmd("GET")
            .arg(&session_key)
            .query_async(&mut conn)
            .await
            .map_err(|e| AppError::InternalError(anyhow::anyhow!("Redis error: {}", e)))?;

        match result {
            Some(json) => {
                let session: Session = serde_json::from_str(&json)
                    .map_err(|e| AppError::InternalError(anyhow::anyhow!("Deserialization failed: {}", e)))?;
                Ok(Some(session))
            }
            None => Ok(None),
        }
    }

    /// Delete session
    pub async fn delete_session(&self, session_id: Uuid, user_id: Uuid) -> AppResult<()> {
        let mut conn = self.redis.get().await?;

        let session_key = format!("session:{}", session_id);
        let user_sessions_key = format!("user_sessions:{}", user_id);

        // Delete session
        deadpool_redis::redis::cmd("DEL")
            .arg(&session_key)
            .query_async::<()>(&mut conn)
            .await
            .map_err(|e| AppError::InternalError(anyhow::anyhow!("Redis error: {}", e)))?;

        // Remove from user's session set
        deadpool_redis::redis::cmd("SREM")
            .arg(&user_sessions_key)
            .arg(session_id.to_string())
            .query_async::<()>(&mut conn)
            .await
            .map_err(|e| AppError::InternalError(anyhow::anyhow!("Redis error: {}", e)))?;

        Ok(())
    }

    /// Delete all sessions for a user
    pub async fn delete_all_sessions(&self, user_id: Uuid) -> AppResult<()> {
        let mut conn = self.redis.get().await?;
        
        let user_sessions_key = format!("user_sessions:{}", user_id);
        
        // Get all session IDs
        let session_ids: Vec<String> = deadpool_redis::redis::cmd("SMEMBERS")
            .arg(&user_sessions_key)
            .query_async(&mut conn)
            .await
            .map_err(|e| AppError::InternalError(anyhow::anyhow!("Redis error: {}", e)))?;

        // Delete each session
        for sid in session_ids {
            let session_key = format!("session:{}", sid);
            deadpool_redis::redis::cmd("DEL")
                .arg(&session_key)
                .query_async::<()>(&mut conn)
                .await
                .map_err(|e| AppError::InternalError(anyhow::anyhow!("Redis error: {}", e)))?;
        }

        // Delete the set
        deadpool_redis::redis::cmd("DEL")
            .arg(&user_sessions_key)
            .query_async::<()>(&mut conn)
            .await
            .map_err(|e| AppError::InternalError(anyhow::anyhow!("Redis error: {}", e)))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::UserRole;

    fn service() -> SessionService {
        // Pool creation does not connect; these tests never touch Redis.
        let redis = deadpool_redis::Config::from_url("redis://127.0.0.1:1")
            .create_pool(Some(deadpool_redis::Runtime::Tokio1))
            .unwrap();
        SessionService::new(
            redis,
            JwtConfig {
                access_secret: "a".repeat(64),
                refresh_secret: "b".repeat(64),
                access_expiry_secs: 900,
                refresh_expiry_secs: 3600,
                issuer: "qor-auth-test".into(),
            },
        )
    }

    fn session() -> Session {
        let now = Utc::now();
        Session {
            session_id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            qor_id: "godmode#0001".into(),
            device_id: "test".into(),
            ip_address: "127.0.0.1".into(),
            user_agent: None,
            scopes: Session::default_scopes(),
            created_at: now,
            last_activity: now,
            expires_at: now + Duration::hours(1),
        }
    }

    #[test]
    fn god_token_round_trips_with_canonical_role() {
        let svc = service();
        let tokens = svc.generate_tokens(&session(), Some(UserRole::God.as_str())).unwrap();
        let claims = svc.validate_access_token(&tokens.access_token).unwrap();
        assert_eq!(claims.role.as_deref(), Some("god"));
        assert!(crate::middleware::auth::role_is_god(claims.role.as_deref()));
        assert!(crate::middleware::auth::role_is_admin(claims.role.as_deref()));
        assert_eq!(claims.iss, "qor-auth-test");
        assert_eq!(claims.aud, TOKEN_AUDIENCE);
    }

    #[test]
    fn debug_formatted_role_is_rejected() {
        // Regression: `format!("{:?}", UserRole::God)` == "God" must not pass RBAC.
        assert!(!crate::middleware::auth::role_is_god(Some(&format!("{:?}", UserRole::God))));
    }

    #[test]
    fn wrong_issuer_or_secret_is_rejected() {
        let svc = service();
        let tokens = svc.generate_tokens(&session(), Some("god")).unwrap();
        // refresh secret must not validate an access token
        assert!(svc.validate_refresh_token(&tokens.access_token).is_err());

        let mut other = service();
        other.jwt_config.issuer = "someone-else".into();
        assert!(other.validate_access_token(&tokens.access_token).is_err());
    }
}
