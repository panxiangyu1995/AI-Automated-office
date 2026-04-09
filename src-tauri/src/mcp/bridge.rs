//! MCP tool bridge - converts MCP tools to system tools.

use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::RwLock;

use crate::agent::tools::{ToolDescriptor, ToolRegistry};

use super::registry::MCPServiceRegistry;
use super::types::MCPTool;

/// Bridge between MCP tools and system tool registry
pub struct MCPToolBridge {
    /// MCP service registry
    registry: Arc<MCPServiceRegistry>,
    /// Tool registry reference
    tool_registry: Arc<RwLock<Option<Arc<ToolRegistry>>>>,
    /// Mapping from MCP tool names to service IDs
    tool_service_map: Arc<RwLock<HashMap<String, String>>>,
}

impl MCPToolBridge {
    /// Create a new bridge
    pub fn new(registry: Arc<MCPServiceRegistry>) -> Self {
        Self {
            registry,
            tool_registry: Arc::new(RwLock::new(None)),
            tool_service_map: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Set the tool registry reference
    pub async fn set_tool_registry(&self, registry: Arc<ToolRegistry>) {
        let mut r = self.tool_registry.write().await;
        *r = Some(registry);
    }

    /// Register all tools from a service
    pub async fn register_service_tools(&self, service_id: &str) -> Result<Vec<String>, String> {
        let tools = self.registry.discover_tools(service_id).await?;
        let mut registered = Vec::new();
        let mut tool_map = self.tool_service_map.write().await;

        for tool in tools {
            let tool_name = format!("mcp_{}_{}", service_id, tool.name);

            // Create tool descriptor
            let descriptor = ToolDescriptor {
                id: format!("mcp_{}_{}", service_id, tool.name),
                name: tool_name.clone(),
                description: tool.description.clone(),
                category: crate::agent::tools::descriptor::ToolCategory::Mcp,
                parameters: Vec::new(), // MCP tools may have different schema
                return_type: None,
                execution_mode: crate::agent::tools::descriptor::ToolExecutionMode::Async,
                capabilities: crate::agent::tools::descriptor::ToolCapabilities {
                    supports_streaming: false,
                    supports_cancellation: false,
                    requires_permission: false,
                    requires_confirmation: false,
                    is_read_only: true,
                    has_side_effects: false,
                    supports_retry: false,
                    estimated_duration: None,
                },
                permissions: None,
                dependencies: None,
                context_requirements: None,
                metadata: crate::agent::tools::descriptor::ToolMetadata {
                    author: None,
                    version: "1.0.0".to_string(),
                    license: None,
                    homepage: None,
                    repository: None,
                    tags: vec!["mcp".to_string()],
                    category: "mcp".to_string(),
                    subcategory: Some(service_id.to_string()),
                },
                enabled: true,
                deprecated: None,
                deprecation_message: None,
                handler_module: Some(format!("mcp_tool:{}", service_id)),
                handler_function: Some(tool.name.clone()),
            };

            // Register with tool registry if available
            if let Some(ref tr) = *self.tool_registry.read().await {
                tr.register(descriptor);
            }

            // Store mapping
            tool_map.insert(tool_name.clone(), service_id.to_string());
            registered.push(tool_name);
        }

        Ok(registered)
    }

    /// Unregister all tools from a service
    pub async fn unregister_service_tools(&self, service_id: &str) -> Result<(), String> {
        let mut tool_map = self.tool_service_map.write().await;

        // Find tools for this service
        let tools_to_remove: Vec<String> = tool_map
            .iter()
            .filter(|(_, v)| *v == service_id)
            .map(|(k, _)| k.clone())
            .collect();

        // Unregister from tool registry
        if let Some(ref tr) = *self.tool_registry.read().await {
            for tool_name in &tools_to_remove {
                tr.unregister(tool_name);
            }
        }

        // Remove mappings
        for tool_name in tools_to_remove {
            tool_map.remove(&tool_name);
        }

        Ok(())
    }

    /// Call an MCP tool through the bridge
    pub async fn call_tool(
        &self,
        tool_name: &str,
        arguments: serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        // Look up service ID from tool name
        let service_id = {
            let tool_map = self.tool_service_map.read().await;
            tool_map.get(tool_name).cloned()
        };

        let service_id = service_id.ok_or_else(|| format!("Tool {} not registered", tool_name))?;

        // Extract the MCP tool name from the full name
        let mcp_tool_name = tool_name
            .strip_prefix(&format!("mcp_{}_", service_id))
            .unwrap_or(tool_name)
            .to_string();

        // Call the tool
        self.registry
            .call_tool(&service_id, mcp_tool_name, arguments)
            .await
    }

    /// Get all registered MCP tools
    pub async fn get_registered_tools(&self) -> Vec<(String, String)> {
        let tool_map = self.tool_service_map.read().await;
        tool_map
            .iter()
            .map(|(tool_name, service_id)| (tool_name.clone(), service_id.clone()))
            .collect()
    }

    /// Check if a tool is registered
    pub async fn is_tool_registered(&self, tool_name: &str) -> bool {
        let tool_map = self.tool_service_map.read().await;
        tool_map.contains_key(tool_name)
    }

    /// Get the service ID for a tool
    pub async fn get_service_for_tool(&self, tool_name: &str) -> Option<String> {
        let tool_map = self.tool_service_map.read().await;
        tool_map.get(tool_name).cloned()
    }
}

impl Default for MCPToolBridge {
    fn default() -> Self {
        Self::new(Arc::new(MCPServiceRegistry::new()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_tool_registration() {
        let registry = MCPServiceRegistry::new();
        let bridge = MCPToolBridge::new(Arc::new(registry));

        // Initially no tools
        let tools = bridge.get_registered_tools().await;
        assert!(tools.is_empty());

        // Check not registered
        assert!(!bridge.is_tool_registered("mcp_test_tool").await);
    }
}