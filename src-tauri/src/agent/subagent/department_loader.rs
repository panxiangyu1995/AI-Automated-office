//! Department Subagent 加载器
//!
//! 从插件 manifest 中加载 Department Subagent 配置

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::types::{AgentConfig, AgentType, SubagentError, SubagentResult};
use super::loader::SubagentLoader;

/// Department Subagent 加载器
///
/// 从插件 manifest 中读取 Subagent 配置
pub struct DepartmentLoader {
    /// 插件 Subagent 配置缓存
    /// key: plugin_id, value: AgentConfig
    subagents: Arc<RwLock<HashMap<String, AgentConfig>>>,
    /// 名称索引
    /// key: subagent_name, value: plugin_id
    name_index: Arc<RwLock<HashMap<String, String>>>,
}

impl DepartmentLoader {
    /// 创建新的 DepartmentLoader
    pub fn new() -> Self {
        Self {
            subagents: Arc::new(RwLock::new(HashMap::new())),
            name_index: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 注册一个 Department Subagent（由插件管理器调用）
    pub async fn register(&self, config: AgentConfig) -> SubagentResult<()> {
        let plugin_id = config.plugin_id.clone()
            .ok_or_else(|| SubagentError::ConfigInvalid("Department Subagent must have plugin_id".to_string()))?;

        let name = config.name.clone();

        // 验证配置
        if config.agent_type != AgentType::Department {
            return Err(SubagentError::ConfigInvalid(
                format!("Expected AgentType::Department, got {:?}", config.agent_type)
            ));
        }

        // 存储配置
        {
            let mut subagents = self.subagents.write().await;
            subagents.insert(plugin_id.clone(), config);
        }

        // 更新名称索引
        {
            let mut name_index = self.name_index.write().await;
            name_index.insert(name, plugin_id);
        }

        Ok(())
    }

    /// 注销一个 Department Subagent
    pub async fn unregister(&self, plugin_id: &str) -> SubagentResult<()> {
        let name = {
            let subagents = self.subagents.read().await;
            subagents.get(plugin_id)
                .map(|c| c.name.clone())
        };

        if let Some(name) = name {
            let mut subagents = self.subagents.write().await;
            subagents.remove(plugin_id);

            let mut name_index = self.name_index.write().await;
            name_index.remove(&name);
        }

        Ok(())
    }

    /// 清除所有注册的 Subagent
    pub async fn clear(&self) {
        let mut subagents = self.subagents.write().await;
        subagents.clear();

        let mut name_index = self.name_index.write().await;
        name_index.clear();
    }
}

impl Default for DepartmentLoader {
    fn default() -> Self {
        Self::new()
    }
}

impl SubagentLoader for DepartmentLoader {
    fn load_all(&self) -> SubagentResult<Vec<AgentConfig>> {
        // 使用 blocking_read 因为这个方法可能在异步上下文中调用
        let subagents = futures::executor::block_on(self.subagents.read());
        Ok(subagents.values().cloned().collect())
    }

    fn load(&self, name: &str) -> SubagentResult<Option<AgentConfig>> {
        let name_index = futures::executor::block_on(self.name_index.read());
        
        if let Some(plugin_id) = name_index.get(name) {
            let subagents = futures::executor::block_on(self.subagents.read());
            Ok(subagents.get(plugin_id).cloned())
        } else {
            Ok(None)
        }
    }

    fn get_type(&self) -> AgentType {
        AgentType::Department
    }

    fn name(&self) -> &str {
        "department"
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_register_and_load() {
        let loader = DepartmentLoader::new();
        
        let config = AgentConfig {
            name: "finance".to_string(),
            agent_type: AgentType::Department,
            mode: AgentMode::Department,
            display_name: "财务助手".to_string(),
            description: "处理财务相关任务".to_string(),
            models: ModelConfig::default(),
            plugin_id: Some("finance-plugin".to_string()),
            ..Default::default()
        };

        loader.register(config.clone()).await.unwrap();

        let loaded = loader.load("finance").unwrap();
        assert!(loaded.is_some());
        assert_eq!(loaded.unwrap().name, "finance");
    }

    #[tokio::test]
    async fn test_load_all() {
        let loader = DepartmentLoader::new();

        let config1 = AgentConfig {
            name: "finance".to_string(),
            agent_type: AgentType::Department,
            mode: AgentMode::Department,
            display_name: "财务助手".to_string(),
            description: "处理财务相关任务".to_string(),
            models: ModelConfig::default(),
            plugin_id: Some("finance-plugin".to_string()),
            ..Default::default()
        };

        let config2 = AgentConfig {
            name: "sales".to_string(),
            agent_type: AgentType::Department,
            mode: AgentMode::Department,
            display_name: "销售助手".to_string(),
            description: "处理销售相关任务".to_string(),
            models: ModelConfig::default(),
            plugin_id: Some("sales-plugin".to_string()),
            ..Default::default()
        };

        loader.register(config1).await.unwrap();
        loader.register(config2).await.unwrap();

        let all = loader.load_all().unwrap();
        assert_eq!(all.len(), 2);
    }

    #[tokio::test]
    async fn test_unregister() {
        let loader = DepartmentLoader::new();
        
        let config = AgentConfig {
            name: "finance".to_string(),
            agent_type: AgentType::Department,
            mode: AgentMode::Department,
            display_name: "财务助手".to_string(),
            description: "处理财务相关任务".to_string(),
            models: ModelConfig::default(),
            plugin_id: Some("finance-plugin".to_string()),
            ..Default::default()
        };

        loader.register(config).await.unwrap();
        loader.unregister("finance-plugin").await.unwrap();

        let loaded = loader.load("finance").unwrap();
        assert!(loaded.is_none());
    }
}
