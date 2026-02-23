use anyhow::Result;
use colored::Colorize;
use mechon_types::api::*;
use uuid::Uuid;

// ============================================================
// OWNER: manage admins
// ============================================================

pub async fn list_admins() -> Result<()> {
    let (client, _) = crate::require_auth()?;
    let admins = client.list_admins().await?;

    if admins.is_empty() {
        println!("No admin accounts yet.");
        return Ok(());
    }

    println!("{:<38} {:<20} {}", "ID".dimmed(), "USERNAME".dimmed(), "EMAIL".dimmed());
    for a in admins {
        println!("{:<38} {:<20} {}", a.id, a.username, a.email);
    }

    Ok(())
}

pub async fn create_admin(email: &str, username: &str, password: &str) -> Result<()> {
    let (client, _) = crate::require_auth()?;

    let user = client
        .create_admin(&CreateAdminRequest {
            email: email.into(),
            username: username.into(),
            password: password.into(),
        })
        .await?;

    println!("{} Admin created: {} ({})", "✓".green(), user.username.bold(), user.id);
    Ok(())
}

pub async fn set_admin_limits(
    admin_id: Uuid,
    max_users: Option<i32>,
    total_ram_mb: Option<i64>,
    total_bots: Option<i32>,
    max_bots_per_user: Option<i32>,
    max_ram_per_user_mb: Option<i64>,
) -> Result<()> {
    let (client, _) = crate::require_auth()?;

    let limits = client
        .set_admin_limits(
            admin_id,
            &SetAdminLimitsRequest {
                max_users,
                total_ram_mb,
                total_cpu_pct: None,
                total_disk_mb: None,
                total_bots,
                max_ram_per_user_mb,
                max_cpu_per_user_pct: None,
                max_bots_per_user,
            },
        )
        .await?;

    println!("{} Admin limits updated", "✓".green());
    println!("  max_users          : {}", limits.max_users);
    println!("  total_ram_mb       : {}", limits.total_ram_mb);
    println!("  total_bots         : {}", limits.total_bots);
    println!("  max_bots_per_user  : {}", limits.max_bots_per_user);
    println!("  max_ram_per_user   : {} MB", limits.max_ram_per_user_mb);

    Ok(())
}

// ============================================================
// ADMIN: manage users
// ============================================================

pub async fn list_users() -> Result<()> {
    let (client, _) = crate::require_auth()?;
    let users = client.list_users().await?;

    if users.is_empty() {
        println!("No user accounts yet.");
        return Ok(());
    }

    println!("{:<38} {:<20} {}", "ID".dimmed(), "USERNAME".dimmed(), "EMAIL".dimmed());
    for u in users {
        println!("{:<38} {:<20} {}", u.id, u.username, u.email);
    }

    Ok(())
}

pub async fn create_user(email: &str, username: &str, password: &str) -> Result<()> {
    let (client, _) = crate::require_auth()?;

    let user = client
        .create_user(&CreateUserRequest {
            email: email.into(),
            username: username.into(),
            password: password.into(),
        })
        .await?;

    println!("{} User created: {} ({})", "✓".green(), user.username.bold(), user.id);
    Ok(())
}

pub async fn set_user_limits(
    user_id: Uuid,
    max_bots: Option<i32>,
    max_ram_mb: Option<i64>,
    max_ram_per_bot_mb: Option<i64>,
) -> Result<()> {
    let (client, _) = crate::require_auth()?;

    let limits = client
        .set_user_limits(
            user_id,
            &SetUserLimitsRequest {
                max_bots,
                max_ram_mb,
                max_ram_per_bot_mb,
                max_cpu_pct: None,
                max_cpu_per_bot_pct: None,
                max_disk_mb: None,
            },
        )
        .await?;

    println!("{} User limits updated", "✓".green());
    println!("  max_bots          : {}", limits.max_bots);
    println!("  max_ram_mb        : {}", limits.max_ram_mb);
    println!("  max_ram_per_bot   : {} MB", limits.max_ram_per_bot_mb);

    Ok(())
}

pub async fn pool() -> Result<()> {
    let (client, _) = crate::require_auth()?;
    let resp = client.get_pool().await?;

    let l = &resp.limits;
    let a = &resp.allocated;
    let r = &resp.remaining;

    println!("{:<22} {:>12} {:>12} {:>12}", "RESOURCE".dimmed(), "TOTAL".dimmed(), "ALLOCATED".dimmed(), "REMAINING".dimmed());
    println!("{:<22} {:>12} {:>12} {:>12}", "RAM (MB)", l.total_ram_mb, a.ram_mb, r.ram_mb);
    println!("{:<22} {:>12} {:>12} {:>12}", "Bots", l.total_bots, a.bots, r.bots);
    println!("{:<22} {:>12} {:>12} {:>12}", "Users", l.max_users, a.users, r.users);

    Ok(())
}
