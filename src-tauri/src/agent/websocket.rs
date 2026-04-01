//! WebSocket Integration Module
//!
//! Implements WebSocket client for real-time bidirectional communication
//! between backend and frontend. Supports:
//! - Event streaming from backend to frontend
//! - Message sync status updates
//! - Heartbeat mechanism
//! - Reconnection with exponential backoff

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tokio::sync::{RwLock, broadcast};
use tokio::time::interval;
use uuid::Uuid;

/// WebSocket event types for bidirectional communication
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum WebSocketEvent {
    /// Ping/pong heartbeat
    Ping { timestamp: i64 },
    Pong { timestamp: i64 },
    
    /// Agent runtime events
    SessionStart { session_id: String, payload: Option<serde_json::Value> },
    SessionEnd { session_id: String, payload: Option<serde_json::Value> },
    MessageStart { message_id: String, payload: Option<serde_json::Value> },
    MessageEnd { message_id: String, payload: Option<serde_json::Value> },
    ToolCall { message_id: String, payload: Option<serde_json::Value> },
    ToolResult { message_id: String, payload: Option<serde_json::Value> },
    PartDelta { message_id: String, content: String },
    Error { code: String, message: String },
    
    /// Sync events
    SyncStatus { status: String, pending: u32 },
    SyncComplete { synced_at: i64 },
    
    /// Connection events
    Connected { session_id: String },
    Disconnected { reason: Option<String> },
}

/// WebSocket client state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketState {
    pub session_id: String,
    pub is_connected: bool,
    pub last_pong_at: Option<i64>,
    pub reconnect_attempts: u32,
    pub max_reconnect_attempts: u32,
    pub reconnect_delay_ms: u64,
}

/// WebSocket event emitter for broadcasting events to listeners
#[derive(Clone)]
pub struct WebSocketEventEmitter {
    sender: broadcast::Sender<WebSocketEvent>,
    state: Arc<RwLock<WebSocketState>>,
}

impl WebSocketEventEmitter {
    /// Create a new WebSocket event emitter
    pub fn new(session_id: String) -> Self {
        let (sender, _) = broadcast::channel(1000);
        let state = WebSocketState {
            session_id,
            is_connected: false,
            last_pong_at: None,
            reconnect_attempts: 0,
            max_reconnect_attempts: 5,
            reconnect_delay_ms: 1000,
        };
        
        Self {
            sender,
            state: Arc::new(RwLock::new(state)),
        }
    }
    
    /// Subscribe to events
    pub fn subscribe(&self) -> broadcast::Receiver<WebSocketEvent> {
        self.sender.subscribe()
    }
    
    /// Emit an event to all subscribers
    pub async fn emit(&self, event: WebSocketEvent) {
        let _ = self.sender.send(event);
    }
    
    /// Emit session start event
    pub async fn session_start(&self, session_id: String, payload: Option<serde_json::Value>) {
        self.emit(WebSocketEvent::SessionStart { session_id, payload }).await;
    }
    
    /// Emit session end event
    pub async fn session_end(&self, session_id: String, payload: Option<serde_json::Value>) {
        self.emit(WebSocketEvent::SessionEnd { session_id, payload }).await;
    }
    
    /// Emit message start event
    pub async fn message_start(&self, message_id: String, payload: Option<serde_json::Value>) {
        self.emit(WebSocketEvent::MessageStart { message_id, payload }).await;
    }
    
    /// Emit message end event
    pub async fn message_end(&self, message_id: String, payload: Option<serde_json::Value>) {
        self.emit(WebSocketEvent::MessageEnd { message_id, payload }).await;
    }
    
    /// Emit part delta for streaming
    pub async fn part_delta(&self, message_id: String, content: String) {
        self.emit(WebSocketEvent::PartDelta { message_id, content }).await;
    }
    
    /// Emit tool call event
    pub async fn tool_call(&self, message_id: String, payload: Option<serde_json::Value>) {
        self.emit(WebSocketEvent::ToolCall { message_id, payload }).await;
    }
    
    /// Emit tool result event
    pub async fn tool_result(&self, message_id: String, payload: Option<serde_json::Value>) {
        self.emit(WebSocketEvent::ToolResult { message_id, payload }).await;
    }
    
    /// Emit error event
    pub async fn error(&self, code: String, message: String) {
        self.emit(WebSocketEvent::Error { code, message }).await;
    }
    
    /// Emit sync status
    pub async fn sync_status(&self, status: String, pending: u32) {
        self.emit(WebSocketEvent::SyncStatus { status, pending }).await;
    }
    
    /// Emit connected event
    pub async fn connected(&self) {
        let mut state = self.state.write().await;
        state.is_connected = true;
        state.reconnect_attempts = 0;
        drop(state);
        
        let session_id = self.state.read().await.session_id.clone();
        self.emit(WebSocketEvent::Connected { session_id }).await;
    }
    
