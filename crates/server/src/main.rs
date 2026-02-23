mod auth;
mod bots;
mod code;
mod config;
mod error;
mod metrics;
mod owner;
mod admin;
mod router;
mod scheduler;
mod setup;
mod state;

use anyhow::Context;
use deadpool_redis::Runtime;
use sqlx::postgres::PgPoolOptions;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "mechon_server=debug,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Config
    let cfg = config::Config::load().context("Failed to load config")?;

    // Postgres
    let db = PgPoolOptions::new()
        .max_connections(cfg.database.max_connections)
        .connect(&cfg.database.url)
        .await
        .context("Failed to connect to Postgres")?;

    // Run migrations
    sqlx::migrate!("../../migrations")
        .run(&db)
        .await
        .context("Failed to run migrations")?;

    tracing::info!("Migrations applied");

    // Redis
    let redis_cfg = deadpool_redis::Config::from_url(&cfg.redis.url);
    let redis = redis_cfg
        .create_pool(Some(Runtime::Tokio1))
        .context("Failed to create Redis pool")?;

    let state = state::AppState::new(db, redis, cfg.clone());

    let addr = format!("{}:{}", cfg.server.host, cfg.server.port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .with_context(|| format!("Failed to bind to {}", addr))?;

    tracing::info!("Listening on {}", addr);

    let app = router::build(state);
    axum::serve(listener, app).await.context("Server error")?;

    Ok(())
}
