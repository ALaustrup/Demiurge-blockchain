//! Demiurge Studio licensing handlers.

use axum::{
    extract::{Extension, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::{json, Value};
use std::sync::Arc;
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::studio::{ActivateLicenseRequest, GenerateLicenseKeysRequest};
use crate::services::studio_license_service::StudioLicenseService;
use crate::state::AppState;

fn studio_enabled(state: &AppState) -> bool {
    state.config.studio.enabled
}

fn require_license(state: &AppState) -> bool {
    state.config.studio.require_license
}

fn admin_secret_ok(state: &AppState, headers: &HeaderMap) -> bool {
    let Some(expected) = state.config.studio.admin_secret.as_ref() else {
        return false;
    };
    let Some(provided) = headers
        .get("X-Studio-Admin-Secret")
        .and_then(|v| v.to_str().ok())
    else {
        return false;
    };
    // Constant-time comparison (leaks only length, never content).
    use subtle::ConstantTimeEq;
    provided.as_bytes().ct_eq(expected.as_bytes()).into()
}

/// GET /api/v1/studio/license — current user's edition (auth required)
pub async fn get_license(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<Uuid>,
) -> AppResult<Json<Value>> {
    if !studio_enabled(&state) {
        return Err(AppError::ValidationError("Studio licensing is disabled".into()));
    }

    let status = StudioLicenseService::get_user_license_status(
        &state.db,
        user_id,
        require_license(&state),
    )
    .await?;

    Ok(Json(serde_json::to_value(status).unwrap()))
}

/// POST /api/v1/studio/activate — bind CD-key to user + machine (auth required)
pub async fn activate_license(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<Uuid>,
    Json(req): Json<ActivateLicenseRequest>,
) -> AppResult<Json<Value>> {
    if !studio_enabled(&state) {
        return Err(AppError::ValidationError("Studio licensing is disabled".into()));
    }

    if req.machine_id.trim().len() < 8 {
        return Err(AppError::ValidationError(
            "machine_id must be at least 8 characters".into(),
        ));
    }

    let status = StudioLicenseService::activate(
        &state.db,
        user_id,
        &req.license_key,
        req.machine_id.trim(),
    )
    .await?;

    Ok(Json(serde_json::to_value(status).unwrap()))
}

/// GET /api/v1/studio/editions — public feature matrix
pub async fn list_editions(State(state): State<Arc<AppState>>) -> AppResult<Json<Value>> {
    if !studio_enabled(&state) {
        return Err(AppError::ValidationError("Studio licensing is disabled".into()));
    }

    use crate::models::studio::StudioEdition;

    Ok(Json(json!({
        "editions": [
            {
                "id": "free",
                "name": "Studio Free",
                "features": StudioEdition::Free.default_features(),
                "requires_key": false
            },
            {
                "id": "creator",
                "name": "Studio Creator",
                "features": StudioEdition::Creator.default_features(),
                "requires_key": true
            },
            {
                "id": "pro",
                "name": "Studio Pro",
                "features": StudioEdition::Pro.default_features(),
                "requires_key": true
            },
            {
                "id": "enterprise",
                "name": "Studio Enterprise",
                "features": StudioEdition::Enterprise.default_features(),
                "requires_key": true
            }
        ]
    })))
}

/// POST /api/v1/studio/admin/generate-keys — local key generation (admin secret)
pub async fn generate_keys(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(req): Json<GenerateLicenseKeysRequest>,
) -> AppResult<(StatusCode, Json<Value>)> {
    if !studio_enabled(&state) {
        return Err(AppError::ValidationError("Studio licensing is disabled".into()));
    }

    if !admin_secret_ok(&state, &headers) {
        return Err(AppError::ValidationError(
            "Invalid or missing X-Studio-Admin-Secret".into(),
        ));
    }

    let edition = StudioLicenseService::parse_edition(&req.edition)?;
    let count = req.count.clamp(1, 500);
    let max_activations = req.max_activations.unwrap_or(2);
    let expires_at = StudioLicenseService::expires_from_days(req.expires_days);

    let mut keys = Vec::new();
    for _ in 0..count {
        let (plaintext, id) = StudioLicenseService::insert_license_key(
            &state.db,
            edition,
            max_activations,
            expires_at,
            req.notes.as_deref(),
        )
        .await?;
        keys.push(json!({
            "id": id,
            "key": plaintext,
            "edition": edition.as_str(),
        }));
    }

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "generated": keys.len(),
            "keys": keys,
            "message": "Store these keys securely — they cannot be retrieved again."
        })),
    ))
}
