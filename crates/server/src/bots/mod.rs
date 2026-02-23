use axum::{
    extract::{Path, State},
    Json,
};
use chrono::Utc;
use mechon_types::{BotRuntime, BotStatus, api::*};
use uuid::Uuid;

use crate::{
    auth::AuthUser,
    error::{AppError, Result},
    scheduler,
    state::AppState,
};

// ============================================================
// BOT CRUD
// ============================================================

pub async fn list(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<BotResponse>>> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        name: String,
        status: String,
        worker_id: Option<Uuid>,
        entrypoint: String,
        runtime: String,
        active_version_id: Option<Uuid>,
        created_at: chrono::DateTime<Utc>,
        updated_at: chrono::DateTime<Utc>,
    }

    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, name, status::text AS status, worker_id, entrypoint, runtime::text AS runtime,
                active_version_id, created_at, updated_at
         FROM bots WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(auth.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(
        rows.into_iter()
            .map(|r| BotResponse {
                bot: mechon_types::Bot {
                    id: r.id,
                    user_id: auth.id,
                    name: r.name,
                    status: parse_bot_status(&r.status),
                    worker_id: r.worker_id,
                    entrypoint: r.entrypoint,
                    runtime: parse_bot_runtime(&r.runtime),
                    active_version_id: r.active_version_id,
                    created_at: r.created_at,
                    updated_at: r.updated_at,
                },
                active_version: None, // omitted in list view for performance
            })
            .collect(),
    ))
}

pub async fn get(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(bot_id): Path<Uuid>,
) -> Result<Json<BotResponse>> {
    let bot = fetch_bot(&state, bot_id, auth.id).await?;
    Ok(Json(bot))
}

pub async fn create(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<CreateBotRequest>,
) -> Result<Json<BotResponse>> {
    // Check bot count limit
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM bots WHERE user_id = $1")
        .bind(auth.id)
        .fetch_one(&state.db)
        .await?;

    let max_bots: i32 =
        sqlx::query_scalar("SELECT max_bots FROM user_limits WHERE user_id = $1")
            .bind(auth.id)
            .fetch_optional(&state.db)
            .await?
            .unwrap_or(0);

    if count >= max_bots as i64 {
        return Err(AppError::LimitExceeded(format!(
            "Bot limit reached ({}/{})",
            count, max_bots
        )));
    }

    let encrypted_token = encrypt_token(&body.token, &state.config.server.secret_key)
        .map_err(|e| AppError::Internal(e))?;

    let id = Uuid::new_v4();
    let now = Utc::now();
    let runtime_str = match body.runtime {
        BotRuntime::Node => "node",
        BotRuntime::Bun => "bun",
        BotRuntime::Deno => "deno",
    };

    sqlx::query(
        "INSERT INTO bots (id, user_id, name, encrypted_token, entrypoint, runtime, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6::bot_runtime, $7, $7)",
    )
    .bind(id)
    .bind(auth.id)
    .bind(&body.name)
    .bind(&encrypted_token)
    .bind(&body.entrypoint)
    .bind(runtime_str)
    .bind(now)
    .execute(&state.db)
    .await?;

    fetch_bot(&state, id, auth.id).await.map(Json)
}

