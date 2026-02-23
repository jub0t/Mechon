/// Bot process lifecycle: spawn, monitor, stop.
use std::{
    collections::HashMap,
    path::PathBuf,
    sync::Arc,
};

use mechon_redis::commands::StartBotCmd;
use tokio::{
    process::Child,
    sync::Mutex,
};
use uuid::Uuid;

use crate::config::WorkerConfig;

/// State tracked for a running bot process.
pub struct RunningBot {
    pub bot_id: Uuid,
    pub child: Child,
    pub ram_limit_mb: i64,
    pub cpu_limit_pct: f32,
}

/// Registry of all bot processes on this worker.
pub type BotRegistry = Arc<Mutex<HashMap<Uuid, RunningBot>>>;

pub fn new_registry() -> BotRegistry {
    Arc::new(Mutex::new(HashMap::new()))
}

/// Spawn a bot process.
///
/// Steps:
///   1. Locate the extracted code directory.
///   2. Spawn `<runtime> <entrypoint>` as a child process.
///   3. Register in the BotRegistry.
pub async fn spawn_bot(
    cmd: &StartBotCmd,
    config: &WorkerConfig,
    registry: &BotRegistry,
) -> anyhow::Result<u32> {
    let bot_dir = bot_work_dir(config, cmd.bot_id);

    if !bot_dir.exists() {
        anyhow::bail!("Bot directory does not exist: {:?}", bot_dir);
    }

    let mut child = tokio::process::Command::new(&cmd.runtime)
        .arg(&cmd.entrypoint)
        .current_dir(&bot_dir)
        .env("DISCORD_TOKEN", &cmd.encrypted_token)
        .env("BOT_ID", cmd.bot_id.to_string())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()?;

    let pid = child.id().ok_or_else(|| anyhow::anyhow!("Failed to get PID"))?;

    let mut reg = registry.lock().await;
    reg.insert(
        cmd.bot_id,
        RunningBot {
            bot_id: cmd.bot_id,
            child,
            ram_limit_mb: cmd.ram_limit_mb,
            cpu_limit_pct: cmd.cpu_limit_pct,
        },
    );

    Ok(pid)
}

/// Send SIGTERM, wait 5 seconds, then SIGKILL if still alive.
pub async fn stop_bot(bot_id: Uuid, registry: &BotRegistry) -> anyhow::Result<()> {
    let mut reg = registry.lock().await;

    let bot = reg.remove(&bot_id).ok_or_else(|| anyhow::anyhow!("Bot {} not in registry", bot_id))?;
    drop(reg); // release lock before awaiting

    graceful_kill(bot).await;

    Ok(())
}

pub async fn restart_bot(
    bot_id: Uuid,
    cmd: &StartBotCmd,
    config: &WorkerConfig,
    registry: &BotRegistry,
) -> anyhow::Result<u32> {
    // Stop existing process if running
    {
        let mut reg = registry.lock().await;
        if let Some(bot) = reg.remove(&bot_id) {
            drop(reg);
            graceful_kill(bot).await;
        }
    }

    spawn_bot(cmd, config, registry).await
}

/// Kill with grace period.
async fn graceful_kill(mut bot: RunningBot) {
    // SIGTERM equivalent on Unix; on Windows we just kill directly
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        if let Some(pid) = bot.child.id() {
            unsafe { libc::kill(pid as i32, libc::SIGTERM) };
        }
    }

    let timeout = tokio::time::timeout(
        std::time::Duration::from_secs(5),
        bot.child.wait(),
    );

    if timeout.await.is_err() {
        // Still alive after grace period — force kill
        let _ = bot.child.kill().await;
    }
}

pub fn bot_work_dir(config: &WorkerConfig, bot_id: Uuid) -> PathBuf {
    PathBuf::from(&config.worker.work_dir).join(bot_id.to_string())
}

/// Extract a zip archive into the bot's working directory.
pub async fn extract_archive(
    archive_bytes: &[u8],
    dest: &PathBuf,
) -> anyhow::Result<()> {
    tokio::fs::create_dir_all(dest).await?;

    let bytes = archive_bytes.to_vec();
    let dest_clone = dest.clone();

    // zip extraction is synchronous; run it on a blocking thread
    tokio::task::spawn_blocking(move || -> anyhow::Result<()> {
        let cursor = std::io::Cursor::new(bytes);
        let mut archive = zip::ZipArchive::new(cursor)?;
        archive.extract(&dest_clone)?;
        Ok(())
    })
    .await??;

    Ok(())
}
