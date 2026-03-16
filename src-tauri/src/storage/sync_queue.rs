use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncQueueItem {
    pub id: String,
    pub operation: String,
    pub entity_type: String,
    pub entity_id: String,
    pub payload: Option<serde_json::Value>,
    pub created_at: i64,
    pub retry_count: i64,
    pub max_retries: i64,
    pub last_error: Option<String>,
    pub status: String,
    pub processed_at: Option<i64>,
}

#[derive(Clone)]
pub struct SyncQueueStore {
    pool: SqlitePool,
}

impl SyncQueueStore {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn enqueue(&self, item: &SyncQueueItem) -> Result<()> {
        let payload = item
            .payload
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;

        sqlx::query(
            "INSERT INTO sync_queue (id, operation, entity_type, entity_id, payload, created_at, retry_count, max_retries, last_error, status, processed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        )
        .bind(&item.id)
        .bind(&item.operation)
        .bind(&item.entity_type)
        .bind(&item.entity_id)
        .bind(payload)
        .bind(item.created_at)
        .bind(item.retry_count)
        .bind(item.max_retries)
        .bind(&item.last_error)
        .bind(&item.status)
        .bind(item.processed_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<SyncQueueItem>> {
        let row = sqlx::query(
            "SELECT id, operation, entity_type, entity_id, payload, created_at, retry_count, max_retries, last_error, status, processed_at
             FROM sync_queue WHERE id = ? LIMIT 1;",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(map_item))
    }

    pub async fn list_pending(&self, limit: i64) -> Result<Vec<SyncQueueItem>> {
        let rows = sqlx::query(
            "SELECT id, operation, entity_type, entity_id, payload, created_at, retry_count, max_retries, last_error, status, processed_at
             FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?;",
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_item).collect())
    }

    pub async fn update_status(&self, id: &str, status: &str, last_error: Option<&str>) -> Result<()> {
        sqlx::query(
            "UPDATE sync_queue SET status = ?, last_error = ? WHERE id = ?;",
        )
        .bind(status)
        .bind(last_error)
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn update_attempt(
        &self,
        id: &str,
        status: &str,
        retry_count: i64,
        last_error: Option<&str>,
        processed_at: Option<i64>,
    ) -> Result<()> {
        sqlx::query(
            "UPDATE sync_queue SET status = ?, retry_count = ?, last_error = ?, processed_at = ? WHERE id = ?;",
        )
        .bind(status)
        .bind(retry_count)
        .bind(last_error)
        .bind(processed_at)
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}

fn map_item(row: sqlx::sqlite::SqliteRow) -> SyncQueueItem {
    let payload: Option<String> = row.try_get("payload").unwrap_or(None);
    let payload = payload
        .and_then(|value| serde_json::from_str(&value).ok());

    SyncQueueItem {
        id: row.get("id"),
        operation: row.get("operation"),
        entity_type: row.get("entity_type"),
        entity_id: row.get("entity_id"),
        payload,
        created_at: row.get("created_at"),
        retry_count: row.get("retry_count"),
        max_retries: row.get("max_retries"),
        last_error: row.get("last_error"),
        status: row.get("status"),
        processed_at: row.get("processed_at"),
    }
}
