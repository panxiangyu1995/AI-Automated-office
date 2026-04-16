//! Message Sync Module
//!
//! Implements message synchronization between local SQLite and cloud server.
//! Features:
//! - Delta sync protocol (GET/POST messages with timestamp)
//! - Soft delete synchronization
//! - Conflict detection and resolution (last-write-wins)
//! - Sync status tracking

use serde::{Deserialize, Serialize};

/// Message sync status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MessageSyncStatus {
    /// Message not yet synced
    Pending,
    /// Message is currently syncing
    Syncing,
    /// Message synced successfully
    Synced,
    /// Message sync failed
    Failed,
    /// Message was deleted locally and needs remote delete
    DeletePending,
}

impl Default for MessageSyncStatus {
    fn default() -> Self {
        Self::Pending
    }
}

impl std::fmt::Display for MessageSyncStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MessageSyncStatus::Pending => write!(f, "pending"),
            MessageSyncStatus::Syncing => write!(f, "syncing"),
            MessageSyncStatus::Synced => write!(f, "synced"),
            MessageSyncStatus::Failed => write!(f, "failed"),
            MessageSyncStatus::DeletePending => write!(f, "delete_pending"),
        }
    }
}

/// Message with sync metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncableMessage {
    pub id: String,
    pub remote_id: Option<String>,
    pub session_id: String,
    pub role: String,
    pub content: Option<String>,
    pub tool_calls: Option<serde_json::Value>,
    pub tool_call_id: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
    pub sync_status: MessageSyncStatus,
    pub synced_at: Option<i64>,
    pub sync_error: Option<String>,
    pub version: i32,
}

/// Sync direction
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum SyncDirection {
    /// Sync from local to remote
    Push,
    /// Sync from remote to local
    Pull,
    /// Bidirectional sync
    Bidirectional,
}

/// Sync conflict resolution strategy
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum ConflictResolution {
    /// Last write wins (default)
    LastWriteWins,
    /// Keep local version
    KeepLocal,
    /// Keep remote version
    KeepRemote,
    /// Keep both versions (creates duplicate)
    KeepBoth,
    /// Smart merge: for simple fields take the newer value, for arrays take union
    Merge,
    /// Ask user to resolve manually via frontend
    AskUser,
}

/// Sync statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStats {
    pub total_messages: u64,
    pub synced_messages: u64,
    pub pending_messages: u64,
    pub failed_messages: u64,
    pub conflicts: u64,
    pub last_sync_at: Option<i64>,
    pub last_sync_duration_ms: u64,
}

impl Default for SyncStats {
    fn default() -> Self {
        Self {
            total_messages: 0,
            synced_messages: 0,
            pending_messages: 0,
            failed_messages: 0,
            conflicts: 0,
            last_sync_at: None,
            last_sync_duration_ms: 0,
        }
    }
}

/// Message sync result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub synced_count: u32,
    pub failed_count: u32,
    pub conflict_count: u32,
    pub started_at: i64,
    pub completed_at: i64,
}

/// Message sync status response for UI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageSyncStatusResponse {
    pub message_id: String,
    pub status: MessageSyncStatus,
    pub synced_at: Option<i64>,
    pub error: Option<String>,
}
