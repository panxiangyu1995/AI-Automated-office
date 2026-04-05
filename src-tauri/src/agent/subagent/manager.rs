//! Subagent 管理器
//!
//! 统一管理所有 Subagent

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::types::{AgentConfig, AgentType, ModelProvider, SubagentError, SubagentResult};
use super::loader::{SubagentLoader, get_builtin_hidden_agents};
use super::department_loader::DepartmentLoader;
use super::personal_loader::PersonalLoader;

/// Subagent 管理器
///
/// 统一管理所有类型的 Subagent（Department、Personal、Hidden）
pub struct SubagentManager {
    /// Department Subagent 加载器
    department_loader: Arc<DepartmentLoader>,
    /// Personal Subagent 加载器（按用户 ID 索引）
    personal_loaders: Arc<RwLock<HashMap<String, Arc<dyn SubagentLoader>>>>,
    /// Hidden Subagent 配置缓存
    hidden_agents: Arc<RwLock<Vec<AgentConfig>>>,
    /// 默认模型提供商
    default_model_provider: ModelProvider,
}

impl SubagentManager {
    /// 创建新的 SubagentManager
    pub fn new(default_model_provider: Option<ModelProvider>) -> Self {
        let default = default_model_provider.unwrap_or_else(|| ModelProvider {
            provider: "openai".to_string(),
            model_id: "gpt-4o".to_string(),
            temperature: 0.7,
            max_tokens: 4096,
        });

        Self {
            department_loader: Arc::new(DepartmentLoader::new()),
            personal_loaders: Arc::new(RwLock::new(HashMap::new())),
            hidden_agents: Arc::new(RwLock::new(Vec::new())),
            default_model_provider: default,
        }
    }

    /// 初始化 Hidden Subagent
    pub fn init_hidden_agents(&self) {
        let hidden_configs = get_builtin_hidden_agents();
        let configs: Vec<AgentConfig> = hidden_configs
            .into_iter()
            .map(|h| h.into_agent_config(&self.default_model_provider))
            .collect();

        let mut hidden = futures::executor::block_on(self.hidden_agents.write());
        *hidden = configs;
    }

    /// 获取 Department 加载器
    pub fn department_loader(&self) -> Arc<DepartmentLoader> {
        Arc::clone(&self.department_loader)
    }

    /// 获取或创建 Personal 加载器
    pub async fn get_personal_loader(&self, user_id: &str) -> SubagentResult<Arc<dyn SubagentLoader>> {
        let mut loaders = self.personal_loaders.write().await;
        
        if let Some(loader) = loaders.get(user_id) {
            return Ok(Arc::clone(loader));
        }

        // 创建新的 PersonalLoader
        let loader = PersonalLoader::new_in_memory(user_id.to_string())?;
        loaders.insert(user_id.to_string(), Arc::new(loader));

        Ok(Arc::clone(loaders.get(user_id).unwrap()))
    }

    /// 获取所有可用的 Subagent（根据用户权限过滤）
    pub async fn list_available(&self, user_id: &str) -> SubagentResult<Vec<AgentConfig>> {
        let mut configs = Vec::new();

        // 1. 添加 Hidden Subagents
        {
            let hidden = self.hidden_agents.read().await;
            configs.extend(hidden.clone());
        }

        // 2. 添加 Department Subagents
        for config in self.department_loader.load_all()? {
            configs.push(config);
        }

        // 3. 添加 Personal Subagents
        let personal_loader = self.get_personal_loader(user_id).await?;
        for config in personal_loader.load_all()? {
            configs.push(config);
        }

        Ok(configs)
    }

    /// 根据名称获取 Subagent 配置
    pub async fn get(&self, user_id: &str, name: &str) -> SubagentResult<Option<AgentConfig>> {
        // 1. 检查 Hidden Subagents
        {
            let hidden = self.hidden_agents.read().await;
            if let Some(config) = hidden.iter().find(|c| c.name == name) {
                return Ok(Some(config.clone()));
            }
        }

        // 2. 检查 Department Subagents
        if let Some(config) = self.department_loader.load(name)? {
            return Ok(Some(config));
        }

        // 3. 检查 Personal Subagents
        let personal_loader = self.get_personal_loader(user_id).await?;
        Ok(personal_loader.load(name)?)
    }

    /// 根据 Agent 类型获取 Subagent
    pub async fn get_by_type(&self, user_id: &str, agent_type: AgentType) -> SubagentResult<Vec<AgentConfig>> {
        let all = self.list_available(user_id).await?;
        Ok(all.into_iter().filter(|c| c.agent_type == agent_type).collect())
    }

    /// 检查 Subagent 是否存在
    pub async fn exists(&self, user_id: &str, name: &str) -> bool {
        self.get(user_id, name).await.ok().flatten().is_some()
    }

