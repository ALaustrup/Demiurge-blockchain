//! # Qor Auth Service
//! 
//! The Non-Dual Identity System for the Demiurge Ecosystem.
//! 
//! ## Architecture
//! 
//! - **Framework**: Axum (Rust 2024)
//! - **Database**: PostgreSQL 18
//! - **Cache**: Redis 7.4+
//! - **Auth**: JWT + Refresh Tokens
//! 
//! ## Features
//! 
//! - Battle.Net-style `username#discriminator` identity
//! - On-chain identity linking via Substrate
//! - Session management with device tracking

use std::net::SocketAddr;
use std::sync::Arc;

use axum::{
    Router,
    routing::{get, post, delete},
    extract::{Request, State},
    middleware::{Next, from_fn, from_fn_with_state},
};
use sqlx::postgres::PgPoolOptions;
use axum::http::{HeaderValue, Method, header};
use tower_http::{
    cors::{AllowOrigin, CorsLayer},
    trace::TraceLayer,
    compression::CompressionLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod error;
mod handlers;
mod middleware;
mod models;
mod services;
mod state;

use crate::config::AppConfig;
use crate::state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "qor_auth=debug,tower_http=debug,axum=trace".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("🎭 Qor Auth Service - Genesis Activation");

    // Load configuration
    let config = AppConfig::load()?;
    
    // Database connection pool
    let db_pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(&config.database.url)
        .await?;

    tracing::info!("✅ Connected to PostgreSQL");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&db_pool)
        .await?;

    tracing::info!("✅ Database migrations applied");

    // Admin bootstrap (env QOR_AUTH_BOOTSTRAP_GOD_PASSWORD); never seeded by migrations.
    services::auth_service::AuthService::new(db_pool.clone())
        .bootstrap_god_if_requested()
        .await
        .map_err(|e| anyhow::anyhow!("god bootstrap failed: {}", e))?;

    // Redis connection
    let redis_cfg = deadpool_redis::Config::from_url(&config.redis.url);
    let redis_pool = redis_cfg.create_pool(Some(deadpool_redis::Runtime::Tokio1))?;

    tracing::info!("✅ Connected to Redis");

    // Initialize email service
    let email_config = services::EmailConfig::default();
    let email_service = services::EmailService::new(email_config);
    
    if email_service.is_configured() {
        tracing::info!("✅ Email service configured");
    } else {
        tracing::warn!("⚠️  Email service not configured - emails will be logged only");
    }

    // Build application state
    let state = Arc::new(AppState::new(config.clone(), db_pool, redis_pool, email_service));

    // Build router
    let app = Router::new()
        // Health endpoints
        .route("/health", get(handlers::health::health_check))
        .route("/ready", get(handlers::health::readiness_check))
        
        // Public auth endpoints
        .nest("/api/v1/auth", auth_routes())
        
        // Protected profile endpoints
        .nest("/api/v1/profile", profile_routes())
        
        // Admin endpoints (protected - God-level)
        .nest("/api/v1/admin", admin_routes())
        
        // Agent management endpoints
        .nest("/api/v1/agents", agent_routes())
        
        // Music player endpoints
        .nest("/api/v1/music", music_routes())

        // Demiurge Studio licensing
        .nest("/api/v1/studio", studio_routes())
        
        // Middleware - inject state into extensions for nested routes
        .layer(from_fn_with_state(
            state.clone(),
            move |State(state): State<Arc<AppState>>, mut request: Request, next: Next| async move {
                request.extensions_mut().insert(state);
                next.run(request).await
            }
        ))
        .layer(TraceLayer::new_for_http())
        .layer(CompressionLayer::new())
        .layer(build_cors(&config.server.cors_allowed_origins))
        .with_state(state);

    // Bind and serve
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server.port));
    tracing::info!("🚀 Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await?;

    Ok(())
}

/// CORS restricted to configured origins (localhost defaults in dev).
fn build_cors(origins: &[String]) -> CorsLayer {
    let parsed: Vec<HeaderValue> = origins
        .iter()
        .filter_map(|o| match HeaderValue::from_str(o) {
            Ok(v) => Some(v),
            Err(_) => {
                tracing::warn!("Ignoring invalid CORS origin: {}", o);
                None
            }
        })
        .collect();
    tracing::info!("CORS allowed origins: {:?}", origins);
    CorsLayer::new()
        .allow_origin(AllowOrigin::list(parsed))
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
        .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE, header::ACCEPT])
}

