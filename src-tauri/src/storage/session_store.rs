use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub session_key: String,
    pub title: Option<String>,
    pub plugin_id: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: i64,
    pub updated_at: i64,
    pub synced_at: Option<i64>,
    pub is_deleted: bool,
    pub version: i64,
}

#[derive(Clone)]
pub struct SessionStore {
    pool: SqlitePool,
}

impl SessionStore {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, session: &Session) -> Result<()> {
        let metadata = session
            .metadata
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;

        sqlx::query(
            "INSERT INTO sessions (id, session_key, title, plugin_id, metadata, created_at, updated_at, synced_at, is_deleted, version)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        )
        .bind(&session.id)
        .bind(&session.session_key)
        .bind(&session.title)
        .bind(&session.plugin_id)
        .bind(metadata)
        .bind(session.created_at)
        .bind(session.updated_at)
        .bind(session.synced_at)
        .bind(if session.is_deleted { 1 } else { 0 })
        .bind(session.version)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<Session>> {
        let row = sqlx::query(
            "SELECT id, session_key, title, plugin_id, metadata, created_at, updated_at, synced_at, is_deleted, version
             FROM sessions WHERE id = ? LIMIT 1;",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(map_session))
    }

    pub async fn get_by_session_key(&self, session_key: &str) -> Result<Option<Session>> {
        let row = sqlx::query(
            "SELECT id, session_key, title, plugin_id, metadata, created_at, updated_at, synced_at, is_deleted, version
             FROM sessions WHERE session_key = ? LIMIT 1;",
        )
        .bind(session_key)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(map_session))
    }

    pub async fn update(&self, session: &Session) -> Result<()> {
        let metadata = session
            .metadata
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;

        sqlx::query(
            "UPDATE sessions
             SET session_key = ?, title = ?, plugin_id = ?, metadata = ?, created_at = ?, updated_at = ?, synced_at = ?, is_deleted = ?, version = ?
             WHERE id = ?;",
        )
        .bind(&session.session_key)
        .bind(&session.title)
        .bind(&session.plugin_id)
        .bind(metadata)
        .bind(session.created_at)
        .bind(session.updated_at)
        .bind(session.synced_at)
        .bind(if session.is_deleted { 1 } else { 0 })
        .bind(session.version)
        .bind(&session.id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn soft_delete(&self, id: &str) -> Result<()> {
        sqlx::query("UPDATE sessions SET is_deleted = 1 WHERE id = ?;")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

fn map_session(row: sqlx::sqlite::SqliteRow) -> Session {
    let metadata: Option<String> = row.try_get("metadata").unwrap_or(None);
    let metadata = metadata
        .and_then(|value| serde_json::from_str(&value).ok());

    Session {
        id: row.get("id"),
        session_key: row.get("session_key"),
        title: row.get("title"),
        plugin_id: row.get("plugin_id"),
        metadata,
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        synced_at: row.get("synced_at"),
        is_deleted: row.get::<i64, _>("is_deleted") != 0,
        version: row.get("version"),
    }
}
