//! Application configuration module.
//! 
//! Loads configuration from environment variables and config files.

use serde::Deserialize;
use config::{Config, Environment, File};

/// Main application configuration
#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
    pub jwt: JwtConfig,
    pub security: SecurityConfig,
    #[serde(default)]
    pub studio: StudioConfig,
    #[serde(default)]
    pub features: FeaturesConfig,
}

/// Feature flags
#[derive(Debug, Clone, Deserialize, Default)]
pub struct FeaturesConfig {
    /// Mint starter CGT on registration via node RPC. Default false.
    /// TODO(phase-1): starter grants must become a signed treasury transaction.
    #[serde(default)]
    pub starter_grant_enabled: bool,
}

/// Demiurge Studio — offline registration and CD-key licensing
#[derive(Debug, Clone, Deserialize)]
pub struct StudioConfig {
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default)]
    pub require_license: bool,
    #[serde(default = "default_true")]
    pub offline_registration: bool,
    #[serde(default = "default_true")]
    pub auto_login_on_register: bool,
    pub admin_secret: Option<String>,
}

fn default_true() -> bool {
    true
}

impl Default for StudioConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            require_license: false,
            offline_registration: true,
            auto_login_on_register: true,
            admin_secret: None,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub environment: String,
    /// Browser origins allowed by CORS. Accepts a TOML array or a comma-separated
    /// string (QOR_AUTH__SERVER__CORS_ALLOWED_ORIGINS=https://a,https://b).
    #[serde(default = "default_cors_origins", deserialize_with = "de_string_list")]
    pub cors_allowed_origins: Vec<String>,
}

fn default_cors_origins() -> Vec<String> {
    vec![
        "http://localhost:3000".into(),
        "http://localhost:5173".into(),
        "http://127.0.0.1:3000".into(),
        "http://127.0.0.1:5173".into(),
    ]
}

