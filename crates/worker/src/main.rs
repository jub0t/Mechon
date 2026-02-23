mod config;
mod logs;
mod metrics;
mod resources;
mod runner;

use anyhow::Context;
use mechon_redis::commands::{StartBotCmd, WorkerCommand};
use runner::{new_registry, BotRegistry};
use sqlx::postgres::PgPoolOptions;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "mechon_worker=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let cfg = config::WorkerConfig::load().context("Failed to load worker config")?;

    // Database
    let db = PgPoolOptions::new()
        .max_connections(cfg.database.max_connections)
        .connect(&cfg.database.url)
        .await
        .context("Failed to connect to Postgres")?;

    // Redis connection manager (multiplexed, auto-reconnects)
    let redis_client = redis::Client::open(cfg.redis.url.as_str())
        .context("Invalid Redis URL")?;
    let mut redis_conn = redis::aio::ConnectionManager::new(redis_client.clone())
        .await
        .context("Failed to connect to Redis")?;

    let bot_registry = new_registry();
    let worker_id = register_worker(&db, &cfg).await?;

    tracing::info!(%worker_id, "Worker registered and online");

    // Spawn heartbeat task
    {
        let db = db.clone();
        let worker_id = worker_id;
        let interval = cfg.worker.heartbeat_interval_secs;
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(std::time::Duration::from_secs(interval)).await;
                let _ = sqlx::query(
                    "UPDATE worker_nodes SET last_heartbeat = NOW() WHERE id = $1",
                )
                .bind(worker_id)
                .execute(&db)
                .await;
                tracing::debug!(%worker_id, "Heartbeat sent");
            }
        });
    }

    // Spawn metrics collection task
    {
        let registry = bot_registry.clone();
        let db = db.clone();
        let redis = redis_conn.clone();
        let interval = cfg.worker.metrics_interval_secs;
        tokio::spawn(async move {
            let mut resources = resources::SystemResources::new();
            let mut conn = redis;
            loop {
                tokio::time::sleep(std::time::Duration::from_secs(interval)).await;
                metrics::collect_and_publish(&registry, &mut resources, &mut conn, &db).await;
            }
        });
    }

    // Subscribe to this worker's command channel
    let channel = mechon_redis::worker_cmd_channel(worker_id);
    let mut pubsub = redis_client
        .get_async_pubsub()
        .await
        .context("Failed to create Redis pubsub connection")?;
    pubsub.subscribe(&channel).await?;

    tracing::info!(%channel, "Subscribed to command channel");

    let mut stream = pubsub.on_message();

    loop {
        use futures_util::StreamExt;
        let Some(msg) = stream.next().await else { break };

        let payload: String = msg.get_payload().unwrap_or_default();
        match serde_json::from_str::<WorkerCommand>(&payload) {
            Ok(cmd) => {
                handle_command(cmd, &bot_registry, &cfg, &db, &mut redis_conn).await;
            }
            Err(e) => {
                tracing::warn!(error = %e, %payload, "Failed to deserialize worker command");
            }
        }
    }

    // Graceful shutdown: mark worker offline
    sqlx::query("UPDATE worker_nodes SET status = 'offline'::worker_status WHERE id = $1")
        .bind(worker_id)
        .execute(&db)
        .await?;

    Ok(())
}

async fn handle_command(
    cmd: WorkerCommand,
    registry: &BotRegistry,
    cfg: &config::WorkerConfig,
    db: &sqlx::PgPool,
    redis_conn: &mut redis::aio::ConnectionManager,
) {
    match cmd {
        WorkerCommand::StartBot(start) => {
            let bot_id = start.bot_id;
            tracing::info!(%bot_id, "Starting bot");

            if let Err(e) = start_bot(start, registry, cfg, db, redis_conn).await {
                tracing::error!(%bot_id, error = %e, "Failed to start bot");
                let _ = sqlx::query(
                    "UPDATE bots SET status = 'error'::bot_status, updated_at = NOW() WHERE id = $1",
                )
                .bind(bot_id)
                .execute(db)
                .await;
            }
        }
        WorkerCommand::StopBot(stop) => {
            let bot_id = stop.bot_id;
            tracing::info!(%bot_id, "Stopping bot");

            if let Err(e) = runner::stop_bot(bot_id, registry).await {
                tracing::warn!(%bot_id, error = %e, "Stop bot error (may already be stopped)");
            }

            let _ = sqlx::query(
                "UPDATE bots SET status = 'stopped'::bot_status, worker_id = NULL, updated_at = NOW() WHERE id = $1",
            )
            .bind(bot_id)
            .execute(db)
            .await;
        }
        WorkerCommand::RestartBot(stop) => {
            let bot_id = stop.bot_id;
            tracing::info!(%bot_id, "Restarting bot — stop phase");

            if let Err(e) = runner::stop_bot(bot_id, registry).await {
                tracing::warn!(%bot_id, error = %e, "Restart stop phase: {}", e);
            }
            // Start phase requires the full StartBotCmd — scheduler must send a fresh StartBot
            // after the stop is acknowledged. This RestartBot command only does the stop.
            let _ = sqlx::query(
                "UPDATE bots SET status = 'stopped'::bot_status, updated_at = NOW() WHERE id = $1",
            )
            .bind(bot_id)
            .execute(db)
            .await;
        }
    }
}

