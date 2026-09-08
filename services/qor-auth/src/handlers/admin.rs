//! Admin handlers (protected - God-level access only).

use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::Arc;
use uuid::Uuid;

use crate::error::AppResult;
use crate::state::AppState;

/// List all users (paginated)
#[derive(Debug, Deserialize)]
pub struct ListUsersQuery {
    page: Option<u32>,
    per_page: Option<u32>,
    role: Option<String>,
    status: Option<String>,
}

pub async fn list_users(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ListUsersQuery>,
) -> AppResult<Json<Value>> {
    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;

    // Get total count (simplified - no filtering for now)
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
        .fetch_one(&state.db)
        .await?;

    // Get users - use query_as with tuple for type safety
    let users: Vec<Value> = sqlx::query_as::<_, (Uuid, String, String, i16, String, String, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, email, username, discriminator, role::text, status::text, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(per_page as i64)
    .bind(offset as i64)
    .fetch_all(&state.db)
    .await?
    .iter()
    .map(|(id, email, username, discriminator, role, status, created_at)| {
        json!({
            "id": id,
            "email": email,
            "qor_id": format!("{}#{:04}", username, discriminator),
            "role": role,
            "status": status,
            "created_at": created_at,
        })
    })
    .collect();

    Ok(Json(json!({
        "users": users,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total as f64 / per_page as f64).ceil() as u32,
    })))
}

