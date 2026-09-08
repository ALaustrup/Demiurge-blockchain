//! Demiurge Studio licensing models.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::Type;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[sqlx(type_name = "studio_edition", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum StudioEdition {
    Free,
    Creator,
    Pro,
    Enterprise,
}

impl StudioEdition {
    pub fn as_str(&self) -> &'static str {
        match self {
            StudioEdition::Free => "free",
            StudioEdition::Creator => "creator",
            StudioEdition::Pro => "pro",
            StudioEdition::Enterprise => "enterprise",
        }
    }

    pub fn default_features(&self) -> serde_json::Value {
        let features: &[&str] = match self {
            StudioEdition::Free => &[
                "hub",
                "local_chain",
                "wallet",
                "single_project",
            ],
            StudioEdition::Creator => &[
                "hub",
                "local_chain",
                "wallet",
                "drc369",
                "unreal_plugin",
                "agents",
                "multi_project",
            ],
            StudioEdition::Pro => &[
                "hub",
                "local_chain",
                "wallet",
                "drc369",
                "unreal_plugin",
                "agents",
                "multi_project",
                "analytics",
                "scatter3d",
            ],
            StudioEdition::Enterprise => &[
                "hub",
                "local_chain",
                "wallet",
                "drc369",
                "unreal_plugin",
                "agents",
                "multi_project",
                "analytics",
                "scatter3d",
                "white_label",
                "team_seats",
            ],
        };
        serde_json::json!(features)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivateLicenseRequest {
    pub license_key: String,
    pub machine_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateLicenseKeysRequest {
    pub edition: String,
    pub count: u32,
    pub max_activations: Option<i32>,
    pub expires_days: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseStatusResponse {
    pub edition: String,
    pub features: serde_json::Value,
    pub activated_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub machine_id: Option<String>,
    pub requires_activation: bool,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct StudioLicenseKeyRow {
    pub id: Uuid,
    pub key_hash: String,
    pub edition: StudioEdition,
    pub features: serde_json::Value,
    pub max_activations: i32,
    pub activations_used: i32,
    pub expires_at: Option<DateTime<Utc>>,
    pub revoked_at: Option<DateTime<Utc>>,
}
