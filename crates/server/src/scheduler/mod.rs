/// Bot placement: picks the best worker node and publishes the command via Redis.
use mechon_redis::commands::{StartBotCmd, StopBotCmd, WorkerCommand};
use mechon_types::Bot;
use uuid::Uuid;

use crate::{
    bots::decrypt_token,
    error::{AppError, Result},
    state::AppState,
};

pub async fn schedule_start(state: &AppState, bot: &Bot, user_id: Uuid) -> Result<()> {
    // Load the active version
    #[derive(sqlx::FromRow)]
    struct VersionRow {
        id: Uuid,
        archive_key: String,
        entrypoint: String,
    }

    let version = sqlx::query_as::<_, VersionRow>(
        "SELECT id, archive_key, entrypoint FROM bot_versions WHERE id = $1",
    )
    .bind(bot.active_version_id.unwrap()) // caller validates this is Some
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    // Load user's per-bot resource limits
    #[derive(sqlx::FromRow)]
    struct LimitsRow {
        max_ram_per_bot_mb: i64,
        max_cpu_per_bot_pct: f32,
    }

    let limits = sqlx::query_as::<_, LimitsRow>(
        "SELECT max_ram_per_bot_mb, max_cpu_per_bot_pct FROM user_limits WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::BadRequest("User limits not configured".into()))?;

    // Pick a worker with enough headroom
    let worker_id = pick_worker(state, limits.max_ram_per_bot_mb, limits.max_cpu_per_bot_pct).await?;

    // Acquire distributed lock to prevent double-start
    let lock_key = mechon_redis::bot_lock_key(bot.id);
    let mut conn = state.redis.get().await.map_err(|e| AppError::Internal(e.into()))?;
    let acquired: bool = redis::cmd("SET")
        .arg(&lock_key)
        .arg("1")
        .arg("NX")
        .arg("EX")
        .arg(30u64) // 30-second TTL
        .query_async(&mut conn)
        .await
        .map_err(|e| AppError::Internal(e.into()))?;

    if !acquired {
        return Err(AppError::Conflict("Bot start already in progress".into()));
    }

    // Update bot status and worker assignment
    sqlx::query(
        "UPDATE bots SET status = 'starting'::bot_status, worker_id = $1, updated_at = NOW() WHERE id = $2",
    )
    .bind(worker_id)
    .bind(bot.id)
    .execute(&state.db)
    .await?;

    // Reserve resources on the worker node
    sqlx::query(
        "UPDATE worker_nodes SET allocated_ram_mb = allocated_ram_mb + $1, allocated_cpu_pct = allocated_cpu_pct + $2 WHERE id = $3",
    )
    .bind(limits.max_ram_per_bot_mb)
    .bind(limits.max_cpu_per_bot_pct)
    .bind(worker_id)
    .execute(&state.db)
    .await?;

    let token = decrypt_token(
        &fetch_encrypted_token(state, bot.id).await?,
        &state.config.server.secret_key,
    )
    .map_err(|e| AppError::Internal(e))?;

    let cmd = WorkerCommand::StartBot(StartBotCmd {
        bot_id: bot.id,
        version_id: version.id,
        archive_key: version.archive_key,
        entrypoint: version.entrypoint,
        runtime: bot.runtime.executable().into(),
        encrypted_token: token,
        ram_limit_mb: limits.max_ram_per_bot_mb,
        cpu_limit_pct: limits.max_cpu_per_bot_pct,
    });

    publish_command(state, worker_id, &cmd).await?;

    Ok(())
}

pub async fn schedule_stop(state: &AppState, bot: &Bot) -> Result<()> {
    let worker_id = bot.worker_id.ok_or_else(|| AppError::BadRequest("Bot has no worker assigned".into()))?;

    sqlx::query(
        "UPDATE bots SET status = 'stopping'::bot_status, updated_at = NOW() WHERE id = $1",
    )
    .bind(bot.id)
    .execute(&state.db)
    .await?;

    let cmd = WorkerCommand::StopBot(StopBotCmd { bot_id: bot.id });
    publish_command(state, worker_id, &cmd).await?;

    Ok(())
}

pub async fn schedule_restart(state: &AppState, bot: &Bot) -> Result<()> {
    let worker_id = bot.worker_id.ok_or_else(|| AppError::BadRequest("Bot has no worker assigned".into()))?;

    let cmd = WorkerCommand::RestartBot(StopBotCmd { bot_id: bot.id });
    publish_command(state, worker_id, &cmd).await?;

    Ok(())
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

/// Greedy placement: pick the online worker with the most available RAM.
async fn pick_worker(state: &AppState, ram_mb: i64, cpu_pct: f32) -> Result<Uuid> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
    }

    let row = sqlx::query_as::<_, Row>(
        r#"SELECT id FROM worker_nodes
           WHERE status = 'online'
             AND (total_ram_mb - allocated_ram_mb) >= $1
             AND ((total_cpu_cores::real * 100.0) - allocated_cpu_pct) >= $2
           ORDER BY (total_ram_mb - allocated_ram_mb) DESC
           LIMIT 1"#,
    )
    .bind(ram_mb)
    .bind(cpu_pct)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::LimitExceeded("No worker nodes have sufficient capacity".into()))?;

    Ok(row.id)
}

async fn publish_command(state: &AppState, worker_id: Uuid, cmd: &WorkerCommand) -> Result<()> {
    let channel = mechon_redis::worker_cmd_channel(worker_id);
    let payload = serde_json::to_string(cmd).map_err(|e| AppError::Internal(e.into()))?;

    let mut conn = state.redis.get().await.map_err(|e| AppError::Internal(e.into()))?;
    redis::cmd("PUBLISH")
        .arg(&channel)
        .arg(&payload)
        .query_async::<_, ()>(&mut conn)
        .await
        .map_err(|e| AppError::Internal(e.into()))?;

    Ok(())
}

async fn fetch_encrypted_token(state: &AppState, bot_id: Uuid) -> Result<String> {
    sqlx::query_scalar("SELECT encrypted_token FROM bots WHERE id = $1")
        .bind(bot_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::NotFound)
}
