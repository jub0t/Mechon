/// Admin-only endpoints: manage user accounts under this admin, view pool usage.
use axum::{
    extract::{Path, State},
    Json,
};
use mechon_types::{UserRole, api::*, UserLimits};
use uuid::Uuid;

use crate::{
    auth::{create_user_internal, AuthUser},
    error::{AppError, Result},
    state::AppState,
};

// ============================================================
// USER ACCOUNTS
// ============================================================

pub async fn list_users(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<UserInfo>>> {
    auth.require_admin_or_owner()?;

    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        email: String,
        username: String,
        parent_id: Option<Uuid>,
    }

    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, email, username, parent_id FROM users WHERE parent_id = $1 AND role = 'user' ORDER BY username",
    )
    .bind(auth.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(
        rows.into_iter()
            .map(|r| UserInfo {
                id: r.id,
                email: r.email,
                username: r.username,
                role: UserRole::User,
                parent_id: r.parent_id,
            })
            .collect(),
    ))
}

pub async fn create_user(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<CreateUserRequest>,
) -> Result<Json<UserInfo>> {
    auth.require_admin_or_owner()?;

    // Check admin's max_users limit
    let current_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE parent_id = $1")
            .bind(auth.id)
            .fetch_one(&state.db)
            .await?;

    let max_users: i32 =
        sqlx::query_scalar("SELECT max_users FROM admin_limits WHERE user_id = $1")
            .bind(auth.id)
            .fetch_optional(&state.db)
            .await?
            .unwrap_or(0);

    if current_count >= max_users as i64 {
        return Err(AppError::LimitExceeded(format!(
            "User limit reached ({}/{})",
            current_count, max_users
        )));
    }

    create_user_internal(
        &state,
        &body.email,
        &body.username,
        &body.password,
        UserRole::User,
        Some(auth.id),
    )
    .await
}

pub async fn get_user(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<UserInfo>> {
    auth.require_admin_or_owner()?;

    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        email: String,
        username: String,
        parent_id: Option<Uuid>,
    }

    let row = sqlx::query_as::<_, Row>(
        "SELECT id, email, username, parent_id FROM users WHERE id = $1 AND parent_id = $2",
    )
    .bind(user_id)
    .bind(auth.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(UserInfo {
        id: row.id,
        email: row.email,
        username: row.username,
        role: UserRole::User,
        parent_id: row.parent_id,
    }))
}

pub async fn delete_user(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    auth.require_admin_or_owner()?;

    let deleted =
        sqlx::query("DELETE FROM users WHERE id = $1 AND parent_id = $2 AND role = 'user'")
            .bind(user_id)
            .bind(auth.id)
            .execute(&state.db)
            .await?;

    if deleted.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }

    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ============================================================
// USER LIMITS
// ============================================================

pub async fn get_user_limits(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<UserLimits>> {
    auth.require_admin_or_owner()?;
    ensure_owns_user(&state, auth.id, user_id).await?;

    fetch_user_limits(&state, user_id).await
}

pub async fn set_user_limits(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    Json(body): Json<SetUserLimitsRequest>,
) -> Result<Json<UserLimits>> {
    auth.require_admin_or_owner()?;
    ensure_owns_user(&state, auth.id, user_id).await?;

    // Load admin's own limits to validate the request won't exceed the pool
    validate_against_pool(&state, auth.id, user_id, &body).await?;

    sqlx::query(
        r#"INSERT INTO user_limits (user_id, max_bots, max_ram_mb, max_ram_per_bot_mb,
               max_cpu_pct, max_cpu_per_bot_pct, max_disk_mb)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (user_id) DO UPDATE SET
               max_bots            = COALESCE($2, user_limits.max_bots),
               max_ram_mb          = COALESCE($3, user_limits.max_ram_mb),
               max_ram_per_bot_mb  = COALESCE($4, user_limits.max_ram_per_bot_mb),
               max_cpu_pct         = COALESCE($5, user_limits.max_cpu_pct),
               max_cpu_per_bot_pct = COALESCE($6, user_limits.max_cpu_per_bot_pct),
               max_disk_mb         = COALESCE($7, user_limits.max_disk_mb)"#,
    )
    .bind(user_id)
    .bind(body.max_bots)
    .bind(body.max_ram_mb)
    .bind(body.max_ram_per_bot_mb)
    .bind(body.max_cpu_pct)
    .bind(body.max_cpu_per_bot_pct)
    .bind(body.max_disk_mb)
    .execute(&state.db)
    .await?;

    fetch_user_limits(&state, user_id).await
}

// ============================================================
// POOL VIEW
// ============================================================

