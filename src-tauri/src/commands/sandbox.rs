//! 工具权限沙箱 Tauri 命令
//!
//! 暴露沙箱功能给前端

use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::State;

use crate::agent::permission::sandbox::{
    ToolSandbox, MatchPattern, PermissionResult, SandboxStats,
};

pub struct SandboxState(pub Arc<RwLock<ToolSandbox>>);

/// 检查工具权限
#[tauri::command]
pub async fn check_tool_permission(
    state: State<'_, SandboxState>,
    tool_name: String,
) -> Result<PermissionResult, String> {
    let sandbox = state.0.read().await;
    Ok(sandbox.check_permission(&tool_name).await)
}

/// 批量检查工具权限
#[tauri::command]
pub async fn batch_check_tool_permissions(
    state: State<'_, SandboxState>,
    tool_names: Vec<String>,
) -> Result<std::collections::HashMap<String, PermissionResult>, String> {
    let sandbox = state.0.read().await;
    let tool_refs: Vec<&str> = tool_names.iter().map(|s| s.as_str()).collect();
    Ok(sandbox.check_batch_permissions(&tool_refs).await)
}

/// 添加到黑名单
#[tauri::command]
pub async fn add_to_blacklist(
    state: State<'_, SandboxState>,
    pattern: MatchPattern,
) -> Result<(), String> {
    let sandbox = state.0.read().await;
    sandbox.add_to_blacklist(pattern).await;
    Ok(())
}

/// 从黑名单移除
#[tauri::command]
pub async fn remove_from_blacklist(
    state: State<'_, SandboxState>,
    pattern: MatchPattern,
) -> Result<(), String> {
    let sandbox = state.0.read().await;
    sandbox.remove_from_blacklist(&pattern).await;
    Ok(())
}

/// 获取黑名单
#[tauri::command]
pub async fn get_blacklist(
    state: State<'_, SandboxState>,
) -> Result<Vec<MatchPattern>, String> {
    let sandbox = state.0.read().await;
    Ok(sandbox.get_blacklist().await)
}

/// 添加到白名单
#[tauri::command]
pub async fn add_to_whitelist(
    state: State<'_, SandboxState>,
    pattern: MatchPattern,
) -> Result<(), String> {
    let sandbox = state.0.read().await;
    sandbox.add_to_whitelist(pattern).await;
    Ok(())
}

/// 从白名单移除
#[tauri::command]
pub async fn remove_from_whitelist(
    state: State<'_, SandboxState>,
    pattern: MatchPattern,
) -> Result<(), String> {
    let sandbox = state.0.read().await;
    sandbox.remove_from_whitelist(&pattern).await;
    Ok(())
}

/// 获取白名单
#[tauri::command]
pub async fn get_whitelist(
    state: State<'_, SandboxState>,
) -> Result<Vec<MatchPattern>, String> {
    let sandbox = state.0.read().await;
    Ok(sandbox.get_whitelist().await)
}

/// 添加到灰名单
#[tauri::command]
pub async fn add_to_graylist(
    state: State<'_, SandboxState>,
    pattern: MatchPattern,
) -> Result<(), String> {
    let sandbox = state.0.read().await;
    sandbox.add_to_graylist(pattern).await;
    Ok(())
}

/// 从灰名单移除
#[tauri::command]
pub async fn remove_from_graylist(
    state: State<'_, SandboxState>,
    pattern: MatchPattern,
) -> Result<(), String> {
    let sandbox = state.0.read().await;
    sandbox.remove_from_graylist(&pattern).await;
    Ok(())
}

/// 获取灰名单
#[tauri::command]
pub async fn get_graylist(
    state: State<'_, SandboxState>,
) -> Result<Vec<MatchPattern>, String> {
    let sandbox = state.0.read().await;
    Ok(sandbox.get_graylist().await)
}

/// 添加分组规则
#[tauri::command]
pub async fn add_sandbox_group(
    state: State<'_, SandboxState>,
    group_name: String,
    patterns: Vec<MatchPattern>,
) -> Result<(), String> {
    let sandbox = state.0.read().await;
    sandbox.add_group(&group_name, patterns).await;
    Ok(())
}

/// 获取分组规则
#[tauri::command]
pub async fn get_sandbox_group(
    state: State<'_, SandboxState>,
    group_name: String,
) -> Result<Option<Vec<MatchPattern>>, String> {
    let sandbox = state.0.read().await;
    Ok(sandbox.get_group(&group_name).await)
}

/// 获取沙箱统计
#[tauri::command]
pub async fn get_sandbox_stats(
    state: State<'_, SandboxState>,
) -> Result<SandboxStats, String> {
    let sandbox = state.0.read().await;
    Ok(sandbox.get_stats().await)
}

/// 重置沙箱统计
#[tauri::command]
pub async fn reset_sandbox_stats(
    state: State<'_, SandboxState>,
) -> Result<(), String> {
    let sandbox = state.0.read().await;
    sandbox.reset_stats().await;
    Ok(())
}

/// 清空所有规则
#[tauri::command]
pub async fn clear_sandbox_rules(
    state: State<'_, SandboxState>,
) -> Result<(), String> {
    let sandbox = state.0.read().await;
    sandbox.clear_all().await;
    Ok(())
}

/// 初始化沙箱服务
pub fn init_sandbox_service() -> SandboxState {
    SandboxState(Arc::new(RwLock::new(ToolSandbox::new())))
}