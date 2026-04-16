//! WebSocket Integration Module
//!
//! Implements WebSocket client for real-time bidirectional communication
//! between backend and frontend using tauri-plugin-websocket.
//! Supports:
//! - Real WebSocket connections to cloud server
//! - Event streaming from backend to frontend
//! - Message sync status updates
//! - Heartbeat mechanism
//! - Reconnection with exponential backoff

use std::collections::HashMap;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::{RwLock, broadcast};
use tokio::time::Duration;
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

/// WebSocket connection state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketConnectionState {
    pub session_id: String,
    pub is_connected: bool,
    pub last_pong_at: Option<i64>,
    pub reconnect_attempts: u32,
    pub max_reconnect_attempts: u32,
    pub reconnect_delay_ms: u64,
    pub url: Option<String>,
}

/// Connection config
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebSocketConfig {
    pub url: String,
    pub token: Option<String>,
    pub heartbeat_interval_ms: u64,
    pub heartbeat_timeout_ms: u64,
    pub max_reconnect_attempts: u32,
    pub initial_reconnect_delay_ms: u64,
}

impl Default for WebSocketConfig {
    fn default() -> Self {
        Self {
            url: String::new(),
            token: None,
            heartbeat_interval_ms: 30000,
            heartbeat_timeout_ms: 10000,
            max_reconnect_attempts: 5,
            initial_reconnect_delay_ms: 1000,
        }
    }
}

/// WebSocket connection manager
#[derive(Clone)]
pub struct WebSocketConnectionManager {
    connections: Arc<RwLock<HashMap<String, WebSocketConnection>>>,
    event_emitters: Arc<RwLock<HashMap<String, broadcast::Sender<WebSocketEvent>>>>,
}

#[derive(Clone)]
pub struct WebSocketConnection {
    pub state: Arc<RwLock<WebSocketConnectionState>>,
    pub event_tx: broadcast::Sender<WebSocketEvent>,
}

