//! User model for Qor ID system.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Authentication method for the user
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type, Default)]
#[sqlx(type_name = "VARCHAR")]
#[serde(rename_all = "lowercase")]
pub enum AuthMethod {
    #[default]
    Password,
    Keypair,
    Both,
}

impl AuthMethod {
    pub fn as_str(&self) -> &'static str {
        match self {
            AuthMethod::Password => "password",
            AuthMethod::Keypair => "keypair",
            AuthMethod::Both => "both",
        }
    }
}

/// Account type (human or agent)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type, Default)]
#[sqlx(type_name = "VARCHAR")]
#[serde(rename_all = "lowercase")]
pub enum AccountType {
    #[default]
    Human,
    Agent,
}

/// Agent autonomy level
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "VARCHAR")]
#[serde(rename_all = "lowercase")]
pub enum AgentAutonomy {
    Supervised, // Requires approval for all actions
    Bounded,    // Pre-approved actions + spending limit
    Autonomous, // Full signing authority
    Sovereign,  // Can spawn sub-agents
}

/// User entity stored in PostgreSQL
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: Option<String>, // Optional for username-only accounts
    pub username: String,
    pub discriminator: i16,
    pub password_hash: String,
    pub email_verified: bool,
    pub avatar_url: Option<String>,
    pub role: UserRole,
    pub status: UserStatus,
    pub on_chain_address: Option<String>,
    pub backup_code: Option<String>, // DEPRECATED: always NULL since migration 012
    #[sqlx(default)]
    pub backup_code_hash: Option<String>, // Argon2id hash of the backup code
    pub email_verification_token: Option<String>,
    pub email_verification_expires_at: Option<DateTime<Utc>>,
    pub login_attempts: i32,
    pub locked_until: Option<DateTime<Utc>>,
    pub primary_pubkey: Option<String>, // Primary public key for keypair auth
    pub auth_method: Option<String>, // password, keypair, or both
    // Agent-specific fields
    pub account_type: Option<String>, // human or agent
    pub controller_id: Option<Uuid>, // Human owner of this agent
    pub agent_did: Option<String>, // did:demiurge:agent:...
    pub agent_capabilities: Option<serde_json::Value>, // JSON array of capabilities
    pub agent_autonomy: Option<String>, // supervised, bounded, autonomous, sovereign
    pub agent_spending_limit: Option<i64>, // CGT spending limit
    pub agent_model: Option<String>, // AI model identifier
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// User role for RBAC
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    User,
    Moderator,
    Admin,
    System,
    God, // God-level access - full system control
}

impl UserRole {
    /// Canonical lowercase name used in JWT `role` claims and RBAC checks.
    /// This is the single source of truth; never use `{:?}` for tokens.
    pub fn as_str(&self) -> &'static str {
        match self {
            UserRole::User => "user",
            UserRole::Moderator => "moderator",
            UserRole::Admin => "admin",
            UserRole::System => "system",
            UserRole::God => "god",
        }
    }

    /// Parse a canonical role name (case-insensitive).
    pub fn parse(s: &str) -> Option<Self> {
        match s.to_ascii_lowercase().as_str() {
            "user" => Some(UserRole::User),
            "moderator" => Some(UserRole::Moderator),
            "admin" => Some(UserRole::Admin),
            "system" => Some(UserRole::System),
            "god" => Some(UserRole::God),
            _ => None,
        }
    }

    /// Check if role has admin privileges
    pub fn is_admin(&self) -> bool {
        matches!(self, UserRole::Admin | UserRole::God | UserRole::System)
    }

    /// Check if role has God-level access
    pub fn is_god(&self) -> bool {
        matches!(self, UserRole::God)
    }
}

impl std::fmt::Display for UserRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

/// User account status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "user_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum UserStatus {
    Active,
    Inactive,
    Suspended,
    Banned,
}

/// Registration request DTO
#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: Option<String>, // Optional - if provided, will send confirmation email
    pub password: String,
    pub username: String,
    /// Demiurge Studio CD-key (optional at signup)
    pub license_key: Option<String>,
    /// Stable machine fingerprint from Studio client
    pub machine_id: Option<String>,
}

