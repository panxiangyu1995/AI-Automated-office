use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: Option<String>,
    pub tool_calls: Option<serde_json::Value>,
    pub tool_call_id: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: i64,
}

#[derive(Clone)]
pub struct MessageStore {
    pool: SqlitePool,
}

impl MessageStore {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, message: &Message) -> Result<()> {
        let tool_calls = message
            .tool_calls
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;
        let metadata = message
            .metadata
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;

        sqlx::query(
            "INSERT INTO messages (id, session_id, role, content, tool_calls, tool_call_id, metadata, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
        )
        .bind(&message.id)
        .bind(&message.session_id)
        .bind(&message.role)
        .bind(&message.content)
        .bind(tool_calls)
        .bind(&message.tool_call_id)
        .bind(metadata)
        .bind(message.created_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<Message>> {
        let row = sqlx::query(
            "SELECT id, session_id, role, content, tool_calls, tool_call_id, metadata, created_at
             FROM messages WHERE id = ? LIMIT 1;",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(map_message))
    }

    pub async fn list_by_session(&self, session_id: &str) -> Result<Vec<Message>> {
        let rows = sqlx::query(
            "SELECT id, session_id, role, content, tool_calls, tool_call_id, metadata, created_at
             FROM messages WHERE session_id = ? ORDER BY created_at ASC;",
        )
        .bind(session_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_message).collect())
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM messages WHERE id = ?;")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

fn map_message(row: sqlx::sqlite::SqliteRow) -> Message {
    let tool_calls: Option<String> = row.try_get("tool_calls").unwrap_or(None);
    let tool_calls = tool_calls
        .and_then(|value| serde_json::from_str(&value).ok());
    let metadata: Option<String> = row.try_get("metadata").unwrap_or(None);
    let metadata = metadata
        .and_then(|value| serde_json::from_str(&value).ok());

    Message {
        id: row.get("id"),
        session_id: row.get("session_id"),
        role: row.get("role"),
        content: row.get("content"),
        tool_calls,
        tool_call_id: row.get("tool_call_id"),
        metadata,
        created_at: row.get("created_at"),
    }
}
