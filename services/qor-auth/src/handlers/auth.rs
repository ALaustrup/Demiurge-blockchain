//! Authentication handlers.

use axum::{
    extract::{ConnectInfo, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use std::net::SocketAddr;
use chrono::{Duration, Utc};
use serde_json::{json, Value};
use std::sync::Arc;
use rand::Rng;

use crate::error::{AppError, AppResult};
use crate::models::{
    ChallengeRequest, ChallengeResponse, ForgotPasswordRequest, KeypairLoginRequest,
    KeypairRegisterRequest, LoginRequest, RegisterRequest,
    ResetPasswordWithBackupRequest, ResetPasswordWithTokenRequest, TokenPair,
};
use crate::services::{
    auth_service::AuthService, session_service::SessionService,
    studio_license_service::StudioLicenseService,
};
use crate::state::AppState;

/// Mint starter CGT to a new user's wallet via blockchain RPC
/// This creates their first on-chain transaction
async fn mint_starter_cgt(rpc_url: &str, address_hex: &str) -> Result<(), String> {
    let client = reqwest::Client::new();
    
    let request_body = json!({
        "jsonrpc": "2.0",
        "method": "balances_claimStarter",
        "params": [address_hex],
        "id": 1
    });

    let response = client
        .post(rpc_url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("RPC request failed: {}", e))?;

    let result: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse RPC response: {}", e))?;

    if let Some(error) = result.get("error") {
        return Err(format!("RPC error: {:?}", error));
    }

    // Check if minting was successful
    if let Some(success) = result.get("result").and_then(|r| r.get("success")).and_then(|s| s.as_bool()) {
        if !success {
            let msg = result.get("result").and_then(|r| r.get("message")).and_then(|m| m.as_str()).unwrap_or("Unknown error");
            return Err(format!("Mint failed: {}", msg));
        }
    }

    tracing::info!("Minted starter CGT to 0x{}", address_hex);
    Ok(())
}

/// Client IP: first X-Forwarded-For hop (set by nginx) else the socket peer.
fn client_ip(headers: &HeaderMap, peer: Option<&SocketAddr>) -> String {
    headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split(',').next())
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
        .or_else(|| peer.map(|p| p.ip().to_string()))
        .unwrap_or_else(|| "unknown".to_string())
}

/// Enforce `security.password_min_length` from config.
fn check_password_length(state: &AppState, password: &str) -> AppResult<()> {
    let min = state.config.security.password_min_length;
    if password.chars().count() < min {
        return Err(AppError::ValidationError(format!(
            "Password must be at least {} characters",
            min
        )));
    }
    Ok(())
}

/// Register a new user
pub async fn register(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    ConnectInfo(peer): ConnectInfo<SocketAddr>,
    Json(req): Json<RegisterRequest>,
) -> AppResult<(StatusCode, Json<Value>)> {
    // Validate username
    if !crate::models::QorId::is_valid_username(&req.username) {
        return Err(AppError::ValidationError(
            "Username must be 3-20 characters, alphanumeric and underscores only".into(),
        ));
    }

    check_password_length(&state, &req.password)?;

    let studio_offline = state.config.studio.enabled && state.config.studio.offline_registration;

    // Studio: email is optional and never required for offline accounts
    if let Some(ref email) = req.email {
        if !email.is_empty() && (!email.contains('@') || !email.contains('.')) {
            return Err(AppError::ValidationError("Invalid email format".into()));
        }
    } else if studio_offline {
        // Explicitly offline — no email step
    }

    let auth_service = AuthService::new(state.db.clone());
    let username_lower = req.username.to_lowercase();

    // Check if username already exists
    if let Some(_existing) = auth_service.find_by_username(&username_lower).await? {
        return Err(AppError::ValidationError(
            "Username already taken".into(),
        ));
    }

    // Check if email already exists (if provided)
    if let Some(ref email) = req.email {
        if let Some(_existing) = auth_service.find_by_email(email).await? {
            return Err(AppError::ValidationError(
                "Email already registered".into(),
            ));
        }
    }

    // Generate discriminator
    let discriminator = auth_service.generate_discriminator(&username_lower).await?;

    // Hash password
    let password_hash = AuthService::hash_password(&req.password)?;

    // Generate backup code for username-only accounts. The plaintext is
    // returned once in the response; only the Argon2id hash is stored.
    let backup_code = if req.email.is_none() {
        Some(AuthService::generate_backup_code())
    } else {
        None
    };
    let backup_code_hash = match &backup_code {
        Some(code) => Some(AuthService::hash_backup_code(code)?),
        None => None,
    };

    // Email verification only when email provided and not in Studio offline-only mode
    let email_provided = req
        .email
        .as_ref()
        .map(|e| !e.trim().is_empty())
        .unwrap_or(false);

    let (email_verification_token, email_verification_expires_at) =
        if email_provided && !studio_offline {
            let token = AuthService::generate_verification_token();
            let expires_at = Utc::now() + Duration::hours(24);
            (Some(token.clone()), Some(expires_at))
        } else {
            (None, None)
        };

    // Generate on-chain address from user data (deterministic derivation)
    // Use hash of username + discriminator + timestamp as seed
    let address_seed = format!("{}#{}:{}", username_lower, discriminator, Utc::now().timestamp());
    let address_hash = AuthService::hash_to_address(&address_seed);
    let on_chain_address = format!("0x{}", address_hash);
    // Persist plain 32-byte hex to remain compatible with existing VARCHAR(64) schemas.
    let on_chain_address_db = address_hash.clone();

    // Insert user with on-chain address
    let user_id = sqlx::query_scalar::<_, uuid::Uuid>(
        r#"
        INSERT INTO users (
            email, username, discriminator, password_hash, 
            email_verified, backup_code_hash, email_verification_token, email_verification_expires_at,
            role, status, on_chain_address
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'user', 'active', $9)
        RETURNING id
        "#,
    )
    .bind(&req.email)
    .bind(&username_lower)
    .bind(discriminator)
    .bind(&password_hash)
    .bind(!email_provided || studio_offline) // offline / no-email accounts are immediately usable
    .bind(&backup_code_hash)
    .bind(&email_verification_token)
    .bind(&email_verification_expires_at)
    .bind(&on_chain_address_db)
    .fetch_one(&state.db)
    .await?;

    // Starter CGT grant: gated by `features.starter_grant_enabled` (default off;
    // the `balances_claimStarter` RPC is being removed). Fail-soft when enabled.
    // TODO(phase-1): starter grants must become a signed treasury transaction.
    let mint_result: Result<(), String> = if state.config.features.starter_grant_enabled {
        let rpc_url = std::env::var("BLOCKCHAIN_RPC_URL")
            .unwrap_or_else(|_| "http://localhost:9944".to_string());
        let r = mint_starter_cgt(&rpc_url, &address_hash).await;
        if let Err(e) = &r {
            tracing::warn!("Starter CGT grant failed for {} (registration continues): {}", username_lower, e);
        }
        r
    } else {
        Err("starter grant disabled".to_string())
    };

    // Optional Studio license activation during signup
    let mut license_status: Option<serde_json::Value> = None;
    if state.config.studio.enabled {
        if let (Some(ref key), Some(ref machine_id)) = (&req.license_key, &req.machine_id) {
            if !key.trim().is_empty() && !machine_id.trim().is_empty() {
                match StudioLicenseService::activate(&state.db, user_id, key, machine_id.trim()).await
                {
                    Ok(status) => {
                        license_status = Some(serde_json::to_value(status).unwrap_or(json!({})));
                    }
                    Err(e) => {
                        tracing::warn!("License activation during register failed: {}", e);
                    }
                }
            }
        }
    }

    // Studio: auto-login after offline registration
    let mut token_pair: Option<TokenPair> = None;
    if state.config.studio.enabled && state.config.studio.auto_login_on_register {
        let session_service = SessionService::new(state.redis.clone(), state.config.jwt.clone());
        let qor_id = format!("{}#{:04}", username_lower, discriminator);
        let device_id = req
            .machine_id
            .clone()
            .unwrap_or_else(|| "studio-client".to_string());
        let ip = client_ip(&headers, Some(&peer));
        let ua = headers.get("user-agent").and_then(|v| v.to_str().ok());
        if let Ok((_session, tokens)) = session_service
            .create_session(
                user_id,
                &qor_id,
                Some(crate::models::UserRole::User.as_str()),
                &device_id,
                &ip,
                ua,
                crate::models::Session::default_scopes(),
            )
            .await
        {
            token_pair = Some(tokens);
        }
    }

    // Send verification email if email provided (skipped in Studio offline mode)
    let cgt_minted = mint_result.is_ok();
    let response = if email_provided && !studio_offline {
        if let Some(ref email) = req.email {
        // Send verification email (async, don't block registration on email sending)
        let email_service = state.email_service.clone();
        let email_clone = email.clone();
        let username_clone = username_lower.clone();
        let token_clone = email_verification_token.clone().unwrap_or_default();
        
        tokio::spawn(async move {
            if let Err(e) = email_service.send_verification_email(&email_clone, &username_clone, &token_clone).await {
                tracing::error!("Failed to send verification email to {}: {}", email_clone, e);
            }
        });
        
            let mut body = json!({
                "qor_id": format!("{}#{:04}", username_lower, discriminator),
                "user_id": user_id,
                "on_chain_address": on_chain_address,
                "email_verified": false,
                "starter_cgt_minted": cgt_minted,
                "offline_account": false,
                "message": if cgt_minted {
                    "Account created! 100 CGT has been added to your wallet. Please verify your email."
                } else {
                    "Account created! Please verify your email."
                }
            });
            if let Some(tokens) = token_pair {
                body["access_token"] = json!(tokens.access_token);
                body["refresh_token"] = json!(tokens.refresh_token);
                body["expires_in"] = json!(tokens.expires_in);
            }
            if let Some(ls) = license_status {
                body["license"] = ls;
            }
            body
        } else {
            json!({})
        }
    } else {
        let mut body = json!({
            "qor_id": format!("{}#{:04}", username_lower, discriminator),
            "user_id": user_id,
            "on_chain_address": on_chain_address,
            "backup_code": backup_code,
            "email_verified": true,
            "offline_account": studio_offline,
            "starter_cgt_minted": cgt_minted,
            "message": if studio_offline {
                if cgt_minted {
                    "Studio account created offline. Save your backup code! 100 CGT added to your wallet."
                } else {
                    "Studio account created offline. Save your backup code!"
                }
            } else if cgt_minted {
                "Account created! 100 CGT has been added to your wallet. Save your backup code!"
            } else {
                "Account created! Save your backup code!"
            }
        });
        if let Some(tokens) = token_pair {
            body["access_token"] = json!(tokens.access_token);
            body["refresh_token"] = json!(tokens.refresh_token);
            body["expires_in"] = json!(tokens.expires_in);
        }
        if let Some(ls) = license_status {
            body["license"] = ls;
        }
        body
    };

    Ok((StatusCode::CREATED, Json(response)))
}

/// Login with email OR username
pub async fn login(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    ConnectInfo(peer): ConnectInfo<SocketAddr>,
    Json(req): Json<LoginRequest>,
) -> AppResult<Json<TokenPair>> {
    let auth_service = AuthService::new(state.db.clone());
    let session_service = SessionService::new(
        state.redis.clone(),
        state.config.jwt.clone(),
    );

    // Determine if identifier is email or username
    let user = if AuthService::is_email(&req.identifier) {
        // Try to find by email
        auth_service.find_by_email(&req.identifier).await?
    } else {
        // Try to find by username
        auth_service.find_by_username(&req.identifier).await?
    };

    let user = match user {
        Some(u) => u,
        None => {
            // If username doesn't exist, return error indicating signup option
            if !AuthService::is_email(&req.identifier) {
                return Err(AppError::ValidationError(
                    format!("Username '{}' not found. Would you like to sign up?", req.identifier)
                ));
            }
            return Err(AppError::InvalidCredentials);
        }
    };

    // Check if account is locked
    if user.is_locked() {
        return Err(AppError::ValidationError(
            "Account is temporarily locked due to too many failed login attempts".into(),
        ));
    }

    // Check account status
    if user.status != crate::models::UserStatus::Active {
        return Err(AppError::ValidationError(
            "Account is not active".into(),
        ));
    }

    // Verify password
    if !AuthService::verify_password(&req.password, &user.password_hash)? {
        // Increment login attempts
        auth_service
            .increment_login_attempts(
                user.id,
                state.config.security.max_login_attempts,
                state.config.security.lockout_duration_secs,
            )
            .await?;

        return Err(AppError::InvalidCredentials);
    }

    // Reset login attempts on successful login
    auth_service.reset_login_attempts(user.id).await?;

    // Create session
    let device_id = req.device_id.unwrap_or_else(|| "unknown".to_string());
    let ip = client_ip(&headers, Some(&peer));
    let ua = headers.get("user-agent").and_then(|v| v.to_str().ok());
    let (_session, tokens) = session_service
        .create_session(
            user.id,
            &user.qor_id(),
            Some(user.role.as_str()),
            &device_id,
            &ip,
            ua,
            crate::models::Session::default_scopes(),
        )
        .await?;

    Ok(Json(tokens))
}

/// Refresh access token
pub async fn refresh_token(
    State(state): State<Arc<AppState>>,
    Json(req): Json<crate::models::RefreshRequest>,
) -> AppResult<Json<TokenPair>> {
    let session_service = SessionService::new(
        state.redis.clone(),
        state.config.jwt.clone(),
    );

    // Validate refresh token
    let claims = session_service.validate_refresh_token(&req.refresh_token)?;

    // Get session
    let session_id = uuid::Uuid::parse_str(&claims.sid)
        .map_err(|_| AppError::InvalidToken)?;
    
    let session = session_service
        .get_session(session_id)
        .await?
        .ok_or(AppError::InvalidToken)?;

    if session.is_expired() {
        return Err(AppError::TokenExpired);
    }

    // Generate new tokens
    let tokens = session_service.generate_tokens(&session, claims.role.as_deref())?;

    Ok(Json(tokens))
}

/// Logout: delete the session named by the bearer access token's `sid`.
/// Subsequent requests with that token fail the middleware EXISTS check.
pub async fn logout(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> AppResult<StatusCode> {
    let token = headers
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or(AppError::InvalidToken)?;

    let session_service = SessionService::new(state.redis.clone(), state.config.jwt.clone());
    // A valid (signed, unexpired) token is required so that unauthenticated
    // callers cannot delete arbitrary sessions.
    let claims = session_service.validate_access_token(token)?;

    let session_id = uuid::Uuid::parse_str(&claims.sid).map_err(|_| AppError::InvalidToken)?;
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| AppError::InvalidToken)?;
    session_service.delete_session(session_id, user_id).await?;

    Ok(StatusCode::NO_CONTENT)
}

/// Verify email address
#[derive(serde::Deserialize)]
pub struct VerifyEmailRequest {
    token: String,
}

pub async fn verify_email(
    State(state): State<Arc<AppState>>,
    Json(req): Json<VerifyEmailRequest>,
) -> AppResult<Json<Value>> {
    // Find user by verification token
    let user: Option<crate::models::User> = sqlx::query_as::<_, crate::models::User>(
        r#"
        SELECT * FROM users 
        WHERE email_verification_token = $1 
        AND email_verification_expires_at > NOW()
        "#
    )
    .bind(&req.token)
    .fetch_optional(&state.db)
    .await?;

    let user = user.ok_or(AppError::ValidationError("Invalid or expired verification token".into()))?;

    // Update user to verified
    sqlx::query(
        r#"
        UPDATE users 
        SET email_verified = TRUE, 
            email_verification_token = NULL,
            email_verification_expires_at = NULL
        WHERE id = $1
        "#
    )
    .bind(user.id)
    .execute(&state.db)
    .await?;

    Ok(Json(json!({
        "message": "Email verified successfully",
        "qor_id": user.qor_id()
    })))
}

/// Request password reset
pub async fn forgot_password(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ForgotPasswordRequest>,
) -> AppResult<Json<Value>> {
    let auth_service = AuthService::new(state.db.clone());

    // Find user by email or username
    let user = if AuthService::is_email(&req.identifier) {
        auth_service.find_by_email(&req.identifier).await?
    } else {
        auth_service.find_by_username(&req.identifier).await?
    };

    if let Some(user) = user {
        if user.email.is_some() {
            // Email-based reset: generate token and send email
            let token = AuthService::generate_verification_token();
            let expires_at = Utc::now() + Duration::hours(1);

            // Store reset token
            sqlx::query(
                r#"
                INSERT INTO password_resets (user_id, token, expires_at)
                VALUES ($1, $2, $3)
                "#
            )
            .bind(user.id)
            .bind(&token)
            .bind(expires_at)
            .execute(&state.db)
            .await?;

            // Send password reset email
            let email_service = state.email_service.clone();
            let email = user.email.clone().unwrap_or_default();
            let username = user.username.clone();
            let token_clone = token.clone();
            
            tokio::spawn(async move {
                if let Err(e) = email_service.send_password_reset_email(&email, &username, &token_clone).await {
                    tracing::error!("Failed to send password reset email to {}: {}", email, e);
                }
            });
            
            return Ok(Json(json!({
                "message": "If an account exists, a reset link will be sent",
                "requires_backup_code": false
            })));
        } else {
            // Username-only account: indicate backup code is needed
            return Ok(Json(json!({
                "requires_backup_code": true,
                "message": "This account requires a backup code to reset password"
            })));
        }
    }

    // Don't reveal if account exists (security best practice)
    Ok(Json(json!({
        "message": "If an account exists, a reset link will be sent"
    })))
}

/// Reset password with backup code (username-only accounts)
///
/// Backup codes are stored only as Argon2id hashes (migration 012). Failed
/// attempts count against the same `login_attempts`/`locked_until` lockout as
/// `login`. Per-IP rate limiting is handled by nginx in front of this service.
pub async fn reset_password_with_backup(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ResetPasswordWithBackupRequest>,
) -> AppResult<Json<Value>> {
    check_password_length(&state, &req.new_password)?;

    // Find user by username. Do not reveal whether the account exists.
    let auth_service = AuthService::new(state.db.clone());
    let user = auth_service
        .find_by_username(&req.username.to_lowercase())
        .await?;

    let Some(user) = user else {
        // Burn one hash so a missing user is not distinguishable by timing.
        let _ = AuthService::verify_backup_code(&req.backup_code, None);
        return Err(AppError::InvalidCredentials);
    };

    if user.is_locked() {
        return Err(AppError::AccountLocked);
    }

    // Verify backup code (Argon2id; constant-time by construction)
    if !AuthService::verify_backup_code(&req.backup_code, user.backup_code_hash.as_deref())? {
        auth_service
            .increment_login_attempts(
                user.id,
                state.config.security.max_login_attempts,
                state.config.security.lockout_duration_secs,
            )
            .await?;
        return Err(AppError::InvalidCredentials);
    }

    // Hash new password
    let password_hash = AuthService::hash_password(&req.new_password)?;

    // Update password and clear lockout counters
    sqlx::query(
        "UPDATE users SET password_hash = $1, login_attempts = 0, locked_until = NULL WHERE id = $2"
    )
    .bind(&password_hash)
    .bind(user.id)
    .execute(&state.db)
    .await?;

    // Revoke all sessions after a credential reset
    let session_service = SessionService::new(state.redis.clone(), state.config.jwt.clone());
    if let Err(e) = session_service.delete_all_sessions(user.id).await {
        tracing::warn!("Failed to revoke sessions after backup reset for {}: {}", user.id, e);
    }

    Ok(Json(json!({
        "message": "Password reset successfully"
    })))
}

/// Reset password with token (email-based accounts)
pub async fn reset_password(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ResetPasswordWithTokenRequest>,
) -> AppResult<Json<Value>> {
    check_password_length(&state, &req.new_password)?;

    // Find valid reset token
    let reset: Option<(uuid::Uuid, uuid::Uuid)> = sqlx::query_as(
        r#"
        SELECT user_id, id FROM password_resets
        WHERE token = $1 
        AND expires_at > NOW()
        AND used_at IS NULL
        LIMIT 1
        "#
    )
    .bind(&req.token)
    .fetch_optional(&state.db)
    .await?;

    let (user_id, reset_id) = reset.ok_or(AppError::ValidationError("Invalid or expired reset token".into()))?;

    // Hash new password
    let password_hash = AuthService::hash_password(&req.new_password)?;

    // Update password and mark token as used, atomically
    let mut tx = state.db.begin().await?;
    sqlx::query("UPDATE users SET password_hash = $1, login_attempts = 0, locked_until = NULL WHERE id = $2")
        .bind(&password_hash)
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
    sqlx::query("UPDATE password_resets SET used_at = NOW() WHERE id = $1")
        .bind(reset_id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;

    Ok(Json(json!({
        "message": "Password reset successfully"
    })))
}

/// Check username availability
#[derive(serde::Deserialize)]
pub struct CheckUsernameRequest {
    username: String,
}

pub async fn check_username(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CheckUsernameRequest>,
) -> AppResult<Json<Value>> {
    // Validate username format
    if !crate::models::QorId::is_valid_username(&req.username) {
        return Ok(Json(json!({
            "available": false,
            "reason": "invalid_format"
        })));
    }

    // Check if username exists in database
    let username_lower = req.username.to_lowercase();
    let exists: Option<i64> = sqlx::query_scalar(
        "SELECT COUNT(*) FROM users WHERE LOWER(username) = $1"
    )
    .bind(&username_lower)
    .fetch_optional(&state.db)
    .await?;

    let available = exists.map(|count| count == 0).unwrap_or(true);

    Ok(Json(json!({
        "available": available,
        "username": username_lower,
    })))
}

/// Check email availability
#[derive(serde::Deserialize)]
pub struct CheckEmailRequest {
    email: String,
}

pub async fn check_email(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CheckEmailRequest>,
) -> AppResult<Json<Value>> {
    // Validate email format
    if !req.email.contains('@') || !req.email.contains('.') {
        return Ok(Json(json!({
            "available": false,
            "reason": "invalid_format"
        })));
    }

    // Check if email exists in database
    let email_lower = req.email.to_lowercase();
    let exists: Option<i64> = sqlx::query_scalar(
        "SELECT COUNT(*) FROM users WHERE LOWER(email) = $1"
    )
    .bind(&email_lower)
    .fetch_optional(&state.db)
    .await?;

    let available = exists.map(|count| count == 0).unwrap_or(true);

    Ok(Json(json!({
        "available": available,
        "email": email_lower,
    })))
}

// =============================================================================
// Keypair-Based Authentication
// =============================================================================

/// Generate a challenge for keypair authentication
/// GET /api/v1/auth/challenge?pubkey=0x...
pub async fn get_challenge(
    State(state): State<Arc<AppState>>,
    Query(req): Query<ChallengeRequest>,
) -> AppResult<Json<ChallengeResponse>> {
    // Validate pubkey format (hex, 64-128 chars for Ed25519/hybrid keys)
    if req.pubkey.len() < 64 || req.pubkey.len() > 256 {
        return Err(AppError::ValidationError(
            "Invalid public key format".into(),
        ));
    }

    // Generate random challenge
    let random_bytes: [u8; 32] = rand::thread_rng().gen();
    let random_hex = hex::encode(random_bytes);
    let timestamp = Utc::now().timestamp();
    let challenge = format!("demiurge:{}:{}", timestamp, random_hex);
    let expires_at = Utc::now() + Duration::minutes(5);

    // Store challenge in database (for verification later)
    sqlx::query(
        r#"
        INSERT INTO auth_challenges (pubkey, challenge, expires_at)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(&req.pubkey)
    .bind(&challenge)
    .bind(expires_at)
    .execute(&state.db)
    .await?;

    Ok(Json(ChallengeResponse {
        challenge,
        expires_at,
    }))
}

/// Verify Ed25519 signature
pub fn verify_ed25519_signature(pubkey: &str, message: &str, signature: &str) -> Result<bool, AppError> {
    use ed25519_dalek::{Signature, VerifyingKey, Verifier};

    // Decode pubkey from hex
    let pubkey_bytes = hex::decode(pubkey)
        .map_err(|_| AppError::ValidationError("Invalid public key hex".into()))?;
    
    if pubkey_bytes.len() != 32 {
        return Err(AppError::ValidationError("Public key must be 32 bytes".into()));
    }

    let pubkey_array: [u8; 32] = pubkey_bytes
        .try_into()
        .map_err(|_| AppError::ValidationError("Invalid public key length".into()))?;

    let verifying_key = VerifyingKey::from_bytes(&pubkey_array)
        .map_err(|_| AppError::ValidationError("Invalid public key".into()))?;

    // Decode signature from hex
    let sig_bytes = hex::decode(signature)
        .map_err(|_| AppError::ValidationError("Invalid signature hex".into()))?;
    
    if sig_bytes.len() != 64 {
        return Err(AppError::ValidationError("Signature must be 64 bytes".into()));
    }

    let sig_array: [u8; 64] = sig_bytes
        .try_into()
        .map_err(|_| AppError::ValidationError("Invalid signature length".into()))?;

    let sig = Signature::from_bytes(&sig_array);

    // Verify signature
    Ok(verifying_key.verify(message.as_bytes(), &sig).is_ok())
}

/// Login with keypair signature
/// POST /api/v1/auth/keypair-login
pub async fn keypair_login(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    ConnectInfo(peer): ConnectInfo<SocketAddr>,
    Json(req): Json<KeypairLoginRequest>,
) -> AppResult<Json<TokenPair>> {
    // Verify challenge exists and is not expired
    let challenge_record: Option<(uuid::Uuid, String)> = sqlx::query_as(
        r#"
        SELECT id, challenge FROM auth_challenges
        WHERE pubkey = $1 AND challenge = $2 AND expires_at > NOW() AND used = FALSE
        LIMIT 1
        "#,
    )
    .bind(&req.pubkey)
    .bind(&req.challenge)
    .fetch_optional(&state.db)
    .await?;

    let (challenge_id, challenge) = challenge_record
        .ok_or(AppError::ValidationError("Invalid or expired challenge".into()))?;

    // Verify signature
    let valid = verify_ed25519_signature(&req.pubkey, &challenge, &req.signature)?;
    if !valid {
        return Err(AppError::InvalidCredentials);
    }

    // Mark challenge as used
    sqlx::query("UPDATE auth_challenges SET used = TRUE WHERE id = $1")
        .bind(challenge_id)
        .execute(&state.db)
        .await?;

    // Find user by pubkey
    let user: Option<crate::models::User> = sqlx::query_as(
        "SELECT * FROM users WHERE primary_pubkey = $1",
    )
    .bind(&req.pubkey)
    .fetch_optional(&state.db)
    .await?;

    let user = user.ok_or(AppError::ValidationError(
        "No account linked to this public key. Please register first.".into(),
    ))?;

    // Check account status
    if user.status != crate::models::UserStatus::Active {
        return Err(AppError::ValidationError("Account is not active".into()));
    }

    // Create session
    let session_service = SessionService::new(
        state.redis.clone(),
        state.config.jwt.clone(),
    );

    let device_id = req.device_id.unwrap_or_else(|| "keypair-client".to_string());
    let ip = client_ip(&headers, Some(&peer));
    let ua = headers.get("user-agent").and_then(|v| v.to_str().ok());
    let (_session, tokens) = session_service
        .create_session(
            user.id,
            &user.qor_id(),
            Some(user.role.as_str()),
            &device_id,
            &ip,
            ua,
            crate::models::Session::default_scopes(),
        )
        .await?;

    Ok(Json(tokens))
}

/// Register with keypair (create new account)
/// POST /api/v1/auth/keypair-register
pub async fn keypair_register(
    State(state): State<Arc<AppState>>,
    Json(req): Json<KeypairRegisterRequest>,
) -> AppResult<(StatusCode, Json<Value>)> {
    // Verify challenge
    let challenge_record: Option<(uuid::Uuid, String)> = sqlx::query_as(
        r#"
        SELECT id, challenge FROM auth_challenges
        WHERE pubkey = $1 AND challenge = $2 AND expires_at > NOW() AND used = FALSE
        LIMIT 1
        "#,
    )
    .bind(&req.pubkey)
    .bind(&req.challenge)
    .fetch_optional(&state.db)
    .await?;

    let (challenge_id, challenge) = challenge_record
        .ok_or(AppError::ValidationError("Invalid or expired challenge".into()))?;

    // Verify signature
    let valid = verify_ed25519_signature(&req.pubkey, &challenge, &req.signature)?;
    if !valid {
        return Err(AppError::InvalidCredentials);
    }

    // Mark challenge as used
    sqlx::query("UPDATE auth_challenges SET used = TRUE WHERE id = $1")
        .bind(challenge_id)
        .execute(&state.db)
        .await?;

    // Check if pubkey already registered
    let existing: Option<uuid::Uuid> = sqlx::query_scalar(
        "SELECT id FROM users WHERE primary_pubkey = $1",
    )
    .bind(&req.pubkey)
    .fetch_optional(&state.db)
    .await?;

    if existing.is_some() {
        return Err(AppError::ValidationError(
            "This public key is already registered".into(),
        ));
    }

    // Generate username from pubkey if not provided
    let username = req.username.unwrap_or_else(|| {
        format!("key_{}", &req.pubkey[0..8].to_lowercase())
    });
    let username_lower = username.to_lowercase();

    // Validate username
    if !crate::models::QorId::is_valid_username(&username_lower) {
        return Err(AppError::ValidationError(
            "Username must be 3-20 characters, alphanumeric and underscores only".into(),
        ));
    }

    let auth_service = AuthService::new(state.db.clone());

    // Check username availability
    if let Some(_) = auth_service.find_by_username(&username_lower).await? {
        return Err(AppError::ValidationError("Username already taken".into()));
    }

    // Generate discriminator
    let discriminator = auth_service.generate_discriminator(&username_lower).await?;

    // Generate a random password hash (keypair-only accounts don't need password)
    let random_password: [u8; 32] = rand::thread_rng().gen();
    let password_hash = AuthService::hash_password(&hex::encode(random_password))?;

    // Generate on-chain address from pubkey (simplified - first 20 bytes of pubkey hash)
    let on_chain_address = format!("0x{}", &req.pubkey[0..40]);

    // Insert user with keypair auth
    let user_id: uuid::Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO users (
            username, discriminator, password_hash,
            email_verified, role, status, 
            primary_pubkey, auth_method, on_chain_address
        )
        VALUES ($1, $2, $3, TRUE, 'user', 'active', $4, 'keypair', $5)
        RETURNING id
        "#,
    )
    .bind(&username_lower)
    .bind(discriminator)
    .bind(&password_hash)
    .bind(&req.pubkey)
    .bind(&on_chain_address)
    .fetch_one(&state.db)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "qor_id": format!("{}#{:04}", username_lower, discriminator),
            "user_id": user_id,
            "pubkey": req.pubkey,
            "on_chain_address": on_chain_address,
            "auth_method": "keypair",
            "message": "Account created successfully with keypair authentication"
        })),
    ))
}

