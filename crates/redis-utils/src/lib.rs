/// Canonical Redis channel and key names used by both server and worker.
/// Keeping these in a shared crate prevents string typos across services.
use uuid::Uuid;

// ============================================================
// WORKER COMMAND CHANNELS
// Each worker subscribes to its own command channel.
// The scheduler publishes to these.
// ============================================================

/// Channel the scheduler publishes bot commands onto for a specific worker.
/// Worker subscribes on startup.
pub fn worker_cmd_channel(worker_id: Uuid) -> String {
    format!("worker:{}:cmds", worker_id)
}

// ============================================================
// BOT LOG CHANNELS
// Worker publishes; API streams to client via SSE.
// ============================================================

pub fn bot_logs_channel(bot_id: Uuid) -> String {
    format!("bot:{}:logs", bot_id)
}

// ============================================================
// BOT METRICS CHANNELS
// Worker publishes samples; server aggregates and persists.
// ============================================================

pub fn bot_metrics_channel(bot_id: Uuid) -> String {
    format!("bot:{}:metrics", bot_id)
}

// ============================================================
// DISTRIBUTED LOCKS
// Prevents race conditions when multiple API nodes handle requests.
// ============================================================

/// Lock key for starting/stopping a bot. TTL should be short (e.g. 30s).
pub fn bot_lock_key(bot_id: Uuid) -> String {
    format!("lock:bot:{}", bot_id)
}

// ============================================================
// WORKER HEARTBEAT KEYS
// Worker writes these; API scheduler reads to detect offline workers.
// ============================================================

pub fn worker_heartbeat_key(worker_id: Uuid) -> String {
    format!("worker:{}:heartbeat", worker_id)
}

// ============================================================
// COMMAND PAYLOADS
// JSON-serializable structs published over command channels.
// Defined here so both server and worker share the exact shape.
// ============================================================

pub mod commands {
    use serde::{Deserialize, Serialize};
    use uuid::Uuid;

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(tag = "type", rename_all = "snake_case")]
    pub enum WorkerCommand {
        StartBot(StartBotCmd),
        StopBot(StopBotCmd),
        RestartBot(StopBotCmd),
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct StartBotCmd {
        pub bot_id: Uuid,
        pub version_id: Uuid,
        pub archive_key: String,
        pub entrypoint: String,
        pub runtime: String,
        pub encrypted_token: String,
        pub ram_limit_mb: i64,
        pub cpu_limit_pct: f32,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct StopBotCmd {
        pub bot_id: Uuid,
    }

    /// Metric sample published by worker on bot_metrics_channel.
    #[derive(Debug, Serialize, Deserialize)]
    pub struct MetricSample {
        pub bot_id: Uuid,
        pub cpu_pct: f32,
        pub ram_mb: i64,
    }

    /// Log line published by worker on bot_logs_channel.
    #[derive(Debug, Serialize, Deserialize)]
    pub struct LogLine {
        pub bot_id: Uuid,
        pub stream: String, // "stdout" | "stderr"
        pub message: String,
    }
}
