//! 三层记忆与Runtime集成模块
//!
//! 实现FR14-4至FR14-12: 三层记忆与AgentRuntime集成
//! - Hook事件自动捕获
//! - 记忆检索注入
//! - 记忆更新决策

use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;
use serde::{Deserialize, Serialize};

/// 记忆项
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryItem {
    /// 记忆ID
    pub id: String,
    /// 层级 (1=个人, 2=企业, 3=图谱)
    pub layer: u8,
    /// 内容
    pub content: String,
    /// 类型
    pub memory_type: MemoryType,
    /// 关联实体
    pub entities: Vec<String>,
    /// 创建时间
    pub created_at: i64,
    /// 更新时间
    pub updated_at: i64,
    /// 访问次数
    pub access_count: u32,
    /// 重要性评分
    pub importance: f32,
    /// 标签
    pub tags: Vec<String>,
}

/// 记忆类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MemoryType {
    Fact,        // 事实
    Preference,  // 偏好
    Project,     // 项目
    Contact,     // 联系人
    Todo,        // 待办
    Meeting,     // 会议
    Document,    // 文档
    Code,        // 代码
    Other,       // 其他
}

/// 记忆检索结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryRetrievalResult {
    /// 个人记忆 (L1)
    pub personal: Vec<MemoryItem>,
    /// 企业知识 (L2)
    pub enterprise: Vec<MemoryItem>,
    /// 图谱知识 (L3)
    pub graph: Vec<MemoryItem>,
    /// 总置信度
    pub total_confidence: f32,
}

/// Hook事件类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MemoryHookEvent {
    SessionStart,
    UserPrompt,
    PostToolUse,
    SessionEnd,
    Error,
}

/// 工具结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolResult {
    pub tool_name: String,
    pub success: bool,
    pub result: String,
    pub error: Option<String>,
}

/// 会话信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    pub session_id: String,
    pub user_id: String,
    pub tenant_id: String,
    pub created_at: i64,
}

/// 记忆更新建议
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryUpdate {
    pub item: MemoryItem,
    pub action: UpdateAction,
    pub reason: String,
}

/// 更新动作
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum UpdateAction {
    Add,
    Update,
    Delete,
    Merge,
}

/// 三层记忆与Runtime集成服务
pub struct MemoryRuntimeIntegration {
    /// 记忆存储
    memory_store: Arc<RwLock<Vec<MemoryItem>>>,
    /// L1个人记忆配置
    l1_config: L1Config,
    /// L2企业知识配置
    l2_config: L2Config,
    /// Hook统计
    stats: Arc<RwLock<HookStats>>,
}

#[derive(Debug, Clone)]
struct L1Config {
    /// 保留最近的记忆数
    max_recent: usize,
    /// 重要性阈值
    importance_threshold: f32,
    /// 自动提取关键词
    auto_extract_keywords: bool,
}

#[derive(Debug, Clone)]
struct L2Config {
    /// 企业知识库ID
    knowledge_base_id: Option<String>,
    /// 自动关联
    auto_associate: bool,
}

#[derive(Debug, Clone)]
pub(crate) struct HookStats {
    pub session_start_count: u32,
    pub user_prompt_count: u32,
    pub tool_use_count: u32,
    pub session_end_count: u32,
    pub memories_added: u32,
}

impl MemoryRuntimeIntegration {
    pub fn new() -> Self {
        Self {
            memory_store: Arc::new(RwLock::new(Vec::new())),
            l1_config: L1Config {
                max_recent: 50,
                importance_threshold: 0.5,
                auto_extract_keywords: true,
            },
            l2_config: L2Config {
                knowledge_base_id: None,
                auto_associate: true,
            },
            stats: Arc::new(RwLock::new(HookStats {
                session_start_count: 0,
                user_prompt_count: 0,
                tool_use_count: 0,
                session_end_count: 0,
                memories_added: 0,
            })),
        }
    }

