//! Application state management.
//! 
//! Shared state across all request handlers.

use std::sync::Arc;
use sqlx::PgPool;
use deadpool_redis::Pool as RedisPool;

use crate::config::AppConfig;
use crate::services::EmailService;

/// Shared application state
pub struct AppState {
    /// Application configuration
    pub config: AppConfig,
    /// PostgreSQL connection pool
    pub db: PgPool,
    /// Redis connection pool
    pub redis: RedisPool,
    /// Email service for sending transactional emails
    pub email_service: Arc<EmailService>,
}

impl AppState {
    /// Create new application state
    pub fn new(config: AppConfig, db: PgPool, redis: RedisPool, email_service: EmailService) -> Self {
        Self { 
            config, 
            db, 
            redis,
            email_service: Arc::new(email_service),
        }
    }
}
