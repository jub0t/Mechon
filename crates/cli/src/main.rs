mod client;
mod commands;
mod config;

use anyhow::Result;
use clap::{Parser, Subcommand};
use std::path::PathBuf;
use uuid::Uuid;

// ============================================================
// CLI STRUCTURE
// ============================================================

#[derive(Parser)]
#[command(
    name = "mechon",
    about = "Mechon — Discord bot hosting CLI",
    version
)]
struct Cli {
    #[command(subcommand)]
    command: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// First-run: create the owner account on a fresh server
    Setup {
        #[arg(long)] host: String,
        #[arg(long)] email: String,
        #[arg(long)] username: String,
        #[arg(long)] password: String,
    },

    /// Authenticate with a Mechon server
    Login {
        #[arg(long)] host: String,
        #[arg(long)] identifier: String,
        #[arg(long)] password: String,
    },

    /// Clear saved credentials
    Logout,

    /// Show the currently logged-in user
    Whoami,

    /// Manage your bots
    #[command(subcommand)]
    Bots(BotsCmd),

    /// Deploy code to a bot
    Deploy {
        /// Bot ID
        bot_id: Uuid,
        /// Path to directory or .zip file to upload
        #[arg(long, short, default_value = ".")]
        path: PathBuf,
        /// Entrypoint override (e.g. src/index.js)
        #[arg(long)]
        entrypoint: Option<String>,
    },

    /// Manage code versions
    #[command(subcommand)]
    Versions(VersionsCmd),

    /// Owner: manage admin accounts
    #[command(subcommand)]
    Owner(OwnerCmd),

    /// Admin: manage user accounts
    #[command(subcommand)]
    Admin(AdminCmd),
}

#[derive(Subcommand)]
enum BotsCmd {
    /// List your bots
    List,
    /// Show bot details
    Info { id: Uuid },
    /// Create a new bot
    Create {
        #[arg(long)] name: String,
        #[arg(long)] token: String,
        #[arg(long, default_value = "node")] runtime: String,
        #[arg(long, default_value = "index.js")] entrypoint: String,
    },
    /// Delete a bot (must be stopped first)
    Delete { id: Uuid },
    /// Start a bot
    Start { id: Uuid },
    /// Stop a bot
    Stop { id: Uuid },
    /// Restart a bot
    Restart { id: Uuid },
    /// View recent logs
    Logs { id: Uuid },
    /// View CPU/RAM metrics
    Metrics { id: Uuid },
}

#[derive(Subcommand)]
enum VersionsCmd {
    /// List deployed versions
    List { bot_id: Uuid },
    /// Roll back to a previous version (bot must be stopped)
    Rollback { bot_id: Uuid, version: i32 },
}

#[derive(Subcommand)]
enum OwnerCmd {
    /// List admin accounts
    Admins,
    /// Create a new admin account
    CreateAdmin {
        #[arg(long)] email: String,
        #[arg(long)] username: String,
        #[arg(long)] password: String,
    },
    /// Set resource limits for an admin
    SetLimits {
        admin_id: Uuid,
        #[arg(long)] max_users: Option<i32>,
        #[arg(long)] total_ram_mb: Option<i64>,
        #[arg(long)] total_bots: Option<i32>,
        #[arg(long)] max_bots_per_user: Option<i32>,
        #[arg(long)] max_ram_per_user_mb: Option<i64>,
    },
}

#[derive(Subcommand)]
enum AdminCmd {
    /// List users under this admin
    Users,
    /// Create a new user account
    CreateUser {
        #[arg(long)] email: String,
        #[arg(long)] username: String,
        #[arg(long)] password: String,
    },
    /// Set resource limits for a user
    SetLimits {
        user_id: Uuid,
        #[arg(long)] max_bots: Option<i32>,
        #[arg(long)] max_ram_mb: Option<i64>,
        #[arg(long)] max_ram_per_bot_mb: Option<i64>,
    },
    /// Show the admin's resource pool (total vs allocated vs remaining)
    Pool,
}

