//! MCP service registry for managing multiple MCP services.

use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::RwLock;

use super::client::{MCPClient, MCPClientConfig};
use super::types::{
    MCPServiceConfig, MCPServiceStatus, MCPServiceInfo, MCPTool,
};

/// Global MCP service registry
pub struct MCPServiceRegistry {
    /// Active clients by service ID
    clients: Arc<RwLock<HashMap<String, Arc<MCPClient>>>>,
    /// Service configurations
    configs: Arc<RwLock<HashMap<String, MCPServiceConfig>>>,
}

impl MCPServiceRegistry {
    /// Create a new registry
    pub fn new() -> Self {
        Self {
            clients: Arc::new(RwLock::new(HashMap::new())),
            configs: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Add and start a service
    pub async fn add_service(&self, config: MCPServiceConfig) -> Result<MCPServiceInfo, String> {
        // Check if service already exists
        {
            let clients = self.clients.read().await;
            if clients.contains_key(&config.id) {
                return Err(format!("Service {} already exists", config.id));
            }
        }

        // Create client
        let client_config = MCPClientConfig::from_service(config.clone());
        let client = Arc::new(MCPClient::new(client_config));

        // Store config
        {
            let mut configs = self.configs.write().await;
            configs.insert(config.id.clone(), config.clone());
        }

        // Start service if auto_start is enabled
        if config.auto_start {
            client.start().await.map_err(|e| e.to_string())?;
        }

        // Store client
        {
            let mut clients = self.clients.write().await;
            clients.insert(config.id.clone(), client.clone());
        }

        Ok(client.service_info().await)
    }

    /// Remove a service
    pub async fn remove_service(&self, service_id: &str) -> Result<(), String> {
        // Stop the service first
        if let Some(client) = {
            let clients = self.clients.read().await;
            clients.get(service_id).cloned()
        } {
            let _ = client.stop().await;
        }

        // Remove from registry
        let mut clients = self.clients.write().await;
        clients.remove(service_id);

        let mut configs = self.configs.write().await;
        configs.remove(service_id);

        Ok(())
    }

    /// Start a service
    pub async fn start_service(&self, service_id: &str) -> Result<(), String> {
        let clients = self.clients.read().await;
        let client = clients.get(service_id)
            .ok_or_else(|| format!("Service {} not found", service_id))?;

        client.start().await
    }

    /// Stop a service
    pub async fn stop_service(&self, service_id: &str) -> Result<(), String> {
        let clients = self.clients.read().await;
        let client = clients.get(service_id)
            .ok_or_else(|| format!("Service {} not found", service_id))?;

        client.stop().await
    }

    /// List all services
    pub async fn list_services(&self) -> Vec<MCPServiceInfo> {
        let clients = self.clients.read().await;
        let mut infos = Vec::new();

        for (_, client) in clients.iter() {
            infos.push(client.service_info().await);
        }

        infos
    }

    /// Get a specific service info
    pub async fn get_service(&self, service_id: &str) -> Option<MCPServiceInfo> {
        let clients = self.clients.read().await;
        clients.get(service_id).map(|c| c.service_info())
    }

    /// Call a tool on a service
    pub async fn call_tool(
        &self,
        service_id: &str,
        tool_name: String,
        arguments: serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        let clients = self.clients.read().await;
        let client = clients.get(service_id)
            .ok_or_else(|| format!("Service {} not found", service_id))?;

        drop(clients);

        let args_map: std::collections::HashMap<String, serde_json::Value> =
            serde_json::from_value(arguments)
            .map_err(|e| e.to_string())?;

        let call = super::types::MCPToolCall {
            tool: tool_name,
            arguments: args_map,
        };

        let result = client.call_tool(call).await?;

        if result.success {
            result.content.ok_or_else(|| "No content in result".to_string())
        } else {
            Err(result.error.unwrap_or_else(|| "Unknown error".to_string()))
        }
    }

    /// Discover tools from a service
    pub async fn discover_tools(&self, service_id: &str) -> Result<Vec<MCPTool>, String> {
        let clients = self.clients.read().await;
        let client = clients.get(service_id)
            .ok_or_else(|| format!("Service {} not found", service_id))?;

        client.discover_tools().await
    }

    /// Get service count
    pub async fn count(&self) -> usize {
        let clients = self.clients.read().await;
        clients.len()
    }

    /// Check if service exists
    pub async fn contains(&self, service_id: &str) -> bool {
        let clients = self.clients.read().await;
        clients.contains_key(service_id)
    }

    /// Get service status
    pub async fn status(&self, service_id: &str) -> Option<MCPServiceStatus> {
        let clients = self.clients.read().await;
        clients.get(service_id).map(|c| c.status())
    }
}

impl Default for MCPServiceRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_registry_operations() {
        let registry = MCPServiceRegistry::new();

        // Add service
        let config = MCPServiceConfig {
            id: "test-service".to_string(),
            name: "Test Service".to_string(),
            description: "A test service".to_string(),
            transport: super::types::MCPTransportType::Http,
            command: None,
            args: Vec::new(),
            env: HashMap::new(),
            url: Some("http://localhost:8080".to_string()),
            ws_url: None,
            auto_start: false,
            max_concurrent: 1,
            timeout_secs: 30,
        };

        let info = registry.add_service(config).await.unwrap();
        assert_eq!(info.id, "test-service");

        // List services
        let services = registry.list_services().await;
        assert_eq!(services.len(), 1);

        // Remove service
        registry.remove_service("test-service").await.unwrap();
        assert_eq!(registry.count().await, 0);
    }
}