//! Music player API handlers.

use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use std::sync::Arc;
use uuid::Uuid;

use crate::error::AppError;
use crate::state::AppState;

const TRACK_SELECT: &str = r#"
    t.id,
    t.uploader_id,
    (u.username || '#' || lpad(u.discriminator::text, 4, '0')) AS uploader_qor_id,
    t.title,
    t.artist,
    t.file_url,
    t.duration_ms,
    t.genre,
    t.plays,
    t.likes,
    t.is_public,
    t.created_at
"#;

const PLAYLIST_SELECT: &str = r#"
    p.id,
    p.name,
    p.description,
    p.owner_id,
    (u.username || '#' || lpad(u.discriminator::text, 4, '0')) AS owner_qor_id,
    p.is_global,
    p.is_public,
    p.cover_url,
    (SELECT COUNT(*)::bigint FROM playlist_tracks pt WHERE pt.playlist_id = p.id) AS track_count,
    p.created_at
"#;

#[derive(Debug, Serialize, FromRow)]
pub struct MusicTrack {
    pub id: Uuid,
    pub uploader_id: Uuid,
    pub uploader_qor_id: Option<String>,
    pub title: String,
    pub artist: Option<String>,
    pub file_url: String,
    pub duration_ms: Option<i32>,
    pub genre: Option<String>,
    pub plays: i32,
    pub likes: i32,
    pub is_public: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct Playlist {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Option<Uuid>,
    pub owner_qor_id: Option<String>,
    pub is_global: bool,
    pub is_public: bool,
    pub cover_url: Option<String>,
    pub track_count: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UploadTrackRequest {
    pub title: String,
    pub artist: Option<String>,
    pub file_url: String,
    pub duration_ms: Option<i32>,
    pub genre: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePlaylistRequest {
    pub name: String,
    pub description: Option<String>,
    pub is_public: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct AddToPlaylistRequest {
    pub track_id: Uuid,
    pub position: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct ListTracksQuery {
    pub genre: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub async fn upload_track(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<Uuid>,
    Json(req): Json<UploadTrackRequest>,
) -> Result<Json<MusicTrack>, AppError> {
    let track = sqlx::query_as::<_, MusicTrack>(
        r#"
        INSERT INTO music_tracks (uploader_id, title, artist, file_url, duration_ms, genre)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id,
            uploader_id,
            NULL::text AS uploader_qor_id,
            title,
            artist,
            file_url,
            duration_ms,
            genre,
            plays,
            likes,
            is_public,
            created_at
        "#,
    )
    .bind(user_id)
    .bind(&req.title)
    .bind(&req.artist)
    .bind(&req.file_url)
    .bind(req.duration_ms)
    .bind(&req.genre)
    .fetch_one(&state.db)
    .await
    .map_err(|e| AppError::internal(format!("Failed to upload track: {e}")))?;

    Ok(Json(track))
}

pub async fn list_tracks(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ListTracksQuery>,
) -> Result<Json<Vec<MusicTrack>>, AppError> {
    let limit = query.limit.unwrap_or(50).min(100);
    let offset = query.offset.unwrap_or(0);

    let tracks = if let Some(genre) = query.genre {
        let sql = format!(
            r#"
            SELECT {TRACK_SELECT}
            FROM music_tracks t
            LEFT JOIN users u ON t.uploader_id = u.id
            WHERE t.is_public = true AND t.genre = $1
            ORDER BY t.created_at DESC
            LIMIT $2 OFFSET $3
            "#
        );
        sqlx::query_as::<_, MusicTrack>(&sql)
            .bind(genre)
            .bind(limit)
            .bind(offset)
            .fetch_all(&state.db)
            .await
    } else {
        let sql = format!(
            r#"
            SELECT {TRACK_SELECT}
            FROM music_tracks t
            LEFT JOIN users u ON t.uploader_id = u.id
            WHERE t.is_public = true
            ORDER BY t.created_at DESC
            LIMIT $1 OFFSET $2
            "#
        );
        sqlx::query_as::<_, MusicTrack>(&sql)
            .bind(limit)
            .bind(offset)
            .fetch_all(&state.db)
            .await
    }
    .map_err(|e| AppError::internal(format!("Failed to list tracks: {e}")))?;

    Ok(Json(tracks))
}

pub async fn get_track(
    State(state): State<Arc<AppState>>,
    Path(track_id): Path<Uuid>,
) -> Result<Json<MusicTrack>, AppError> {
    let sql = format!(
        r#"
        SELECT {TRACK_SELECT}
        FROM music_tracks t
        LEFT JOIN users u ON t.uploader_id = u.id
        WHERE t.id = $1
        "#
    );

    let track = sqlx::query_as::<_, MusicTrack>(&sql)
        .bind(track_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| AppError::internal(format!("Failed to get track: {e}")))?
        .ok_or_else(|| AppError::not_found("Track not found"))?;

    Ok(Json(track))
}

pub async fn record_play(
    State(state): State<Arc<AppState>>,
    Path(track_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    sqlx::query("UPDATE music_tracks SET plays = plays + 1 WHERE id = $1")
        .bind(track_id)
        .execute(&state.db)
        .await
        .map_err(|e| AppError::internal(format!("Failed to record play: {e}")))?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn like_track(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<Uuid>,
    Path(track_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    let result = sqlx::query(
        r#"
        INSERT INTO track_likes (user_id, track_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, track_id) DO NOTHING
        "#,
    )
    .bind(user_id)
    .bind(track_id)
    .execute(&state.db)
    .await
    .map_err(|e| AppError::internal(format!("Failed to like track: {e}")))?;

    if result.rows_affected() > 0 {
        sqlx::query("UPDATE music_tracks SET likes = likes + 1 WHERE id = $1")
            .bind(track_id)
            .execute(&state.db)
            .await
            .map_err(|e| AppError::internal(format!("Failed to update like count: {e}")))?;
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_playlists(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Playlist>>, AppError> {
    let sql = format!(
        r#"
        SELECT {PLAYLIST_SELECT}
        FROM playlists p
        LEFT JOIN users u ON p.owner_id = u.id
        WHERE p.is_public = true
        ORDER BY p.is_global DESC, p.created_at DESC
        "#
    );

    let playlists = sqlx::query_as::<_, Playlist>(&sql)
        .fetch_all(&state.db)
        .await
        .map_err(|e| AppError::internal(format!("Failed to list playlists: {e}")))?;

    Ok(Json(playlists))
}

pub async fn get_global_playlist(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<MusicTrack>>, AppError> {
    let sql = format!(
        r#"
        SELECT {TRACK_SELECT}
        FROM music_tracks t
        INNER JOIN playlist_tracks pt ON t.id = pt.track_id
        LEFT JOIN users u ON t.uploader_id = u.id
        WHERE pt.playlist_id = '00000000-0000-0000-0000-000000000001'
        ORDER BY pt.position ASC
        "#
    );

    let tracks = sqlx::query_as::<_, MusicTrack>(&sql)
        .fetch_all(&state.db)
        .await
        .map_err(|e| AppError::internal(format!("Failed to get global playlist: {e}")))?;

    Ok(Json(tracks))
}

pub async fn get_playlist_tracks(
    State(state): State<Arc<AppState>>,
    Path(playlist_id): Path<Uuid>,
) -> Result<Json<Vec<MusicTrack>>, AppError> {
    let sql = format!(
        r#"
        SELECT {TRACK_SELECT}
        FROM music_tracks t
        INNER JOIN playlist_tracks pt ON t.id = pt.track_id
        LEFT JOIN users u ON t.uploader_id = u.id
        WHERE pt.playlist_id = $1
        ORDER BY pt.position ASC
        "#
    );

    let tracks = sqlx::query_as::<_, MusicTrack>(&sql)
        .bind(playlist_id)
        .fetch_all(&state.db)
        .await
        .map_err(|e| AppError::internal(format!("Failed to get playlist tracks: {e}")))?;

    Ok(Json(tracks))
}

pub async fn create_playlist(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<Uuid>,
    Json(req): Json<CreatePlaylistRequest>,
) -> Result<Json<Playlist>, AppError> {
    let is_public = req.is_public.unwrap_or(true);

    let playlist = sqlx::query_as::<_, Playlist>(
        r#"
        INSERT INTO playlists (name, description, owner_id, is_public)
        VALUES ($1, $2, $3, $4)
        RETURNING
            id,
            name,
            description,
            owner_id,
            NULL::text AS owner_qor_id,
            is_global,
            is_public,
            cover_url,
            0::bigint AS track_count,
            created_at
        "#,
    )
    .bind(&req.name)
    .bind(&req.description)
    .bind(user_id)
    .bind(is_public)
    .fetch_one(&state.db)
    .await
    .map_err(|e| AppError::internal(format!("Failed to create playlist: {e}")))?;

    Ok(Json(playlist))
}

pub async fn add_to_playlist(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<Uuid>,
    Path(playlist_id): Path<Uuid>,
    Json(req): Json<AddToPlaylistRequest>,
) -> Result<StatusCode, AppError> {
    let playlist = sqlx::query_as::<_, (Option<Uuid>, bool)>(
        "SELECT owner_id, is_global FROM playlists WHERE id = $1",
    )
    .bind(playlist_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| AppError::internal(format!("Failed to check playlist: {e}")))?
    .ok_or_else(|| AppError::not_found("Playlist not found"))?;

    let (owner_id, is_global) = playlist;

    if !is_global && owner_id != Some(user_id) {
        return Err(AppError::forbidden("Not authorized to modify this playlist"));
    }

    let position = if let Some(pos) = req.position {
        pos
    } else {
        let max_pos: Option<i32> = sqlx::query_scalar(
            "SELECT MAX(position) FROM playlist_tracks WHERE playlist_id = $1",
        )
        .bind(playlist_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| AppError::internal(format!("Failed to get max position: {e}")))?;

        max_pos.unwrap_or(0) + 1
    };

    sqlx::query(
        r#"
        INSERT INTO playlist_tracks (playlist_id, track_id, position)
        VALUES ($1, $2, $3)
        ON CONFLICT (playlist_id, track_id) DO UPDATE SET position = $3
        "#,
    )
    .bind(playlist_id)
    .bind(req.track_id)
    .bind(position)
    .execute(&state.db)
    .await
    .map_err(|e| AppError::internal(format!("Failed to add track to playlist: {e}")))?;

    Ok(StatusCode::CREATED)
}

pub async fn remove_from_playlist(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<Uuid>,
    Path((playlist_id, track_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, AppError> {
    let playlist = sqlx::query_as::<_, (Option<Uuid>, bool)>(
        "SELECT owner_id, is_global FROM playlists WHERE id = $1",
    )
    .bind(playlist_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| AppError::internal(format!("Failed to check playlist: {e}")))?
    .ok_or_else(|| AppError::not_found("Playlist not found"))?;

    let (owner_id, is_global) = playlist;

    if !is_global && owner_id != Some(user_id) {
        return Err(AppError::forbidden("Not authorized to modify this playlist"));
    }

    sqlx::query("DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2")
        .bind(playlist_id)
        .bind(track_id)
        .execute(&state.db)
        .await
        .map_err(|e| AppError::internal(format!("Failed to remove track: {e}")))?;

    Ok(StatusCode::NO_CONTENT)
}