/// Login request DTO - accepts email OR username
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    #[serde(alias = "email", alias = "username")]
    pub identifier: String, // Can be email or username
    pub password: String,
    pub device_id: Option<String>,
}

/// Password reset request DTO
#[derive(Debug, Deserialize)]
pub struct ForgotPasswordRequest {
    pub identifier: String, // Username or email
}

/// Link wallet request: proves control of an Ed25519 key over a server challenge
#[derive(Debug, Deserialize)]
pub struct LinkWalletRequest {
    pub pubkey: String,
    pub challenge: String,
    pub signature: String,
}

/// Password reset with backup code DTO
#[derive(Debug, Deserialize)]
pub struct ResetPasswordWithBackupRequest {
    pub username: String,
    pub backup_code: String,
    pub new_password: String,
}

/// Password reset with token DTO (for email-based reset)
#[derive(Debug, Deserialize)]
pub struct ResetPasswordWithTokenRequest {
    pub token: String,
    pub new_password: String,
}

/// Request for a signature challenge (keypair auth step 1)
#[derive(Debug, Deserialize)]
pub struct ChallengeRequest {
    pub pubkey: String,
}

/// Response containing the challenge to sign
#[derive(Debug, Serialize)]
pub struct ChallengeResponse {
    pub challenge: String,
    pub expires_at: DateTime<Utc>,
}

/// Login with keypair signature (keypair auth step 2)
#[derive(Debug, Deserialize)]
pub struct KeypairLoginRequest {
    pub pubkey: String,
    pub challenge: String,
    pub signature: String,
    pub device_id: Option<String>,
}

/// Register with keypair (creates account from pubkey)
#[derive(Debug, Deserialize)]
pub struct KeypairRegisterRequest {
    pub pubkey: String,
    pub username: Option<String>, // Optional username, will be auto-generated if not provided
    pub challenge: String,
    pub signature: String,
}

/// Link keypair to existing account
#[derive(Debug, Deserialize)]
pub struct LinkKeypairRequest {
    pub pubkey: String,
    pub challenge: String,
    pub signature: String,
}

// =============================================================================
// Agent Types
// =============================================================================

/// Register a new AI agent
#[derive(Debug, Deserialize)]
pub struct RegisterAgentRequest {
    pub name: String,
    pub capabilities: Vec<String>,
    pub autonomy: String, // supervised, bounded, autonomous, sovereign
    pub spending_limit: Option<i64>,
    pub model: Option<String>,
}

/// Agent registration response
#[derive(Debug, Serialize)]
pub struct AgentRegistrationResponse {
    pub agent_id: Uuid,
    pub qor_id: String,
    pub did: String,
    /// Ed25519 verifying key (hex). This is what is stored server-side.
    pub primary_pubkey: String,
    /// Ed25519 signing key (hex, 32 bytes). Returned ONCE at registration and
    /// never stored by the server. The caller must persist it securely; it
    /// cannot be recovered.
    pub private_key: String,
    pub on_chain_address: String,
    pub capabilities: Vec<String>,
    pub autonomy: String,
}

/// Update agent capabilities
#[derive(Debug, Deserialize)]
pub struct UpdateAgentCapabilitiesRequest {
    pub capabilities: Vec<String>,
}

/// Agent info response
#[derive(Debug, Serialize)]
pub struct AgentInfo {
    pub id: Uuid,
    pub qor_id: String,
    pub did: String,
    pub pubkey: Option<String>,
    pub on_chain_address: Option<String>,
    pub capabilities: Vec<String>,
    pub autonomy: String,
    pub spending_limit: Option<i64>,
    pub model: Option<String>,
    pub status: String,
    pub controller_id: Uuid,
    pub created_at: DateTime<Utc>,
}

impl User {
    /// Format as Qor ID (username#discriminator)
    pub fn qor_id(&self) -> String {
        format!("{}#{:04}", self.username.to_lowercase(), self.discriminator)
    }

    /// Check if account is locked
    pub fn is_locked(&self) -> bool {
        if let Some(locked_until) = self.locked_until {
            Utc::now() < locked_until
        } else {
            false
        }
    }
}
