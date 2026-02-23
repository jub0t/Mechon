use axum::{
    extract::{Path, Query, State},
    Json,
};
use chrono::Utc;
use mechon_types::{BotMetrics, api::MetricsResponse};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    auth::AuthUser,
    error::{AppError, Result},
    state::AppState,
};

#[derive(Debug, Deserialize)]
pub struct MetricsQuery {
    /// Number of most-recent samples to return (default 100)
    pub limit: Option<i64>,
}

pub async fn get_metrics(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(bot_id): Path<Uuid>,
    Query(params): Query<MetricsQuery>,
) -> Result<Json<MetricsResponse>> {
    // Ensure ownership
    let owns: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM bots WHERE id = $1 AND user_id = $2)")
            .bind(bot_id)
            .bind(auth.id)
            .fetch_one(&state.db)
            .await?;

    if !owns {
        return Err(AppError::NotFound);
    }

    let limit = params.limit.unwrap_or(100).clamp(1, 1000);

    #[derive(sqlx::FromRow)]
    struct Row {
        cpu_pct: f32,
        ram_mb: i64,
        recorded_at: chrono::DateTime<Utc>,
    }

    let rows = sqlx::query_as::<_, Row>(
        "SELECT cpu_pct, ram_mb, recorded_at FROM bot_metrics
         WHERE bot_id = $1 ORDER BY recorded_at DESC LIMIT $2",
    )
    .bind(bot_id)
    .bind(limit)
    .fetch_all(&state.db)
    .await?;

    let metrics = rows
        .into_iter()
        .map(|r| BotMetrics {
            bot_id,
            cpu_pct: r.cpu_pct,
            ram_mb: r.ram_mb,
            recorded_at: r.recorded_at,
        })
        .collect();

    Ok(Json(MetricsResponse { metrics }))
}