    /// Emit disconnected event
    pub async fn disconnected(&self, reason: Option<String>) {
        let mut state = self.state.write().await;
        state.is_connected = false;
        drop(state);
        
        self.emit(WebSocketEvent::Disconnected { reason }).await;
    }
    
    /// Update pong timestamp
    pub async fn update_pong(&self) {
        let mut state = self.state.write().await;
        state.last_pong_at = Some(chrono::Utc::now().timestamp_millis());
    }
    
    /// Get current state
    pub async fn get_state(&self) -> WebSocketState {
        self.state.read().await.clone()
    }
    
    /// Check if connected
    pub async fn is_connected(&self) -> bool {
        self.state.read().await.is_connected
    }
    
    /// Increment reconnect attempts
    pub async fn increment_reconnect(&self) -> u32 {
        let mut state = self.state.write().await;
        state.reconnect_attempts += 1;
        state.reconnect_attempts
    }
    
    /// Calculate reconnect delay with exponential backoff
    pub async fn get_reconnect_delay(&self) -> Duration {
        let state = self.state.read().await;
        let delay = state.reconnect_delay_ms * 2_u64.pow(state.reconnect_attempts.min(5));
        Duration::from_millis(delay.min(30000)) // Max 30 seconds
    }
}

/// WebSocket manager for handling multiple connections
#[derive(Clone)]
pub struct WebSocketManager {
    emitters: Arc<RwLock<HashMap<String, WebSocketEventEmitter>>>,
}

impl WebSocketManager {
    /// Create a new WebSocket manager
    pub fn new() -> Self {
        Self {
            emitters: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Create a new session emitter
    pub async fn create_session(&self, session_id: String) -> WebSocketEventEmitter {
        let emitter = WebSocketEventEmitter::new(session_id.clone());
        let mut emitters = self.emitters.write().await;
        emitters.insert(session_id, emitter.clone());
        emitter
    }
    
    /// Get an existing session emitter
    pub async fn get_session(&self, session_id: &str) -> Option<WebSocketEventEmitter> {
        let emitters = self.emitters.read().await;
        emitters.get(session_id).cloned()
    }
    
    /// Remove a session
    pub async fn remove_session(&self, session_id: &str) {
        let mut emitters = self.emitters.write().await;
        emitters.remove(session_id);
    }
    
    /// Get all active sessions
    pub async fn get_active_sessions(&self) -> Vec<String> {
        let emitters = self.emitters.read().await;
        emitters.keys().cloned().collect()
    }
    
    /// Broadcast to all sessions
    pub async fn broadcast(&self, event: WebSocketEvent) {
        let emitters = self.emitters.read().await;
        for emitter in emitters.values() {
            let _ = emitter.sender.send(event.clone());
        }
    }
}

impl Default for WebSocketManager {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

use tauri::State;

/// Create a new WebSocket session
#[tauri::command]
pub async fn create_websocket_session(
    session_id: Option<String>,
    manager: State<'_, Arc<WebSocketManager>>,
) -> Result<String, String> {
    let id = session_id.unwrap_or_else(|| format!("ws-session-{}", Uuid::new_v4()));
    let _emitter = manager.create_session(id.clone()).await;
    tracing::info!("WebSocket session created: {}", id);
    Ok(id)
}

/// Get WebSocket session state
#[tauri::command]
pub async fn get_websocket_state(
    session_id: String,
    manager: State<'_, Arc<WebSocketManager>>,
) -> Result<WebSocketState, String> {
    let emitter = manager
        .get_session(&session_id)
        .await
        .ok_or_else(|| format!("Session not found: {}", session_id))?;
    
    Ok(emitter.get_state().await)
}

/// Check if WebSocket session is connected
#[tauri::command]
pub async fn is_websocket_connected(
    session_id: String,
    manager: State<'_, Arc<WebSocketManager>>,
) -> Result<bool, String> {
    let emitter = manager
        .get_session(&session_id)
        .await
        .ok_or_else(|| format!("Session not found: {}", session_id))?;
    
    Ok(emitter.is_connected().await)
}

/// Close a WebSocket session
#[tauri::command]
pub async fn close_websocket_session(
    session_id: String,
    manager: State<'_, Arc<WebSocketManager>>,
) -> Result<(), String> {
    manager.remove_session(&session_id).await;
    tracing::info!("WebSocket session closed: {}", session_id);
    Ok(())
}

/// Emit an event to a WebSocket session
#[tauri::command]
pub async fn emit_websocket_event(
    session_id: String,
    event: WebSocketEvent,
    manager: State<'_, Arc<WebSocketManager>>,
) -> Result<(), String> {
    let emitter = manager
        .get_session(&session_id)
        .await
        .ok_or_else(|| format!("Session not found: {}", session_id))?;
    
    emitter.emit(event).await;
    Ok(())
}

/// Get all active WebSocket sessions
#[tauri::command]
pub async fn get_active_websocket_sessions(
    manager: State<'_, Arc<WebSocketManager>>,
) -> Result<Vec<String>, String> {
    Ok(manager.get_active_sessions().await)
}
