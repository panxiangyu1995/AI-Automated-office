//! Agent-to-Agent Communication Module
//!
//! 实现FR59-FR68: Agent间消息通信及权限控制
//! - Agent消息发送和路由
//! - 消息权限校验
//! - 审计日志记录
//! - 消息状态追踪

pub mod types;
pub mod service;
pub mod permission;
pub mod audit;
pub mod status;

use std::sync::Arc;
use tokio::sync::RwLock;

use crate::agent::AgentState;

/// Agent间通信服务
pub struct AgentIntercom {
    state: Arc<RwLock<AgentState>>,
    permission: permission::AgentPermissionMiddleware,
    audit: audit::AuditLogger,
}

impl AgentIntercom {
    pub fn new(state: Arc<RwLock<AgentState>>) -> Self {
        Self {
            state,
            permission: permission::AgentPermissionMiddleware::new(),
            audit: audit::AuditLogger::new(),
        }
    }

    /// 发送Agent间消息
    pub async fn send_message(
        &self,
        sender_id: &str,
        receiver_id: &str,
        content: types::MessageContent,
    ) -> Result<types::AgentMessage, types::AgentIntercomError> {
        // 1. 权限校验
        self.permission.check_send_permission(sender_id, receiver_id).await?;
        
        // 2. 内容安全检查
        self.check_content_safety(&content).await?;
        
        // 3. 创建消息
        let mut message = types::AgentMessage::new(
            sender_id.to_string(),
            receiver_id.to_string(),
            content,
        );
        
        // 4. 检查是否需要用户确认
        if self.permission.requires_user_confirmation(sender_id).await? {
            message.requires_confirmation = true;
            return Ok(message);
        }
        
        // 5. 发送消息
        message.status = types::MessageStatus::Sent;
        self.save_message(&message).await?;
        self.deliver_message(&message).await?;
        
        // 6. 审计日志
        self.audit.record_send(&message).await?;
        
        Ok(message)
    }

    /// 获取Agent的消息列表
    pub async fn get_messages(
        &self,
        agent_id: &str,
        limit: Option<usize>,
    ) -> Result<Vec<types::AgentMessage>, types::AgentIntercomError> {
        let state = self.state.read().await;
        let messages = state.get_agent_messages(agent_id);
        
        let limit = limit.unwrap_or(100);
        Ok(messages.into_iter().rev().take(limit).collect())
    }

    /// 更新消息状态
    pub async fn update_message_status(
        &self,
        message_id: &str,
        status: types::MessageStatus,
    ) -> Result<(), types::AgentIntercomError> {
        let mut state = self.state.write().await;
        state.update_message_status(message_id, status.clone()).await?;
        
        // 记录状态变更到审计日志
        self.audit.record_status_change(message_id, status).await?;
        
        Ok(())
    }

    /// 设置Agent通信权限
    pub async fn set_agent_permission(
        &self,
        agent_id: &str,
        permission: types::AgentPermission,
    ) -> Result<(), types::AgentIntercomError> {
        self.permission.set_permission(agent_id, permission).await?;
        Ok(())
    }

    /// 内容安全检查
    async fn check_content_safety(
        &self,
        content: &types::MessageContent,
    ) -> Result<(), types::AgentIntercomError> {
        // TODO: 实现内容安全检查
        // - 敏感词过滤
        // - 恶意内容检测
        Ok(())
    }

    /// 保存消息到存储
    async fn save_message(&self, message: &types::AgentMessage) -> Result<(), types::AgentIntercomError> {
        let mut state = self.state.write().await;
        state.save_agent_message(message).await?;
        Ok(())
    }

    /// 投递消息到接收方
    async fn deliver_message(&self, message: &types::AgentMessage) -> Result<(), types::AgentIntercomError> {
        let mut state = self.state.write().await;
        state.deliver_agent_message(message).await?;
        Ok(())
    }
}
