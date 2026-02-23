/// Polls running bot processes and publishes CPU/RAM samples to Redis.
use std::collections::HashMap;

use mechon_redis::commands::MetricSample;
use redis::AsyncCommands;
use uuid::Uuid;

use crate::resources::SystemResources;
use crate::runner::{BotRegistry, RunningBot};

/// Called on a timer interval. Reads metrics for all running bots and:
///   1. Publishes samples to Redis (for real-time streaming).
///   2. Enforces resource limits (kills bots that exceed RAM ceiling).
pub async fn collect_and_publish(
    registry: &BotRegistry,
    resources: &mut SystemResources,
    redis_conn: &mut redis::aio::ConnectionManager,
    db: &sqlx::PgPool,
) {
    resources.refresh();

    let pids: HashMap<Uuid, (u32, i64, f32)> = {
        let reg = registry.lock().await;
        let reg: &std::collections::HashMap<Uuid, RunningBot> = &reg;
        reg.iter()
            .filter_map(|(id, bot)| {
                bot.child
                    .id()
                    .map(|pid| (*id, (pid, bot.ram_limit_mb, bot.cpu_limit_pct)))
            })
            .collect()
    };

    for (bot_id, (pid, ram_limit, _cpu_limit)) in pids {
        let ram_mb = resources.process_ram_mb(pid).unwrap_or(0);
        let cpu_pct = resources.process_cpu_pct(pid).unwrap_or(0.0);

        // Enforce RAM limit
        if ram_mb > ram_limit {
            tracing::warn!(
                bot_id = %bot_id,
                ram_mb,
                ram_limit,
                "Bot exceeded RAM limit — terminating"
            );
            let mut reg = registry.lock().await;
            let reg: &mut std::collections::HashMap<Uuid, RunningBot> = &mut reg;
            if let Some(mut bot) = reg.remove(&bot_id) {
                let _ = bot.child.kill().await;
            }
            let _ = reg;
            // drop(reg);

            // Update DB status to error
            let _ = sqlx::query(
                "UPDATE bots SET status = 'error'::bot_status, worker_id = NULL, updated_at = NOW() WHERE id = $1",
            )
            .bind(bot_id)
            .execute(db)
            .await;

            continue;
        }

        // Publish sample to Redis
        let channel = mechon_redis::bot_metrics_channel(bot_id);
        let sample = MetricSample {
            bot_id,
            cpu_pct,
            ram_mb,
        };
        if let Ok(payload) = serde_json::to_string(&sample) {
            let _: Result<(), _> = redis_conn.publish(&channel, &payload).await;
        }

        // Persist to DB (fire-and-forget)
        let db = db.clone();
        tokio::spawn(async move {
            let _ = sqlx::query(
                "INSERT INTO bot_metrics (bot_id, cpu_pct, ram_mb) VALUES ($1, $2, $3)",
            )
            .bind(bot_id)
            .bind(cpu_pct)
            .bind(ram_mb)
            .execute(&db)
            .await;
        });
    }
}
