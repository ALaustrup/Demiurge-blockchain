//! Profile management handlers.

use axum::{
    extract::{Extension, Multipart, Path, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};
use std::sync::Arc;
use uuid::Uuid;
use sha2::{Sha256, Digest};
use hex;
use base64::engine::general_purpose;
use base64::Engine;

use crate::error::{AppError, AppResult};
use crate::state::AppState;
use crate::models::user::{LinkWalletRequest, User};
use sqlx;

/// Get current user's profile
/// Extracts user_id from auth middleware and fetches real profile data
pub async fn get_profile(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<Uuid>,
) -> AppResult<Json<Value>> {
    // user_id is extracted from JWT by auth middleware
    // Fetch user data from database
    let user: User = sqlx::query_as(
        r#"
        SELECT id, email, username, discriminator, password_hash, email_verified,
               avatar_url, role, status, on_chain_address, login_attempts, locked_until,
               created_at, updated_at, backup_code, backup_code_hash, email_verification_token,
               email_verification_expires_at, primary_pubkey, auth_method,
               account_type, controller_id, agent_did, agent_capabilities,
               agent_autonomy, agent_spending_limit, agent_model
        FROM users WHERE id = $1
        "#
    )
    .bind(user_id)
    .fetch_one(&state.db)
    .await
    .map_err(|_| AppError::NotFound("User not found".into()))?;
    
    // Format QOR ID: username#discriminator
    let qor_id = format!("{}#{:04}", user.username, user.discriminator);
    
    Ok(Json(json!({
        "id": user.id.to_string(),
        "qor_id": qor_id,
        "email": user.email,
        "display_name": user.username, // Use username as display name for now
        "avatar_url": user.avatar_url,
        "role": user.role,
        "status": user.status,
        "created_at": user.created_at,
        "on_chain": {
            "address": user.on_chain_address,
            "cgt_balance": "0.00" // TODO: Fetch from blockchain RPC
        },
        "account_type": user.account_type,
        "auth_method": user.auth_method
    })))
}

/// Update user profile
pub async fn update_profile(
    State(_state): State<Arc<AppState>>,
    Json(_req): Json<Value>,
) -> AppResult<Json<Value>> {
    // TODO: Validate and update profile fields

    Ok(Json(json!({
        "message": "Profile updated successfully"
    })))
}

/// Upload avatar image
pub async fn upload_avatar(
    State(_state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> AppResult<Json<Value>> {
    // TODO: Extract user from auth middleware
    // For now, we'll use the qor_id from the form data

    let mut avatar_data: Option<Vec<u8>> = None;
    let mut qor_id: Option<String> = None;

    // Parse multipart form data
    while let Some(field) = multipart.next_field().await
        .map_err(|e| AppError::ValidationError(format!("Failed to parse multipart: {}", e)))?
    {
        let name = field.name().unwrap_or("");
        
        match name {
            "avatar" => {
                let data = field.bytes().await
                    .map_err(|e| AppError::ValidationError(format!("Failed to read avatar data: {}", e)))?;
                
                // Validate file size (max 5MB)
                if data.len() > 5 * 1024 * 1024 {
                    return Err(AppError::ValidationError("Avatar file too large (max 5MB)".to_string()));
                }
                
                // Validate file type (check magic bytes)
                if data.len() < 4 {
                    return Err(AppError::ValidationError("Invalid image file".to_string()));
                }
                
                let magic = &data[0..4];
                let is_valid_image = magic == b"\x89PNG" // PNG
                    || magic == [0xFF, 0xD8, 0xFF, 0xE0] // JPEG
                    || magic == [0xFF, 0xD8, 0xFF, 0xE1] // JPEG
                    || magic == [0x47, 0x49, 0x46, 0x38]; // GIF
                
                if !is_valid_image {
                    return Err(AppError::ValidationError("Invalid image format. Only PNG, JPEG, and GIF are supported".to_string()));
                }
                
                avatar_data = Some(data.to_vec());
            }
            "qor_id" => {
                let text = field.text().await
                    .map_err(|e| AppError::ValidationError(format!("Failed to read qor_id: {}", e)))?;
                qor_id = Some(text);
            }
            _ => {}
        }
    }

    let avatar_bytes = avatar_data.ok_or_else(|| 
        AppError::ValidationError("Missing avatar file".to_string())
    )?;

    // Generate hash for filename
    let mut hasher = Sha256::new();
    hasher.update(&avatar_bytes);
    hasher.update(qor_id.as_deref().unwrap_or("").as_bytes());
    let hash = hex::encode(hasher.finalize());
    let _filename = format!("{}.png", &hash[..16]); // Use first 16 chars of hash

    // Detect MIME type from magic bytes (before encoding)
    let mime_type = if avatar_bytes.len() >= 4 {
        match &avatar_bytes[0..4] {
            b"\x89PNG" => "image/png",
            [0xFF, 0xD8, 0xFF, 0xE0] | [0xFF, 0xD8, 0xFF, 0xE1] => "image/jpeg",
            [0x47, 0x49, 0x46, 0x38] => "image/gif",
            _ => "image/png", // Default
        }
    } else {
        "image/png"
    };
    
    // For now, store as base64 data URL
    // In production, upload to IPFS or object storage (S3, etc.)
    let base64_data = general_purpose::STANDARD.encode(&avatar_bytes);
    let avatar_url = format!("data:{};base64,{}", mime_type, base64_data);

    // TODO: Update user record in database
    // For now, return the data URL
    // In production, you would:
    // 1. Upload to IPFS/S3
    // 2. Get the IPFS hash or S3 URL
    // 3. Update the user's avatar_url in the database
    // 4. Return the URL

    Ok(Json(json!({
        "avatar_url": avatar_url,
        "message": "Avatar uploaded successfully. Minting as DRC-369 NFT..."
    })))
}

/// List all active sessions
pub async fn list_sessions(
    State(_state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    // TODO: Fetch sessions from Redis

    Ok(Json(json!({
        "sessions": []
    })))
}

/// Revoke a specific session
pub async fn revoke_session(
    State(_state): State<Arc<AppState>>,
    Path(_session_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    // TODO: Delete session from Redis

    Ok(StatusCode::NO_CONTENT)
}

/// Link on-chain wallet address to Qor ID
///
/// The caller proves control of an Ed25519 key by signing a server-issued
/// challenge (`GET /api/v1/auth/challenge?pubkey=...`). The linked address is
/// derived from that pubkey exactly as in keypair-register, so a user cannot
/// link an address they do not control.
pub async fn link_wallet(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<Uuid>, // set by require_auth
    Json(req): Json<LinkWalletRequest>,
) -> AppResult<Json<Value>> {
    // Consume the challenge (single use, bound to this pubkey)
    let challenge_record: Option<(Uuid, String)> = sqlx::query_as(
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

    let (challenge_id, challenge) =
        challenge_record.ok_or(AppError::ValidationError("Invalid or expired challenge".into()))?;

    if !crate::handlers::auth::verify_ed25519_signature(&req.pubkey, &challenge, &req.signature)? {
        return Err(AppError::InvalidCredentials);
    }

    sqlx::query("UPDATE auth_challenges SET used = TRUE WHERE id = $1")
        .bind(challenge_id)
        .execute(&state.db)
        .await?;

    // Reject a pubkey already bound to a different account
    let owner: Option<Uuid> = sqlx::query_scalar("SELECT id FROM users WHERE primary_pubkey = $1")
        .bind(&req.pubkey)
        .fetch_optional(&state.db)
        .await?;
    if matches!(owner, Some(o) if o != user_id) {
        return Err(AppError::ValidationError(
            "This public key is already linked to another account".into(),
        ));
    }

    let pubkey_lower = req.pubkey.to_lowercase();
    let address = format!("0x{}", &pubkey_lower[0..40]);

    let user: User = sqlx::query_as(
        r#"
        UPDATE users
        SET on_chain_address = $1, primary_pubkey = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
        "#,
    )
    .bind(&address)
    .bind(&req.pubkey)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(json!({
        "message": "Wallet linked successfully",
        "address": address,
        "pubkey": req.pubkey,
        "qor_id": user.qor_id()
    })))
}