    /// Hook: SessionStart - 加载L1个人记忆
    pub async fn on_session_start(&self, _session: &SessionInfo) -> Vec<MemoryItem> {
        // 更新统计
        {
            let mut stats = self.stats.write().await;
            stats.session_start_count += 1;
        }

        // 搜索L1个人记忆
        let store = self.memory_store.read().await;
        let personal_memories: Vec<MemoryItem> = store.iter()
            .filter(|m| m.layer == 1)
            .filter(|m| {
                // 优先返回高重要性和高访问的记忆
                m.importance > 0.5 || m.access_count > 2
            })
            .take(self.l1_config.max_recent)
            .cloned()
            .collect();

        // 增加访问计数
        drop(store);
        for memory in &personal_memories {
            self.increment_access_count(&memory.id).await;
        }

        personal_memories
    }

    /// Hook: UserPrompt - 分析是否需要记忆
    pub async fn on_user_prompt(
        &self,
        prompt: &str,
        session: &SessionInfo,
    ) -> Option<MemoryItem> {
        // 更新统计
        {
            let mut stats = self.stats.write().await;
            stats.user_prompt_count += 1;
        }

        // 分析是否应该记住
        if self.should_remember(prompt) {
            let item = self.extract_memory_item(prompt, session);
            
            // 添加到存储
            self.add_memory(item.clone()).await;
            
            // 更新统计
            {
                let mut stats = self.stats.write().await;
                stats.memories_added += 1;
            }
            
            return Some(item);
        }
        
        None
    }

    /// Hook: PostToolUse - 关键结果记忆
    pub async fn on_tool_result(
        &self,
        result: &ToolResult,
        session: &SessionInfo,
    ) -> Option<MemoryItem> {
        // 更新统计
        {
            let mut stats = self.stats.write().await;
            stats.tool_use_count += 1;
        }

        // 检查是否是关键结果
        if self.is_key_result(result) {
            let item = self.memory_item_from_tool_result(result, session);
            
            self.add_memory(item.clone()).await;
            
            {
                let mut stats = self.stats.write().await;
                stats.memories_added += 1;
            }
            
            return Some(item);
        }
        
        None
    }

    /// Hook: SessionEnd - 提取关键事实到L1
    pub async fn on_session_end(&self, session: &SessionInfo) -> Vec<MemoryItem> {
        // 更新统计
        {
            let mut stats = self.stats.write().await;
            stats.session_end_count += 1;
        }

        // 从会话历史中提取关键事实
        let key_facts = self.extract_key_facts(session);
        
        for fact in &key_facts {
            self.add_memory(fact.clone()).await;
        }

        key_facts
    }

    /// 判断是否应该记住
    fn should_remember(&self, content: &str) -> bool {
        // 长度检查
        if content.len() < 20 {
            return false;
        }

        // 检查关键词模式
        let patterns = [
            "记住", "别忘了", "记得",
            "我需要", "我要", "我喜欢",
            "我的", "我在做", "我正在",
            "完成了", "解决了", "发现了",
        ];

        for pattern in patterns {
            if content.contains(pattern) {
                return true;
            }
        }

        // 检查是否有实体提及
        if self.contains_entities(content) {
            return true;
        }

        false
    }

    /// 检查是否包含实体
    fn contains_entities(&self, content: &str) -> bool {
        // 简单检测：包含大写字母开头的词（可能是名字/项目名）
        let words: Vec<&str> = content.split_whitespace().collect();
        for word in words {
            if word.len() > 1 && word.chars().next().unwrap().is_uppercase() {
                return true;
            }
        }
        false
    }

    /// 提取记忆项
    fn extract_memory_item(&self, content: &str, _session: &SessionInfo) -> MemoryItem {
        let now = Utc::now().timestamp();
        
        // 分析记忆类型
        let memory_type = self.infer_memory_type(content);
        
        // 提取实体
        let entities = self.extract_entities(content);
        
        // 计算重要性
        let importance = self.calculate_importance(content);
        
        // 提取标签
        let tags = self.extract_tags(content);
        
        MemoryItem {
            id: uuid::Uuid::new_v4().to_string(),
            layer: 1, // 个人记忆
            content: content.to_string(),
            memory_type,
            entities,
            created_at: now,
            updated_at: now,
            access_count: 0,
            importance,
            tags,
        }
    }

