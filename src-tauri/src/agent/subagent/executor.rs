//! SubAgent Executor Module
//!
//! 实现 SubAgent 的委派执行逻辑，将请求委派给合适的 SubAgent 并返回结果。
//! Story 60.2 - SubAgent 委派执行

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::sync::RwLock;
use tokio::time::timeout;
use uuid::Uuid;

use super::types::{
    AgentConfig, DelegationConstraints, DelegationContext, OutputFormat,
    SubagentError, SubagentExecutionResult, SubagentResult, ToolPermissions,
};

/// 委派执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelegationOutcome {
    /// 委派唯一标识
    pub delegation_id: String,
    /// SubAgent ID
    pub subagent_id: String,
    /// SubAgent 名称
    pub subagent_name: String,
    /// 执行状态
    pub status: DelegationStatus,
    /// 输出内容
    pub output: Option<String>,
    /// 错误信息
    pub error: Option<String>,
    /// 执行耗时（毫秒）
    pub elapsed_ms: u64,
    /// 委派深度
    pub delegation_depth: u32,
}

/// 委派状态
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DelegationStatus {
    /// 成功
    Success,
    /// 超时
    Timeout,
    /// 错误
    Error,
    /// 拒绝
    Rejected,
}

/// 执行器错误
#[derive(Debug, Error)]
pub enum ExecutorError {
    #[error("SubAgent not found: {0}")]
    SubAgentNotFound(String),

    #[error("Timeout after {0}ms")]
    Timeout(u64),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Execution failed: {0}")]
    ExecutionFailed(String),

    #[error("Max delegation depth exceeded: {0}")]
    MaxDepthExceeded(u32),

    #[error("Cyclic delegation detected")]
    CyclicDelegation,
}

impl From<ExecutorError> for SubagentError {
    fn from(err: ExecutorError) -> Self {
        match err {
            ExecutorError::SubAgentNotFound(s) => SubagentError::NotFound(s),
            ExecutorError::PermissionDenied(s) => SubagentError::PermissionDenied(s),
            ExecutorError::ExecutionFailed(s) => SubagentError::Execution(s),
            _ => SubagentError::Execution(err.to_string()),
        }
    }
}

/// SubAgent Executor
///
/// 负责执行 SubAgent 委派，包括：
/// - 权限验证和收缩
/// - 执行超时控制
/// - 委派深度限制
/// - 结果收集和返回
pub struct SubagentExecutor {
    /// SubAgent 配置缓存
    agent_configs: Arc<RwLock<HashMap<String, AgentConfig>>>,
    /// 当前委派深度
    current_depth: Arc<RwLock<u32>>,
    /// 最大允许深度
    max_depth: u32,
    /// 委派历史
    history: Arc<RwLock<Vec<DelegationOutcome>>>,
}

