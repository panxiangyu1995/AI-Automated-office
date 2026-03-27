use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RuntimeEventType {
    SessionStart,
    SessionEnd,
    MessageStart,
    MessageEnd,
    ToolCall,
    ToolResult,
    Error,
    Warning,
    Debug,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeEvent {
    pub id: String,
    #[serde(rename = "type")]
    pub event_type: RuntimeEventType,
    pub session_id: String,
    pub timestamp: i64,
    pub sequence: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payload: Option<serde_json::Value>,
}

#[derive(Clone)]
pub struct RuntimeEventEmitter {
    app: AppHandle,
    session_id: String,
    sequence: u64,
}

impl RuntimeEventEmitter {
    pub fn new(app: AppHandle, session_id: String) -> Self {
        Self {
            app,
            session_id,
            sequence: 0,
        }
    }

    fn next_sequence(&mut self) -> u64 {
        self.sequence += 1;
        self.sequence
    }

    fn emit(&mut self, event_type: RuntimeEventType, message_id: Option<String>, payload: Option<serde_json::Value>) {
        let event = RuntimeEvent {
            id: Uuid::new_v4().to_string(),
            event_type,
            session_id: self.session_id.clone(),
            timestamp: chrono::Utc::now().timestamp_millis(),
            sequence: self.next_sequence(),
            message_id,
            payload,
        };

        if let Err(err) = self.app.emit_all("agent_runtime_event", event) {
            tracing::warn!("failed to emit runtime event: {}", err);
        }
    }

    pub fn session_start(&mut self, metadata: Option<serde_json::Value>) {
        self.emit(RuntimeEventType::SessionStart, None, metadata);
    }

    pub fn session_end(&mut self, payload: serde_json::Value) {
        self.emit(RuntimeEventType::SessionEnd, None, Some(payload));
    }

    pub fn message_start(&mut self, message_id: String, payload: serde_json::Value) {
        self.emit(RuntimeEventType::MessageStart, Some(message_id), Some(payload));
    }

    pub fn message_end(&mut self, message_id: String, payload: serde_json::Value) {
        self.emit(RuntimeEventType::MessageEnd, Some(message_id), Some(payload));
    }

    pub fn tool_call(&mut self, message_id: Option<String>, payload: serde_json::Value) {
        self.emit(RuntimeEventType::ToolCall, message_id, Some(payload));
    }

    pub fn tool_result(&mut self, message_id: Option<String>, payload: serde_json::Value) {
        self.emit(RuntimeEventType::ToolResult, message_id, Some(payload));
    }

    pub fn error(&mut self, payload: serde_json::Value) {
        self.emit(RuntimeEventType::Error, None, Some(payload));
    }
}