    /// 推断记忆类型
    fn infer_memory_type(&self, content: &str) -> MemoryType {
        let content_lower = content.to_lowercase();
        
        if content_lower.contains("完成") || content_lower.contains("结束") {
            MemoryType::Todo
        } else if content_lower.contains("会议") || content_lower.contains("约") {
            MemoryType::Meeting
        } else if content_lower.contains("喜欢") || content_lower.contains("偏好") {
            MemoryType::Preference
        } else if content_lower.contains("项目") || content_lower.contains("任务") {
            MemoryType::Project
        } else if content_lower.contains("联系") || content_lower.contains("找") {
            MemoryType::Contact
        } else if content_lower.contains("代码") || content_lower.contains("函数") {
            MemoryType::Code
        } else if content_lower.contains("文档") || content_lower.contains("文件") {
            MemoryType::Document
        } else {
            MemoryType::Fact
        }
    }

    /// 提取实体
    fn extract_entities(&self, content: &str) -> Vec<String> {
        let mut entities = Vec::new();
        let words: Vec<&str> = content.split_whitespace().collect();
        
        for word in words {
            // 检测大写字母开头的词
            if word.len() > 1 && word.chars().next().unwrap().is_uppercase() {
                entities.push(word.to_string());
            }
        }
        
        entities.truncate(5); // 限制数量
        entities
    }

    /// 计算重要性
    fn calculate_importance(&self, content: &str) -> f32 {
        let mut score: f32 = 0.5; // 基础分
        
        // 长度贡献
        if content.len() > 100 { score += 0.1; }
        if content.len() > 200 { score += 0.1; }
        
        // 关键词贡献
        let keywords = ["重要", "必须", "紧急", "关键", "记住", "别忘"];
        for kw in keywords {
            if content.contains(kw) {
                score += 0.15;
            }
        }
        
        score.min(1.0)
    }

    /// 提取标签
    fn extract_tags(&self, content: &str) -> Vec<String> {
        let mut tags = Vec::new();
        
        // 基于关键词提取标签
        let tag_keywords = [
            ("工作", vec!["工作", "项目", "任务", "代码"]),
            ("个人", vec!["我", "我的", "喜欢", "想"]),
            ("会议", vec!["会议", "约", "见面"]),
            ("学习", vec!["学习", "研究", "了解"]),
        ];
        
        for (tag, keywords) in tag_keywords {
            for kw in keywords {
                if content.contains(kw) {
                    if !tags.contains(&tag.to_string()) {
                        tags.push(tag.to_string());
                    }
                    break;
                }
            }
        }
        
        tags.truncate(3);
        tags
    }

    /// 检查是否是关键结果
    fn is_key_result(&self, result: &ToolResult) -> bool {
        // 成功的工具调用
        if !result.success {
            return false;
        }

        // 包含关键信息的结果
        let key_patterns = [
            "完成", "创建", "更新", "删除",
            "编译", "测试", "部署",
            "保存", "导出", "生���",
        ];

        for pattern in key_patterns {
            if result.result.contains(pattern) {
                return true;
            }
        }

        false
    }

    /// 从工具结果创建记忆项
    fn memory_item_from_tool_result(&self, result: &ToolResult, _session: &SessionInfo) -> MemoryItem {
        let now = Utc::now().timestamp();
        
        MemoryItem {
            id: uuid::Uuid::new_v4().to_string(),
            layer: 1,
            content: format!("[{}] {}", result.tool_name, result.result),
            memory_type: MemoryType::Fact,
            entities: vec![result.tool_name.clone()],
            created_at: now,
            updated_at: now,
            access_count: 0,
            importance: 0.6,
            tags: vec!["tool_result".to_string()],
        }
    }

