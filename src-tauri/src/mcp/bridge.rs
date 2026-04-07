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
                name: tool_name.clone(),
                description: tool.description,
                category: "mcp".to_string(),
                parameters: tool.input_schema,
                handler: format!("mcp_tool:{}:{}", service_id, tool.name),
                permissions: Vec::new(),
                experimental: tool.experimental,
            };

            // Register with tool registry if available
            if let Some(ref tr) = *self.tool_registry.read().await {
                let _ = tr.register(descriptor).await;
            }

            // Store mapping
            tool_map.insert(tool_name, service_id.to_string());
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
                let _ = tr.unregister(tool_name).await;
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
        let tool_map = self.tool_service_map.read().await;
        let service_id = tool_map.get(tool_name)
            .ok_or_else(|| format!("Tool {} not registered", tool_name))?;

        drop(tool_map);

        // Extract the MCP tool name from the full name
        let mcp_tool_name = tool_name
            .strip_prefix(&format!("mcp_{}_", service_id))
            .unwrap_or(tool_name)
            .to_string();

        // Call the tool
        self.registry
            .call_tool(service_id, mcp_tool_name, arguments)
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