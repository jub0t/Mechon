use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BotStatus {
    Stopped,
    Starting,
    Running,
    Stopping,
    Error,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BotRuntime {
    Node,
    Bun,
    Deno,
}

impl BotRuntime {
    /// Returns the executable name for this runtime
    pub fn executable(&self) -> &'static str {
        match self {
            BotRuntime::Node => "node",
            BotRuntime::Bun => "bun",
            BotRuntime::Deno => "deno",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bot {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub status: BotStatus,
    /// Which worker node is currently running this bot (null when stopped)
    pub worker_id: Option<Uuid>,
    pub entrypoint: String,
    pub runtime: BotRuntime,
    pub active_version_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BotVersion {
    pub id: Uuid,
    pub bot_id: Uuid,
    pub version: i32,
    /// Object key in MinIO/S3, or relative path for local storage
    pub archive_key: String,
    pub entrypoint: String,
    pub uploaded_at: DateTime<Utc>,
    pub deployed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BotMetrics {
    pub bot_id: Uuid,
    pub cpu_pct: f32,
    pub ram_mb: i64,
    pub recorded_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BotLog {
    pub bot_id: Uuid,
    pub stream: LogStream,
    pub message: String,
    pub recorded_at: DateTime<Utc>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LogStream {
    Stdout,
    Stderr,
}
