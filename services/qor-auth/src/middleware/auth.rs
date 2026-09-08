//! Authentication middleware.
//!
//! All variants share `authenticate`, which validates the bearer JWT
//! (signature, exp/nbf, iss, aud) and then checks that the session `sid`
//! still exists in Redis, so logout and ban revoke access tokens immediately.

use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use std::sync::Arc;

use crate::models::Claims;
use crate::services::SessionService;
use crate::state::AppState;

/// Session id from the validated token, exposed to handlers via extensions.
#[derive(Debug, Clone, Copy)]
pub struct SessionId(pub uuid::Uuid);

/// Helper to extract state from request (for use in nested routes)
fn get_state_from_request(request: &Request) -> Option<Arc<AppState>> {
    request.extensions().get::<Arc<AppState>>().cloned()
}

/// Extract user ID from request extensions (set by auth middleware)
pub fn get_user_id(request: &Request) -> Option<uuid::Uuid> {
    request.extensions().get::<uuid::Uuid>().copied()
}

/// Extract user role from request extensions
pub fn get_user_role(request: &Request) -> Option<String> {
    request.extensions().get::<String>().cloned()
}

/// Canonical RBAC checks. Role strings are the lowercase names from
/// `UserRole::as_str()`; anything else (including `{:?}` output) is denied.
pub fn role_is_god(role: Option<&str>) -> bool {
    role == Some("god")
}

pub fn role_is_admin(role: Option<&str>) -> bool {
    matches!(role, Some("admin" | "god" | "system"))
}

/// Bearer token from the Authorization header (owned, so no `&Request` is
/// held across an await; `Body` is `!Sync`).
fn bearer_token(request: &Request) -> Option<String> {
    request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .map(|t| t.to_string())
}

/// Validate a bearer token and confirm its session is live.
pub async fn authenticate(state: &AppState, token: &str) -> Result<Claims, StatusCode> {
    let session_service = SessionService::new(state.redis.clone(), state.config.jwt.clone());

    let claims = session_service
        .validate_access_token(token)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Revocation check: session must still exist (logout / ban delete it).
    match session_service.session_exists(&claims.sid).await {
        Ok(true) => Ok(claims),
        Ok(false) => Err(StatusCode::UNAUTHORIZED),
        Err(e) => {
            tracing::error!("session lookup failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Attach user info from claims to request extensions for handlers.
fn attach_claims(request: &mut Request, claims: &Claims) {
    if let Ok(user_id) = uuid::Uuid::parse_str(&claims.sub) {
        request.extensions_mut().insert(user_id);
    }
    if let Ok(sid) = uuid::Uuid::parse_str(&claims.sid) {
        request.extensions_mut().insert(SessionId(sid));
    }
    if let Some(role) = &claims.role {
        request.extensions_mut().insert(role.clone());
    }
    request.extensions_mut().insert(claims.qor_id.clone());
    request.extensions_mut().insert(claims.clone());
}

/// Middleware to require authentication (with state)
pub async fn require_auth_with_state(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Store state in extensions for nested routes
    request.extensions_mut().insert(state.clone());
    let token = bearer_token(&request).ok_or(StatusCode::UNAUTHORIZED)?;
    let claims = authenticate(&state, &token).await?;
    attach_claims(&mut request, &claims);
    Ok(next.run(request).await)
}

/// Middleware to require authentication (without state - for nested routes)
pub async fn require_auth(mut request: Request, next: Next) -> Result<Response, StatusCode> {
    let state = get_state_from_request(&request).ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    let token = bearer_token(&request).ok_or(StatusCode::UNAUTHORIZED)?;
    let claims = authenticate(&state, &token).await?;
    attach_claims(&mut request, &claims);
    Ok(next.run(request).await)
}

/// Middleware to require admin role (admin, god, or system)
pub async fn require_admin(mut request: Request, next: Next) -> Result<Response, StatusCode> {
    let state = get_state_from_request(&request).ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    let token = bearer_token(&request).ok_or(StatusCode::UNAUTHORIZED)?;
    let claims = authenticate(&state, &token).await?;
    if !role_is_admin(claims.role.as_deref()) {
        return Err(StatusCode::FORBIDDEN);
    }
    attach_claims(&mut request, &claims);
    Ok(next.run(request).await)
}

/// Middleware to require God-level access
pub async fn require_god(mut request: Request, next: Next) -> Result<Response, StatusCode> {
    let state = get_state_from_request(&request).ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    let token = bearer_token(&request).ok_or(StatusCode::UNAUTHORIZED)?;
    let claims = authenticate(&state, &token).await?;
    if !role_is_god(claims.role.as_deref()) {
        return Err(StatusCode::FORBIDDEN);
    }
    attach_claims(&mut request, &claims);
    Ok(next.run(request).await)
}
