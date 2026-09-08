//! Demiurge Studio CD-key licensing (offline-first).

use chrono::{Duration, Utc};
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::studio::{LicenseStatusResponse, StudioEdition, StudioLicenseKeyRow};

pub struct StudioLicenseService;

impl StudioLicenseService {
    pub fn normalize_key(raw: &str) -> String {
        raw.chars()
            .filter(|c| !c.is_whitespace())
            .collect::<String>()
            .to_uppercase()
    }

    pub fn hash_key(normalized: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(normalized.as_bytes());
        hex::encode(hasher.finalize())
    }

    pub fn validate_key_format(normalized: &str) -> bool {
        // DS-CREATOR-XXXXX-XXXXX-XXXXX
        let parts: Vec<&str> = normalized.split('-').collect();
        if parts.len() != 5 {
            return false;
        }
        parts[0] == "DS"
            && matches!(parts[1], "CREATOR" | "PRO" | "ENTERPRISE" | "FREE")
            && parts[2].len() == 5
            && parts[3].len() == 5
            && parts[4].len() == 5
            && parts[2..]
                .iter()
                .all(|p| p.chars().all(|c| c.is_ascii_alphanumeric()))
    }

    pub fn edition_from_key(normalized: &str) -> Option<StudioEdition> {
        let edition = normalized.split('-').nth(1)?;
        match edition {
            "FREE" => Some(StudioEdition::Free),
            "CREATOR" => Some(StudioEdition::Creator),
            "PRO" => Some(StudioEdition::Pro),
            "ENTERPRISE" => Some(StudioEdition::Enterprise),
            _ => None,
        }
    }

    pub fn generate_key_code(edition: StudioEdition) -> String {
        use rand::Rng;
        const CHARSET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let mut rng = rand::thread_rng();
        let mut segment = || {
            (0..5)
                .map(|_| {
                    let idx = rng.gen_range(0..CHARSET.len());
                    CHARSET[idx] as char
                })
                .collect::<String>()
        };
        let label = match edition {
            StudioEdition::Free => "FREE",
            StudioEdition::Creator => "CREATOR",
            StudioEdition::Pro => "PRO",
            StudioEdition::Enterprise => "ENTERPRISE",
        };
        format!(
            "DS-{}-{}-{}-{}",
            label,
            segment(),
            segment(),
            segment()
        )
    }

    pub async fn get_user_license_status(
        db: &PgPool,
        user_id: Uuid,
        require_license: bool,
    ) -> AppResult<LicenseStatusResponse> {
        let row: Option<(StudioEdition, serde_json::Value, chrono::DateTime<Utc>, Option<chrono::DateTime<Utc>>, String)> =
            sqlx::query_as(
                r#"
                SELECT a.edition, k.features, a.activated_at, k.expires_at, a.machine_id
                FROM studio_activations a
                JOIN studio_license_keys k ON k.id = a.license_key_id
                WHERE a.user_id = $1 AND a.is_active = TRUE
                LIMIT 1
                "#,
            )
            .bind(user_id)
            .fetch_optional(db)
            .await?;

        if let Some((edition, features, activated_at, expires_at, machine_id)) = row {
            if let Some(exp) = expires_at {
                if exp < Utc::now() {
                    return Ok(LicenseStatusResponse {
                        edition: StudioEdition::Free.as_str().to_string(),
                        features: StudioEdition::Free.default_features(),
                        activated_at: None,
                        expires_at: Some(exp),
                        machine_id: None,
                        requires_activation: require_license,
                    });
                }
            }

            return Ok(LicenseStatusResponse {
                edition: edition.as_str().to_string(),
                features,
                activated_at: Some(activated_at),
                expires_at,
                machine_id: Some(machine_id),
                requires_activation: false,
            });
        }

        Ok(LicenseStatusResponse {
            edition: StudioEdition::Free.as_str().to_string(),
            features: StudioEdition::Free.default_features(),
            activated_at: None,
            expires_at: None,
            machine_id: None,
            requires_activation: require_license,
        })
    }