/// Accept either `["a","b"]` or `"a,b"`.
fn de_string_list<'de, D: serde::Deserializer<'de>>(d: D) -> Result<Vec<String>, D::Error> {
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum ListOrString {
        List(Vec<String>),
        Str(String),
    }
    Ok(match ListOrString::deserialize(d)? {
        ListOrString::List(v) => v,
        ListOrString::Str(s) => s
            .split(',')
            .map(|x| x.trim().to_string())
            .filter(|x| !x.is_empty())
            .collect(),
    })
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RedisConfig {
    pub url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JwtConfig {
    /// Secret for signing access tokens
    pub access_secret: String,
    /// Secret for signing refresh tokens
    pub refresh_secret: String,
    /// Access token expiry in seconds (default: 900 = 15 minutes)
    pub access_expiry_secs: i64,
    /// Refresh token expiry in seconds (default: 2592000 = 30 days)
    pub refresh_expiry_secs: i64,
    /// Issuer claim
    pub issuer: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SecurityConfig {
    /// Maximum login attempts before lockout
    pub max_login_attempts: u32,
    /// Lockout duration in seconds
    pub lockout_duration_secs: i64,
    /// Maximum concurrent sessions per user
    pub max_sessions: usize,
    /// Password minimum length
    pub password_min_length: usize,
}

impl AppConfig {
    /// Load configuration from environment and files
    pub fn load() -> anyhow::Result<Self> {
        // Load .env file if present
        dotenvy::dotenv().ok();

        let env = std::env::var("RUN_ENV").unwrap_or_else(|_| "development".into());

        let config = Config::builder()
            // Start with default values
            .set_default("server.host", "0.0.0.0")?
            .set_default("server.port", 8080)?
            .set_default("server.environment", env.as_str())?
            .set_default("database.max_connections", 10)?
            .set_default("jwt.access_expiry_secs", 900)?
            .set_default("jwt.refresh_expiry_secs", 2592000)?
            .set_default("jwt.issuer", "qor-auth")?
            .set_default("security.max_login_attempts", 5)?
            .set_default("security.lockout_duration_secs", 900)?
            .set_default("security.max_sessions", 10)?
            .set_default("security.password_min_length", 12)?
            .set_default("studio.enabled", true)?
            .set_default("studio.require_license", false)?
            .set_default("studio.offline_registration", true)?
            .set_default("studio.auto_login_on_register", true)?
            .set_default("features.starter_grant_enabled", false)?
            // Load config file based on environment
            .add_source(File::with_name(&format!("config/{}", env)).required(false))
            // Override with environment variables (QOR_AUTH_*)
            .add_source(
                Environment::with_prefix("QOR_AUTH")
                    .separator("__")
                    .try_parsing(true),
            )
            .build()?;

        let mut cfg: AppConfig = config.try_deserialize()?;

        // Plain env overrides (Studio ops)
        if let Ok(v) = std::env::var("STUDIO_MODE") {
            cfg.studio.enabled = v == "1" || v.eq_ignore_ascii_case("true");
        }
        if let Ok(v) = std::env::var("STUDIO_REQUIRE_LICENSE") {
            cfg.studio.require_license = v == "1" || v.eq_ignore_ascii_case("true");
        }
        if let Ok(v) = std::env::var("STUDIO_LICENSE_ADMIN_SECRET") {
            if !v.is_empty() {
                cfg.studio.admin_secret = Some(v);
            }
        }

        cfg.validate(&env)?;

        Ok(cfg)
    }

    /// Fail fast on unusable secrets. Enforced only when RUN_ENV=production.
    pub fn validate(&self, env: &str) -> anyhow::Result<()> {
        if env != "production" {
            return Ok(());
        }
        check_secret("jwt.access_secret (QOR_AUTH__JWT__ACCESS_SECRET)", &self.jwt.access_secret)?;
        check_secret("jwt.refresh_secret (QOR_AUTH__JWT__REFRESH_SECRET)", &self.jwt.refresh_secret)?;
        if self.jwt.access_secret == self.jwt.refresh_secret {
            anyhow::bail!("jwt.access_secret and jwt.refresh_secret must differ");
        }
        if is_placeholder(&self.database.url) {
            anyhow::bail!(
                "database.url is unset or a placeholder; set QOR_AUTH__DATABASE__URL"
            );
        }
        Ok(())
    }
}

const SECRET_MIN_BYTES: usize = 32;

/// Known placeholder values that must never be used as secrets.
const KNOWN_PLACEHOLDERS: &[&str] = &[
    "CHANGE_ME_ACCESS_SECRET",
    "CHANGE_ME_REFRESH_SECRET",
    "CHANGE_ME",
    "your-super-secret-access-key-change-in-production",
    "your-super-secret-refresh-key-change-in-production",
    "super-secret-jwt-access-key-change-in-production-2026",
    "super-secret-jwt-refresh-key-change-in-production-2026",
    "dev-access-secret-min-32-chars-qor-auth-local",
    "dev-refresh-secret-min-32-chars-qor-auth-local",
];

fn is_placeholder(v: &str) -> bool {
    let t = v.trim();
    t.is_empty()
        || t.starts_with("${")
        || KNOWN_PLACEHOLDERS.contains(&t)
        || t.to_ascii_lowercase().contains("change_me")
        || t.to_ascii_lowercase().contains("change-me")
        || t.to_ascii_lowercase().contains("change-in-production")
}

fn check_secret(name: &str, value: &str) -> anyhow::Result<()> {
    if value.trim().is_empty() {
        anyhow::bail!("{name} is empty; RUN_ENV=production requires a real secret (openssl rand -hex 32)");
    }
    if is_placeholder(value) {
        anyhow::bail!("{name} is a known placeholder; RUN_ENV=production requires a real secret (openssl rand -hex 32)");
    }
    if value.len() < SECRET_MIN_BYTES {
        anyhow::bail!(
            "{name} is {} bytes; RUN_ENV=production requires at least {SECRET_MIN_BYTES} bytes (openssl rand -hex 32)",
            value.len()
        );
    }
    Ok(())
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                host: "0.0.0.0".into(),
                port: 8080,
                environment: "development".into(),
                cors_allowed_origins: default_cors_origins(),
            },
            database: DatabaseConfig {
                url: "postgres://localhost/qor_auth".into(),
                max_connections: 10,
            },
            redis: RedisConfig {
                url: "redis://localhost:6379".into(),
            },
            jwt: JwtConfig {
                access_secret: "CHANGE_ME_ACCESS_SECRET".into(),
                refresh_secret: "CHANGE_ME_REFRESH_SECRET".into(),
                access_expiry_secs: 900,
                refresh_expiry_secs: 2592000,
                issuer: "qor-auth".into(),
            },
            security: SecurityConfig {
                max_login_attempts: 5,
                lockout_duration_secs: 900,
                max_sessions: 10,
                password_min_length: 12,
            },
            studio: StudioConfig::default(),
            features: FeaturesConfig::default(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn production_rejects_placeholder_and_short_secrets() {
        let mut cfg = AppConfig::default();
        cfg.database.url = "postgres://u:p@h/db".into();
        assert!(cfg.validate("development").is_ok());
        assert!(cfg.validate("production").is_err(), "CHANGE_ME placeholders must fail");

        cfg.jwt.access_secret = "short".into();
        cfg.jwt.refresh_secret = "also-short".into();
        assert!(cfg.validate("production").is_err());

        cfg.jwt.access_secret = "".into();
        assert!(cfg.validate("production").is_err());

        cfg.jwt.access_secret = "${QOR_AUTH__JWT__ACCESS_SECRET}".into();
        assert!(cfg.validate("production").is_err());

        cfg.jwt.access_secret = "a".repeat(64);
        cfg.jwt.refresh_secret = "b".repeat(64);
        assert!(cfg.validate("production").is_ok());
    }
}