/// Get a specific user by ID
pub async fn get_user(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let user = sqlx::query_as::<_, crate::models::User>(
        "SELECT * FROM users WHERE id = $1"
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?;

    match user {
        Some(u) => Ok(Json(json!({
            "id": u.id,
            "email": u.email,
            "qor_id": u.qor_id(),
            "role": u.role.as_str(),
            "status": format!("{:?}", u.status).to_lowercase(),
            "email_verified": u.email_verified,
            "avatar_url": u.avatar_url,
            "on_chain_address": u.on_chain_address,
            "created_at": u.created_at,
            "updated_at": u.updated_at,
        }))),
        None => Err(crate::error::AppError::UserNotFound),
    }
}

/// Ban a user
#[derive(Debug, Deserialize)]
pub struct BanRequest {
    reason: Option<String>,
}

pub async fn ban_user(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<Uuid>,
    Json(req): Json<BanRequest>,
) -> AppResult<Json<Value>> {
    // Update user status to banned
    sqlx::query("UPDATE users SET status = 'banned' WHERE id = $1")
        .bind(user_id)
        .execute(&state.db)
        .await?;

    // Revoke all sessions
    let session_service = crate::services::SessionService::new(
        state.redis.clone(),
        state.config.jwt.clone(),
    );
    session_service.delete_all_sessions(user_id).await?;

    // Log admin action (admin_id will be set by middleware in request extensions)
    // For now, use a placeholder - in production, extract from request extensions
    let admin_id = Uuid::nil();

    sqlx::query(
        "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)"
    )
    .bind(admin_id)
    .bind("user_banned")
    .bind(json!({
        "target_user_id": user_id,
        "reason": req.reason,
    }))
    .execute(&state.db)
    .await?;

    Ok(Json(json!({
        "message": "User banned successfully",
        "user_id": user_id,
    })))
}

/// Unban a user
pub async fn unban_user(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    sqlx::query("UPDATE users SET status = 'active' WHERE id = $1")
        .bind(user_id)
        .execute(&state.db)
        .await?;

    Ok(Json(json!({
        "message": "User unbanned successfully",
        "user_id": user_id,
    })))
}

/// Update user role
#[derive(Debug, Deserialize)]
pub struct UpdateRoleRequest {
    role: String,
}

pub async fn update_role(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<Uuid>,
    Json(req): Json<UpdateRoleRequest>,
) -> AppResult<Json<Value>> {
    // Validate role
    let valid_roles = ["user", "moderator", "admin", "god", "system"];
    if !valid_roles.contains(&req.role.as_str()) {
        return Err(crate::error::AppError::ValidationError(
            format!("Invalid role. Must be one of: {}", valid_roles.join(", "))
        ));
    }

    sqlx::query("UPDATE users SET role = $1 WHERE id = $2")
        .bind(&req.role)
        .bind(user_id)
        .execute(&state.db)
        .await?;

    Ok(Json(json!({
        "message": "User role updated successfully",
        "user_id": user_id,
        "new_role": req.role,
    })))
}

/// Transfer CGT tokens (for customer support)
#[derive(Debug, Deserialize)]
pub struct TransferTokensRequest {
    from_user_id: Option<Uuid>, // If None, from treasury
    to_user_id: Uuid,
    amount: String, // Amount in CGT (as string to preserve precision)
    reason: String,
}

pub async fn transfer_tokens(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<TransferTokensRequest>,
) -> AppResult<Json<Value>> {
    // TODO: Implement actual blockchain transaction
    // This would:
    // 1. Connect to Substrate node
    // 2. Build transfer extrinsic
    // 3. Sign with admin key
    // 4. Submit transaction
    // 5. Return transaction hash

    Ok(Json(json!({
        "message": "Token transfer initiated",
        "transaction_hash": "0x0000000000000000000000000000000000000000000000000000000000000000", // Placeholder
        "from": req.from_user_id,
        "to": req.to_user_id,
        "amount": req.amount,
    })))
}

/// Refund CGT tokens (for customer support)
#[derive(Debug, Deserialize)]
pub struct RefundTokensRequest {
    user_id: Uuid,
    amount: String,
    original_transaction_hash: String,
    reason: String,
}

pub async fn refund_tokens(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<RefundTokensRequest>,
) -> AppResult<Json<Value>> {
    // TODO: Implement actual blockchain transaction
    // Similar to transfer_tokens but with refund tracking

    Ok(Json(json!({
        "message": "Refund initiated",
        "transaction_hash": "0x0000000000000000000000000000000000000000000000000000000000000000", // Placeholder
        "user_id": req.user_id,
        "amount": req.amount,
        "original_tx": req.original_transaction_hash,
    })))
}

/// Get system statistics
pub async fn get_stats(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    // Total users
    let total_users: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
        .fetch_one(&state.db)
        .await?;

    // Active sessions (from Redis - approximate)
    let active_sessions = 0; // TODO: Count active sessions from Redis

    // Registrations in last 24h
    let registrations_24h: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours'"
    )
    .fetch_one(&state.db)
    .await?;

    // Logins in last 24h (approximate from audit log)
    let logins_24h: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM audit_log WHERE action = 'login' AND created_at > NOW() - INTERVAL '24 hours'"
    )
    .fetch_one(&state.db)
    .await?;

    // Users by role
    let users_by_role: Vec<(String, i64)> = sqlx::query_as(
        "SELECT role::text, COUNT(*) FROM users GROUP BY role"
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(json!({
        "total_users": total_users,
        "active_sessions": active_sessions,
        "registrations_24h": registrations_24h,
        "logins_24h": logins_24h,
        "users_by_role": users_by_role.iter().map(|(role, count)| json!({
            "role": role,
            "count": count
        })).collect::<Vec<_>>(),
    })))
}

/// Get audit log
#[derive(Debug, Deserialize)]
pub struct AuditLogQuery {
    page: Option<u32>,
    per_page: Option<u32>,
    user_id: Option<Uuid>,
    action: Option<String>,
}

pub async fn get_audit_log(
    State(state): State<Arc<AppState>>,
    Query(query): Query<AuditLogQuery>,
) -> AppResult<Json<Value>> {
    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(50).min(100);
    let offset = (page - 1) * per_page;

    // Simplified query - filtering can be added later
    // Use query_as with tuple for type safety
    let logs: Vec<Value> = sqlx::query_as::<_, (Uuid, Option<Uuid>, String, Value, Option<String>, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, user_id, action, details, ip_address, created_at FROM audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(per_page as i64)
    .bind(offset as i64)
    .fetch_all(&state.db)
    .await?
    .iter()
    .map(|(id, user_id, action, details, ip_address, created_at)| {
        json!({
            "id": id,
            "user_id": user_id,
            "action": action,
            "details": details,
            "ip_address": ip_address,
            "created_at": created_at,
        })
    })
    .collect();

    Ok(Json(json!({
        "logs": logs,
        "page": page,
        "per_page": per_page,
    })))
}
