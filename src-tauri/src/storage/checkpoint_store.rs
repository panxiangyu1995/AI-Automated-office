use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Checkpoint {
    pub id: String,
    pub session_id: String,
    pub created_at: i64,
    pub user_input_preview: Option<String>,
    pub user_input_full: Option<String>,
    pub conversation_turn: Option<i64>,
    pub message_ids: Option<serde_json::Value>,
    pub git_commit_hash: Option<String>,
    pub git_commit_message: Option<String>,
    pub artifacts: Option<serde_json::Value>,
    pub is_important: bool,
    pub is_active: bool,
    pub branch_id: Option<String>,
    pub parent_checkpoint_id: Option<String>,
}

#[derive(Clone)]
pub struct CheckpointStore {
    pool: SqlitePool,
}

impl CheckpointStore {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, checkpoint: &Checkpoint) -> Result<()> {
        let message_ids = checkpoint
            .message_ids
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;
        let artifacts = checkpoint
            .artifacts
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;

        sqlx::query(
            "INSERT INTO checkpoints (id, session_id, created_at, user_input_preview, user_input_full, conversation_turn, message_ids, git_commit_hash, git_commit_message, artifacts, is_important, is_active, branch_id, parent_checkpoint_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        )
        .bind(&checkpoint.id)
        .bind(&checkpoint.session_id)
        .bind(checkpoint.created_at)
        .bind(&checkpoint.user_input_preview)
        .bind(&checkpoint.user_input_full)
        .bind(checkpoint.conversation_turn)
        .bind(message_ids)
        .bind(&checkpoint.git_commit_hash)
        .bind(&checkpoint.git_commit_message)
        .bind(artifacts)
        .bind(if checkpoint.is_important { 1 } else { 0 })
        .bind(if checkpoint.is_active { 1 } else { 0 })
        .bind(&checkpoint.branch_id)
        .bind(&checkpoint.parent_checkpoint_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<Checkpoint>> {
        let row = sqlx::query(
            "SELECT id, session_id, created_at, user_input_preview, user_input_full, conversation_turn, message_ids, git_commit_hash, git_commit_message, artifacts, is_important, is_active, branch_id, parent_checkpoint_id
             FROM checkpoints WHERE id = ? LIMIT 1;",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(map_checkpoint))
    }

    pub async fn list_by_session(&self, session_id: &str) -> Result<Vec<Checkpoint>> {
        let rows = sqlx::query(
            "SELECT id, session_id, created_at, user_input_preview, user_input_full, conversation_turn, message_ids, git_commit_hash, git_commit_message, artifacts, is_important, is_active, branch_id, parent_checkpoint_id
             FROM checkpoints WHERE session_id = ? ORDER BY created_at DESC;",
        )
        .bind(session_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_checkpoint).collect())
    }

    pub async fn update_active(&self, id: &str, is_active: bool) -> Result<()> {
        sqlx::query("UPDATE checkpoints SET is_active = ? WHERE id = ?;")
            .bind(if is_active { 1 } else { 0 })
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

fn map_checkpoint(row: sqlx::sqlite::SqliteRow) -> Checkpoint {
    let message_ids: Option<String> = row.try_get("message_ids").unwrap_or(None);
    let message_ids = message_ids
        .and_then(|value| serde_json::from_str(&value).ok());
    let artifacts: Option<String> = row.try_get("artifacts").unwrap_or(None);
    let artifacts = artifacts
        .and_then(|value| serde_json::from_str(&value).ok());

    Checkpoint {
        id: row.get("id"),
        session_id: row.get("session_id"),
        created_at: row.get("created_at"),
        user_input_preview: row.get("user_input_preview"),
        user_input_full: row.get("user_input_full"),
        conversation_turn: row.get("conversation_turn"),
        message_ids,
        git_commit_hash: row.get("git_commit_hash"),
        git_commit_message: row.get("git_commit_message"),
        artifacts,
        is_important: row.get::<i64, _>("is_important") != 0,
        is_active: row.get::<i64, _>("is_active") != 0,
        branch_id: row.get("branch_id"),
        parent_checkpoint_id: row.get("parent_checkpoint_id"),
    }
}
