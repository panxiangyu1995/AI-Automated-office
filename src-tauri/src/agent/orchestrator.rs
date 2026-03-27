use std::collections::HashSet;
use std::sync::Arc;

use tokio::sync::RwLock;
use uuid::Uuid;
use chrono::Utc;

use super::events::RuntimeEventEmitter;
use super::provider::{AgentProvider, ProviderRequest};
use super::runtime_session::RuntimeSessionService;
use super::{
    AgentError,
    AgentExecutionRequest,
    AgentExecutionResponse,
    AgentExecutionStatus,
    AgentMessage,
    AgentResult,
};

#[derive(Clone)]
pub struct AgentOrchestrator {
    provider: Arc<dyn AgentProvider>,
    runtime: RuntimeSessionService,
    cancellations: Arc<RwLock<HashSet<String>>>,
}

impl AgentOrchestrator {
    pub fn new(
        provider: Arc<dyn AgentProvider>,
        runtime: RuntimeSessionService,
        cancellations: Arc<RwLock<HashSet<String>>>,
    ) -> Self {
        Self {
            provider,
            runtime,
            cancellations,
        }
    }

    pub async fn interrupt(&self, session_id: &str) -> bool {
        let mut cancellations = self.cancellations.write().await;
        cancellations.insert(session_id.to_string())
    }

    async fn clear_interrupt(&self, session_id: &str) {
        let mut cancellations = self.cancellations.write().await;
        cancellations.remove(session_id);
    }

    async fn is_interrupted(&self, session_id: &str) -> bool {
        let cancellations = self.cancellations.read().await;
        cancellations.contains(session_id)
    }

    pub async fn execute(
        &self,
        request: AgentExecutionRequest,
    ) -> AgentResult<AgentExecutionResponse> {
        self.execute_with_events(request, None).await
    }

    pub async fn execute_with_events(
        &self,
        request: AgentExecutionRequest,
        mut emitter: Option<&mut RuntimeEventEmitter>,
    ) -> AgentResult<AgentExecutionResponse> {
        self.clear_interrupt(&request.session_id).await;
        if self.is_interrupted(&request.session_id).await {
            return Err(AgentError::Interrupted);
        }

        let start_time = Utc::now().timestamp_millis();
        let trace_id = Uuid::new_v4().to_string();
        self.runtime
            .ensure_session(&request.session_id, &request.user_id)
            .await?;

        if let Some(event_emitter) = emitter.as_deref_mut() {
            event_emitter.session_start(Some(serde_json::json!({
                "userId": request.user_id,
                "traceId": trace_id,
            })));
        }

        let user_metadata = with_trace_metadata(request.metadata.clone(), &trace_id, "user");
        let user_message = self.runtime
            .append_message(
                &request.session_id,
                "user",
                Some(request.message.clone()),
                user_metadata,
            )
            .await?;

        if let Some(event_emitter) = emitter.as_deref_mut() {
            let payload = serde_json::json!({
                "role": "user",
                "content": request.message,
            });
            event_emitter.message_start(user_message.id.clone(), payload.clone());
            event_emitter.message_end(user_message.id.clone(), payload);
        }

        let history = self.runtime.list_messages(&request.session_id).await?;
        let mut messages = Vec::new();
        for message in history {
            if let Some(content) = message.content {
                messages.push(AgentMessage {
                    role: message.role,
                    content,
                    metadata: message.metadata,
                });
            }
        }

        let provider_response = match self
            .provider
            .complete(ProviderRequest {
                session_id: request.session_id.clone(),
                trace_id: trace_id.clone(),
                messages,
                metadata: None,
            })
            .await
        {
            Ok(response) => response,
            Err(err) => {
                if let Some(event_emitter) = emitter.as_deref_mut() {
                    event_emitter.error(serde_json::json!({
                        "code": "UNKNOWN_ERROR",
                        "message": err.to_string(),
                        "recoverable": false
                    }));
                    let duration = Utc::now().timestamp_millis() - start_time;
                    event_emitter.session_end(serde_json::json!({
                        "reason": "error",
                        "duration": duration,
                    }));
                }
                return Err(err);
            }
        };

        if self.is_interrupted(&request.session_id).await {
            return Ok(AgentExecutionResponse {
                session_id: request.session_id,
                trace_id,
                status: AgentExecutionStatus::Interrupted,
                content: None,
                error: Some("execution interrupted".to_string()),
            });
        }

        let assistant_metadata =
            with_trace_metadata(provider_response.metadata.clone(), &trace_id, "assistant");
        let assistant_message = self.runtime
            .append_message(
                &request.session_id,
                "assistant",
                Some(provider_response.content.clone()),
                assistant_metadata,
            )
            .await?;

        if let Some(event_emitter) = emitter.as_deref_mut() {
            let payload = serde_json::json!({
                "role": "assistant",
                "content": provider_response.content,
            });
            event_emitter.message_start(assistant_message.id.clone(), payload.clone());
            event_emitter.message_end(assistant_message.id.clone(), payload);
        }

        if let Some(event_emitter) = emitter.as_deref_mut() {
            let duration = Utc::now().timestamp_millis() - start_time;
            event_emitter.session_end(serde_json::json!({
                "reason": "completed",
                "duration": duration,
            }));
        }

        Ok(AgentExecutionResponse {
            session_id: request.session_id,
            trace_id,
            status: AgentExecutionStatus::Completed,
            content: Some(provider_response.content),
            error: None,
        })
    }
}

fn with_trace_metadata(
    metadata: Option<serde_json::Value>,
    trace_id: &str,
    role: &str,
) -> Option<serde_json::Value> {
    let mut base = metadata.unwrap_or_else(|| serde_json::json!({}));
    if let Some(map) = base.as_object_mut() {
        map.insert("trace_id".to_string(), serde_json::Value::String(trace_id.to_string()));
        map.insert("role".to_string(), serde_json::Value::String(role.to_string()));
        Some(base)
    } else {
        Some(serde_json::json!({
            "trace_id": trace_id,
            "role": role,
            "metadata": base
        }))
    }
}
