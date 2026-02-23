use anyhow::Result;
use colored::Colorize;
use mechon_types::{BotRuntime, api::CreateBotRequest};
use uuid::Uuid;

pub async fn list() -> Result<()> {
    let (client, _) = crate::require_auth()?;
    let bots = client.list_bots().await?;

    if bots.is_empty() {
        println!("No bots yet. Create one with 'mechon bots create'.");
        return Ok(());
    }

    println!(
        "{:<38} {:<20} {:<10} {:<8}",
        "ID".dimmed(),
        "NAME".dimmed(),
        "STATUS".dimmed(),
        "RUNTIME".dimmed()
    );

    for b in bots {
        let status_colored = match b.bot.status {
            mechon_types::BotStatus::Running => "running".green(),
            mechon_types::BotStatus::Error => "error".red(),
            mechon_types::BotStatus::Starting => "starting".yellow(),
            mechon_types::BotStatus::Stopping => "stopping".yellow(),
            mechon_types::BotStatus::Stopped => "stopped".dimmed(),
        };

        println!(
            "{:<38} {:<20} {:<10} {:<8}",
            b.bot.id,
            b.bot.name,
            status_colored,
            format!("{:?}", b.bot.runtime).to_lowercase()
        );
    }

    Ok(())
}

pub async fn info(id: Uuid) -> Result<()> {
    let (client, _) = crate::require_auth()?;
    let b = client.get_bot(id).await?;

    println!("ID         : {}", b.bot.id);
    println!("Name       : {}", b.bot.name.bold());
    println!("Status     : {}", format!("{:?}", b.bot.status).to_lowercase());
    println!("Runtime    : {}", format!("{:?}", b.bot.runtime).to_lowercase());
    println!("Entrypoint : {}", b.bot.entrypoint);
    println!("Worker     : {}", b.bot.worker_id.map(|id| id.to_string()).unwrap_or_else(|| "none".into()));
    println!("Created    : {}", b.bot.created_at.format("%Y-%m-%d %H:%M UTC"));

    if let Some(v) = b.active_version {
        println!("Version    : {} ({})", v.version, v.archive_key);
    }

    Ok(())
}

pub async fn create(name: &str, token: &str, runtime: &str, entrypoint: &str) -> Result<()> {
    let (client, _) = crate::require_auth()?;

    let rt = match runtime {
        "bun" => BotRuntime::Bun,
        "deno" => BotRuntime::Deno,
        _ => BotRuntime::Node,
    };

    let b = client
        .create_bot(&CreateBotRequest {
            name: name.into(),
            token: token.into(),
            runtime: rt,
            entrypoint: entrypoint.into(),
        })
        .await?;

    println!("{} Bot created: {} ({})", "✓".green(), b.bot.name.bold(), b.bot.id);
    Ok(())
}

pub async fn delete(id: Uuid) -> Result<()> {
    let (client, _) = crate::require_auth()?;
    client.delete_bot(id).await?;
    println!("{} Bot {} deleted", "✓".green(), id);
    Ok(())
}

pub async fn start(id: Uuid) -> Result<()> {
    let (client, _) = crate::require_auth()?;
    let b = client.start_bot(id).await?;
    println!("{} Bot {} is {}", "✓".green(), b.bot.name, "starting".yellow());
    Ok(())
}

pub async fn stop(id: Uuid) -> Result<()> {
    let (client, _) = crate::require_auth()?;
    let b = client.stop_bot(id).await?;
    println!("{} Bot {} is {}", "✓".green(), b.bot.name, "stopping".yellow());
    Ok(())
}

pub async fn restart(id: Uuid) -> Result<()> {
    let (client, _) = crate::require_auth()?;
    let b = client.restart_bot(id).await?;
    println!("{} Bot {} is restarting", "✓".green(), b.bot.name);
    Ok(())
}

pub async fn logs(id: Uuid) -> Result<()> {
    let (client, _) = crate::require_auth()?;
    let resp = client.get_logs(id).await?;

    for log in resp.logs.iter().rev() {
        let stream_label = match log.stream {
            mechon_types::LogStream::Stdout => "stdout".dimmed(),
            mechon_types::LogStream::Stderr => "stderr".red(),
        };
        println!("[{}] {} {}", log.recorded_at.format("%H:%M:%S"), stream_label, log.message);
    }

    Ok(())
}

pub async fn metrics(id: Uuid) -> Result<()> {
    let (client, _) = crate::require_auth()?;
    let resp = client.get_metrics(id).await?;

    if resp.metrics.is_empty() {
        println!("No metrics yet.");
        return Ok(());
    }

    println!(
        "{:<22} {:>8} {:>10}",
        "TIME".dimmed(),
        "CPU %".dimmed(),
        "RAM MB".dimmed()
    );

    for m in resp.metrics.iter().rev() {
        println!(
            "{:<22} {:>8.1} {:>10}",
            m.recorded_at.format("%Y-%m-%d %H:%M:%S"),
            m.cpu_pct,
            m.ram_mb
        );
    }

    Ok(())
}
