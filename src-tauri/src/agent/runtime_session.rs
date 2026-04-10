use chrono::Utc;
use uuid::Uuid;

use crate::storage::{
    message_store::Message,
    session_store::Session,
    StorageManager,
};

use super::{AgentError, AgentResult};

pub struct RuntimeSessionService {
    storage: StorageManager,
    tenant_id: String,
}

impl RuntimeSessionService {
    pub async fn new(tenant_id: &str) -> AgentResult<Self> {
        let storage = StorageManager::init(tenant_id)
            .await
            .map_err(|err| AgentError::Storage(err.to_string()))?;
        Ok(Self {
            storage,
            tenant_id: tenant_id.to_string(),
        })
    }

    /// Get the tenant ID for this session service
    pub fn tenant_id(&self) -> &str {
        &self.tenant_id
    }

    pub async fn ensure_session(&self, session_id: &str, user_id: &str) -> AgentResult<Session> {
        if let Some(existing) = self
            .storage
            .session_store()
            .get_by_id(session_id)
            .await
            .map_err(|err| AgentError::Storage(err.to_string()))?
        {
            return Ok(existing);
        }

        let now = Utc::now().timestamp();
        let session = Session {
            id: session_id.to_string(),
            session_key: format!("agent:{}:{}", user_id, now),
            title: None,
            plugin_id: None,
            metadata: Some(serde_json::json!({
                "created_by": user_id,
                "source": "agent_runtime"
            })),
            created_at: now,
            updated_at: now,
            synced_at: None,
            is_deleted: false,
            version: 1,
            tenant_id: self.tenant_id.clone(),
        };

        // 使用防抖存储，立即保存到缓存（延迟写入数据库）
        self.storage
            .debounced()
            .save_session(session.clone())
            .await;

        Ok(session)
    }

    pub async fn create_session(
        &self,
        user_id: &str,
        title: Option<String>,
    ) -> AgentResult<Session> {
        let now = Utc::now().timestamp();
        let session_id = format!("agent-session-{}", Uuid::new_v4());
        let session = Session {
            id: session_id,
            session_key: format!("agent:{}:{}", user_id, now),
            title,
            plugin_id: None,
            metadata: Some(serde_json::json!({
                "created_by": user_id,
                "source": "agent_runtime"
            })),
            created_at: now,
            updated_at: now,
            synced_at: None,
            is_deleted: false,
            version: 1,
            tenant_id: self.tenant_id.clone(),
        };

        // 使用防抖存储，立即保存到缓存（延迟写入数据库）
        self.storage
            .debounced()
            .save_session(session.clone())
            .await;

        Ok(session)
    }

    /// Append a message to the session (debounced write)
    ///
    /// The message is cached in memory and written to the database
    /// after the debounce delay (default 500ms) or when flush() is called.
    pub async fn append_message(
        &self,
        session_id: &str,
        role: &str,
        content: Option<String>,
        metadata: Option<serde_json::Value>,
    ) -> AgentResult<Message> {
        let message = Message {
            id: format!("msg-{}", Uuid::new_v4()),
            session_id: session_id.to_string(),
            role: role.to_string(),
            content,
            tool_calls: None,
            tool_call_id: None,
            metadata,
            created_at: Utc::now().timestamp(),
            tenant_id: self.tenant_id.clone(),
        };

        // 使用防抖存储，立即保存到缓存（延迟写入数据库）
        self.storage
            .debounced()
            .save_message(message.clone())
            .await;

        Ok(message)
    }

    /// List messages for a session (reads directly from database)
    pub async fn list_messages(&self, session_id: &str) -> AgentResult<Vec<Message>> {
        self.storage
            .message_store()
            .list_by_session(session_id)
            .await
            .map_err(|err| AgentError::Storage(err.to_string()))
    }

    /// Flush all pending writes to the database
    ///
    /// Call this when the session ends or you need to ensure
    /// all cached data is written to the database.
    pub async fn flush(&self) -> AgentResult<()> {
        self.storage
            .debounced()
            .flush()
            .await;
        Ok(())
    }

    /// Get the number of pending session writes
    pub async fn session_pending_count(&self) -> AgentResult<usize> {
        Ok(self.storage.debounced().session_pending_count().await)
    }

    /// Get the number of pending message writes
    pub async fn message_pending_count(&self) -> AgentResult<usize> {
        Ok(self.storage.debounced().message_pending_count().await)
    }
}
