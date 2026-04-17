use anyhow::Result;
use sqlx::{Row, SqlitePool};
use std::time::{SystemTime, UNIX_EPOCH};

mod v1_initial;
mod v2_context_summaries;
mod v3_users;
mod v4_session_summaries;
mod v5_provider_tables;
mod v6_provider_routing_config;
mod v7_tenant_tables;
mod v8_users_tenant_id;
mod v9_store_tenant_id;
mod v10_template_tables;
mod v11_template_schema_json;
mod v12_dashboard_tables;
mod v13_workflow_tables;

pub struct Migration {
    pub version: i64,
    pub name: &'static str,
    pub up: &'static str,
    pub down: Option<&'static str>,
}

fn now_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

pub fn all_migrations() -> Vec<Migration> {
    vec![
        v1_initial::migration(),
        v2_context_summaries::migration(),
        v3_users::migration(),
        v4_session_summaries::migration(),
        v5_provider_tables::migration(),
        v6_provider_routing_config::migration(),
        v7_tenant_tables::migration(),
        v8_users_tenant_id::migration(),
        v9_store_tenant_id::migration(),
        v10_template_tables::migration(),
        v11_template_schema_json::migration(),
        v12_dashboard_tables::migration(),
        v13_workflow_tables::migration(),
    ]
}

pub async fn run_migrations(pool: &SqlitePool) -> Result<()> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY,
            applied_at INTEGER NOT NULL,
            description TEXT
        );",
    )
    .execute(pool)
    .await?;

    let row = sqlx::query("SELECT MAX(version) as version FROM schema_version;")
        .fetch_one(pool)
        .await?;
    let current_version: i64 = row.try_get::<Option<i64>, _>("version")?.unwrap_or(0);

    let mut migrations = all_migrations();
    migrations.sort_by_key(|m| m.version);

    for migration in migrations.into_iter().filter(|m| m.version > current_version) {
        sqlx::query(migration.up).execute(pool).await?;
        sqlx::query(
            "INSERT INTO schema_version (version, applied_at, description) VALUES (?, ?, ?);",
        )
        .bind(migration.version)
        .bind(now_timestamp())
        .bind(migration.name)
        .execute(pool)
        .await?;
    }

    Ok(())
}
