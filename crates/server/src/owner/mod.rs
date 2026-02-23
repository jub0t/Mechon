/// Owner-only endpoints: manage admin accounts, set admin limits, platform config.
use axum::{
    extract::{Path, State},
    Json,
};
use chrono::Utc;
use mechon_types::{UserRole, api::*, AdminLimits, WorkerNode, WorkerStatus};
use uuid::Uuid;

use crate::{
    auth::{create_user_internal, AuthUser},
    error::{AppError, Result},
    state::AppState,
};

// ============================================================
// ADMIN ACCOUNTS
// ============================================================

pub async fn list_admins(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<UserInfo>>> {
    auth.require_owner()?;

    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        email: String,
        username: String,
        role: String,
        parent_id: Option<Uuid>,
    }

    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, email, username, role::text AS role, parent_id FROM users WHERE role = 'admin' ORDER BY username",
    )
    .fetch_all(&state.db)
    .await?;

    let admins = rows
        .into_iter()
        .map(|r| UserInfo {
            id: r.id,
            email: r.email,
            username: r.username,
            role: UserRole::Admin,
            parent_id: r.parent_id,
        })
        .collect();

    Ok(Json(admins))
}

pub async fn create_admin(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<CreateAdminRequest>,
) -> Result<Json<UserInfo>> {
    auth.require_owner()?;

    let user = create_user_internal(
        &state,
        &body.email,
        &body.username,
        &body.password,
        UserRole::Admin,
        None, // admins have no parent — they answer directly to the owner
    )
    .await?;

    // Insert default (zero) admin limits so the row exists
    sqlx::query(
        "INSERT INTO admin_limits (user_id) VALUES ($1) ON CONFLICT DO NOTHING",
    )
    .bind(user.id)
    .execute(&state.db)
    .await?;

    Ok(user)
}

pub async fn get_admin(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<UserInfo>> {
    auth.require_owner()?;

    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        email: String,
        username: String,
        parent_id: Option<Uuid>,
    }

    let row = sqlx::query_as::<_, Row>(
        "SELECT id, email, username, parent_id FROM users WHERE id = $1 AND role = 'admin'",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(UserInfo {
        id: row.id,
        email: row.email,
        username: row.username,
        role: UserRole::Admin,
        parent_id: row.parent_id,
    }))
}

pub async fn delete_admin(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    auth.require_owner()?;

    let deleted =
        sqlx::query("DELETE FROM users WHERE id = $1 AND role = 'admin'")
            .bind(id)
            .execute(&state.db)
            .await?;

    if deleted.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }

    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ============================================================
// ADMIN LIMITS
// ============================================================

