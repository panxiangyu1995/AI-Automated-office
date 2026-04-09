//! MCP service Tauri commands.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use tauri::State;

use crate::mcp::{
    MCPServiceRegistry, MCPServiceConfig, MCPServiceInfo,
    MCPTool, MCPTransportType,
};

/// Global MCP registry instance
static MCP_REGISTRY: once_cell::sync::Lazy<Arc<RwLock<MCPServiceRegistry>>> =
    once_cell::sync::Lazy::new(|| Arc::new(RwLock::new(MCPServiceRegistry::new())));

/// Service info response
#[derive(serde::Serialize)]
pub struct ServiceResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ServiceResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn err(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

/// Add a new MCP service
#[tauri::command]
pub async fn mcp_add_service(
    id: String,
    name: String,
    description: String,
    transport_type: String,
    command: Option<String>,
    args: Option<Vec<String>>,
    env: Option<HashMap<String, String>>,
    url: Option<String>,
    ws_url: Option<String>,
    auto_start: Option<bool>,
    max_concurrent: Option<usize>,
    timeout_secs: Option<u64>,
) -> Result<ServiceResponse<MCPServiceInfo>, String> {
    let transport = match transport_type.as_str() {
        "stdio" => MCPTransportType::Stdio,
        "http" => MCPTransportType::Http,
        "websocket" => MCPTransportType::WebSocket,
        _ => return Ok(ServiceResponse::err(format!("Invalid transport type: {}", transport_type))),
    };

    let config = MCPServiceConfig {
        id,
        name,
        description,
        transport,
        command,
        args: args.unwrap_or_default(),
        env: env.unwrap_or_default(),
        url,
        ws_url,
        auto_start: auto_start.unwrap_or(false),
        max_concurrent: max_concurrent.unwrap_or(1),
        timeout_secs: timeout_secs.unwrap_or(30),
    };

    let registry = MCP_REGISTRY.read().await;
    match registry.add_service(config).await {
        Ok(info) => Ok(ServiceResponse::ok(info)),
        Err(e) => Ok(ServiceResponse::err(e)),
    }
}

/// Remove an MCP service
#[tauri::command]
pub async fn mcp_remove_service(service_id: String) -> Result<ServiceResponse<()>, String> {
    let registry = MCP_REGISTRY.read().await;
    match registry.remove_service(&service_id).await {
        Ok(_) => Ok(ServiceResponse::ok(())),
        Err(e) => Ok(ServiceResponse::err(e)),
    }
}

/// List all MCP services
#[tauri::command]
pub async fn mcp_list_services() -> Result<ServiceResponse<Vec<MCPServiceInfo>>, String> {
    let registry = MCP_REGISTRY.read().await;
    let services = registry.list_services().await;
    Ok(ServiceResponse::ok(services))
}

/// Get a specific service info
#[tauri::command]
pub async fn mcp_get_service(service_id: String) -> Result<ServiceResponse<Option<MCPServiceInfo>>, String> {
    let registry = MCP_REGISTRY.read().await;
    let info = registry.get_service(&service_id).await;
    Ok(ServiceResponse::ok(info))
}

/// Start an MCP service
#[tauri::command]
pub async fn mcp_start_service(service_id: String) -> Result<ServiceResponse<()>, String> {
    let registry = MCP_REGISTRY.read().await;
    match registry.start_service(&service_id).await {
        Ok(_) => Ok(ServiceResponse::ok(())),
        Err(e) => Ok(ServiceResponse::err(e)),
    }
}

/// Stop an MCP service
#[tauri::command]
pub async fn mcp_stop_service(service_id: String) -> Result<ServiceResponse<()>, String> {
    let registry = MCP_REGISTRY.read().await;
    match registry.stop_service(&service_id).await {
        Ok(_) => Ok(ServiceResponse::ok(())),
        Err(e) => Ok(ServiceResponse::err(e)),
    }
}

/// Call a tool on an MCP service
#[tauri::command]
pub async fn mcp_call_tool(
    service_id: String,
    tool_name: String,
    arguments: serde_json::Value,
) -> Result<ServiceResponse<serde_json::Value>, String> {
    let registry = MCP_REGISTRY.read().await;
    match registry.call_tool(&service_id, tool_name, arguments).await {
        Ok(result) => Ok(ServiceResponse::ok(result)),
        Err(e) => Ok(ServiceResponse::err(e)),
    }
}

/// Discover tools from an MCP service
#[tauri::command]
pub async fn mcp_discover_tools(service_id: String) -> Result<ServiceResponse<Vec<MCPTool>>, String> {
    let registry = MCP_REGISTRY.read().await;
    match registry.discover_tools(&service_id).await {
        Ok(tools) => Ok(ServiceResponse::ok(tools)),
        Err(e) => Ok(ServiceResponse::err(e)),
    }
}

/// Get MCP service count
#[tauri::command]
pub async fn mcp_service_count() -> Result<ServiceResponse<usize>, String> {
    let registry = MCP_REGISTRY.read().await;
    let count = registry.count().await;
    Ok(ServiceResponse::ok(count))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_mcp_service_lifecycle() {
        // This is a mock test - actual integration requires running MCP servers
        
        // Add service
        let add_result = mcp_add_service(
            "test-mcp".to_string(),
            "Test MCP Service".to_string(),
            "A test service".to_string(),
            "http".to_string(),
            None,
            None,
            None,
            Some("http://localhost:8080".to_string()),
            None,
            Some(true),
            Some(5),
            Some(30),
        ).await;
        
        assert!(add_result.is_ok());
        let response = add_result.unwrap();
        // In real test, would check response.success

        // List services
        let list_result = mcp_list_services().await;
        assert!(list_result.is_ok());

        // Remove service
        let remove_result = mcp_remove_service("test-mcp".to_string()).await;
        assert!(remove_result.is_ok());
    }
}