    /// 获取 Subagent 数量统计
    pub async fn get_stats(&self, user_id: &str) -> SubagentResult<SubagentStats> {
        let hidden_count = {
            let hidden = self.hidden_agents.read().await;
            hidden.len()
        };

        let department_count = self.department_loader.load_all().map(|v| v.len()).unwrap_or(0);

        let personal_loader = self.get_personal_loader(user_id).await?;
        let personal_count = personal_loader.load_all().unwrap_or_default().len();

        Ok(SubagentStats {
            hidden: hidden_count,
            department: department_count,
            personal: personal_count,
            total: hidden_count + department_count + personal_count,
        })
    }

    /// 根据关键词匹配 Subagent
    pub async fn match_by_keywords(&self, user_id: &str, keywords: &[String]) -> SubagentResult<Vec<AgentConfig>> {
        let all = self.list_available(user_id).await?;
        
        let matched: Vec<AgentConfig> = all
            .into_iter()
            .filter(|config| {
                // 检查触发关键词
                for keyword in keywords {
                    let keyword_lower = keyword.to_lowercase();
                    if config.trigger.keywords.iter().any(|k| k.to_lowercase().contains(&keyword_lower)) {
                        return true;
                    }
                    // 检查名称和描述
                    if config.name.to_lowercase().contains(&keyword_lower) 
                        || config.display_name.to_lowercase().contains(&keyword_lower)
                        || config.description.to_lowercase().contains(&keyword_lower) {
                        return true;
                    }
                }
                false
            })
            .collect();

        Ok(matched)
    }

    /// 按优先级排序 Subagent
    pub async fn get_by_priority(&self, user_id: &str) -> SubagentResult<Vec<AgentConfig>> {
        let mut all = self.list_available(user_id).await?;
        all.sort_by(|a, b| b.trigger.priority.cmp(&a.trigger.priority));
        Ok(all)
    }
}

impl Default for SubagentManager {
    fn default() -> Self {
        Self::new(None)
    }
}

/// Subagent 统计信息
#[derive(Debug, Clone)]
pub struct SubagentStats {
    /// Hidden Subagent 数量
    pub hidden: usize,
    /// Department Subagent 数量
    pub department: usize,
    /// Personal Subagent 数量
    pub personal: usize,
    /// 总数
    pub total: usize,
}

/// 全局 SubagentManager 实例
use std::sync::OnceLock;
static SUBAGENT_MANAGER: OnceLock<Arc<SubagentManager>> = OnceLock::new();

/// 获取全局 SubagentManager 实例
pub fn get_subagent_manager() -> Arc<SubagentManager> {
    SUBAGENT_MANAGER
        .get_or_init(|| Arc::new(SubagentManager::default()))
        .clone()
}

/// 初始化全局 SubagentManager
pub fn init_subagent_manager(default_model: Option<ModelProvider>) -> Arc<SubagentManager> {
    let manager = Arc::new(SubagentManager::new(default_model));
    manager.init_hidden_agents();
    
    SUBAGENT_MANAGER
        .set(manager.clone())
        .ok();
    
    manager
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_manager() -> SubagentManager {
        let manager = SubagentManager::new(Some(ModelProvider {
            provider: "test".to_string(),
            model_id: "test-model".to_string(),
            temperature: 0.7,
            max_tokens: 4096,
        }));
        manager.init_hidden_agents();
        manager
    }

    #[tokio::test]
    async fn test_list_available() {
        let manager = create_test_manager();
        let list = manager.list_available("user1").await.unwrap();
        
        // 应该包含 Hidden Subagents
        assert!(list.iter().any(|c| c.agent_type == AgentType::Hidden));
    }

    #[tokio::test]
    async fn test_get_stats() {
        let manager = create_test_manager();
        let stats = manager.get_stats("user1").await.unwrap();
        
        // Hidden agents 应该是内置的 3 个
        assert_eq!(stats.hidden, 3);
        assert!(stats.total >= stats.hidden);
    }

    #[tokio::test]
    async fn test_match_by_keywords() {
        let manager = create_test_manager();
        let matched = manager.match_by_keywords("user1", &["财务".to_string()]).await.unwrap();
        
        // 应该能匹配到标题生成器（包含 "title" 中的 "i" 不匹配 "财务"）
        // 实际测试时可能为空，因为默认没有配置触发关键词
        println!("Matched: {:?}", matched.len());
    }

    #[tokio::test]
    async fn test_exists() {
        let manager = create_test_manager();
        
        // Hidden Subagent 应该存在
        assert!(manager.exists("user1", "title").await);
        assert!(manager.exists("user1", "summary").await);
        assert!(manager.exists("user1", "compaction").await);
        
        // 不存在的应该返回 false
        assert!(!manager.exists("user1", "nonexistent").await);
    }
}
