use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    Owner,
    Admin,
    User,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: UserRole,
    /// null for owner/admins; admin's id for users
    pub parent_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Resource pool granted by the server owner to an admin account.
/// The admin distributes slices of this pool to their users.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdminLimits {
    pub user_id: Uuid,
    /// Maximum number of user accounts this admin can create
    pub max_users: i32,
    /// Total RAM (MB) the admin can distribute across all their users
    pub total_ram_mb: i64,
    /// Total CPU (%) the admin can distribute across all their users
    pub total_cpu_pct: f32,
    /// Total disk (MB) the admin can distribute
    pub total_disk_mb: i64,
    /// Total number of bots across all their users
    pub total_bots: i32,
    /// Ceiling: max RAM any single user under this admin may receive
    pub max_ram_per_user_mb: i64,
    /// Ceiling: max CPU any single user under this admin may receive
    pub max_cpu_per_user_pct: f32,
    /// Ceiling: max bots any single user under this admin may receive
    pub max_bots_per_user: i32,
}

/// Resource limits set by an admin for a user account.
/// Must not exceed the admin's remaining pool allocation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserLimits {
    pub user_id: Uuid,
    pub max_bots: i32,
    /// Total RAM (MB) this user can consume across all their bots
    pub max_ram_mb: i64,
    /// Max RAM per individual bot
    pub max_ram_per_bot_mb: i64,
    /// Total CPU (%) across all bots
    pub max_cpu_pct: f32,
    /// Max CPU per individual bot
    pub max_cpu_per_bot_pct: f32,
    pub max_disk_mb: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKey {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub last_used_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}
