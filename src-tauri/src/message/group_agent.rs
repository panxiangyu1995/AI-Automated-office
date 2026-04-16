//! 群聊 Agent 协作引擎
//!
//! 实现 FR639-FR649: Agent 在群聊中的协作行为
//! - FR639: Agent 消息必须有 "AI助手" 标识和所属员工
//! - FR640: Agent 默认静默，仅在特定场景发言
//! - FR642: 任务状态变化时 Agent 主动通知
//! - FR643: 员工发言涉及数据时 Agent 补充数据卡片
//! - FR644: 员工可以让 Agent 汇报工作进度
//! - FR645: 上游任务完成时 Agent 通知下游
//! - FR646: 员工可设置 Agent 在群内的发言权限
//! - FR649: Agent 在群内只能访问与任务相关的数据

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::group::GroupStore;
use super::group_message::{GroupMessage, GroupMessageStore};
pub use super::group_agent_types::*;

/// Agent 群聊协作引擎
///
/// 统一管理 Agent 在群聊中的协作行为：
/// - 发言权限控制 (FR646)
/// - 数据隔离 (FR649)
/// - 消息标识 (FR639)
/// - 触发策略 (FR640)
/// - 协作事件处理 (FR642/643/644/645)
pub struct GroupAgentEngine {
    /// 群组存储
    group_store: Arc<GroupStore>,
    /// 消息存储（用于发送 Agent 响应消息）
    #[allow(dead_code)]
    message_store: Arc<GroupMessageStore>,
    /// Agent 发言权限映射 (group_id:user_id -> permission)
    speech_permissions: Arc<RwLock<HashMap<String, AgentSpeechPermission>>>,
    /// Agent 数据隔离映射 (group_id:user_id -> data_scope)
    data_scopes: Arc<RwLock<HashMap<String, AgentDataScope>>>,
    /// 用户名称缓存 (user_id -> display_name)
    user_names: Arc<RwLock<HashMap<String, String>>>,
}

