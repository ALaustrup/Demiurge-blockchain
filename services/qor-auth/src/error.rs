//! Error handling for the Qor Auth service.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

/// Application-specific errors
#[derive(Error, Debug)]
pub enum AppError {
    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),

    #[error("Invalid credentials")]
    InvalidCredentials,

    #[error("Token expired")]
    TokenExpired,

    #[error("Invalid token")]
    InvalidToken,

    #[error("User not found")]
    UserNotFound,

    #[error("User already exists")]
    UserAlreadyExists,

    #[error("Email not verified")]
    EmailNotVerified,

    #[error("Account locked")]
    AccountLocked,

    #[error("Insufficient permissions")]
    InsufficientPermissions,

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Redis error: {0}")]
    RedisError(#[from] deadpool_redis::PoolError),

    #[error("Internal server error")]
    InternalError(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_code, message) = match self {
            AppError::AuthenticationFailed(msg) => {
                (StatusCode::UNAUTHORIZED, "AUTH_FAILED", msg)
            }
            AppError::InvalidCredentials => {
                (StatusCode::UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email or password".into())
            }
            AppError::TokenExpired => {
                (StatusCode::UNAUTHORIZED, "TOKEN_EXPIRED", "Token has expired".into())
            }
            AppError::InvalidToken => {
                (StatusCode::UNAUTHORIZED, "INVALID_TOKEN", "Invalid or malformed token".into())
            }
            AppError::UserNotFound => {
                (StatusCode::NOT_FOUND, "USER_NOT_FOUND", "User not found".into())
            }
            AppError::UserAlreadyExists => {
                (StatusCode::CONFLICT, "USER_EXISTS", "User already exists".into())
            }
            AppError::EmailNotVerified => {
                (StatusCode::FORBIDDEN, "EMAIL_NOT_VERIFIED", "Please verify your email".into())
            }
            AppError::AccountLocked => {
                (StatusCode::FORBIDDEN, "ACCOUNT_LOCKED", "Account is temporarily locked".into())
            }
            AppError::InsufficientPermissions => {
                (StatusCode::FORBIDDEN, "FORBIDDEN", "Insufficient permissions".into())
            }
            AppError::ValidationError(msg) => {
                (StatusCode::BAD_REQUEST, "VALIDATION_ERROR", msg)
            }
            AppError::NotFound(msg) => {
                (StatusCode::NOT_FOUND, "NOT_FOUND", msg)
            }
            AppError::DatabaseError(e) => {
                tracing::error!("Database error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR", "Database error occurred".into())
            }
            AppError::RedisError(e) => {
                tracing::error!("Redis error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "CACHE_ERROR", "Cache error occurred".into())
            }
            AppError::InternalError(e) => {
                tracing::error!("Internal error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Internal server error".into())
            }
        };

        let body = Json(json!({
            "error": {
                "code": error_code,
                "message": message
            }
        }));

        (status, body).into_response()
    }
}

/// Result type alias for convenience
pub type AppResult<T> = Result<T, AppError>;

impl AppError {
    pub fn unauthorized(msg: impl Into<String>) -> Self {
        AppError::AuthenticationFailed(msg.into())
    }

    pub fn forbidden(_msg: impl Into<String>) -> Self {
        AppError::InsufficientPermissions
    }

    pub fn not_found(msg: impl Into<String>) -> Self {
        AppError::NotFound(msg.into())
    }

    pub fn internal(msg: impl Into<String>) -> Self {
        AppError::InternalError(anyhow::anyhow!(msg.into()))
    }
}
