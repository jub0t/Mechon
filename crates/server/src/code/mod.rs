use axum::{
    body::Bytes,
    extract::{Multipart, Path, State},
    Json,
};
use chrono::Utc;
use uuid::Uuid;
use mechon_types::{BotVersion, api::*};

use crate::{
    auth::AuthUser,
    error::{AppError, Result},
    state::AppState,
};

pub async fn deploy(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(bot_id): Path<Uuid>,
    mut multipart: Multipart,
) -> Result<Json<BotVersion>> {
    ensure_owns_bot(&state, bot_id, auth.id).await?;

    // Extract archive bytes and optional entrypoint override from multipart
    let mut archive_bytes: Option<Bytes> = None;
    let mut entrypoint_override: Option<String> = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::BadRequest(e.to_string()))? {
        match field.name() {
            Some("archive") => {
                archive_bytes = Some(field.bytes().await.map_err(|e| AppError::BadRequest(e.to_string()))?);
            }
            Some("entrypoint") => {
                let text = field.text().await.map_err(|e| AppError::BadRequest(e.to_string()))?;
                entrypoint_override = Some(text);
            }
            _ => {}
        }
    }

    let bytes = archive_bytes.ok_or_else(|| AppError::BadRequest("Missing 'archive' field".into()))?;

    if bytes.is_empty() {
        return Err(AppError::BadRequest("Archive is empty".into()));
    }

    // Determine next version number
    let next_version: i32 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(version), 0) + 1 FROM bot_versions WHERE bot_id = $1",
    )
    .bind(bot_id)
    .fetch_one(&state.db)
    .await?;

    // Determine entrypoint
    let current_entrypoint: String =
        sqlx::query_scalar("SELECT entrypoint FROM bots WHERE id = $1")
            .bind(bot_id)
            .fetch_one(&state.db)
            .await?;

    let entrypoint = entrypoint_override.unwrap_or(current_entrypoint);

    // Store the archive
    let archive_key = store_archive(&state, bot_id, next_version, &bytes).await?;

    let version_id = Uuid::new_v4();
    let now = Utc::now();

    sqlx::query(
        "INSERT INTO bot_versions (id, bot_id, version, archive_key, entrypoint, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(version_id)
    .bind(bot_id)
    .bind(next_version)
    .bind(&archive_key)
    .bind(&entrypoint)
    .bind(now)
    .execute(&state.db)
    .await?;

    // Auto-activate as the new active version
    sqlx::query(
        "UPDATE bots SET active_version_id = $1, entrypoint = $2, updated_at = NOW() WHERE id = $3",
    )
    .bind(version_id)
    .bind(&entrypoint)
    .bind(bot_id)
    .execute(&state.db)
    .await?;

    Ok(Json(BotVersion {
        id: version_id,
        bot_id,
        version: next_version,
        archive_key,
        entrypoint,
        uploaded_at: now,
        deployed_at: None,
    }))
}

pub async fn list_versions(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(bot_id): Path<Uuid>,
) -> Result<Json<VersionsResponse>> {
    ensure_owns_bot(&state, bot_id, auth.id).await?;

    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        version: i32,
        archive_key: String,
        entrypoint: String,
        uploaded_at: chrono::DateTime<Utc>,
        deployed_at: Option<chrono::DateTime<Utc>>,
    }

    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, version, archive_key, entrypoint, uploaded_at, deployed_at
         FROM bot_versions WHERE bot_id = $1 ORDER BY version DESC",
    )
    .bind(bot_id)
    .fetch_all(&state.db)
    .await?;

    let versions = rows
        .into_iter()
        .map(|r| BotVersion {
            id: r.id,
            bot_id,
            version: r.version,
            archive_key: r.archive_key,
            entrypoint: r.entrypoint,
            uploaded_at: r.uploaded_at,
            deployed_at: r.deployed_at,
        })
        .collect();

    Ok(Json(VersionsResponse { versions }))
}

