/// Persists the CLI's auth state to ~/.mechon/config.json
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct CliConfig {
    /// Base URL of the Mechon server (e.g. https://mechon.example.com)
    pub host: Option<String>,
    /// JWT from the last successful login
    pub token: Option<String>,
}

fn config_path() -> Result<PathBuf> {
    let home = dirs::home_dir().context("Cannot find home directory")?;
    Ok(home.join(".mechon").join("config.json"))
}

pub fn load() -> Result<CliConfig> {
    let path = config_path()?;
    if !path.exists() {
        return Ok(CliConfig::default());
    }
    let contents = std::fs::read_to_string(&path)
        .with_context(|| format!("Failed to read {:?}", path))?;
    serde_json::from_str(&contents).context("Failed to parse CLI config")
}

pub fn save(cfg: &CliConfig) -> Result<()> {
    let path = config_path()?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let contents = serde_json::to_string_pretty(cfg)?;
    std::fs::write(&path, contents)
        .with_context(|| format!("Failed to write {:?}", path))
}

pub fn clear() -> Result<()> {
    save(&CliConfig::default())
}
