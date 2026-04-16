//! Tool Visibility Commands
//!
//! Tauri commands for tool call visibility and history tracking (FR69-FR80):
//! - Real-time tool call push
//! - Parameter and result display
//! - Failure retry tracking
//! - Manual result input
//! - Batch breakpoint resume
//!
//! Story 36.1 - 工具调用可见性增强

use tauri::State;
use crate::agent::tools::visibility::{
    ToolVisibilityService, ToolCallEntry, ToolCallFilter, ToolVisibilityStats,
    BatchOperation, ToolCategory,
};

/// Create a new tool call entry for visibility tracking
#[tauri::command]
pub async fn create_tool_call_entry(
    state: State<'_, ToolVisibilityService>,
    tool_id: String,
    tool_name: String,
    category: String,
    input: serde_json::Value,
    correlation_id: String,
    session_id: String,
    user_id: String,
    message_id: Option<String>,
) -> Result<ToolCallEntry, String> {
    let cat = match category.to_lowercase().as_str() {
        "platform" => ToolCategory::Platform,
        "department" => ToolCategory::Department,
        "restricted" => ToolCategory::Restricted,
        _ => ToolCategory::General,
    };

    Ok(state.create_entry(
        tool_id,
        tool_name,
        cat,
        input,
        correlation_id,
        session_id,
        user_id,
        message_id,
    ).await)
}

/// Get a tool call entry by execution ID
#[tauri::command]
pub async fn get_tool_call_entry(
    state: State<'_, ToolVisibilityService>,
    execution_id: String,
) -> Result<Option<ToolCallEntry>, String> {
    Ok(state.get_entry(&execution_id).await)
}

/// Mark tool call as started
#[tauri::command]
pub async fn mark_tool_call_started(
    state: State<'_, ToolVisibilityService>,
    execution_id: String,
) -> Result<Option<ToolCallEntry>, String> {
    Ok(state.mark_started(&execution_id).await)
}

/// Mark tool call as success with output
#[tauri::command]
pub async fn mark_tool_call_success(
    state: State<'_, ToolVisibilityService>,
    execution_id: String,
    output: serde_json::Value,
) -> Result<Option<ToolCallEntry>, String> {
    Ok(state.mark_success(&execution_id, output).await)
}

/// Mark tool call as failed
#[tauri::command]
pub async fn mark_tool_call_failed(
    state: State<'_, ToolVisibilityService>,
    execution_id: String,
    error: String,
) -> Result<Option<ToolCallEntry>, String> {
    Ok(state.mark_failed(&execution_id, error).await)
}

/// Mark tool call for retry
#[tauri::command]
pub async fn mark_tool_call_retry(
    state: State<'_, ToolVisibilityService>,
    execution_id: String,
) -> Result<Option<ToolCallEntry>, String> {
    Ok(state.mark_retry(&execution_id).await)
}

/// Set manual result for a tool call
#[tauri::command]
pub async fn set_tool_call_manual_result(
    state: State<'_, ToolVisibilityService>,
    execution_id: String,
    output: serde_json::Value,
) -> Result<Option<ToolCallEntry>, String> {
    Ok(state.set_manual_result(&execution_id, output).await)
}

/// Mark tool call as retained in history
#[tauri::command]
pub async fn mark_tool_call_retained(
    state: State<'_, ToolVisibilityService>,
    execution_id: String,
    retained: bool,
    retention_days: u32,
) -> Result<Option<ToolCallEntry>, String> {
    Ok(state.mark_retained(&execution_id, retained, retention_days).await)
}

/// Query tool call entries with filters
#[tauri::command]
pub async fn query_tool_call_entries(
    state: State<'_, ToolVisibilityService>,
    filter: ToolCallFilter,
) -> Result<Vec<ToolCallEntry>, String> {
    Ok(state.query_entries(filter).await)
}