pub async fn activate_version(
    auth: AuthUser,
    State(state): State<AppState>,
    Path((bot_id, version)): Path<(Uuid, i32)>,
) -> Result<Json<BotVersion>> {
    ensure_owns_bot(&state, bot_id, auth.id).await?;

    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        archive_key: String,
        entrypoint: String,
        uploaded_at: chrono::DateTime<Utc>,
        deployed_at: Option<chrono::DateTime<Utc>>,
    }

    let row = sqlx::query_as::<_, Row>(
        "SELECT id, archive_key, entrypoint, uploaded_at, deployed_at
         FROM bot_versions WHERE bot_id = $1 AND version = $2",
    )
    .bind(bot_id)
    .bind(version)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    // Check bot is stopped before switching active version
    let status: String =
        sqlx::query_scalar("SELECT status::text FROM bots WHERE id = $1")
            .bind(bot_id)
            .fetch_one(&state.db)
            .await?;

    if status != "stopped" && status != "error" {
        return Err(AppError::BadRequest("Stop the bot before activating a different version".into()));
    }

    sqlx::query(
        "UPDATE bots SET active_version_id = $1, entrypoint = $2, updated_at = NOW() WHERE id = $3",
    )
    .bind(row.id)
    .bind(&row.entrypoint)
    .bind(bot_id)
    .execute(&state.db)
    .await?;

    sqlx::query("UPDATE bot_versions SET deployed_at = NOW() WHERE id = $1")
        .bind(row.id)
        .execute(&state.db)
        .await?;

    Ok(Json(BotVersion {
        id: row.id,
        bot_id,
        version,
        archive_key: row.archive_key,
        entrypoint: row.entrypoint,
        uploaded_at: row.uploaded_at,
        deployed_at: Some(Utc::now()),
    }))
}

// ============================================================
// STORAGE BACKEND
// ============================================================

async fn store_archive(
    state: &AppState,
    bot_id: Uuid,
    version: i32,
    bytes: &[u8],
) -> Result<String> {
    use crate::config::StorageDriver;

    let key = format!("bots/{}/v{}.zip", bot_id, version);

    match state.config.storage.driver {
        StorageDriver::Local => {
            let base = state
                .config
                .storage
                .local_path
                .as_deref()
                .unwrap_or("/var/mechon/artifacts");

            let path = std::path::Path::new(base).join(&key);
            if let Some(parent) = path.parent() {
                tokio::fs::create_dir_all(parent)
                    .await
                    .map_err(|e| AppError::Internal(e.into()))?;
            }
            tokio::fs::write(&path, bytes)
                .await
                .map_err(|e| AppError::Internal(e.into()))?;
        }
        StorageDriver::S3 => {
            upload_to_s3(state, &key, bytes).await?;
        }
    }

    Ok(key)
}

async fn upload_to_s3(state: &AppState, key: &str, bytes: &[u8]) -> Result<()> {
    use aws_sdk_s3::primitives::ByteStream;

    let s3_cfg = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .endpoint_url(
            state.config.storage.endpoint.as_deref().unwrap_or_default(),
        )
        .region(aws_config::Region::new(
            state.config.storage.region.clone().unwrap_or_else(|| "us-east-1".into()),
        ))
        .load()
        .await;

    let client = aws_sdk_s3::Client::new(&s3_cfg);
    let bucket = state.config.storage.bucket.as_deref().unwrap_or("mechon-artifacts");

    client
        .put_object()
        .bucket(bucket)
        .key(key)
        .body(ByteStream::from(bytes.to_vec()))
        .send()
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("S3 upload failed: {}", e)))?;

    Ok(())
}

async fn ensure_owns_bot(state: &AppState, bot_id: Uuid, user_id: Uuid) -> Result<()> {
    let owns: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM bots WHERE id = $1 AND user_id = $2)")
            .bind(bot_id)
            .bind(user_id)
            .fetch_one(&state.db)
            .await?;

    if !owns {
        Err(AppError::NotFound)
    } else {
        Ok(())
    }
}
