use anyhow::{Context, Result};
use directories::ProjectDirs;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous};
use sqlx::SqlitePool;
use std::env;
use std::fs;
use std::path::PathBuf;

pub fn database_path(tenant_id: &str) -> Result<PathBuf> {
    if let Ok(base_dir) = env::var("AI_OFFICE_DATA_DIR") {
        let base = PathBuf::from(base_dir);
        return Ok(base.join(tenant_id).join("local.db"));
    }

    let project_dirs =
        ProjectDirs::from("com", "ai-automated-office", "AI-Automated-office")
            .context("failed to locate app data directory")?;
    let base_dir = project_dirs.data_local_dir().to_path_buf();
    Ok(base_dir.join(tenant_id).join("local.db"))
}

pub async fn create_pool(tenant_id: &str) -> Result<SqlitePool> {
    let db_path = database_path(tenant_id)?;
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent).context("failed to create database directory")?;
    }

    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await
        .context("failed to connect sqlite")?;

    sqlx::query("PRAGMA foreign_keys = ON;")
        .execute(&pool)
        .await
        .context("failed to enable foreign keys")?;

    Ok(pool)
}