pub async fn delete(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(bot_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    // Ensure bot is stopped before deletion
    let status: String =
        sqlx::query_scalar("SELECT status::text FROM bots WHERE id = $1 AND user_id = $2")
            .bind(bot_id)
            .bind(auth.id)
            .fetch_optional(&state.db)
            .await?
            .ok_or(AppError::NotFound)?;

    if status == "running" || status == "starting" {
        return Err(AppError::BadRequest("Stop the bot before deleting it".into()));
    }

    sqlx::query("DELETE FROM bots WHERE id = $1 AND user_id = $2")
        .bind(bot_id)
        .bind(auth.id)
        .execute(&state.db)
        .await?;

    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ============================================================
// BOT LIFECYCLE
// ============================================================

pub async fn start(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(bot_id): Path<Uuid>,
) -> Result<Json<BotResponse>> {
    let bot = fetch_bot(&state, bot_id, auth.id).await?;

    if bot.bot.status != BotStatus::Stopped && bot.bot.status != BotStatus::Error {
        return Err(AppError::BadRequest("Bot is already running or starting".into()));
    }

    if bot.bot.active_version_id.is_none() {
        return Err(AppError::BadRequest("No code deployed — upload code first".into()));
    }

    scheduler::schedule_start(&state, &bot.bot, auth.id).await?;

    fetch_bot(&state, bot_id, auth.id).await.map(Json)
}

pub async fn stop(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(bot_id): Path<Uuid>,
) -> Result<Json<BotResponse>> {
    let bot = fetch_bot(&state, bot_id, auth.id).await?;

    if bot.bot.status == BotStatus::Stopped {
        return Err(AppError::BadRequest("Bot is already stopped".into()));
    }

    scheduler::schedule_stop(&state, &bot.bot).await?;

    fetch_bot(&state, bot_id, auth.id).await.map(Json)
}

pub async fn restart(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(bot_id): Path<Uuid>,
) -> Result<Json<BotResponse>> {
    let bot = fetch_bot(&state, bot_id, auth.id).await?;

    scheduler::schedule_restart(&state, &bot.bot).await?;

    fetch_bot(&state, bot_id, auth.id).await.map(Json)
}

// ============================================================
// LOGS
// ============================================================

pub async fn logs(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(bot_id): Path<Uuid>,
) -> Result<Json<LogsResponse>> {
    ensure_owns_bot(&state, bot_id, auth.id).await?;

    let retention: i64 = sqlx::query_scalar(
        "SELECT value::bigint FROM platform_config WHERE key = 'log_retention_lines'",
    )
    .fetch_optional(&state.db)
    .await?
    .unwrap_or(5000);

    #[derive(sqlx::FromRow)]
    struct Row {
        stream: String,
        message: String,
        recorded_at: chrono::DateTime<Utc>,
    }

    let rows = sqlx::query_as::<_, Row>(
        "SELECT stream, message, recorded_at FROM bot_logs
         WHERE bot_id = $1 ORDER BY recorded_at DESC LIMIT $2",
    )
    .bind(bot_id)
    .bind(retention)
    .fetch_all(&state.db)
    .await?;

    let logs = rows
        .into_iter()
        .map(|r| mechon_types::BotLog {
            bot_id,
            stream: if r.stream == "stdout" {
                mechon_types::LogStream::Stdout
            } else {
                mechon_types::LogStream::Stderr
            },
            message: r.message,
            recorded_at: r.recorded_at,
        })
        .collect();

    Ok(Json(LogsResponse { logs }))
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

async fn fetch_bot(state: &AppState, bot_id: Uuid, user_id: Uuid) -> Result<BotResponse> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        name: String,
        status: String,
        worker_id: Option<Uuid>,
        entrypoint: String,
        runtime: String,
        active_version_id: Option<Uuid>,
        created_at: chrono::DateTime<Utc>,
        updated_at: chrono::DateTime<Utc>,
    }

    let row = sqlx::query_as::<_, Row>(
        "SELECT id, name, status::text AS status, worker_id, entrypoint, runtime::text AS runtime,
                active_version_id, created_at, updated_at
         FROM bots WHERE id = $1 AND user_id = $2",
    )
    .bind(bot_id)
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    let active_version = if let Some(vid) = row.active_version_id {
        fetch_version(state, vid).await?
    } else {
        None
    };

    Ok(BotResponse {
        bot: mechon_types::Bot {
            id: row.id,
            user_id,
            name: row.name,
            status: parse_bot_status(&row.status),
            worker_id: row.worker_id,
            entrypoint: row.entrypoint,
            runtime: parse_bot_runtime(&row.runtime),
            active_version_id: row.active_version_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
        },
        active_version,
    })
}

async fn fetch_version(
    state: &AppState,
    version_id: Uuid,
) -> Result<Option<mechon_types::BotVersion>> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        bot_id: Uuid,
        version: i32,
        archive_key: String,
        entrypoint: String,
        uploaded_at: chrono::DateTime<Utc>,
        deployed_at: Option<chrono::DateTime<Utc>>,
    }

    let row = sqlx::query_as::<_, Row>(
        "SELECT id, bot_id, version, archive_key, entrypoint, uploaded_at, deployed_at FROM bot_versions WHERE id = $1",
    )
    .bind(version_id)
    .fetch_optional(&state.db)
    .await?;

    Ok(row.map(|r| mechon_types::BotVersion {
        id: r.id,
        bot_id: r.bot_id,
        version: r.version,
        archive_key: r.archive_key,
        entrypoint: r.entrypoint,
        uploaded_at: r.uploaded_at,
        deployed_at: r.deployed_at,
    }))
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

fn parse_bot_status(s: &str) -> BotStatus {
    match s {
        "running" => BotStatus::Running,
        "starting" => BotStatus::Starting,
        "stopping" => BotStatus::Stopping,
        "error" => BotStatus::Error,
        _ => BotStatus::Stopped,
    }
}

fn parse_bot_runtime(s: &str) -> BotRuntime {
    match s {
        "bun" => BotRuntime::Bun,
        "deno" => BotRuntime::Deno,
        _ => BotRuntime::Node,
    }
}

/// AES-256-GCM encrypt the bot token using the server's secret key.
fn encrypt_token(token: &str, secret_key: &str) -> anyhow::Result<String> {
    use aes_gcm::{
        aead::{Aead, KeyInit},
        Aes256Gcm, Nonce,
    };
    use rand::RngCore;
    use base64::{engine::general_purpose::STANDARD, Engine};

    // Derive a 32-byte key from the secret (pad/truncate)
    let mut key = [0u8; 32];
    let kb = secret_key.as_bytes();
    let len = kb.len().min(32);
    key[..len].copy_from_slice(&kb[..len]);

    let cipher = Aes256Gcm::new_from_slice(&key)?;

    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, token.as_bytes())
        .map_err(|e| anyhow::anyhow!("Encryption failed: {}", e))?;

    // Store as base64(nonce || ciphertext)
    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ciphertext);
    Ok(STANDARD.encode(combined))
}

/// Decrypt a bot token.
pub fn decrypt_token(encrypted: &str, secret_key: &str) -> anyhow::Result<String> {
    use aes_gcm::{
        aead::{Aead, KeyInit},
        Aes256Gcm, Nonce,
    };
    use base64::{engine::general_purpose::STANDARD, Engine};

    let mut key = [0u8; 32];
    let kb = secret_key.as_bytes();
    let len = kb.len().min(32);
    key[..len].copy_from_slice(&kb[..len]);

    let data = STANDARD.decode(encrypted)?;
    if data.len() < 12 {
        anyhow::bail!("Invalid encrypted token");
    }

    let (nonce_bytes, ciphertext) = data.split_at(12);
    let cipher = Aes256Gcm::new_from_slice(&key)?;
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| anyhow::anyhow!("Decryption failed: {}", e))?;

    Ok(String::from_utf8(plaintext)?)
}