impl SubagentExecutor {
    /// 创建新的 Executor
    pub fn new(max_depth: u32) -> Self {
        Self {
            agent_configs: Arc::new(RwLock::new(HashMap::new())),
            current_depth: Arc::new(RwLock::new(0)),
            max_depth,
            history: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// 注册 SubAgent 配置
    pub async fn register_agent(&self, config: AgentConfig) {
        let mut configs = self.agent_configs.write().await;
        configs.insert(config.name.clone(), config);
    }

    /// 批量注册 SubAgent
    pub async fn register_agents(&self, configs: Vec<AgentConfig>) {
        let mut agent_configs = self.agent_configs.write().await;
        for config in configs {
            agent_configs.insert(config.name.clone(), config);
        }
    }

    /// 执行委派
    ///
    /// # Arguments
    /// * `subagent_id` - SubAgent 标识
    /// * `context` - 委派上下文
    /// * `timeout_ms` - 超时时间（毫秒）
    pub async fn execute(
        &self,
        subagent_id: &str,
        context: DelegationContext,
        timeout_ms: u64,
    ) -> SubagentResult<DelegationOutcome> {
        let start = Instant::now();

        // 检查委派深度
        let depth = *self.current_depth.read().await;
        if depth >= self.max_depth {
            return Err(ExecutorError::MaxDepthExceeded(depth).into());
        }

        // 获取 SubAgent 配置
        let config = self.agent_configs.read().await
            .get(subagent_id)
            .ok_or_else(|| ExecutorError::SubAgentNotFound(subagent_id.to_string()))?
            .clone();

        // 验证工具权限
        self.validate_tool_permissions(&config.tools).await?;

        // 增加深度计数
        {
            let mut current = self.current_depth.write().await;
            *current += 1;
        }

        // 执行委派（带超时）
        let result = timeout(
            Duration::from_millis(timeout_ms),
            self.execute_internal(&config, context),
        )
        .await;

        // 恢复深度计数
        {
            let mut current = self.current_depth.write().await;
            *current = current.saturating_sub(1);
        }

        // 处理结果
        let elapsed_ms = start.elapsed().as_millis() as u64;
        let outcome = match result {
            Ok(Ok(output)) => DelegationOutcome {
                delegation_id: Uuid::new_v4().to_string(),
                subagent_id: subagent_id.to_string(),
                subagent_name: config.display_name.clone(),
                status: DelegationStatus::Success,
                output: Some(output),
                error: None,
                elapsed_ms,
                delegation_depth: depth + 1,
            },
            Ok(Err(e)) => DelegationOutcome {
                delegation_id: Uuid::new_v4().to_string(),
                subagent_id: subagent_id.to_string(),
                subagent_name: config.display_name.clone(),
                status: DelegationStatus::Error,
                output: None,
                error: Some(e.to_string()),
                elapsed_ms,
                delegation_depth: depth + 1,
            },
            Err(_) => DelegationOutcome {
                delegation_id: Uuid::new_v4().to_string(),
                subagent_id: subagent_id.to_string(),
                subagent_name: config.display_name.clone(),
                status: DelegationStatus::Timeout,
                output: None,
                error: Some(format!("Execution timeout after {}ms", timeout_ms)),
                elapsed_ms,
                delegation_depth: depth + 1,
            },
        };

        // 记录历史
        {
            let mut history = self.history.write().await;
            history.push(outcome.clone());
        }

        Ok(outcome)
    }

    /// 内部执行逻辑
    async fn execute_internal(
        &self,
        config: &AgentConfig,
        context: DelegationContext,
    ) -> Result<String, SubagentError> {
        // 构建 SubAgent 提示
        let prompt = self.build_subagent_prompt(config, &context)?;

        // 这里应该调用 LLM Provider 执行
        // 暂时返回模拟结果
        Ok(format!(
            "[SubAgent: {}] Processed: {}",
            config.display_name,
            context.user_message
        ))
    }

    /// 构建 SubAgent 提示
    fn build_subagent_prompt(
        &self,
        config: &AgentConfig,
        context: &DelegationContext,
    ) -> SubagentResult<String> {
        let mut prompt = String::new();

        // 添加角色定义
        prompt.push_str(&format!("# Role: {}\n\n", config.display_name));
        prompt.push_str(&format!("{}\n\n", config.description));

        // 添加约束
        prompt.push_str("## Constraints\n");
        if !config.tools.allowed.is_empty() {
            prompt.push_str(&format!(
                "- Allowed tools: {}\n",
                config.tools.allowed.join(", ")
            ));
        }
        if !config.tools.denied.is_empty() {
            prompt.push_str(&format!(
                "- Denied tools: {}\n",
                config.tools.denied.join(", ")
            ));
        }
        prompt.push('\n');

        // 添加限制
        prompt.push_str(&format!(
            "## Limits\n- Max steps: {}\n- Timeout: {}s\n\n",
            config.limits.max_steps, config.limits.timeout_seconds
        ));

        // 添加用户消息
        prompt.push_str(&format!("## User Request\n{}\n", context.user_message));

        // 添加前置结果
        if let Some(ref previous) = context.previous_results {
            prompt.push_str("\n## Previous Results\n");
            for result in previous {
                prompt.push_str(&format!(
                    "- {}: {}\n",
                    result.subagent, result.output
                ));
            }
        }

        Ok(prompt)
    }

    /// 验证工具权限
    async fn validate_tool_permissions(
        &self,
        _tools: &ToolPermissions,
    ) -> Result<(), ExecutorError> {
        // 实际实现应该检查权限
        // 目前允许所有工具
        Ok(())
    }

    /// 获取委派历史
    pub async fn get_history(&self, limit: Option<usize>) -> Vec<DelegationOutcome> {
        let history = self.history.read().await;
        let limit = limit.unwrap_or(100);
        history.iter().rev().take(limit).cloned().collect()
    }

    /// 清除历史
    pub async fn clear_history(&self) {
        let mut history = self.history.write().await;
        history.clear();
    }

    /// 应用权限收缩
    ///
    /// 将主 Agent 的权限与 SubAgent 的声明权限取交集
    pub fn apply_permission_shrinkage(
        agent_permissions: &[String],
        subagent_permissions: &[String],
    ) -> Vec<String> {
        agent_permissions
            .iter()
            .filter(|p| subagent_permissions.contains(p))
            .cloned()
            .collect()
    }
}

impl Default for SubagentExecutor {
    fn default() -> Self {
        Self::new(3) // 默认最大深度为 3
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_executor_creation() {
        let executor = SubagentExecutor::new(3);
        assert_eq!(executor.max_depth, 3);
    }

    #[tokio::test]
    async fn test_register_agent() {
        let executor = SubagentExecutor::default();
        let config = AgentConfig {
            name: "test-agent".to_string(),
            display_name: "Test Agent".to_string(),
            description: "A test agent".to_string(),
            agent_type: super::super::types::AgentType::Personal,
            mode: super::super::types::AgentMode::Code,
            models: super::super::types::ModelConfig::default(),
            tools: ToolPermissions::default(),
            trigger: super::super::types::TriggerConfig::default(),
            limits: super::super::types::LimitsConfig::default(),
            plugin_id: None,
            creator_id: None,
        };

        executor.register_agent(config.clone()).await;

        let configs = executor.agent_configs.read().await;
        assert!(configs.contains_key("test-agent"));
    }

    #[test]
    fn test_permission_shrinkage() {
        let agent_perms = vec!["tool1".to_string(), "tool2".to_string(), "tool3".to_string()];
        let subagent_perms = vec!["tool1".to_string(), "tool2".to_string()];

        let result = SubagentExecutor::apply_permission_shrinkage(&agent_perms, &subagent_perms);
        assert_eq!(result.len(), 2);
        assert!(result.contains(&"tool1".to_string()));
        assert!(result.contains(&"tool2".to_string()));
        assert!(!result.contains(&"tool3".to_string()));
    }

    #[tokio::test]
    async fn test_max_depth() {
        let executor = SubagentExecutor::new(2);

        // 设置深度为最大值
        {
            let mut depth = executor.current_depth.write().await;
            *depth = 2;
        }

        let context = DelegationContext {
            user_message: "test".to_string(),
            extracted_entities: HashMap::new(),
            previous_results: None,
        };

        let result = executor.execute("test-agent", context, 5000).await;
        assert!(result.is_err());
    }
}
