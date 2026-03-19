//! Session cache Tauri commands
//!
//! This module provides Tauri commands for managing local session cache.

use tauri::State;
use crate::session::{SessionCache, SessionMetadata};

/// Save session metadata to local cache
///
/// # Arguments
/// * `metadata` - Session metadata (must not contain password or access_token)
///
/// # Returns
/// * `Ok(())` - Save successful
/// * `Err` - Security violation or storage error
///
/// # Security
/// This command performs security checks to prevent storing:
/// - Passwords
/// - Access tokens
/// - Other sensitive fields
#[tauri::command]
pub async fn save_session_metadata(
    metadata: SessionMetadata,
    cache: State<'_, SessionCache>,
) -> Result<(), String> {
    cache.save(metadata).await.map_err(|e| e.to_string())
}

/// Get session metadata from local cache
///
/// # Returns
/// * `Ok(Some(metadata))` - Valid cached metadata
/// * `Ok(None)` - No cache or expired
/// * `Err` - Read error
#[tauri::command]
pub async fn get_session_metadata(
    cache: State<'_, SessionCache>,
) -> Result<Option<SessionMetadata>, String> {
    cache.load().await.map_err(|e| e.to_string())
}

/// Clear session cache
///
/// Removes all cached session data from local storage.
/// Called during logout or when session becomes invalid.
#[tauri::command]
pub async fn clear_session_cache(
    cache: State<'_, SessionCache>,
) -> Result<(), String> {
    cache.clear().await.map_err(|e| e.to_string())
}

/// Check if session cache exists
///
/// Returns true if there is cached session data that may be valid.
#[tauri::command]
pub async fn has_session_cache(
    cache: State<'_, SessionCache>,
) -> Result<bool, String> {
    Ok(cache.exists().await)
}