    pub async fn activate(
        db: &PgPool,
        user_id: Uuid,
        raw_key: &str,
        machine_id: &str,
    ) -> AppResult<LicenseStatusResponse> {
        let normalized = Self::normalize_key(raw_key);
        if !Self::validate_key_format(&normalized) {
            return Err(AppError::ValidationError(
                "Invalid license key format. Expected DS-EDITION-XXXXX-XXXXX-XXXXX".into(),
            ));
        }

        let key_hash = Self::hash_key(&normalized);

        let mut tx = db.begin().await?;

        let license: Option<StudioLicenseKeyRow> = sqlx::query_as(
            r#"
            SELECT id, key_hash, edition, features, max_activations, activations_used, expires_at, revoked_at
            FROM studio_license_keys
            WHERE key_hash = $1
            FOR UPDATE
            "#,
        )
        .bind(&key_hash)
        .fetch_optional(&mut *tx)
        .await?;

        let license = license.ok_or_else(|| {
            AppError::ValidationError("License key not found or invalid".into())
        })?;

        if license.revoked_at.is_some() {
            return Err(AppError::ValidationError("This license key has been revoked".into()));
        }

        if let Some(exp) = license.expires_at {
            if exp < Utc::now() {
                return Err(AppError::ValidationError("This license key has expired".into()));
            }
        }

        let expected_edition = Self::edition_from_key(&normalized)
            .ok_or_else(|| AppError::ValidationError("Could not parse edition from key".into()))?;

        if expected_edition != license.edition {
            return Err(AppError::ValidationError(
                "License key edition mismatch".into(),
            ));
        }

        // Already activated on this machine for this user
        let existing: Option<Uuid> = sqlx::query_scalar(
            r#"
            SELECT a.id FROM studio_activations a
            WHERE a.license_key_id = $1 AND a.machine_id = $2 AND a.user_id = $3 AND a.is_active = TRUE
            "#,
        )
        .bind(license.id)
        .bind(machine_id)
        .bind(user_id)
        .fetch_optional(&mut *tx)
        .await?;

        if existing.is_some() {
            tx.commit().await?;
            return Self::get_user_license_status(db, user_id, false).await;
        }

        if license.activations_used >= license.max_activations {
            return Err(AppError::ValidationError(format!(
                "License key has reached its activation limit ({})",
                license.max_activations
            )));
        }

        // Deactivate prior license for this user
        sqlx::query(
            r#"
            UPDATE studio_activations
            SET is_active = FALSE, deactivated_at = NOW()
            WHERE user_id = $1 AND is_active = TRUE
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO studio_activations (license_key_id, user_id, machine_id, edition)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(license.id)
        .bind(user_id)
        .bind(machine_id)
        .bind(license.edition)
        .execute(&mut *tx)
        .await?;

        sqlx::query(
            r#"
            UPDATE studio_license_keys
            SET activations_used = activations_used + 1
            WHERE id = $1
            "#,
        )
        .bind(license.id)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        Self::get_user_license_status(db, user_id, false).await
    }

    pub async fn insert_license_key(
        db: &PgPool,
        edition: StudioEdition,
        max_activations: i32,
        expires_at: Option<chrono::DateTime<Utc>>,
        notes: Option<&str>,
    ) -> AppResult<(String, Uuid)> {
        let plaintext = Self::generate_key_code(edition);
        let normalized = Self::normalize_key(&plaintext);
        let key_hash = Self::hash_key(&normalized);
        let features = edition.default_features();

        let id: Uuid = sqlx::query_scalar(
            r#"
            INSERT INTO studio_license_keys (key_hash, edition, features, max_activations, expires_at, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            "#,
        )
        .bind(&key_hash)
        .bind(edition)
        .bind(features)
        .bind(max_activations)
        .bind(expires_at)
        .bind(notes)
        .fetch_one(db)
        .await?;

        Ok((plaintext, id))
    }

    pub fn parse_edition(s: &str) -> AppResult<StudioEdition> {
        match s.to_lowercase().as_str() {
            "free" => Ok(StudioEdition::Free),
            "creator" => Ok(StudioEdition::Creator),
            "pro" => Ok(StudioEdition::Pro),
            "enterprise" => Ok(StudioEdition::Enterprise),
            _ => Err(AppError::ValidationError(
                "Edition must be free, creator, pro, or enterprise".into(),
            )),
        }
    }

    pub fn expires_from_days(days: Option<i32>) -> Option<chrono::DateTime<Utc>> {
        days.map(|d| Utc::now() + Duration::days(d as i64))
    }
}
