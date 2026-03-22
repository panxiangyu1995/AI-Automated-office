use anyhow::{anyhow, Result};
use sqlx::{Row, SqlitePool};

pub mod checkpoint_store;
pub mod memory_store;
pub mod message_store;
pub mod migrations;
pub mod session_store;
pub mod sqlite;
pub mod sync_queue;

use checkpoint_store::CheckpointStore;
use memory_store::MemoryStore;
use message_store::MessageStore;
use session_store::SessionStore;
use sync_queue::SyncQueueStore;

pub struct StorageManager {
    pool: SqlitePool,
    tenant_id: String,
}

impl StorageManager {
    pub async fn init(tenant_id: &str) -> Result<Self> {
        let pool = sqlite::create_pool(tenant_id).await?;
        migrations::run_migrations(&pool).await?;
        Ok(Self {
            pool,
            tenant_id: tenant_id.to_string(),
        })
    }

    pub fn tenant_id(&self) -> &str {
        &self.tenant_id
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }

    pub fn session_store(&self) -> SessionStore {
        SessionStore::new(self.pool.clone())
    }

    pub fn message_store(&self) -> MessageStore {
        MessageStore::new(self.pool.clone())
    }

    pub fn sync_queue_store(&self) -> SyncQueueStore {
        SyncQueueStore::new(self.pool.clone())
    }

    pub fn memory_store(&self) -> MemoryStore {
        MemoryStore::new(self.pool.clone())
    }

    pub fn checkpoint_store(&self) -> CheckpointStore {
        CheckpointStore::new(self.pool.clone())
    }
}

pub async fn verify_startup(tenant_id: &str) -> Result<()> {
    let manager = StorageManager::init(tenant_id).await?;
    let required_tables = [
        "schema_version",
        "sessions",
        "messages",
        "sync_queue",
        "memory_facts",
        "checkpoints",
        "context_summaries",
    ];

    for table in required_tables {
        let row = sqlx::query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?;")
            .bind(table)
            .fetch_optional(manager.pool())
            .await?;
        let exists = row
            .and_then(|record| record.try_get::<String, _>("name").ok())
            .is_some();
        if !exists {
            return Err(anyhow!("缺少表: {}", table));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::verify_startup;
    use std::env;
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[tokio::test]
    async fn test_verify_startup() {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or(0);
        let tenant_id = format!("test-tenant-{}", suffix);
        let base_dir: PathBuf = env::temp_dir().join("ai-office-storage-tests");
        let _ = fs::create_dir_all(&base_dir);
        env::set_var("AI_OFFICE_DATA_DIR", &base_dir);
        let result = verify_startup(&tenant_id).await;
        env::remove_var("AI_OFFICE_DATA_DIR");
        assert!(result.is_ok());
    }
}