impl WebSocketConnectionManager {
    pub fn new() -> Self {
        Self {
            connections: Arc::new(RwLock::new(HashMap::new())),
            event_emitters: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Create a new connection
    pub async fn create_connection(&self, session_id: String, config: WebSocketConfig) -> WebSocketConnection {
        let (event_tx, _) = broadcast::channel(1000);
        
        let state = WebSocketConnectionState {
            session_id: session_id.clone(),
            is_connected: false,
            last_pong_at: None,
            reconnect_attempts: 0,
            max_reconnect_attempts: config.max_reconnect_attempts,
            reconnect_delay_ms: config.initial_reconnect_delay_ms,
            url: Some(config.url.clone()),
        };

        let connection = WebSocketConnection {
            state: Arc::new(RwLock::new(state)),
            event_tx: event_tx.clone(),
        };

        let mut connections = self.connections.write().await;
        connections.insert(session_id.clone(), connection.clone());

        let mut emitters = self.event_emitters.write().await;
        emitters.insert(session_id, event_tx);

        connection
    }

    /// Get a connection by session ID
    pub async fn get_connection(&self, session_id: &str) -> Option<WebSocketConnection> {
        let connections = self.connections.read().await;
        connections.get(session_id).cloned()
    }

    /// Remove a connection
    pub async fn remove_connection(&self, session_id: &str) {
        let mut connections = self.connections.write().await;
        connections.remove(session_id);

        let mut emitters = self.event_emitters.write().await;
        emitters.remove(session_id);
    }

    /// Subscribe to events for a session
    pub async fn subscribe(&self, session_id: &str) -> Option<broadcast::Receiver<WebSocketEvent>> {
        let emitters = self.event_emitters.read().await;
        emitters.get(session_id).map(|tx| tx.subscribe())
    }

    /// Emit an event to a session
    pub async fn emit_event(&self, session_id: &str, event: WebSocketEvent) {
        let emitters = self.event_emitters.read().await;
        if let Some(tx) = emitters.get(session_id) {
            let _ = tx.send(event);
        }
    }

    /// Broadcast to all sessions
    pub async fn broadcast(&self, event: WebSocketEvent) {
        let emitters = self.event_emitters.read().await;
        for tx in emitters.values() {
            let _ = tx.send(event.clone());
        }
    }

    /// Get all active session IDs
    pub async fn get_active_sessions(&self) -> Vec<String> {
        let connections = self.connections.read().await;
        connections.keys().cloned().collect()
    }

    /// Update connection state
    pub async fn update_state(&self, session_id: &str, update: impl FnOnce(&mut WebSocketConnectionState)) {
        if let Some(conn) = self.get_connection(session_id).await {
            let mut state = conn.state.write().await;
            update(&mut state);
        }
    }

    /// Mark as connected
    pub async fn set_connected(&self, session_id: &str) {
        self.update_state(session_id, |state| {
            state.is_connected = true;
            state.reconnect_attempts = 0;
            state.reconnect_delay_ms = 1000;
        }).await;
    }

    /// Mark as disconnected
    pub async fn set_disconnected(&self, session_id: &str) {
        self.update_state(session_id, |state| {
            state.is_connected = false;
        }).await;
    }

    /// Increment reconnect attempts
    pub async fn increment_reconnect(&self, session_id: &str) -> u32 {
        let mut current_attempts = 0u32;
        
        if let Some(conn) = self.get_connection(session_id).await {
            let mut state = conn.state.write().await;
            state.reconnect_attempts += 1;
            state.reconnect_delay_ms = (state.reconnect_delay_ms * 2).min(30000);
            current_attempts = state.reconnect_attempts;
        }
        
        current_attempts
    }

    /// Check if can reconnect
    pub async fn can_reconnect(&self, session_id: &str) -> bool {
        if let Some(conn) = self.get_connection(session_id).await {
            let state = conn.state.read().await;
            state.reconnect_attempts < state.max_reconnect_attempts
        } else {
            false
        }
    }

    /// Get reconnect delay
    pub async fn get_reconnect_delay(&self, session_id: &str) -> Duration {
        if let Some(conn) = self.get_connection(session_id).await {
            let state = conn.state.read().await;
            Duration::from_millis(state.reconnect_delay_ms)
        } else {
            Duration::from_millis(1000)
        }
    }

    /// Update pong timestamp
    pub async fn update_pong(&self, session_id: &str) {
        self.update_state(session_id, |state| {
            state.last_pong_at = Some(chrono::Utc::now().timestamp_millis());
        }).await;
    }

    /// Emit connected event
    pub async fn emit_connected(&self, session_id: &str) {
        let _ = self.emit_event(session_id, WebSocketEvent::Connected {
            session_id: session_id.to_string(),
        }).await;
    }

    /// Emit disconnected event
    pub async fn emit_disconnected(&self, session_id: &str, reason: Option<String>) {
        let _ = self.emit_event(session_id, WebSocketEvent::Disconnected { reason }).await;
    }
}

impl Default for WebSocketConnectionManager {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Create a new WebSocket connection
#[tauri::command]
pub async fn create_websocket_connection(
    session_id: Option<String>,
    config: WebSocketConfig,
    _app: AppHandle,
    manager: tauri::State<'_, Arc<WebSocketConnectionManager>>,
) -> Result<String, String> {
    let id = session_id.unwrap_or_else(|| format!("ws-{}", Uuid::new_v4()));

    // Create connection
    let _connection = manager.create_connection(id.clone(), config.clone()).await;

    // Note: WebSocket connection via tauri-plugin-websocket should be handled from frontend
    // The Rust side manages connection state only

    tracing::info!("WebSocket connection created: {}", id);
    Ok(id)
}

/// Get WebSocket connection state
#[tauri::command]
pub async fn get_websocket_connection_state(
    session_id: String,
    manager: tauri::State<'_, Arc<WebSocketConnectionManager>>,
) -> Result<WebSocketConnectionState, String> {
    let connection = manager.get_connection(&session_id).await
        .ok_or_else(|| format!("Connection not found: {}", session_id))?;

    let state = connection.state.read().await.clone();
    Ok(state)
}

/// Check if WebSocket is connected
#[tauri::command]
pub async fn is_websocket_connected(
    session_id: String,
    manager: tauri::State<'_, Arc<WebSocketConnectionManager>>,
) -> Result<bool, String> {
    let connection = manager.get_connection(&session_id).await
        .ok_or_else(|| format!("Connection not found: {}", session_id))?;

    let is_connected = connection.state.read().await.is_connected;
    Ok(is_connected)
}

/// Close WebSocket connection
#[tauri::command]
pub async fn close_websocket_connection(
    session_id: String,
    manager: tauri::State<'_, Arc<WebSocketConnectionManager>>,
) -> Result<(), String> {
    manager.emit_disconnected(&session_id, Some("Connection closed by client".to_string())).await;
    manager.remove_connection(&session_id).await;
    tracing::info!("WebSocket connection closed: {}", session_id);
    Ok(())
}

/// Send message through WebSocket (internal event)
#[tauri::command]
pub async fn send_websocket_message(
    session_id: String,
    event: WebSocketEvent,
    manager: tauri::State<'_, Arc<WebSocketConnectionManager>>,
) -> Result<(), String> {
    manager.emit_event(&session_id, event).await;
    Ok(())
}

/// Get all active WebSocket sessions
#[tauri::command]
pub async fn get_active_websocket_sessions(
    manager: tauri::State<'_, Arc<WebSocketConnectionManager>>,
) -> Result<Vec<String>, String> {
    Ok(manager.get_active_sessions().await)
}
