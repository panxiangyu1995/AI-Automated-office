//! Agent间通信服务
//!
//! 核心服务实现，处理消息发送、路由、状态追踪

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;
use uuid::Uuid;

use super::types::{
    AgentMessage, AgentPermission, AgentIntercomConfig, 
    MessageContent, MessageStatus, AgentIntercomError,
};
use super::permission::AgentPermissionMiddleware;
use super::audit::{AuditLogger, AuditLogFilter};
use super::status::{MessageStatusTracker, DeliveryTracker};

/// Agent间通信服务
pub struct AgentIntercomService {
    /// 服务配置
    config: AgentIntercomConfig,
    /// 权限校验中间件
    permission: AgentPermissionMiddleware,
    /// 审计日志
    audit: AuditLogger,
    /// 消息状态追踪
    status_tracker: MessageStatusTracker,
    /// 投递追踪
    delivery_tracker: DeliveryTracker,
    /// Agent消息缓存
    messages: Arc<RwLock<HashMap<String, Vec<AgentMessage>>>>,
}

impl AgentIntercomService {
    pub fn new(config: AgentIntercomConfig) -> Self {
        Self {
            config,
            permission: AgentPermissionMiddleware::new(),
            audit: AuditLogger::new(),
            status_tracker: MessageStatusTracker::new(),
            delivery_tracker: DeliveryTracker::new(),
            messages: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 发送消息 (实现FR59)
    pub async fn send_message(
        &self,
        sender_id: &str,
        receiver_id: &str,
        content: MessageContent,
    ) -> Result<AgentMessage, AgentIntercomError> {
        // 1. 创建消息
        let mut message = AgentMessage::new(
            sender_id.to_string(),
            receiver_id.to_string(),
            content,
        );
        
        // 2. 循环检测
        if message.hop_count >= self.config.max_hop_count {
            return Err(AgentIntercomError::CyclicMessageDetected {
                message_id: message.id.clone(),
            });
        }
        
        // 3. 权限校验
        self.permission.check_send_permission(sender_id, receiver_id).await?;
        self.permission.check_receive_permission(receiver_id, sender_id).await?;
        self.permission.check_content_restriction(sender_id, &message.content).await?;
        
        // 4. 内容安全检查
        if self.config.content_moderation_enabled {
            self.check_content_safety(&message.content)?;
        }
        
        // 5. 检查是否需要用户确认 (FR60)
        if self.permission.requires_user_confirmation(sender_id).await? {
            message.requires_confirmation = true;
            self.audit.record_confirmation_request(&message.id, sender_id).await.ok();
            return Ok(message);
        }
        
        // 6. 注册消息状态
        self.status_tracker.register_message(message.id.clone()).await;
        
        // 7. 更新状态为已发送
        message.status = MessageStatus::Sent;
        self.status_tracker.update_status(&message.id, MessageStatus::Sent).await.ok();
        
        // 8. 保存消息
        self.save_message(&message).await?;
        
        // 9. 投递消息
        self.deliver_message(&message).await?;
        
        // 10. 记录审计日志
        self.audit.record_send(&message).await.map_err(|e| {
            AgentIntercomError::InternalError { message: e.to_string() }
        })?;
        
        Ok(message)
    }

    /// 确认消息发送 (FR60)
    pub async fn confirm_message(
        &self,
        message_id: &str,
        approved: bool,
    ) -> Result<AgentMessage, AgentIntercomError> {
        let messages = self.messages.read().await;
        
        // 查找消息
        let message = messages.values()
            .flatten()
            .find(|m| m.id == message_id)
            .ok_or_else(|| AgentIntercomError::MessageNotFound {
                message_id: message_id.to_string(),
            })?;
        
        let mut message = message.clone();
        
        if approved {
            // 用户批准，更新状态
            message.status = MessageStatus::Sent;
            self.status_tracker.update_status(&message.id, MessageStatus::Sent).await.ok();
            self.deliver_message(&message).await?;
        } else {
            // 用户拒绝
            message.status = MessageStatus::Failed;
            self.audit.record_confirmation_response(message_id, false).await.ok();
            return Err(AgentIntercomError::UserConfirmationRejected {
                message_id: message_id.to_string(),
            });
        }
        
        // 记录确认响应
        self.audit.record_confirmation_response(message_id, approved).await.ok();
        
        Ok(message)
    }

    /// 获取Agent的消息列表 (FR61)
    pub async fn get_messages(
        &self,
        agent_id: &str,
        limit: Option<usize>,
    ) -> Result<Vec<AgentMessage>, AgentIntercomError> {
        let messages = self.messages.read().await;
        let limit = limit.unwrap_or(100);
        
        let agent_messages = messages.get(agent_id)
            .map(|msgs| msgs.clone())
            .unwrap_or_default();
        
        // 按时间倒序返回
        let mut sorted = agent_messages;
        sorted.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        
        Ok(sorted.into_iter().take(limit).collect())
    }

    /// 更新消息状态 (FR622, FR623)
    pub async fn update_message_status(
        &self,
        message_id: &str,
        status: MessageStatus,
    ) -> Result<(), AgentIntercomError> {
        // 更新状态追踪
        self.status_tracker.update_status(message_id, status.clone()).await
            .map_err(|e| AgentIntercomError::InternalError { message: e.to_string() })?;
        
        // 更新消息缓存中的状态
        let mut messages = self.messages.write().await;
        
        for msgs in messages.values_mut() {
            if let Some(msg) = msgs.iter_mut().find(|m| m.id == message_id) {
                msg.status = status;
                
                // 更新时间戳
                match status {
                    MessageStatus::Delivered => msg.delivered_at = Some(Utc::now()),
                    MessageStatus::Read => msg.read_at = Some(Utc::now()),
                    _ => {}
                }
                
                return Ok(());
            }
        }
        
        Err(AgentIntercomError::MessageNotFound {
            message_id: message_id.to_string(),
        })
    }

    /// 设置Agent权限 (FR62)
    pub async fn set_permission(
        &self,
        agent_id: &str,
        permission: AgentPermission,
    ) -> Result<(), AgentIntercomError> {
        self.permission.set_permission(agent_id, permission).await?;
        Ok(())
    }

    /// 获取Agent权限
    pub async fn get_permission(
        &self,
        agent_id: &str,
    ) -> Result<AgentPermission, AgentIntercomError> {
        self.permission.get_permission(agent_id).await.map_err(|e| {
            AgentIntercomError::InternalError { message: e.to_string() }
        })
    }

    /// 查询审计日志 (FR61)
    pub async fn query_audit_logs(
        &self,
        filter: AuditLogFilter,
    ) -> Vec<super::types::AuditLogEntry> {
        self.audit.query(filter).await
    }

    /// 撤回消息 (FR63)
    pub async fn recall_message(
        &self,
        message_id: &str,
        sender_id: &str,
    ) -> Result<(), AgentIntercomError> {
        let mut messages = self.messages.write().await;
        
        for msgs in messages.values_mut() {
            if let Some(msg) = msgs.iter_mut().find(|m| m.id == message_id) {
                // 检查是否是发送者
                if msg.sender_id != sender_id {
                    return Err(AgentIntercomError::PermissionDenied {
                        reason: "只能撤回自己发送的消息".to_string(),
                    });
                }
                
                // 检查消息状态
                if msg.status != MessageStatus::Sending && msg.status != MessageStatus::Sent {
                    return Err(AgentIntercomError::PermissionDenied {
                        reason: "消息已送达，无法撤回".to_string(),
                    });
                }
                
                // 标记为失败
                msg.status = MessageStatus::Failed;
                
                // 记录审计
                self.audit.record_status_change(message_id, MessageStatus::Failed).await.ok();
                
                return Ok(());
            }
        }
        
        Err(AgentIntercomError::MessageNotFound {
            message_id: message_id.to_string(),
        })
    }

    /// 保存消息
    async fn save_message(&self, message: &AgentMessage) -> Result<(), AgentIntercomError> {
        let mut messages = self.messages.write().await;
        messages
            .entry(message.sender_id.clone())
            .or_insert_with(Vec::new)
            .push(message.clone());
        Ok(())
    }

    /// 投递消息
    async fn deliver_message(&self, message: &AgentMessage) -> Result<(), AgentIntercomError> {
        // 创建通知
        let notification_id = self.delivery_tracker
            .create_notification(message.id.clone(), message.receiver_id.clone())
            .await;
        
        // 更新状态为已送达
        self.status_tracker.update_status(&message.id, MessageStatus::Delivered).await.ok();
        
        // 记录接收
        self.audit.record_receive(message).await.ok();
        
        Ok(())
    }

    /// 内容安全检查
    fn check_content_safety(&self, content: &MessageContent) -> Result<(), AgentIntercomError> {
        // TODO: 实现内容安全检查
        // - 敏感词过滤
        // - 恶意内容检测
        Ok(())
    }

    /// 获取配置
    pub fn get_config(&self) -> &AgentIntercomConfig {
        &self.config
    }

    /// 更新配置
    pub fn update_config(&mut self, config: AgentIntercomConfig) {
        self.config = config;
    }
}

/// 服务构建器
pub struct AgentIntercomServiceBuilder {
    config: AgentIntercomConfig,
}

impl AgentIntercomServiceBuilder {
    pub fn new() -> Self {
        Self {
            config: AgentIntercomConfig::default(),
        }
    }

    pub fn enabled(mut self, enabled: bool) -> Self {
        self.config.enabled = enabled;
        self
    }

    pub fn audit_enabled(mut self, enabled: bool) -> Self {
        self.config.audit_enabled = enabled;
        self
    }

    pub fn content_moderation_enabled(mut self, enabled: bool) -> Self {
        self.config.content_moderation_enabled = enabled;
        self
    }

    pub fn max_hop_count(mut self, count: u8) -> Self {
        self.config.max_hop_count = count;
        self
    }

    pub fn default_permission(mut self, permission: AgentPermission) -> Self {
        self.config.default_permission = permission;
        self
    }

    pub fn build(self) -> AgentIntercomService {
        AgentIntercomService::new(self.config)
    }
}

impl Default for AgentIntercomServiceBuilder {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_send_message() {
        let service = AgentIntercomService::new(AgentIntercomConfig::default());
        
        let result = service.send_message(
            "agent-1",
            "agent-2",
            MessageContent::text("Hello"),
        ).await;
        
        assert!(result.is_ok());
        let message = result.unwrap();
        assert_eq!(message.sender_id, "agent-1");
        assert_eq!(message.receiver_id, "agent-2");
    }

    #[tokio::test]
    async fn test_get_messages() {
        let service = AgentIntercomService::new(AgentIntercomConfig::default());
        
        // 发送消息
        service.send_message(
            "agent-1",
            "agent-2",
            MessageContent::text("Test 1"),
        ).await.unwrap();
        
        service.send_message(
            "agent-1",
            "agent-2",
            MessageContent::text("Test 2"),
        ).await.unwrap();
        
        // 获取消息
        let messages = service.get_messages("agent-1", None).await.unwrap();
        assert_eq!(messages.len(), 2);
    }

    #[tokio::test]
    async fn test_recall_message() {
        let service = AgentIntercomService::new(AgentIntercomConfig::default());
        
        // 发送消息
        let message = service.send_message(
            "agent-1",
            "agent-2",
            MessageContent::text("Test"),
        ).await.unwrap();
        
        // 撤回
        let result = service.recall_message(&message.id, "agent-1").await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_permission_denied() {
        let service = AgentIntercomService::new(AgentIntercomConfig::default());
        
        let message = service.send_message(
            "agent-1",
            "agent-2",
            MessageContent::text("Test"),
        ).await.unwrap();
        
        // 尝试撤回别人的消息
        let result = service.recall_message(&message.id, "agent-other").await;
        assert!(result.is_err());
    }
}
