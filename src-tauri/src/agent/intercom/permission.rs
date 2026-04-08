//! Agent通信权限校验中间件
//!
//! 实现FR62, FR65: 权限控制和访问限制

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;

use super::types::{AgentPermission, AgentIntercomError, MessageContent};

/// 权限校验中间件
pub struct AgentPermissionMiddleware {
    /// Agent权限映射表
    permissions: Arc<RwLock<HashMap<String, AgentPermission>>>,
    /// 发送速率追踪
    rate_limiter: Arc<RwLock<HashMap<String, (u32, i64)>>>,
}

impl AgentPermissionMiddleware {
    pub fn new() -> Self {
        Self {
            permissions: Arc::new(RwLock::new(HashMap::new())),
            rate_limiter: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 检查发送权限
    pub async fn check_send_permission(
        &self,
        sender_id: &str,
        receiver_id: &str,
    ) -> Result<(), AgentIntercomError> {
        let permission = self.get_permission(sender_id).await?;
        
        // 检查是否允许向Agent发送
        if !permission.can_send_to_agents {
            return Err(AgentIntercomError::PermissionDenied {
                reason: "Agent被配置为不允许发送消息".to_string(),
            });
        }
        
        // 检查是否在禁止列表中
        if permission.blocked_receivers.contains(&receiver_id.to_string()) {
            return Err(AgentIntercomError::PermissionDenied {
                reason: format!("接收方 {} 在禁止列表中", receiver_id),
            });
        }
        
        // 如果配置了允许列表，检查接收方是否在列表中
        if !permission.allowed_receivers.is_empty() 
            && !permission.allowed_receivers.contains(&receiver_id.to_string()) {
            return Err(AgentIntercomError::PermissionDenied {
                reason: format!("接收方 {} 不在允许列表中", receiver_id),
            });
        }
        
        // 检查速率限制
        self.check_rate_limit(sender_id, permission.max_message_rate).await?;
        
        Ok(())
    }

    /// 检查接收权限
    pub async fn check_receive_permission(
        &self,
        receiver_id: &str,
        sender_id: &str,
    ) -> Result<(), AgentIntercomError> {
        let permission = self.get_permission(receiver_id).await?;
        
        // 检查是否允许接收外部消息
        if !permission.allow_external && sender_id.starts_with("external:") {
            return Err(AgentIntercomError::PermissionDenied {
                reason: "Agent不允许接收外部消息".to_string(),
            });
        }
        
        Ok(())
    }

    /// 检查发送方权限配置
    pub async fn check_content_restriction(
        &self,
        sender_id: &str,
        content: &MessageContent,
    ) -> Result<(), AgentIntercomError> {
        let permission = self.get_permission(sender_id).await?;
        
        // 如果有限制关键词，检查消息内容
        if !permission.content_restrictions.is_empty() {
            if let Some(text) = content.as_text() {
                for keyword in &permission.content_restrictions {
                    if text.to_lowercase().contains(&keyword.to_lowercase()) {
                        return Err(AgentIntercomError::PermissionDenied {
                            reason: format!("消息包含限制关键词: {}", keyword),
                        });
                    }
                }
            }
        }
        
        Ok(())
    }

    /// 获取Agent权限配置
    pub async fn get_permission(&self, agent_id: &str) -> Result<AgentPermission, AgentIntercomError> {
        let permissions = self.permissions.read().await;
        
        match permissions.get(agent_id) {
            Some(p) => Ok(p.clone()),
            None => Ok(AgentPermission::default()),
        }
    }

    /// 设置Agent权限配置
    pub async fn set_permission(
        &self,
        agent_id: &str,
        permission: AgentPermission,
    ) -> Result<(), AgentIntercomError> {
        let mut permissions = self.permissions.write().await;
        permissions.insert(agent_id.to_string(), permission);
        Ok(())
    }

    /// 检查是否需要用户确认
    pub async fn requires_user_confirmation(&self, agent_id: &str) -> Result<bool, AgentIntercomError> {
        let permission = self.get_permission(agent_id).await?;
        Ok(permission.requires_confirmation)
    }

    /// 检查速率限制
    async fn check_rate_limit(
        &self,
        agent_id: &str,
        max_rate: u32,
    ) -> Result<(), AgentIntercomError> {
        let mut rate_limiter = self.rate_limiter.write().await;
        let now = Utc::now().timestamp();
        
        // 获取当前时间窗口的计数
        let entry = rate_limiter.entry(agent_id.to_string())
            .or_insert((0, now));
        
        // 如果时间窗口已过，重置计数
        if now - entry.1 >= 60 {
            entry.0 = 0;
            entry.1 = now;
        }
        
        // 检查是否超过限制
        if entry.0 >= max_rate {
            return Err(AgentIntercomError::RateLimitExceeded {
                agent_id: agent_id.to_string(),
            });
        }
        
        // 增加计数
        entry.0 += 1;
        
        Ok(())
    }

    /// 移除Agent权限配置
    pub async fn remove_permission(&self, agent_id: &str) {
        let mut permissions = self.permissions.write().await;
        permissions.remove(agent_id);
    }

    /// 获取所有权限配置
    pub async fn get_all_permissions(&self) -> HashMap<String, AgentPermission> {
        let permissions = self.permissions.read().await;
        permissions.clone()
    }
}

impl Default for AgentPermissionMiddleware {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_permission_check() {
        let middleware = AgentPermissionMiddleware::new();
        
        // 设置权限
        let permission = AgentPermission {
            agent_id: "agent-1".to_string(),
            can_send_to_agents: true,
            blocked_receivers: vec!["agent-blocked".to_string()],
            ..Default::default()
        };
        middleware.set_permission("agent-1", permission).await.unwrap();
        
        // 正常发送
        assert!(middleware.check_send_permission("agent-1", "agent-2").await.is_ok());
        
        // 被阻止的接收方
        assert!(middleware.check_send_permission("agent-1", "agent-blocked").await.is_err());
    }

    #[tokio::test]
    async fn test_allowed_receivers() {
        let middleware = AgentPermissionMiddleware::new();
        
        let permission = AgentPermission {
            agent_id: "agent-1".to_string(),
            can_send_to_agents: true,
            allowed_receivers: vec!["agent-allowed".to_string()],
            ..Default::default()
        };
        middleware.set_permission("agent-1", permission).await.unwrap();
        
        // 不在允许列表中
        assert!(middleware.check_send_permission("agent-1", "agent-other").await.is_err());
        
        // 在允许列表中
        assert!(middleware.check_send_permission("agent-1", "agent-allowed").await.is_ok());
    }

    #[tokio::test]
    async fn test_content_restriction() {
        let middleware = AgentPermissionMiddleware::new();
        
        let permission = AgentPermission {
            agent_id: "agent-1".to_string(),
            content_restrictions: vec!["机密".to_string(), "保密".to_string()],
            ..Default::default()
        };
        middleware.set_permission("agent-1", permission).await.unwrap();
        
        // 包含敏感词
        let content = MessageContent::text("这是一份机密文件");
        assert!(middleware.check_content_restriction("agent-1", &content).await.is_err());
        
        // 正常内容
        let content = MessageContent::text("今天天气很好");
        assert!(middleware.check_content_restriction("agent-1", &content).await.is_ok());
    }
}
