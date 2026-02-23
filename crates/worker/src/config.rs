use anyhow::{Context, Result};
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct WorkerConfig {
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
    pub storage: StorageConfig,
    pub worker: WorkerSettings,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    #[serde(default = "default_max_connections")]
    pub max_connections: u32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct RedisConfig {
    pub url: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct StorageConfig {
    #[serde(default = "default_storage_driver")]
    pub driver: String, // "local" | "s3"
    pub local_path: Option<String>,
    pub endpoint: Option<String>,
    pub bucket: Option<String>,
    pub access_key: Option<String>,
    pub secret_key: Option<String>,
    pub region: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct WorkerSettings {
    /// Directory where bot code is extracted and run
    #[serde(default = "default_work_dir")]
    pub work_dir: String,
    #[serde(default = "default_heartbeat_secs")]
    pub heartbeat_interval_secs: u64,
    #[serde(default = "default_metrics_secs")]
    pub metrics_interval_secs: u64,
}

fn default_max_connections() -> u32 { 5 }
fn default_storage_driver() -> String { "local".into() }
fn default_work_dir() -> String { "/var/mechon/bots".into() }
fn default_heartbeat_secs() -> u64 { 30 }
fn default_metrics_secs() -> u64 { 10 }

impl WorkerConfig {
    pub fn load() -> Result<Self> {
        let cfg = config::Config::builder()
            .add_source(config::File::with_name("worker").required(false))
            .add_source(config::File::with_name("config").required(false))
            .add_source(
                config::Environment::with_prefix("MECHON")
                    .separator("__")
                    .try_parsing(true),
            )
            .build()
            .context("Failed to build worker configuration")?;

        cfg.try_deserialize().context("Failed to deserialize worker configuration")
    }
}