async fn start_bot(
    cmd: StartBotCmd,
    registry: &BotRegistry,
    cfg: &config::WorkerConfig,
    db: &sqlx::PgPool,
    redis_conn: &mut redis::aio::ConnectionManager,
) -> anyhow::Result<()> {
    let bot_id = cmd.bot_id;

    // Fetch and extract the archive
    let archive_bytes = fetch_archive(&cmd.archive_key, cfg).await?;
    let work_dir = runner::bot_work_dir(cfg, bot_id);
    runner::extract_archive(&archive_bytes, &work_dir).await?;

    // Spawn the process
    let pid = runner::spawn_bot(&cmd, cfg, registry).await?;

    tracing::info!(%bot_id, pid, "Bot process spawned");

    // Attach log capture
    {
        let mut reg = registry.lock().await;
        if let Some(bot) = reg.get_mut(&bot_id) {
            if let (Some(stdout), Some(stderr)) =
                (bot.child.stdout.take(), bot.child.stderr.take())
            {
                logs::attach_log_capture(
                    bot_id,
                    stdout,
                    stderr,
                    redis_conn.clone(),
                    db.clone(),
                );
            }
        }
    }

    // Update DB status
    sqlx::query(
        "UPDATE bots SET status = 'running'::bot_status, updated_at = NOW() WHERE id = $1",
    )
    .bind(bot_id)
    .execute(db)
    .await?;

    Ok(())
}

async fn fetch_archive(key: &str, cfg: &config::WorkerConfig) -> anyhow::Result<Vec<u8>> {
    if cfg.storage.driver == "s3" {
        let s3_cfg = aws_config::defaults(aws_config::BehaviorVersion::latest())
            .endpoint_url(cfg.storage.endpoint.as_deref().unwrap_or_default())
            .region(aws_config::Region::new(
                cfg.storage.region.clone().unwrap_or_else(|| "us-east-1".into()),
            ))
            .load()
            .await;

        let client = aws_sdk_s3::Client::new(&s3_cfg);
        let bucket = cfg.storage.bucket.as_deref().unwrap_or("mechon-artifacts");

        let resp = client
            .get_object()
            .bucket(bucket)
            .key(key)
            .send()
            .await?;

        let bytes = resp.body.collect().await?.into_bytes();
        Ok(bytes.to_vec())
    } else {
        let base = cfg.storage.local_path.as_deref().unwrap_or("/var/mechon/artifacts");
        let path = std::path::Path::new(base).join(key);
        Ok(tokio::fs::read(&path).await?)
    }
}

async fn register_worker(
    db: &sqlx::PgPool,
    _cfg: &config::WorkerConfig,
) -> anyhow::Result<Uuid> {
    let mut resources = resources::SystemResources::new();
    resources.refresh();

    let hostname = hostname::get()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let ip = local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .unwrap_or_else(|_| "unknown".into());

    let total_ram = resources.total_ram_mb();
    let cpu_cores = resources.cpu_cores();

    let id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO worker_nodes (id, hostname, ip_address, total_ram_mb, total_cpu_cores, status, last_heartbeat)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'online'::worker_status, NOW())
           RETURNING id"#,
    )
    .bind(&hostname)
    .bind(&ip)
    .bind(total_ram)
    .bind(cpu_cores)
    .fetch_one(db)
    .await?;

    Ok(id)
}