pub async fn get_pool(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<AdminLimitsResponse>> {
    auth.require_admin_or_owner()?;
    let admin_id = auth.id;

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

    use mechon_types::AdminLimits;
    use mechon_types::api::{AdminLimitsResponse, AllocatedResources};

    Ok(Json(AdminLimitsResponse {
        limits: AdminLimits {
            user_id: admin_id,
            max_users: row.max_users,
            total_ram_mb: row.total_ram_mb,
            total_cpu_pct: row.total_cpu_pct,
            total_disk_mb: row.total_disk_mb,
            total_bots: row.total_bots,
            max_ram_per_user_mb: row.max_ram_per_user_mb,
            max_cpu_per_user_pct: row.max_cpu_per_user_pct,
            max_bots_per_user: row.max_bots_per_user,
        },
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

// ============================================================
// INTERNAL HELPERS
// ============================================================

async fn ensure_owns_user(state: &AppState, admin_id: Uuid, user_id: Uuid) -> Result<()> {
    let owns: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 AND parent_id = $2)",
    )
    .bind(user_id)
    .bind(admin_id)
    .fetch_one(&state.db)
    .await?;

    if !owns {
        Err(AppError::NotFound)
    } else {
        Ok(())
    }
}

async fn fetch_user_limits(state: &AppState, user_id: Uuid) -> Result<Json<UserLimits>> {
    #[derive(sqlx::FromRow)]
    struct Row {
        max_bots: i32,
        max_ram_mb: i64,
        max_ram_per_bot_mb: i64,
        max_cpu_pct: f32,
        max_cpu_per_bot_pct: f32,
        max_disk_mb: i64,
    }

    let row = sqlx::query_as::<_, Row>(
        "SELECT max_bots, max_ram_mb, max_ram_per_bot_mb, max_cpu_pct, max_cpu_per_bot_pct, max_disk_mb
         FROM user_limits WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(UserLimits {
        user_id,
        max_bots: row.max_bots,
        max_ram_mb: row.max_ram_mb,
        max_ram_per_bot_mb: row.max_ram_per_bot_mb,
        max_cpu_pct: row.max_cpu_pct,
        max_cpu_per_bot_pct: row.max_cpu_per_bot_pct,
        max_disk_mb: row.max_disk_mb,
    }))
}

/// Ensures the proposed user limits don't push the admin over their own pool limits.
async fn validate_against_pool(
    state: &AppState,
    admin_id: Uuid,
    user_id: Uuid,
    body: &SetUserLimitsRequest,
) -> Result<()> {
    #[derive(sqlx::FromRow)]
    struct PoolRow {
        total_ram_mb: i64,
        total_cpu_pct: f32,
        total_bots: i32,
        max_ram_per_user_mb: i64,
        max_cpu_per_user_pct: f32,
        max_bots_per_user: i32,
    }

    let Some(pool) = sqlx::query_as::<_, PoolRow>(
        "SELECT total_ram_mb, total_cpu_pct, total_bots, max_ram_per_user_mb, max_cpu_per_user_pct, max_bots_per_user
         FROM admin_limits WHERE user_id = $1",
    )
    .bind(admin_id)
    .fetch_optional(&state.db)
    .await?
    else {
        return Err(AppError::LimitExceeded("Admin has no limits configured".into()));
    };

    // Sum of all OTHER users' limits under this admin
    #[derive(sqlx::FromRow)]
    struct AllocRow {
        ram_mb: Option<i64>,
        cpu_pct: Option<f32>,
        bots: Option<i64>,
    }

    let alloc = sqlx::query_as::<_, AllocRow>(
        r#"SELECT COALESCE(SUM(ul.max_ram_mb), 0)  AS ram_mb,
                  COALESCE(SUM(ul.max_cpu_pct), 0) AS cpu_pct,
                  COALESCE(SUM(ul.max_bots), 0)    AS bots
           FROM users u
           JOIN user_limits ul ON ul.user_id = u.id
           WHERE u.parent_id = $1 AND u.id != $2"#,
    )
    .bind(admin_id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    let other_ram = alloc.ram_mb.unwrap_or(0);
    let other_cpu = alloc.cpu_pct.unwrap_or(0.0);
    let other_bots = alloc.bots.unwrap_or(0) as i32;

    if let Some(ram) = body.max_ram_mb {
        if ram > pool.max_ram_per_user_mb {
            return Err(AppError::LimitExceeded(format!(
                "max_ram_mb ({}) exceeds per-user ceiling ({})",
                ram, pool.max_ram_per_user_mb
            )));
        }
        if other_ram + ram > pool.total_ram_mb {
            return Err(AppError::LimitExceeded("Not enough RAM remaining in admin pool".into()));
        }
    }

    if let Some(cpu) = body.max_cpu_pct {
        if cpu > pool.max_cpu_per_user_pct {
            return Err(AppError::LimitExceeded(format!(
                "max_cpu_pct ({}) exceeds per-user ceiling ({})",
                cpu, pool.max_cpu_per_user_pct
            )));
        }
        if other_cpu + cpu > pool.total_cpu_pct {
            return Err(AppError::LimitExceeded("Not enough CPU remaining in admin pool".into()));
        }
    }

    if let Some(bots) = body.max_bots {
        if bots > pool.max_bots_per_user {
            return Err(AppError::LimitExceeded(format!(
                "max_bots ({}) exceeds per-user ceiling ({})",
                bots, pool.max_bots_per_user
            )));
        }
        if other_bots + bots > pool.total_bots {
            return Err(AppError::LimitExceeded("Not enough bot slots remaining in admin pool".into()));
        }
    }

    Ok(())
}