// ============================================================
// ENTRYPOINT
// ============================================================

#[tokio::main]
async fn main() {
    if let Err(e) = run().await {
        eprintln!("{} {}", colored::Colorize::red("Error:"), e);
        std::process::exit(1);
    }
}

async fn run() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Cmd::Setup { host, email, username, password } => {
            commands::auth::setup(&host, &email, &username, &password).await?;
        }
        Cmd::Login { host, identifier, password } => {
            commands::auth::login(&host, &identifier, &password).await?;
        }
        Cmd::Logout => {
            commands::auth::logout().await?;
        }
        Cmd::Whoami => {
            commands::auth::whoami().await?;
        }

        Cmd::Bots(cmd) => match cmd {
            BotsCmd::List => commands::bots::list().await?,
            BotsCmd::Info { id } => commands::bots::info(id).await?,
            BotsCmd::Create { name, token, runtime, entrypoint } => {
                commands::bots::create(&name, &token, &runtime, &entrypoint).await?;
            }
            BotsCmd::Delete { id } => commands::bots::delete(id).await?,
            BotsCmd::Start { id } => commands::bots::start(id).await?,
            BotsCmd::Stop { id } => commands::bots::stop(id).await?,
            BotsCmd::Restart { id } => commands::bots::restart(id).await?,
            BotsCmd::Logs { id } => commands::bots::logs(id).await?,
            BotsCmd::Metrics { id } => commands::bots::metrics(id).await?,
        },

        Cmd::Deploy { bot_id, path, entrypoint } => {
            commands::deploy::deploy(bot_id, &path, entrypoint).await?;
        }

        Cmd::Versions(cmd) => match cmd {
            VersionsCmd::List { bot_id } => commands::deploy::list_versions(bot_id).await?,
            VersionsCmd::Rollback { bot_id, version } => {
                commands::deploy::rollback(bot_id, version).await?;
            }
        },

        Cmd::Owner(cmd) => match cmd {
            OwnerCmd::Admins => commands::admin::list_admins().await?,
            OwnerCmd::CreateAdmin { email, username, password } => {
                commands::admin::create_admin(&email, &username, &password).await?;
            }
            OwnerCmd::SetLimits {
                admin_id,
                max_users,
                total_ram_mb,
                total_bots,
                max_bots_per_user,
                max_ram_per_user_mb,
            } => {
                commands::admin::set_admin_limits(
                    admin_id,
                    max_users,
                    total_ram_mb,
                    total_bots,
                    max_bots_per_user,
                    max_ram_per_user_mb,
                )
                .await?;
            }
        },

        Cmd::Admin(cmd) => match cmd {
            AdminCmd::Users => commands::admin::list_users().await?,
            AdminCmd::CreateUser { email, username, password } => {
                commands::admin::create_user(&email, &username, &password).await?;
            }
            AdminCmd::SetLimits { user_id, max_bots, max_ram_mb, max_ram_per_bot_mb } => {
                commands::admin::set_user_limits(user_id, max_bots, max_ram_mb, max_ram_per_bot_mb)
                    .await?;
            }
            AdminCmd::Pool => commands::admin::pool().await?,
        },
    }

    Ok(())
}

// ============================================================
// SHARED HELPER: get authenticated client
// ============================================================

pub fn require_auth() -> Result<(client::Client, config::CliConfig)> {
    let cfg = config::load()?;

    let host = cfg
        .host
        .as_deref()
        .ok_or_else(|| anyhow::anyhow!("Not logged in. Run 'mechon login --host <url> --identifier <name> --password <pass>'"))?;

    let token = cfg
        .token
        .clone()
        .ok_or_else(|| anyhow::anyhow!("Not logged in. Run 'mechon login'"))?;

    Ok((client::Client::new(host, Some(token)), cfg))
}
