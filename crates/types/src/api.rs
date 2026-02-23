/// API request/response shapes shared between server and CLI.
/// All types derive both Serialize and Deserialize — the server uses one
/// direction, the CLI uses the other.
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{AdminLimits, Bot, BotLog, BotMetrics, BotRuntime, BotVersion, User, WorkerNode};

// ============================================================
// SETUP (first run)
// ============================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct SetupRequest {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SetupStatus {
    pub configured: bool,
}

// ============================================================
// AUTH
// ============================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    /// Email or username
    pub identifier: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserInfo,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub role: crate::UserRole,
    pub parent_id: Option<Uuid>,
}

impl From<User> for UserInfo {
    fn from(u: User) -> Self {
        UserInfo {
            id: u.id,
            email: u.email,
            username: u.username,
            role: u.role,
            parent_id: u.parent_id,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateApiKeyRequest {
    pub name: String,
    pub expires_at: Option<DateTime<Utc>>,
}

/// Returned once on creation — the raw key is never stored, only the hash.
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateApiKeyResponse {
    pub id: Uuid,
    pub name: String,
    /// Show this to the user exactly once.
    pub key: String,
    pub created_at: DateTime<Utc>,
}

// ============================================================
// OWNER → ADMIN MANAGEMENT
// ============================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateAdminRequest {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SetAdminLimitsRequest {
    pub max_users: Option<i32>,
    pub total_ram_mb: Option<i64>,
    pub total_cpu_pct: Option<f32>,
    pub total_disk_mb: Option<i64>,
    pub total_bots: Option<i32>,
    pub max_ram_per_user_mb: Option<i64>,
    pub max_cpu_per_user_pct: Option<f32>,
    pub max_bots_per_user: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AdminLimitsResponse {
    pub limits: AdminLimits,
    /// Resources already allocated to users under this admin
    pub allocated: AllocatedResources,
    /// limits - allocated
    pub remaining: AllocatedResources,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AllocatedResources {
    pub ram_mb: i64,
    pub cpu_pct: f32,
    pub disk_mb: i64,
    pub bots: i32,
    pub users: i32,
}

// ============================================================
// ADMIN → USER MANAGEMENT
// ============================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SetUserLimitsRequest {
    pub max_bots: Option<i32>,
    pub max_ram_mb: Option<i64>,
    pub max_ram_per_bot_mb: Option<i64>,
    pub max_cpu_pct: Option<f32>,
    pub max_cpu_per_bot_pct: Option<f32>,
    pub max_disk_mb: Option<i64>,
}

// ============================================================
// BOTS
// ============================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBotRequest {
    pub name: String,
    /// Raw Discord bot token (encrypted server-side before storage)
    pub token: String,
    pub runtime: BotRuntime,
    pub entrypoint: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateBotRequest {
    pub name: Option<String>,
    pub entrypoint: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BotResponse {
    #[serde(flatten)]
    pub bot: Bot,
    pub active_version: Option<BotVersion>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogsResponse {
    pub logs: Vec<BotLog>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MetricsResponse {
    pub metrics: Vec<BotMetrics>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VersionsResponse {
    pub versions: Vec<BotVersion>,
}

// ============================================================
// PLATFORM CONFIG
// ============================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigEntry {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SetConfigRequest {
    pub value: String,
}

// ============================================================
// WORKERS (internal/admin view)
// ============================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkersResponse {
    pub workers: Vec<WorkerNode>,
}
