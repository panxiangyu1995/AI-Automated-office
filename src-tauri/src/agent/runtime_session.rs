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
        };

        self.storage
            .session_store()
            .create(&session)
            .await
            .map_err(|err| AgentError::Storage(err.to_string()))?;

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
        };

        self.storage
            .session_store()
            .create(&session)
            .await
            .map_err(|err| AgentError::Storage(err.to_string()))?;

        Ok(session)
    }

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
        };

        self.storage
            .message_store()
            .create(&message)
            .await
            .map_err(|err| AgentError::Storage(err.to_string()))?;

        Ok(message)
    }

    pub async fn list_messages(&self, session_id: &str) -> AgentResult<Vec<Message>> {
        self.storage
            .message_store()
            .list_by_session(session_id)
            .await
            .map_err(|err| AgentError::Storage(err.to_string()))
    }
}
