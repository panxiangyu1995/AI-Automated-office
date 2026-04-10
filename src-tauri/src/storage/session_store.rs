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
    pub tenant_id: String,
}

#[derive(Clone)]
pub struct SessionStore {
    pool: SqlitePool,
    tenant_id: String,
}

impl SessionStore {
    pub fn new(pool: SqlitePool, tenant_id: String) -> Self {
        Self { pool, tenant_id }
    }

    pub async fn create(&self, session: &Session) -> Result<()> {
        let metadata = session
            .metadata
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;

        sqlx::query(
            "INSERT INTO sessions (id, session_key, title, plugin_id, metadata, created_at, updated_at, synced_at, is_deleted, version, tenant_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
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
        .bind(&self.tenant_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<Session>> {
        let row = sqlx::query(
            "SELECT id, session_key, title, plugin_id, metadata, created_at, updated_at, synced_at, is_deleted, version, tenant_id
             FROM sessions WHERE id = ? AND tenant_id = ? LIMIT 1;",
        )
        .bind(id)
        .bind(&self.tenant_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(map_session))
    }

    pub async fn get_by_session_key(&self, session_key: &str) -> Result<Option<Session>> {
        let row = sqlx::query(
            "SELECT id, session_key, title, plugin_id, metadata, created_at, updated_at, synced_at, is_deleted, version, tenant_id
             FROM sessions WHERE session_key = ? AND tenant_id = ? LIMIT 1;",
        )
        .bind(session_key)
        .bind(&self.tenant_id)
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
             WHERE id = ? AND tenant_id = ?;",
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
        .bind(&self.tenant_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn soft_delete(&self, id: &str) -> Result<()> {
        sqlx::query("UPDATE sessions SET is_deleted = 1 WHERE id = ? AND tenant_id = ?;")
            .bind(id)
            .bind(&self.tenant_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn list(&self, include_deleted: bool) -> Result<Vec<Session>> {
        let query = if include_deleted {
            sqlx::query_as::<_, SqliteSessionRow>(
                "SELECT id, session_key, title, plugin_id, metadata, created_at, updated_at, synced_at, is_deleted, version, tenant_id
                 FROM sessions WHERE tenant_id = ? ORDER BY updated_at DESC"
            )
            .bind(&self.tenant_id)
        } else {
            sqlx::query_as::<_, SqliteSessionRow>(
                "SELECT id, session_key, title, plugin_id, metadata, created_at, updated_at, synced_at, is_deleted, version, tenant_id
                 FROM sessions WHERE tenant_id = ? AND is_deleted = 0 ORDER BY updated_at DESC"
            )
            .bind(&self.tenant_id)
        };

        let rows = query.fetch_all(&self.pool).await?;
        Ok(rows.into_iter().map(Session::from).collect())
    }
}

#[derive(Debug, sqlx::FromRow)]
struct SqliteSessionRow {
    id: String,
    session_key: String,
    title: Option<String>,
    plugin_id: Option<String>,
    metadata: Option<String>,
    created_at: i64,
    updated_at: i64,
    synced_at: Option<i64>,
    is_deleted: i64,
    version: i64,
    tenant_id: String,
}

impl From<SqliteSessionRow> for Session {
    fn from(row: SqliteSessionRow) -> Self {
        let metadata = row.metadata
            .and_then(|value| serde_json::from_str(&value).ok());

        Session {
            id: row.id,
            session_key: row.session_key,
            title: row.title,
            plugin_id: row.plugin_id,
            metadata,
            created_at: row.created_at,
            updated_at: row.updated_at,
            synced_at: row.synced_at,
            is_deleted: row.is_deleted != 0,
            version: row.version,
            tenant_id: row.tenant_id,
        }
    }
}

fn map_session(row: sqlx::sqlite::SqliteRow) -> Session {
    let metadata: Option<String> = row.try_get("metadata").unwrap_or(None);
    let metadata = metadata
        .and_then(|value| serde_json::from_str(&value).ok());
    let tenant_id: String = row.try_get("tenant_id").unwrap_or_default();

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
        tenant_id,
    }
}
