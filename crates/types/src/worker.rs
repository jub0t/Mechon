use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WorkerStatus {
    Online,
    Offline,
    Draining,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerNode {
    pub id: Uuid,
    pub hostname: String,
    pub ip_address: String,
    pub total_ram_mb: i64,
    pub total_cpu_cores: i32,
    /// Sum of maxRamPerBot for all running bots on this node
    pub allocated_ram_mb: i64,
    /// Sum of maxCpuPerBot for all running bots on this node
    pub allocated_cpu_pct: f32,
    pub status: WorkerStatus,
    pub last_heartbeat: DateTime<Utc>,
}

impl WorkerNode {
    pub fn available_ram_mb(&self) -> i64 {
        self.total_ram_mb - self.allocated_ram_mb
    }

    pub fn available_cpu_pct(&self) -> f32 {
        (self.total_cpu_cores as f32 * 100.0) - self.allocated_cpu_pct
    }

    pub fn can_fit(&self, ram_mb: i64, cpu_pct: f32) -> bool {
        self.status == WorkerStatus::Online
            && self.available_ram_mb() >= ram_mb
            && self.available_cpu_pct() >= cpu_pct
    }
}
