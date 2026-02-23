/// Captures stdout/stderr from a child process and streams lines to Redis.
use mechon_redis::commands::LogLine;
use redis::AsyncCommands;
use tokio::io::{AsyncBufReadExt, BufReader};
use uuid::Uuid;

/// Spawn two tasks that tail stdout and stderr of a child process,
/// publishing each line to Redis and persisting to the DB.
pub fn attach_log_capture(
    bot_id: Uuid,
    stdout: tokio::process::ChildStdout,
    stderr: tokio::process::ChildStderr,
    redis_conn: redis::aio::ConnectionManager,
    db: sqlx::PgPool,
) {
    let redis_stdout = redis_conn.clone();
    let db_stdout = db.clone();
    tokio::spawn(capture_stream(
        bot_id,
        stdout,
        "stdout".into(),
        redis_stdout,
        db_stdout,
    ));

    tokio::spawn(capture_stream(
        bot_id,
        stderr,
        "stderr".into(),
        redis_conn,
        db,
    ));
}

async fn capture_stream<R: tokio::io::AsyncRead + Unpin + Send + 'static>(
    bot_id: Uuid,
    stream: R,
    stream_name: String,
    mut redis_conn: redis::aio::ConnectionManager,
    db: sqlx::PgPool,
) {
    let channel = mechon_redis::bot_logs_channel(bot_id);
    let reader = BufReader::new(stream);
    let mut lines = reader.lines();

    while let Ok(Some(line)) = lines.next_line().await {
        let log = LogLine {
            bot_id,
            stream: stream_name.clone(),
            message: line.clone(),
        };

        // Publish to Redis for real-time streaming
        if let Ok(payload) = serde_json::to_string(&log) {
            let _: Result<(), _> = redis_conn.publish(&channel, &payload).await;
        }

        // Persist to DB (rolling — pruning handled separately)
        let db = db.clone();
        let stream_name = stream_name.clone();
        tokio::spawn(async move {
            let _ = sqlx::query(
                "INSERT INTO bot_logs (bot_id, stream, message) VALUES ($1, $2, $3)",
            )
            .bind(bot_id)
            .bind(&stream_name)
            .bind(&line)
            .execute(&db)
            .await;
        });
    }
}