impl GroupAgentEngine {
    pub fn new(
        group_store: Arc<GroupStore>,
        message_store: Arc<GroupMessageStore>,
    ) -> Self {
        Self {
            group_store,
            message_store,
            speech_permissions: Arc::new(RwLock::new(HashMap::new())),
            data_scopes: Arc::new(RwLock::new(HashMap::new())),
            user_names: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    // ---- FR639: 消息标识 ----

    /// 为群消息添加 Agent 标识
    ///
    /// FR639: Agent 在群聊中的消息必须有 "AI助手" 标识和所属员工
    pub async fn create_agent_message(
        &self,
        group_id: String,
        agent_user_id: String,
        content: String,
    ) -> Result<GroupMessage, GroupAgentError> {
        // 验证 Agent 所属用户是群成员
        let group = self.group_store.get_group(&group_id).await
            .map_err(|_| GroupAgentError::GroupNotFound)?;

        if !group.is_member(&agent_user_id) {
            return Err(GroupAgentError::NotMember);
        }

        // FR639: 在消息内容前添加 AI 助手标识
        let user_names = self.user_names.read().await;
        let owner_name = user_names.get(&agent_user_id)
            .map(|n| n.as_str())
            .unwrap_or("员工");
        let badge = AgentMessageBadge::for_agent(agent_user_id.clone(), owner_name);

        // 构造带标识的消息内容
        let labeled_content = format!("[{}] {}", badge.display_label, content);

        let mut message = GroupMessage::new(
            group_id,
            agent_user_id,
            "agent".to_string(),
            labeled_content,
        );

        // 在 mentions 中标记这是 Agent 消息
        message.agent_response_id = Some(badge.display_label);

        Ok(message)
    }

    // ---- FR640/FR646: 发言权限 ----

    /// 设置 Agent 在群内的发言权限 (FR646)
    pub async fn set_speech_permission(&self, permission: AgentSpeechPermission) {
        let key = format!("{}:{}", permission.group_id, permission.user_id);
        let mut perms = self.speech_permissions.write().await;
        perms.insert(key, permission);
    }

    /// 获取 Agent 在群内的发言权限
    pub async fn get_speech_permission(
        &self,
        group_id: &str,
        user_id: &str,
    ) -> AgentSpeechPermission {
        let key = format!("{}:{}", group_id, user_id);
        let perms = self.speech_permissions.read().await;
        perms.get(&key).cloned().unwrap_or_else(|| {
            AgentSpeechPermission::new(user_id.to_string(), group_id.to_string())
        })
    }

    /// 检查 Agent 是否可以在指定场景发言
    pub async fn can_agent_speak(
        &self,
        group_id: &str,
        user_id: &str,
        scenario: AgentTriggerScenario,
    ) -> bool {
        let perm = self.get_speech_permission(group_id, user_id).await;
        perm.can_speak_in_scenario(scenario)
    }

    // ---- FR649: 数据隔离 ----

    /// 设置 Agent 在群内的数据访问范围
    pub async fn set_data_scope(&self, scope: AgentDataScope) {
        let key = format!("{}:{}", scope.group_id, scope.user_id);
        let mut scopes = self.data_scopes.write().await;
        scopes.insert(key, scope);
    }

    /// 获取 Agent 在群内的数据访问范围
    pub async fn get_data_scope(&self, group_id: &str, user_id: &str) -> AgentDataScope {
        let key = format!("{}:{}", group_id, user_id);
        let scopes = self.data_scopes.read().await;
        scopes.get(&key).cloned().unwrap_or_else(|| {
            AgentDataScope::new(group_id.to_string(), user_id.to_string())
        })
    }

    /// 检查 Agent 是否可以访问指定数据 (FR649)
    pub async fn can_access_data(
        &self,
        group_id: &str,
        user_id: &str,
        department: &str,
        entity_type: &str,
    ) -> bool {
        let scope = self.get_data_scope(group_id, user_id).await;
        scope.can_access_department(department) && scope.can_access_entity(entity_type)
    }

    // ---- FR642/643/644/645: 协作事件处理 ----

    /// 处理协作事件并生成 Agent 响应
    ///
    /// 根据事件类型和 Agent 权限决定是否生成响应消息
    pub async fn handle_collaboration_event(
        &self,
        event: &AgentCollaborationEvent,
    ) -> Vec<GroupMessage> {
        let mut responses = Vec::new();

        // 获取群组所有成员
        let group = match self.group_store.get_group(&event.group_id).await {
            Ok(g) => g,
            Err(_) => return responses,
        };

        // 遍历所有启用 Agent 的成员
        for member in &group.members {
            if !member.is_active() || !member.agent_enabled {
                continue;
            }

            // 确定对应的触发场景
            let scenario = match event.event_type {
                CollaborationEventType::TaskStatusChanged => AgentTriggerScenario::TaskStatusChanged,
                CollaborationEventType::DataSupplement => AgentTriggerScenario::DataSupplement,
                CollaborationEventType::ProgressReport => AgentTriggerScenario::ProgressReport,
                CollaborationEventType::CollaborationRelay => AgentTriggerScenario::CollaborationRelay,
            };

            // 检查该成员的 Agent 是否有权限在此场景发言
            if !self.can_agent_speak(&event.group_id, &member.user_id, scenario).await {
                continue;
            }

            // FR649: 检查数据访问权限
            if let Some(data) = &event.related_data {
                if let Some(dept) = data.get("department").and_then(|v| v.as_str()) {
                    if let Some(entity) = data.get("entity_type").and_then(|v| v.as_str()) {
                        if !self.can_access_data(
                            &event.group_id,
                            &member.user_id,
                            dept,
                            entity,
                        ).await {
                            continue;
                        }
                    }
                }
            }

            // 生成 Agent 响应消息
            if let Ok(msg) = self.create_agent_message(
                event.group_id.clone(),
                member.user_id.clone(),
                event.content.clone(),
            ).await {
                responses.push(msg);
            }
        }

        responses
    }

    // ---- 用户名称管理 ----

    /// 注册用户显示名称（用于 FR639 标识）
    pub async fn register_user_name(&self, user_id: String, display_name: String) {
        let mut names = self.user_names.write().await;
        names.insert(user_id, display_name);
    }

    /// 获取用户显示名称
    pub async fn get_user_name(&self, user_id: &str) -> Option<String> {
        let names = self.user_names.read().await;
        names.get(user_id).cloned()
    }
}

// ============ 单元测试 ============

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_message_badge_for_agent() {
        let badge = AgentMessageBadge::for_agent("user-1".to_string(), "张三");
        assert!(badge.is_ai_assistant);
        assert_eq!(badge.owner_user_id, "user-1");
        assert_eq!(badge.display_label, "张三的AI助手");
    }

    #[test]
    fn test_agent_message_badge_for_human() {
        let badge = AgentMessageBadge::for_human();
        assert!(!badge.is_ai_assistant);
        assert!(badge.display_label.is_empty());
    }

    #[test]
    fn test_agent_speech_mode_default_is_silent() {
        assert_eq!(AgentSpeechMode::default(), AgentSpeechMode::Silent);
    }

    #[test]
    fn test_speech_permission_default() {
        let perm = AgentSpeechPermission::new("user-1".to_string(), "group-1".to_string());
        assert_eq!(perm.speech_mode, AgentSpeechMode::Silent);
        assert!(perm.can_speak_in_scenario(AgentTriggerScenario::Mentioned));
        assert!(!perm.can_speak_in_scenario(AgentTriggerScenario::TaskStatusChanged));
        assert!(!perm.can_speak_in_scenario(AgentTriggerScenario::DataSupplement));
    }

    #[test]
    fn test_speech_permission_muted_denies_all() {
        let mut perm = AgentSpeechPermission::new("user-1".to_string(), "group-1".to_string());
        perm.speech_mode = AgentSpeechMode::Muted;
        assert!(!perm.can_speak_in_scenario(AgentTriggerScenario::Mentioned));
        assert!(!perm.can_speak_in_scenario(AgentTriggerScenario::TaskStatusChanged));
    }

    #[test]
    fn test_speech_permission_full() {
        let perm = AgentSpeechPermission::new("user-1".to_string(), "group-1".to_string())
            .with_full_permission();
        assert_eq!(perm.speech_mode, AgentSpeechMode::Proactive);
        assert!(perm.can_speak_in_scenario(AgentTriggerScenario::Mentioned));
        assert!(perm.can_speak_in_scenario(AgentTriggerScenario::TaskStatusChanged));
        assert!(perm.can_speak_in_scenario(AgentTriggerScenario::DataSupplement));
        assert!(perm.can_speak_in_scenario(AgentTriggerScenario::ProgressReport));
        assert!(perm.can_speak_in_scenario(AgentTriggerScenario::CollaborationRelay));
    }

    #[test]
    fn test_data_scope_default_is_task_only() {
        let scope = AgentDataScope::new("group-1".to_string(), "user-1".to_string());
        assert_eq!(scope.scope_level, DataScopeLevel::TaskOnly);
        assert!(!scope.can_access_department("hr"));
        assert!(!scope.can_access_entity("employee"));
    }

    #[test]
    fn test_data_scope_company_level() {
        let mut scope = AgentDataScope::new("group-1".to_string(), "user-1".to_string());
        scope.scope_level = DataScopeLevel::Company;
        assert!(scope.can_access_department("hr"));
        assert!(scope.can_access_entity("employee"));
    }

    #[test]
    fn test_data_scope_department_level() {
        let mut scope = AgentDataScope::new("group-1".to_string(), "user-1".to_string());
        scope.scope_level = DataScopeLevel::Department;
        scope.allowed_departments = vec!["hr".to_string(), "finance".to_string()];
        scope.allowed_entities = vec!["employee".to_string(), "invoice".to_string()];
        assert!(scope.can_access_department("hr"));
        assert!(!scope.can_access_department("sales"));
        assert!(scope.can_access_entity("employee"));
        assert!(!scope.can_access_entity("customer"));
    }

    #[tokio::test]
    async fn test_group_agent_engine_speech_permission() {
        let group_store = Arc::new(GroupStore::new());
        let message_store = Arc::new(GroupMessageStore::new());
        let engine = GroupAgentEngine::new(group_store, message_store);

        assert!(engine.can_agent_speak("g1", "u1", AgentTriggerScenario::Mentioned).await);
        assert!(!engine.can_agent_speak("g1", "u1", AgentTriggerScenario::TaskStatusChanged).await);

        let perm = AgentSpeechPermission::new("u1".to_string(), "g1".to_string())
            .with_full_permission();
        engine.set_speech_permission(perm).await;

        assert!(engine.can_agent_speak("g1", "u1", AgentTriggerScenario::TaskStatusChanged).await);
        assert!(engine.can_agent_speak("g1", "u1", AgentTriggerScenario::CollaborationRelay).await);
    }

    #[tokio::test]
    async fn test_group_agent_engine_data_scope() {
        let group_store = Arc::new(GroupStore::new());
        let message_store = Arc::new(GroupMessageStore::new());
        let engine = GroupAgentEngine::new(group_store, message_store);

        assert!(!engine.can_access_data("g1", "u1", "hr", "employee").await);

        let mut scope = AgentDataScope::new("g1".to_string(), "u1".to_string());
        scope.scope_level = DataScopeLevel::Department;
        scope.allowed_departments = vec!["hr".to_string()];
        scope.allowed_entities = vec!["employee".to_string()];
        engine.set_data_scope(scope).await;

        assert!(engine.can_access_data("g1", "u1", "hr", "employee").await);
        assert!(!engine.can_access_data("g1", "u1", "sales", "customer").await);
    }

    #[tokio::test]
    async fn test_group_agent_engine_user_name_registration() {
        let group_store = Arc::new(GroupStore::new());
        let message_store = Arc::new(GroupMessageStore::new());
        let engine = GroupAgentEngine::new(group_store, message_store);

        engine.register_user_name("user-1".to_string(), "张三".to_string()).await;
        assert_eq!(engine.get_user_name("user-1").await, Some("张三".to_string()));
        assert_eq!(engine.get_user_name("user-2").await, None);
    }

    #[tokio::test]
    async fn test_group_agent_engine_create_agent_message() {
        let group_store = Arc::new(GroupStore::new());
        let message_store = Arc::new(GroupMessageStore::new());
        let engine = GroupAgentEngine::new(group_store.clone(), message_store);

        let group = group_store.create_group(
            "测试群".to_string(),
            "user-1".to_string(),
            super::super::group::GroupType::Public,
        ).await;

        engine.register_user_name("user-1".to_string(), "张三".to_string()).await;

        let msg = engine.create_agent_message(
            group.id.clone(),
            "user-1".to_string(),
            "这是Agent的回复".to_string(),
        ).await.unwrap();

        assert_eq!(msg.sender_type, "agent");
        assert!(msg.content.contains("张三的AI助手"));
        assert!(msg.agent_response_id.is_some());
    }

    #[tokio::test]
    async fn test_group_agent_engine_create_agent_message_not_member() {
        let group_store = Arc::new(GroupStore::new());
        let message_store = Arc::new(GroupMessageStore::new());
        let engine = GroupAgentEngine::new(group_store, message_store);

        let result = engine.create_agent_message(
            "nonexistent-group".to_string(),
            "user-1".to_string(),
            "test".to_string(),
        ).await;

        assert!(result.is_err());
    }

    #[test]
    fn test_collaboration_event_type_serde() {
        let event_type = CollaborationEventType::TaskStatusChanged;
        let json = serde_json::to_string(&event_type).unwrap();
        assert!(json.contains("task_status_changed"));
    }
}
