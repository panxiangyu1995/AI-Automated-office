//! Config Store - 管理MCP服务配置的持久化

use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::RwLock;

use super::types::MCPServiceConfig;

/// Config Store - 管理MCP服务配置的存储
/// 
/// 职责：
/// - 配置的保存、加载
/// - 配置的更新、删除
/// - 配置列表查询
pub struct ConfigStore {
    configs: Arc<RwLock<HashMap<String, MCPServiceConfig>>>,
}

impl ConfigStore {
    /// 创建新的ConfigStore
    pub fn new() -> Self {
        Self {
            configs: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 保存配置
    pub async fn save(&self, config: MCPServiceConfig) -> Result<(), String> {
        self.configs.write().await
            .insert(config.id.clone(), config);
        Ok(())
    }

    /// 加载配置
    pub async fn load(&self, service_id: &str) -> Option<MCPServiceConfig> {
        self.configs.read().await.get(service_id).cloned()
    }

    /// 删除配置
    pub async fn delete(&self, service_id: &str) -> Option<MCPServiceConfig> {
        self.configs.write().await.remove(service_id)
    }

    /// 更新配置
    pub async fn update(&self, config: MCPServiceConfig) -> Result<(), String> {
        if !self.configs.read().await.contains_key(&config.id) {
            return Err(format!("Service {} not found", config.id));
        }
        self.configs.write().await
            .insert(config.id.clone(), config);
        Ok(())
    }

    /// 列出所有配置
    pub async fn list(&self) -> Vec<MCPServiceConfig> {
        self.configs.read().await.values().cloned().collect()
    }

    /// 获取配置数量
    pub async fn count(&self) -> usize {
        self.configs.read().await.len()
    }

    /// 检查配置是否存在
    pub async fn contains(&self, service_id: &str) -> bool {
        self.configs.read().await.contains_key(service_id)
    }
}

impl Default for ConfigStore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_config_store_creation() {
        let store = ConfigStore::new();
        assert_eq!(store.count().await, 0);
    }

    #[tokio::test]
    async fn test_save_and_load_config() {
        let store = ConfigStore::new();
        
        let config = MCPServiceConfig {
            id: "test-config".into(),
            name: "Test Config".into(),
            description: "A test config".into(),
            transport: crate::mcp::MCPTransportType::Http,
            command: None,
            args: vec![],
            env: std::collections::HashMap::new(),
            url: Some("http://localhost:8080".into()),
            ws_url: None,
            auto_start: true,
            max_concurrent: 5,
            timeout_secs: 30,
        };

        store.save(config.clone()).await.unwrap();
        assert_eq!(store.count().await, 1);

        let loaded = store.load("test-config").await;
        assert!(loaded.is_some());
        assert_eq!(loaded.unwrap().name, "Test Config");
    }

    #[tokio::test]
    async fn test_delete_config() {
        let store = ConfigStore::new();
        
        let config = MCPServiceConfig {
            id: "delete-test".into(),
            name: "Delete Test".into(),
            description: "A test config".into(),
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

        store.save(config).await.unwrap();
        assert_eq!(store.count().await, 1);

        let deleted = store.delete("delete-test").await;
        assert!(deleted.is_some());
        assert_eq!(store.count().await, 0);
    }

    #[tokio::test]
    async fn test_update_config() {
        let store = ConfigStore::new();
        
        let config = MCPServiceConfig {
            id: "update-test".into(),
            name: "Original Name".into(),
            description: "Original description".into(),
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

        store.save(config).await.unwrap();

        let updated_config = MCPServiceConfig {
            id: "update-test".into(),
            name: "Updated Name".into(),
            description: "Updated description".into(),
            transport: crate::mcp::MCPTransportType::Http,
            command: None,
            args: vec![],
            env: std::collections::HashMap::new(),
            url: Some("http://localhost:8080".into()),
            ws_url: None,
            auto_start: true,
            max_concurrent: 10,
            timeout_secs: 60,
        };

        store.update(updated_config).await.unwrap();

        let loaded = store.load("update-test").await.unwrap();
        assert_eq!(loaded.name, "Updated Name");
        assert_eq!(loaded.auto_start, true);
    }
}
