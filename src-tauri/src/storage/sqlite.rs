use anyhow::{Context, Result};
use directories::ProjectDirs;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous};
use sqlx::SqlitePool;
use std::fs;
use std::path::PathBuf;

pub fn database_path(tenant_id: &str) -> Result<PathBuf> {
    let project_dirs = ProjectDirs::from("com", "ai-automated-office", "AI-Automated-office")
        .context("无法获取应用数据目录")?;
    let base_dir = project_dirs.data_local_dir().to_path_buf();
    Ok(base_dir.join("data").join(tenant_id).join("local.db"))
}

pub async fn create_pool(tenant_id: &str) -> Result<SqlitePool> {
    let db_path = database_path(tenant_id)?;
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent).context("无法创建数据库目录")?;
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
        .context("无法连接 SQLite 数据库")?;

    sqlx::query("PRAGMA foreign_keys = ON;")
        .execute(&pool)
        .await
        .context("无法启用外键约束")?;

    Ok(pool)
}
