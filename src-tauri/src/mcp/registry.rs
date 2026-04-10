//! MCP service registry for managing multiple MCP services.
//! 
//! 使用委托模式，将职责分离到子模块：
//! - ServiceManager: 服务生命周期管理
//! - ConfigStore: 配置存储
//! - PolicyEngine: 审批策略管理

// 引用同目录下的模块（已在 mcp/mod.rs 中声明）
pub use super::manager::ServiceManager;
pub use super::store::ConfigStore;
pub use super::engine::PolicyEngine;

use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::RwLock;


use super::client::{MCPClient, MCPClientConfig};
use super::types::{
    MCPServiceConfig, MCPServiceStatus, MCPServiceInfo, MCPTool,
    PerToolApprovalConfig, ApprovalPolicy, AutoApproveResult,
};

/// Global MCP service registry
/// 
/// 使用委托模式，将职责分离到三个子模块：
/// - service_manager: 管理服务生命周期
/// - config_store: 管理配置持久化
/// - policy_engine: 管理审批策略
pub struct MCPServiceRegistry {
    /// 服务管理器
    service_manager: Arc<ServiceManager>,
    /// 配置存储
    config_store: Arc<ConfigStore>,
    /// 审批策略引擎
    policy_engine: Arc<PolicyEngine>,
}

impl MCPServiceRegistry {
    /// 创建新的registry
    pub fn new() -> Self {
        Self {
            service_manager: Arc::new(ServiceManager::new()),
            config_store: Arc::new(ConfigStore::new()),
            policy_engine: Arc::new(PolicyEngine::new()),
        }
    }

    /// 添加服务
    pub async fn add_service(&self, config: MCPServiceConfig) -> Result<MCPServiceInfo, String> {
        // 先保存配置
        self.config_store.save(config.clone()).await?;
        // 再添加服务
        self.service_manager.add_service(config).await
    }

    /// 移除服务
    pub async fn remove_service(&self, service_id: &str) -> Result<(), String> {
        // 先停止服务
        self.service_manager.remove_service(service_id).await?;
        // 再删除配置
        let _ = self.config_store.delete(service_id).await;
        Ok(())
    }

    /// 启动服务
    pub async fn start_service(&self, service_id: &str) -> Result<(), String> {
        self.service_manager.start_service(service_id).await
    }

    /// 停止服务
    pub async fn stop_service(&self, service_id: &str) -> Result<(), String> {
        self.service_manager.stop_service(service_id).await
    }

    /// 列出所有服务
    pub async fn list_services(&self) -> Vec<MCPServiceInfo> {
        self.service_manager.list_services().await
    }

    /// 获取服务信息
    pub async fn get_service(&self, service_id: &str) -> Option<MCPServiceInfo> {
        let _ = self.service_manager.get_client(service_id).await?;
        // 简化实现，直接返回基本信息
        let status = self.service_manager.status(service_id).await;
        let config = self.config_store.load(service_id).await;
        Some(MCPServiceInfo {
            id: service_id.to_string(),
            name: config.map(|c| c.name).unwrap_or_default(),
            status: status.unwrap_or(MCPServiceStatus::Stopped),
            pid: None,
            last_error: None,
            tool_count: 0,
            started_at: None,
            uptime_secs: 0,
        })
    }