/// Get all entries for a specific session
#[tauri::command]
pub async fn get_session_tool_calls(
    state: State<'_, ToolVisibilityService>,
    session_id: String,
) -> Result<Vec<ToolCallEntry>, String> {
    Ok(state.get_session_entries(&session_id).await)
}

/// Get failed/timeout entries that can be retried
#[tauri::command]
pub async fn get_retriable_tool_calls(
    state: State<'_, ToolVisibilityService>,
) -> Result<Vec<ToolCallEntry>, String> {
    Ok(state.get_retriable_entries().await)
}

/// Get pending retry entries
#[tauri::command]
pub async fn get_pending_retries(
    state: State<'_, ToolVisibilityService>,
) -> Result<Vec<ToolCallEntry>, String> {
    Ok(state.get_pending_retries().await)
}

/// Get tool visibility statistics
#[tauri::command]
pub async fn get_tool_visibility_stats(
    state: State<'_, ToolVisibilityService>,
) -> Result<ToolVisibilityStats, String> {
    Ok(state.get_stats().await)
}

/// Delete a tool call entry
#[tauri::command]
pub async fn delete_tool_call_entry(
    state: State<'_, ToolVisibilityService>,
    execution_id: String,
) -> Result<bool, String> {
    Ok(state.delete_entry(&execution_id).await)
}

/// Clear all tool call entries
#[tauri::command]
pub async fn clear_all_tool_calls(
    state: State<'_, ToolVisibilityService>,
) -> Result<(), String> {
    state.clear_all().await;
    Ok(())
}

/// Create a batch operation for breakpoint resume
#[tauri::command]
pub async fn create_tool_batch(
    state: State<'_, ToolVisibilityService>,
    tool_id: String,
    execution_ids: Vec<String>,
) -> Result<BatchOperation, String> {
    Ok(state.create_batch(tool_id, execution_ids).await)
}

/// Start a batch operation
#[tauri::command]
pub async fn start_tool_batch(
    state: State<'_, ToolVisibilityService>,
    batch_id: String,
) -> Result<Option<BatchOperation>, String> {
    Ok(state.start_batch(&batch_id).await)
}

/// Update batch operation progress
#[tauri::command]
pub async fn update_tool_batch_progress(
    state: State<'_, ToolVisibilityService>,
    batch_id: String,
    completed_count: u32,
    failed_count: u32,
) -> Result<Option<BatchOperation>, String> {
    Ok(state.update_batch_progress(&batch_id, completed_count, failed_count).await)
}

/// Get batch operation status
#[tauri::command]
pub async fn get_tool_batch(
    state: State<'_, ToolVisibilityService>,
    batch_id: String,
) -> Result<Option<BatchOperation>, String> {
    Ok(state.get_batch(&batch_id).await)
}

/// Get pending batch operations
#[tauri::command]
pub async fn get_pending_batches(
    state: State<'_, ToolVisibilityService>,
) -> Result<Vec<BatchOperation>, String> {
    Ok(state.get_pending_batches().await)
}

/// Resume a failed batch (get failed entries for retry)
#[tauri::command]
pub async fn resume_tool_batch(
    state: State<'_, ToolVisibilityService>,
    batch_id: String,
) -> Result<Option<Vec<ToolCallEntry>>, String> {
    Ok(state.resume_batch(&batch_id).await)
}

/// Get tool call status enum values
#[tauri::command]
pub fn get_tool_call_statuses() -> Vec<String> {
    vec![
        "pending".to_string(),
        "running".to_string(),
        "success".to_string(),
        "failed".to_string(),
        "timeout".to_string(),
        "cancelled".to_string(),
        "retrying".to_string(),
    ]
}

/// Get tool category enum values
#[tauri::command]
pub fn get_tool_categories() -> Vec<String> {
    vec![
        "general".to_string(),
        "platform".to_string(),
        "department".to_string(),
        "restricted".to_string(),
    ]
}