pub async fn get_admin_limits(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(admin_id): Path<Uuid>,
) -> Result<Json<AdminLimitsResponse>> {
    auth.require_owner()?;

    #[derive(sqlx::FromRow)]
    struct LimitsRow {
        max_users: i32,
        total_ram_mb: i64,
        total_cpu_pct: f32,
        total_disk_mb: i64,
        total_bots: i32,
        max_ram_per_user_mb: i64,
        max_cpu_per_user_pct: f32,
        max_bots_per_user: i32,
    }

    let row = sqlx::query_as::<_, LimitsRow>(
        "SELECT max_users, total_ram_mb, total_cpu_pct, total_disk_mb, total_bots,
                max_ram_per_user_mb, max_cpu_per_user_pct, max_bots_per_user
         FROM admin_limits WHERE user_id = $1",
    )
    .bind(admin_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    // Compute allocated = sum of all user_limits under this admin
    #[derive(sqlx::FromRow)]
    struct AllocRow {
        ram_mb: Option<i64>,
        cpu_pct: Option<f32>,
        disk_mb: Option<i64>,
        bots: Option<i64>,
        users: Option<i64>,
    }

    let alloc = sqlx::query_as::<_, AllocRow>(
        r#"SELECT
               COALESCE(SUM(ul.max_ram_mb), 0)  AS ram_mb,
               COALESCE(SUM(ul.max_cpu_pct), 0) AS cpu_pct,
               COALESCE(SUM(ul.max_disk_mb), 0) AS disk_mb,
               COALESCE(SUM(ul.max_bots), 0)    AS bots,
               COUNT(u.id)                       AS users
           FROM users u
           LEFT JOIN user_limits ul ON ul.user_id = u.id
           WHERE u.parent_id = $1"#,
    )
    .bind(admin_id)
    .fetch_one(&state.db)
    .await?;

    let alloc_ram = alloc.ram_mb.unwrap_or(0);
    let alloc_cpu = alloc.cpu_pct.unwrap_or(0.0);
    let alloc_disk = alloc.disk_mb.unwrap_or(0);
    let alloc_bots = alloc.bots.unwrap_or(0) as i32;
    let alloc_users = alloc.users.unwrap_or(0) as i32;

    let limits = AdminLimits {
        user_id: admin_id,
        max_users: row.max_users,
        total_ram_mb: row.total_ram_mb,
        total_cpu_pct: row.total_cpu_pct,
        total_disk_mb: row.total_disk_mb,
        total_bots: row.total_bots,
        max_ram_per_user_mb: row.max_ram_per_user_mb,
        max_cpu_per_user_pct: row.max_cpu_per_user_pct,
        max_bots_per_user: row.max_bots_per_user,
    };

    Ok(Json(AdminLimitsResponse {
        limits,
        allocated: AllocatedResources {
            ram_mb: alloc_ram,
            cpu_pct: alloc_cpu,
            disk_mb: alloc_disk,
            bots: alloc_bots,
            users: alloc_users,
        },
        remaining: AllocatedResources {
            ram_mb: row.total_ram_mb - alloc_ram,
            cpu_pct: row.total_cpu_pct - alloc_cpu,
            disk_mb: row.total_disk_mb - alloc_disk,
            bots: row.total_bots - alloc_bots,
            users: row.max_users - alloc_users,
        },
    }))
}

pub async fn set_admin_limits(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(admin_id): Path<Uuid>,
    Json(body): Json<SetAdminLimitsRequest>,
) -> Result<Json<AdminLimits>> {
    auth.require_owner()?;

    // Ensure the admin exists
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 AND role = 'admin')",
    )
    .bind(admin_id)
    .fetch_one(&state.db)
    .await?;

    if !exists {
        return Err(AppError::NotFound);
    }

    // Upsert limits (apply only the fields provided)
    sqlx::query(
        r#"INSERT INTO admin_limits (user_id, max_users, total_ram_mb, total_cpu_pct,
               total_disk_mb, total_bots, max_ram_per_user_mb, max_cpu_per_user_pct, max_bots_per_user)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (user_id) DO UPDATE SET
               max_users            = COALESCE($2, admin_limits.max_users),
               total_ram_mb         = COALESCE($3, admin_limits.total_ram_mb),
               total_cpu_pct        = COALESCE($4, admin_limits.total_cpu_pct),
               total_disk_mb        = COALESCE($5, admin_limits.total_disk_mb),
               total_bots           = COALESCE($6, admin_limits.total_bots),
               max_ram_per_user_mb  = COALESCE($7, admin_limits.max_ram_per_user_mb),
               max_cpu_per_user_pct = COALESCE($8, admin_limits.max_cpu_per_user_pct),
               max_bots_per_user    = COALESCE($9, admin_limits.max_bots_per_user)"#,
    )
    .bind(admin_id)
    .bind(body.max_users)
    .bind(body.total_ram_mb)
    .bind(body.total_cpu_pct)
    .bind(body.total_disk_mb)
    .bind(body.total_bots)
    .bind(body.max_ram_per_user_mb)
    .bind(body.max_cpu_per_user_pct)
    .bind(body.max_bots_per_user)
    .execute(&state.db)
    .await?;

    #[derive(sqlx::FromRow)]
    struct Row {
        max_users: i32,
        total_ram_mb: i64,
        total_cpu_pct: f32,
        total_disk_mb: i64,
        total_bots: i32,
        max_ram_per_user_mb: i64,
        max_cpu_per_user_pct: f32,
        max_bots_per_user: i32,
    }

    let row = sqlx::query_as::<_, Row>(
        "SELECT max_users, total_ram_mb, total_cpu_pct, total_disk_mb, total_bots,
                max_ram_per_user_mb, max_cpu_per_user_pct, max_bots_per_user
         FROM admin_limits WHERE user_id = $1",
    )
    .bind(admin_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(AdminLimits {
        user_id: admin_id,
        max_users: row.max_users,
        total_ram_mb: row.total_ram_mb,
        total_cpu_pct: row.total_cpu_pct,
        total_disk_mb: row.total_disk_mb,
        total_bots: row.total_bots,
        max_ram_per_user_mb: row.max_ram_per_user_mb,
        max_cpu_per_user_pct: row.max_cpu_per_user_pct,
        max_bots_per_user: row.max_bots_per_user,
    }))
}