    /// 调用工具
    pub async fn call_tool(
        &self,
        service_id: &str,
        tool_name: String,
        arguments: serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        // 检查审批策略
        let approval = self.policy_engine.check(service_id, &tool_name).await;
        if !approval.approved {
            return Err(format!(
                "Tool '{}' requires approval: {}",
                tool_name,
                approval.reason
            ));
        }

        // 获取client并调用
        let client = self.service_manager.get_client(service_id).await
            .ok_or_else(|| format!("Service {} not found", service_id))?;

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

    /// 发现工具
    pub async fn discover_tools(&self, service_id: &str) -> Result<Vec<MCPTool>, String> {
        let client = self.service_manager.get_client(service_id).await
            .ok_or_else(|| format!("Service {} not found", service_id))?;
        client.discover_tools().await
    }

    /// 获取服务数量
    pub async fn count(&self) -> usize {
        self.service_manager.count().await
    }

    /// 检查服务是否存在
    pub async fn contains(&self, service_id: &str) -> bool {
        self.service_manager.contains(service_id).await
    }

    /// 获取服务状态
    pub async fn status(&self, service_id: &str) -> Option<MCPServiceStatus> {
        self.service_manager.status(service_id).await
    }

    // ==================== Approval Configuration Management ====================

    /// 设置工具审批配置
    pub async fn set_tool_approval_config(
        &self,
        config: PerToolApprovalConfig,
    ) -> Result<(), String> {
        self.policy_engine.set_config(config).await
    }

    /// 获取工具审批配置
    pub async fn get_tool_approval_config(
        &self,
        config_id: &str,
    ) -> Option<PerToolApprovalConfig> {
        self.policy_engine.get_config(config_id).await
    }

    /// 获取服务所有审批配置
    pub async fn get_service_approval_configs(
        &self,
        service_id: &str,
    ) -> Vec<PerToolApprovalConfig> {
        self.policy_engine.list_configs(service_id).await
    }

    /// 获取所有审批配置
    pub async fn get_all_approval_configs(&self) -> Vec<PerToolApprovalConfig> {
        self.policy_engine.list_all_configs().await
    }

    /// 删除工具审批配置
    pub async fn delete_tool_approval_config(
        &self,
        config_id: &str,
    ) -> Result<(), String> {
        self.policy_engine.delete_config(config_id)
            .await
            .map(|_| ())
            .ok_or_else(|| format!("Config '{}' not found", config_id))
    }

    /// 检查工具是否应该自动批准
    pub async fn check_auto_approve(
        &self,
        service_id: &str,
        tool_name: &str,
    ) -> AutoApproveResult {
        self.policy_engine.check(service_id, tool_name).await
    }

    /// 启用/禁用审批配置
    pub async fn set_approval_config_enabled(
        &self,
        config_id: &str,
        enabled: bool,
    ) -> Result<(), String> {
        self.policy_engine.set_enabled(config_id, enabled).await
    }

    /// 获取审批配置数量
    pub async fn approval_configs_count(&self) -> usize {
        self.policy_engine.count().await
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

        // 添加服务
        let config = MCPServiceConfig {
            id: "test-service".to_string(),
            name: "Test Service".to_string(),
            description: "A test service".to_string(),
            transport: crate::mcp::MCPTransportType::Http,
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

        // 列出服务
        let services = registry.list_services().await;
        assert_eq!(services.len(), 1);

        // 移除服务
        registry.remove_service("test-service").await.unwrap();
        assert_eq!(registry.count().await, 0);
    }

    #[tokio::test]
    async fn test_approval_config() {
        let registry = MCPServiceRegistry::new();
        
        let config = PerToolApprovalConfig {
            id: "test-approval".to_string(),
            service_id: "test-svc".to_string(),
            tool_pattern: "*.read".to_string(),
            is_regex: false,
            policy: ApprovalPolicy::AutoApprove,
            description: Some("Auto-approve read tools".to_string()),
            enabled: true,
            created_at: "2026-04-10T00:00:00Z".to_string(),
            updated_at: "2026-04-10T00:00:00Z".to_string(),
            created_by: "admin".to_string(),
        };

        registry.set_tool_approval_config(config).await.unwrap();

        let all_configs = registry.get_all_approval_configs().await;
        assert_eq!(all_configs.len(), 1);

        let check_result = registry.check_auto_approve("test-svc", "file.read").await;
        assert!(check_result.approved);

        registry.delete_tool_approval_config("test-approval").await.unwrap();
        assert_eq!(registry.approval_configs_count().await, 0);
    }
}
