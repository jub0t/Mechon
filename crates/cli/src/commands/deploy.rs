use anyhow::{Context, Result};
use colored::Colorize;
use indicatif::{ProgressBar, ProgressStyle};
use std::io::Write;
use std::path::Path;
use uuid::Uuid;

pub async fn deploy(bot_id: Uuid, path: &Path, entrypoint: Option<String>) -> Result<()> {
    let (client, _) = crate::require_auth()?;

    // If path is a directory, zip it in memory; if it's already a .zip, read it directly
    let archive_bytes = if path.is_dir() {
        println!("{} Zipping {}...", "→".blue(), path.display());
        zip_directory(path).context("Failed to zip directory")?
    } else if path.extension().and_then(|e| e.to_str()) == Some("zip") {
        std::fs::read(path).with_context(|| format!("Failed to read {:?}", path))?
    } else {
        anyhow::bail!("Path must be a directory or a .zip file");
    };

    let size_kb = archive_bytes.len() / 1024;
    println!("{} Uploading {} KB...", "→".blue(), size_kb);

    let pb = ProgressBar::new_spinner();
    pb.set_style(ProgressStyle::default_spinner().template("{spinner} {msg}").unwrap());
    pb.set_message("Uploading...");
    pb.enable_steady_tick(std::time::Duration::from_millis(100));

    let version = client.deploy(bot_id, archive_bytes, entrypoint).await?;

    pb.finish_and_clear();

    println!(
        "{} Deployed version {} (entrypoint: {})",
        "✓".green(),
        version.version.to_string().bold(),
        version.entrypoint
    );

    Ok(())
}

pub async fn list_versions(bot_id: Uuid) -> Result<()> {
    let (client, _) = crate::require_auth()?;
    let resp = client.list_versions(bot_id).await?;

    if resp.versions.is_empty() {
        println!("No versions yet. Deploy with 'mechon deploy'.");
        return Ok(());
    }

    println!(
        "{:<6} {:<40} {:<14} {:<22}",
        "VER".dimmed(),
        "ARCHIVE KEY".dimmed(),
        "ENTRYPOINT".dimmed(),
        "UPLOADED".dimmed()
    );

    for v in &resp.versions {
        println!(
            "{:<6} {:<40} {:<14} {:<22}",
            v.version,
            v.archive_key,
            v.entrypoint,
            v.uploaded_at.format("%Y-%m-%d %H:%M UTC")
        );
    }

    Ok(())
}

pub async fn rollback(bot_id: Uuid, version: i32) -> Result<()> {
    let (client, _) = crate::require_auth()?;
    let v = client.activate_version(bot_id, version).await?;
    println!("{} Rolled back to version {}", "✓".green(), v.version);
    Ok(())
}

// ============================================================
// ZIP HELPER
// ============================================================

fn zip_directory(dir: &Path) -> Result<Vec<u8>> {
    use zip::{write::FileOptions, CompressionMethod, ZipWriter};

    let buf = std::io::Cursor::new(Vec::new());
    let mut zip = ZipWriter::new(buf);
    let options = FileOptions::<()>::default().compression_method(CompressionMethod::Deflated);

    add_dir_to_zip(&mut zip, dir, dir, &options)?;

    let cursor = zip.finish()?;
    Ok(cursor.into_inner())
}

fn add_dir_to_zip<W: std::io::Write + std::io::Seek>(

    zip: &mut zip::ZipWriter<W>,
    base: &Path,
    dir: &Path,
    options: &zip::write::FileOptions<()>,
) -> Result<()> {
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let name = path.strip_prefix(base)?.to_str().unwrap_or_default().replace('\\', "/");

        // Skip node_modules and hidden directories
        if name.starts_with("node_modules") || name.starts_with('.') {
            continue;
        }

        if path.is_dir() {
            zip.add_directory(&name, *options)?;
            add_dir_to_zip(zip, base, &path, options)?;
        } else {
            zip.start_file(&name, *options)?;
            let contents = std::fs::read(&path)?;
            zip.write_all(&contents)?;
        }
    }

    Ok(())
}