// ============================================================
// WORKERS
// ============================================================

pub async fn list_workers(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<WorkersResponse>> {
    auth.require_owner()?;

    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        hostname: String,
        ip_address: String,
        total_ram_mb: i64,
        total_cpu_cores: i32,
        allocated_ram_mb: i64,
        allocated_cpu_pct: f32,
        status: String,
        last_heartbeat: chrono::DateTime<Utc>,
    }

    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, hostname, ip_address, total_ram_mb, total_cpu_cores,
                allocated_ram_mb, allocated_cpu_pct, status::text AS status, last_heartbeat
         FROM worker_nodes ORDER BY hostname",
    )
    .fetch_all(&state.db)
    .await?;

    let workers = rows
        .into_iter()
        .map(|r| WorkerNode {
            id: r.id,
            hostname: r.hostname,
            ip_address: r.ip_address,
            total_ram_mb: r.total_ram_mb,
            total_cpu_cores: r.total_cpu_cores,
            allocated_ram_mb: r.allocated_ram_mb,
            allocated_cpu_pct: r.allocated_cpu_pct,
            status: match r.status.as_str() {
                "online" => WorkerStatus::Online,
                "draining" => WorkerStatus::Draining,
                _ => WorkerStatus::Offline,
            },
            last_heartbeat: r.last_heartbeat,
        })
        .collect();

    Ok(Json(WorkersResponse { workers }))
}

// ============================================================
// PLATFORM CONFIG
// ============================================================

pub async fn get_config(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<ConfigEntry>>> {
    auth.require_owner()?;

    #[derive(sqlx::FromRow)]
    struct Row {
        key: String,
        value: String,
    }

    let rows = sqlx::query_as::<_, Row>("SELECT key, value FROM platform_config ORDER BY key")
        .fetch_all(&state.db)
        .await?;

    Ok(Json(
        rows.into_iter()
            .map(|r| ConfigEntry { key: r.key, value: r.value })
            .collect(),
    ))
}

pub async fn set_config(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(key): Path<String>,
    Json(body): Json<SetConfigRequest>,
) -> Result<Json<ConfigEntry>> {
    auth.require_owner()?;

    // Only allow known keys
    let allowed = ["open_registration", "default_runtime", "log_retention_lines"];
    if !allowed.contains(&key.as_str()) {
        return Err(AppError::BadRequest(format!("Unknown config key: {}", key)));
    }

    sqlx::query(
        "UPDATE platform_config SET value = $1, updated_at = NOW() WHERE key = $2",
    )
    .bind(&body.value)
    .bind(&key)
    .execute(&state.db)
    .await?;

    Ok(Json(ConfigEntry { key, value: body.value }))
}
