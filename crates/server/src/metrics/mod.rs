use std::convert::Infallible;

use axum::{
    extract::{Path, Query, State},
    response::sse::{Event, KeepAlive, Sse},
    Json,
};
use chrono::Utc;
use futures_util::StreamExt;
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

/// SSE endpoint: streams real-time metric samples as they arrive from the worker.
/// Each event is a JSON-encoded MetricSample: { bot_id, cpu_pct, ram_mb }
///
/// Connect with:
///   curl -N -H "Authorization: Bearer <token>" \
///        http://localhost:8080/bots/<id>/metrics/stream
pub async fn stream_metrics(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(bot_id): Path<Uuid>,
) -> Result<Sse<impl futures_util::Stream<Item = std::result::Result<Event, Infallible>>>> {
    let owns: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM bots WHERE id = $1 AND user_id = $2)")
            .bind(bot_id)
            .bind(auth.id)
            .fetch_one(&state.db)
            .await?;

    if !owns {
        return Err(AppError::NotFound);
    }

    // Dedicated connection for pub/sub — cannot reuse a deadpool connection
    let client = redis::Client::open(state.config.redis.url.as_str())
        .map_err(|e| AppError::Internal(anyhow::anyhow!(e)))?;
    let mut pubsub = client
        .get_async_pubsub()
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!(e)))?;

    pubsub
        .subscribe(mechon_redis::bot_metrics_channel(bot_id))
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!(e)))?;

    let stream = pubsub.into_on_message().map(|msg| {
        let payload: String = msg.get_payload().unwrap_or_default();
        Ok(Event::default().event("metric").data(payload))
    });

    Ok(Sse::new(stream).keep_alive(KeepAlive::default()))
}
