use anyhow::Result;
use colored::Colorize;
use mechon_types::api::{LoginRequest, SetupRequest};

use crate::{client::Client, config};

pub async fn login(host: &str, identifier: &str, password: &str) -> Result<()> {
    let client = Client::new(host, None);

    let resp = client
        .login(&LoginRequest {
            identifier: identifier.into(),
            password: password.into(),
        })
        .await?;

    config::save(&config::CliConfig {
        host: Some(host.into()),
        token: Some(resp.token),
    })?;

    println!(
        "{} Logged in as {} ({})",
        "✓".green(),
        resp.user.username.bold(),
        format!("{:?}", resp.user.role).to_lowercase()
    );

    Ok(())
}

pub async fn logout() -> Result<()> {
    config::clear()?;
    println!("{} Logged out", "✓".green());
    Ok(())
}

pub async fn whoami() -> Result<()> {
    let (client, _) = crate::require_auth()?;
    let user = client.me().await?;

    println!("Username : {}", user.username.bold());
    println!("Email    : {}", user.email);
    println!("Role     : {}", format!("{:?}", user.role).to_lowercase());
    println!("ID       : {}", user.id);

    Ok(())
}

pub async fn setup(host: &str, email: &str, username: &str, password: &str) -> Result<()> {
    let client = Client::new(host, None);

    let status = client.setup_status().await?;
    if status.configured {
        anyhow::bail!("Server is already configured. Use 'mechon login' instead.");
    }

    let user = client
        .setup(&SetupRequest {
            email: email.into(),
            username: username.into(),
            password: password.into(),
        })
        .await?;

    println!(
        "{} Owner account created: {} ({})",
        "✓".green(),
        user.username.bold(),
        user.email
    );
    println!("Run 'mechon login --host {} --identifier {}' to log in.", host, user.username);

    Ok(())
}
