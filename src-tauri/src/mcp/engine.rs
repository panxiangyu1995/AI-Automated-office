//! Policy Engine - 管理MCP工具调用的审批策略

use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::RwLock;

use super::types::{PerToolApprovalConfig, ApprovalPolicy, AutoApproveResult};

/// Policy Engine - 管理MCP工具调用的审批策略
/// 
/// 职责：
/// - 审批配置的管理（设置、获取、删除）
/// - 工具调用审批检查
pub struct PolicyEngine {
    configs: Arc<RwLock<HashMap<String, PerToolApprovalConfig>>>,
}

impl PolicyEngine {
    /// 创建新的PolicyEngine
    pub fn new() -> Self {
        Self {
            configs: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 检查工具是否应该自动批准
    pub async fn check(&self, service_id: &str, tool_name: &str) -> AutoApproveResult {
        let configs = self.configs.read().await;

        for config in configs.values() {
            if config.service_id == service_id && config.matches(tool_name) {
                let approved = config.policy == ApprovalPolicy::AutoApprove;
                return AutoApproveResult {
                    approved,
                    policy: config.policy.clone(),
                    matched_config_id: Some(config.id.clone()),
                    reason: if approved {
                        format!("Tool '{}' auto-approved by config '{}'", tool_name, config.id)
                    } else {
                        format!("Tool '{}' policy is {:?} according to config '{}'",
                            tool_name, config.policy, config.id)
                    },
                };
            }
        }

        // 没有匹配的策略，默认Manual
        AutoApproveResult {
            approved: false,
            policy: ApprovalPolicy::Manual,
            matched_config_id: None,
            reason: format!(
                "No approval config found for tool '{}' in service '{}', defaulting to manual",
                tool_name, service_id
            ),
        }
    }

    /// 设置审批配置
    pub async fn set_config(&self, config: PerToolApprovalConfig) -> Result<(), String> {
        self.configs.write().await
            .insert(config.id.clone(), config);
        Ok(())
    }

    /// 获取审批配置
    pub async fn get_config(&self, config_id: &str) -> Option<PerToolApprovalConfig> {
        self.configs.read().await.get(config_id).cloned()
    }

    /// 删除审批配置
    pub async fn delete_config(&self, config_id: &str) -> Option<PerToolApprovalConfig> {
        self.configs.write().await.remove(config_id)
    }

    /// 列出服务所有审批配置
    pub async fn list_configs(&self, service_id: &str) -> Vec<PerToolApprovalConfig> {
        self.configs.read().await
            .values()
            .filter(|c| c.service_id == service_id)
            .cloned()
            .collect()
    }

    /// 列出所有审批配置
    pub async fn list_all_configs(&self) -> Vec<PerToolApprovalConfig> {
        self.configs.read().await.values().cloned().collect()
    }

    /// 获取配置数量
    pub async fn count(&self) -> usize {
        self.configs.read().await.len()
    }

    /// 启用/禁用配置
    pub async fn set_enabled(&self, config_id: &str, enabled: bool) -> Result<(), String> {
        let mut configs = self.configs.write().await;
        if let Some(config) = configs.get_mut(config_id) {
            config.enabled = enabled;
            Ok(())
        } else {
            Err(format!("Config '{}' not found", config_id))
        }
    }
}

impl Default for PolicyEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn make_timestamp() -> String {
        let duration = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default();
        let secs = duration.as_secs();
        format!("2026-04-10T{:02}:{:02}:{:02}Z",
            (secs / 3600) % 24,
            (secs / 60) % 60,
            secs % 60)
    }

    #[tokio::test]
    async fn test_policy_engine_creation() {
        let engine = PolicyEngine::new();
        assert_eq!(engine.count().await, 0);
    }

    #[tokio::test]
    async fn test_check_auto_approve() {
        let engine = PolicyEngine::new();
        
        let config = PerToolApprovalConfig {
            id: "config-1".into(),
            service_id: "svc-1".into(),
            tool_pattern: "fs.read".into(),
            is_regex: false,
            policy: ApprovalPolicy::AutoApprove,
            description: Some("Auto-approve read operations".into()),
            enabled: true,
            created_at: make_timestamp(),
            updated_at: make_timestamp(),
            created_by: "admin".into(),
        };

        engine.set_config(config).await.unwrap();

        let result = engine.check("svc-1", "fs.read").await;
        assert!(result.approved);
        assert_eq!(result.policy, ApprovalPolicy::AutoApprove);
    }

    #[tokio::test]
    async fn test_check_manual() {
        let engine = PolicyEngine::new();
        
        let config = PerToolApprovalConfig {
            id: "config-2".into(),
            service_id: "svc-1".into(),
            tool_pattern: "fs.write".into(),
            is_regex: false,
            policy: ApprovalPolicy::Manual,
            description: Some("Manual approval for write operations".into()),
            enabled: true,
            created_at: make_timestamp(),
            updated_at: make_timestamp(),
            created_by: "admin".into(),
        };

        engine.set_config(config).await.unwrap();

        let result = engine.check("svc-1", "fs.write").await;
        assert!(!result.approved);
        assert_eq!(result.policy, ApprovalPolicy::Manual);
    }

    #[tokio::test]
    async fn test_check_denied() {
        let engine = PolicyEngine::new();
        
        let config = PerToolApprovalConfig {
            id: "config-3".into(),
            service_id: "svc-1".into(),
            tool_pattern: "dangerous.*".into(),
            is_regex: true,
            policy: ApprovalPolicy::Denied,
            description: Some("Deny dangerous operations".into()),
            enabled: true,
            created_at: make_timestamp(),
            updated_at: make_timestamp(),
            created_by: "admin".into(),
        };

        engine.set_config(config).await.unwrap();

        let result = engine.check("svc-1", "dangerous_operation").await;
        assert!(!result.approved);
        assert_eq!(result.policy, ApprovalPolicy::Denied);
    }

    #[tokio::test]
    async fn test_check_wildcard() {
        let engine = PolicyEngine::new();
        
        let config = PerToolApprovalConfig {
            id: "config-4".into(),
            service_id: "svc-1".into(),
            tool_pattern: "*".into(),
            is_regex: false,
            policy: ApprovalPolicy::AutoApprove,
            description: Some("Auto-approve all tools".into()),
            enabled: true,
            created_at: make_timestamp(),
            updated_at: make_timestamp(),
            created_by: "admin".into(),
        };

        engine.set_config(config).await.unwrap();

        let result = engine.check("svc-1", "any_tool").await;
        assert!(result.approved);
    }

    #[tokio::test]
    async fn test_check_no_config() {
        let engine = PolicyEngine::new();
        
        let result = engine.check("unknown-svc", "unknown-tool").await;
        assert!(!result.approved);
        assert_eq!(result.policy, ApprovalPolicy::Manual);
    }

    #[tokio::test]
    async fn test_list_configs() {
        let engine = PolicyEngine::new();
        
        let config1 = PerToolApprovalConfig {
            id: "config-5".into(),
            service_id: "svc-2".into(),
            tool_pattern: "tool1".into(),
            is_regex: false,
            policy: ApprovalPolicy::AutoApprove,
            description: None,
            enabled: true,
            created_at: make_timestamp(),
            updated_at: make_timestamp(),
            created_by: "admin".into(),
        };

        let config2 = PerToolApprovalConfig {
            id: "config-6".into(),
            service_id: "svc-2".into(),
            tool_pattern: "tool2".into(),
            is_regex: false,
            policy: ApprovalPolicy::Manual,
            description: None,
            enabled: true,
            created_at: make_timestamp(),
            updated_at: make_timestamp(),
            created_by: "admin".into(),
        };

        engine.set_config(config1).await.unwrap();
        engine.set_config(config2).await.unwrap();

        let configs = engine.list_configs("svc-2").await;
        assert_eq!(configs.len(), 2);
    }
}
