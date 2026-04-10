//! Service Manager - 管理MCP服务的生命周期

use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::RwLock;

use super::client::{MCPClient, MCPClientConfig};
use super::types::{MCPServiceConfig, MCPServiceInfo, MCPServiceStatus};

/// Service Manager - 管理MCP服务的生命周期
/// 
/// 职责：
/// - 服务的添加、删除
/// - 服务的启动、停止
/// - 服务列表查询
pub struct ServiceManager {
    clients: Arc<RwLock<HashMap<String, Arc<MCPClient>>>>,
}

impl ServiceManager {
    /// 创建新的ServiceManager
    pub fn new() -> Self {
        Self {
            clients: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 添加服务
    pub async fn add_service(&self, config: MCPServiceConfig) -> Result<MCPServiceInfo, String> {
        // 检查是否已存在
        if self.clients.read().await.contains_key(&config.id) {
            return Err(format!("Service {} already exists", config.id));
        }

        // 创建client
        let client_config = MCPClientConfig::from_service(config.clone());
        let client = Arc::new(MCPClient::new(client_config));

        // 自动启动
        if config.auto_start {
            client.start().await?;
        }

        // 存储client
        self.clients.write().await.insert(config.id.clone(), client.clone());
        
        Ok(client.service_info().await)
    }

    /// 移除服务
    pub async fn remove_service(&self, service_id: &str) -> Result<(), String> {
        if let Some(client) = self.clients.write().await.remove(service_id) {
            let _ = client.stop().await;
        }
        Ok(())
    }

    /// 启动服务
    pub async fn start_service(&self, service_id: &str) -> Result<(), String> {
        let clients = self.clients.read().await;
        let client = clients.get(service_id)
            .ok_or_else(|| format!("Service {} not found", service_id))?;
        client.start().await
    }

    /// 停止服务
    pub async fn stop_service(&self, service_id: &str) -> Result<(), String> {
        let clients = self.clients.read().await;
        let client = clients.get(service_id)
            .ok_or_else(|| format!("Service {} not found", service_id))?;
        client.stop().await
    }

    /// 获取服务client
    pub async fn get_client(&self, service_id: &str) -> Option<Arc<MCPClient>> {
        self.clients.read().await.get(service_id).cloned()
    }

    /// 列出所有服务
    pub async fn list_services(&self) -> Vec<MCPServiceInfo> {
        self.clients.read().await
            .values()
            .map(|c| futures::executor::block_on(c.service_info()))
            .collect()
    }

    /// 获取服务数量
    pub async fn count(&self) -> usize {
        self.clients.read().await.len()
    }

    /// 检查服务是否存在
    pub async fn contains(&self, service_id: &str) -> bool {
        self.clients.read().await.contains_key(service_id)
    }

    /// 获取服务状态
    pub async fn status(&self, service_id: &str) -> Option<MCPServiceStatus> {
        self.clients.read().await
            .get(service_id)
            .map(|c| futures::executor::block_on(c.status()))
    }
}

impl Default for ServiceManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_service_manager_creation() {
        let manager = ServiceManager::new();
        assert_eq!(manager.count().await, 0);
    }

    #[tokio::test]
    async fn test_add_and_remove_service() {
        let manager = ServiceManager::new();
        
        let config = MCPServiceConfig {
            id: "test-service".into(),
            name: "Test Service".into(),
            description: "A test service".into(),
            transport: crate::mcp::MCPTransportType::Http,
            command: None,
            args: vec![],
            env: std::collections::HashMap::new(),
            url: Some("http://localhost:8080".into()),
            ws_url: None,
            auto_start: false,
            max_concurrent: 1,
            timeout_secs: 30,
        };

        // 添加服务
        let info = manager.add_service(config).await.unwrap();
        assert_eq!(info.id, "test-service");
        assert_eq!(manager.count().await, 1);

        // 移除服务
        manager.remove_service("test-service").await.unwrap();
        assert_eq!(manager.count().await, 0);
    }

    #[tokio::test]
    async fn test_list_services() {
        let manager = ServiceManager::new();
        
        let config1 = MCPServiceConfig {
            id: "service-1".into(),
            name: "Service 1".into(),
            description: "Test service 1".into(),
            transport: crate::mcp::MCPTransportType::Http,
            command: None,
            args: vec![],
            env: std::collections::HashMap::new(),
            url: Some("http://localhost:8080".into()),
            ws_url: None,
            auto_start: false,
            max_concurrent: 1,
            timeout_secs: 30,
        };

        let config2 = MCPServiceConfig {
            id: "service-2".into(),
            name: "Service 2".into(),
            description: "Test service 2".into(),
            transport: crate::mcp::MCPTransportType::Http,
            command: None,
            args: vec![],
            env: std::collections::HashMap::new(),
            url: Some("http://localhost:8081".into()),
            ws_url: None,
            auto_start: false,
            max_concurrent: 1,
            timeout_secs: 30,
        };

        manager.add_service(config1).await.unwrap();
        manager.add_service(config2).await.unwrap();

        let services = manager.list_services().await;
        assert_eq!(services.len(), 2);
    }
}