/// Authentication routes (public)
fn auth_routes() -> Router<Arc<AppState>> {
    Router::new()
        // Traditional password auth
        .route("/register", post(handlers::auth::register))
        .route("/login", post(handlers::auth::login))
        .route("/refresh", post(handlers::auth::refresh_token))
        .route("/logout", post(handlers::auth::logout))
        .route("/verify-email", post(handlers::auth::verify_email))
        .route("/forgot-password", post(handlers::auth::forgot_password))
        .route("/reset-password", post(handlers::auth::reset_password))
        .route("/reset-password-backup", post(handlers::auth::reset_password_with_backup))
        .route("/check-username", post(handlers::auth::check_username))
        .route("/check-email", post(handlers::auth::check_email))
        // Keypair-based auth (Nostr-style)
        .route("/challenge", get(handlers::auth::get_challenge))
        .route("/keypair-login", post(handlers::auth::keypair_login))
        .route("/keypair-register", post(handlers::auth::keypair_register))
}

/// Profile routes (protected)
fn profile_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(handlers::profile::get_profile))
        .route("/", post(handlers::profile::update_profile))
        .route("/avatar", post(handlers::profile::upload_avatar))
        .route("/sessions", get(handlers::profile::list_sessions))
        .route("/sessions/{id}", axum::routing::delete(handlers::profile::revoke_session))
        .route("/link-wallet", post(handlers::profile::link_wallet))
        .layer(from_fn(crate::middleware::auth::require_auth))
}

/// Admin routes (protected - God-level access)
fn admin_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/users", get(handlers::admin::list_users))
        .route("/users/{id}", get(handlers::admin::get_user))
        .route("/users/{id}/ban", post(handlers::admin::ban_user))
        .route("/users/{id}/unban", post(handlers::admin::unban_user))
        .route("/users/{id}/role", post(handlers::admin::update_role))
        .route("/tokens/transfer", post(handlers::admin::transfer_tokens))
        .route("/tokens/refund", post(handlers::admin::refund_tokens))
        .route("/stats", get(handlers::admin::get_stats))
        .route("/audit", get(handlers::admin::get_audit_log))
        .layer(from_fn(crate::middleware::auth::require_god))
}

/// Agent management routes (protected)
fn agent_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/register", post(handlers::agents::register_agent))
        .route("/", get(handlers::agents::list_agents))
        .route("/{did}", get(handlers::agents::get_agent))
        .route("/{did}/capabilities", axum::routing::put(handlers::agents::update_capabilities))
        .route("/{did}", axum::routing::delete(handlers::agents::deactivate_agent))
        .layer(from_fn(crate::middleware::auth::require_auth))
}

/// Music player routes (mixed public/protected)
fn music_routes() -> Router<Arc<AppState>> {
    let public = Router::new()
        .route("/tracks", get(handlers::music::list_tracks))
        .route("/tracks/{id}", get(handlers::music::get_track))
        .route("/tracks/{id}/play", post(handlers::music::record_play))
        .route("/playlists", get(handlers::music::list_playlists))
        .route("/playlists/global", get(handlers::music::get_global_playlist))
        .route("/playlists/{id}/tracks", get(handlers::music::get_playlist_tracks));

    let protected = Router::new()
        .route("/tracks/upload", post(handlers::music::upload_track))
        .route("/tracks/{id}/like", post(handlers::music::like_track))
        .route("/playlists/create", post(handlers::music::create_playlist))
        .route("/playlists/{id}/add", post(handlers::music::add_to_playlist))
        .route(
            "/playlists/{playlist_id}/remove/{track_id}",
            delete(handlers::music::remove_from_playlist),
        )
        .layer(from_fn(crate::middleware::auth::require_auth));

    public.merge(protected)
}

/// Demiurge Studio licensing routes
fn studio_routes() -> Router<Arc<AppState>> {
    let public = Router::new()
        .route("/editions", get(handlers::studio::list_editions))
        .route(
            "/admin/generate-keys",
            post(handlers::studio::generate_keys),
        );

    let protected = Router::new()
        .route("/license", get(handlers::studio::get_license))
        .route("/activate", post(handlers::studio::activate_license))
        .layer(from_fn(crate::middleware::auth::require_auth));

    public.merge(protected)
}

/// Graceful shutdown signal handler
async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("Failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    tracing::info!("🛑 Shutdown signal received, starting graceful shutdown");
}