    /// 提取关键事实
    fn extract_key_facts(&self, _session: &SessionInfo) -> Vec<MemoryItem> {
        // 简化实现：返回空列表
        // 实际实现需要分析会话历史
        Vec::new()
    }

    /// 添加记忆
    async fn add_memory(&self, item: MemoryItem) {
        let mut store = self.memory_store.write().await;
        store.push(item);
        
        // 限制存储大小
        if store.len() > 1000 {
            // 删除最老的低重要性记忆
            store.sort_by(|a, b| {
                b.importance.partial_cmp(&a.importance).unwrap()
            });
            store.truncate(800);
        }
    }

    /// 增加访问计数
    async fn increment_access_count(&self, memory_id: &str) {
        let mut store = self.memory_store.write().await;
        if let Some(item) = store.iter_mut().find(|m| m.id == memory_id) {
            item.access_count += 1;
        }
    }

    /// 检索记忆
    pub async fn search(&self, query: &str, layer: Option<u8>) -> MemoryRetrievalResult {
        let store = self.memory_store.read().await;
        
        let mut personal = Vec::new();
        let mut enterprise = Vec::new();
        let mut graph = Vec::new();
        
        for item in store.iter() {
            // 检查层级
            if let Some(l) = layer {
                if item.layer != l {
                    continue;
                }
            }
            
            // 简单关键词匹配
            if item.content.to_lowercase().contains(&query.to_lowercase()) {
                match item.layer {
                    1 => personal.push(item.clone()),
                    2 => enterprise.push(item.clone()),
                    3 => graph.push(item.clone()),
                    _ => {}
                }
            }
        }
        
        // 计算总置信度
        let total_confidence = if personal.is_empty() && enterprise.is_empty() && graph.is_empty() {
            0.0
        } else {
            0.7 // 简化计算
        };
        
        MemoryRetrievalResult {
            personal,
            enterprise,
            graph,
            total_confidence,
        }
    }

    /// 获取统计
    pub(crate) async fn get_stats(&self) -> HookStats {
        self.stats.read().await.clone()
    }

    /// 重置统计
    pub async fn reset_stats(&self) {
        let mut stats = self.stats.write().await;
        *stats = HookStats {
            session_start_count: 0,
            user_prompt_count: 0,
            tool_use_count: 0,
            session_end_count: 0,
            memories_added: 0,
        };
    }
}

impl Default for MemoryRuntimeIntegration {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_should_remember() {
        let integration = MemoryRuntimeIntegration::new();
        
        assert!(integration.should_remember("记住我的项目是X"));
        assert!(integration.should_remember("我喜欢用VSCode"));
        assert!(!integration.should_remember("hello"));
    }

    #[tokio::test]
    async fn test_infer_memory_type() {
        let integration = MemoryRuntimeIntegration::new();
        
        assert_eq!(integration.infer_memory_type("完成了任务A"), MemoryType::Todo);
        assert_eq!(integration.infer_memory_type("约了明天的会议"), MemoryType::Meeting);
    }

    #[tokio::test]
    async fn test_session_start() {
        let integration = MemoryRuntimeIntegration::new();
        
        let session = SessionInfo {
            session_id: "test".to_string(),
            user_id: "user-1".to_string(),
            tenant_id: "tenant-1".to_string(),
            created_at: Utc::now().timestamp(),
        };
        
        let memories = integration.on_session_start(&session).await;
        assert!(memories.is_empty()); // 初始为空
        
        // 添加一些记忆
        integration.add_memory(MemoryItem {
            id: "mem-1".to_string(),
            layer: 1,
            content: "我喜欢用Python".to_string(),
            memory_type: MemoryType::Preference,
            entities: vec![],
            created_at: Utc::now().timestamp(),
            updated_at: Utc::now().timestamp(),
            access_count: 3,
            importance: 0.7,
            tags: vec![],
        }).await;
        
        let memories = integration.on_session_start(&session).await;
        assert!(!memories.is_empty());
    }
}