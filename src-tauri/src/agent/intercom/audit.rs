//! Agent通信审计日志
//!
//! 实现FR64: AI Agent接收的消息会通知员工并记录到日志
//! FR66: 系统可以设置Agent间通信的内容审核规则

use std::collections::VecDeque;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use uuid::Uuid;

use super::types::{AuditLogEntry, AuditEventType, AuditResult, MessageStatus};

/// 审计日志记录器
pub struct AuditLogger {
    /// 审计日志存储
    logs: Arc<RwLock<VecDeque<AuditLogEntry>>>,
    /// 最大日志条数
    max_logs: usize,
    /// 是否启用
    enabled: bool,
}

impl AuditLogger {
    pub fn new() -> Self {
        Self {
            logs: Arc::new(RwLock::new(VecDeque::new())),
            max_logs: 10000,
            enabled: true,
        }
    }

    /// 启用/禁用审计
    pub fn set_enabled(&mut self, enabled: bool) {
        self.enabled = enabled;
    }

    /// 设置最大日志条数
    pub fn set_max_logs(&mut self, max: usize) {
        self.max_logs = max;
    }

    /// 记录消息发送
    pub async fn record_send(&self, message: &super::types::AgentMessage) -> Result<(), String> {
        if !self.enabled {
            return Ok(());
        }

        let entry = AuditLogEntry {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            event_type: AuditEventType::Send,
            sender_id: Some(message.sender_id.clone()),
            receiver_id: Some(message.receiver_id.clone()),
            message_id: Some(message.id.clone()),
            action: "send_message".to_string(),
            result: if message.status == super::types::MessageStatus::Failed {
                AuditResult::Failed
            } else {
                AuditResult::Success
            },
            details: Some(format!(
                "消息类型: {:?}, 需要确认: {}, 跳数: {}",
                message.content,
                message.requires_confirmation,
                message.hop_count
            )),
        };

        self.add_entry(entry).await;
        Ok(())
    }

    /// 记录消息接收
    pub async fn record_receive(&self, message: &super::types::AgentMessage) -> Result<(), String> {
        if !self.enabled {
            return Ok(());
        }

        let entry = AuditLogEntry {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            event_type: AuditEventType::Receive,
            sender_id: Some(message.sender_id.clone()),
            receiver_id: Some(message.receiver_id.clone()),
            message_id: Some(message.id.clone()),
            action: "receive_message".to_string(),
            result: AuditResult::Success,
            details: None,
        };

        self.add_entry(entry).await;
        Ok(())
    }

    /// 记录权限检查
    pub async fn record_permission_check(
        &self,
        sender_id: &str,
        receiver_id: &str,
        allowed: bool,
        reason: Option<&str>,
    ) -> Result<(), String> {
        if !self.enabled {
            return Ok(());
        }

        let entry = AuditLogEntry {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            event_type: AuditEventType::PermissionCheck,
            sender_id: Some(sender_id.to_string()),
            receiver_id: Some(receiver_id.to_string()),
            message_id: None,
            action: "check_permission".to_string(),
            result: if allowed { AuditResult::Success } else { AuditResult::Blocked },
            details: reason.map(|s| s.to_string()),
        };

        self.add_entry(entry).await;
        Ok(())
    }

    /// 记录状态变更
    pub async fn record_status_change(
        &self,
        message_id: &str,
        new_status: MessageStatus,
    ) -> Result<(), String> {
        if !self.enabled {
            return Ok(());
        }

        let entry = AuditLogEntry {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            event_type: AuditEventType::StatusChange,
            sender_id: None,
            receiver_id: None,
            message_id: Some(message_id.to_string()),
            action: format!("status_change_to_{:?}", new_status),
            result: AuditResult::Success,
            details: None,
        };

        self.add_entry(entry).await;
        Ok(())
    }

    /// 记录确认请求
    pub async fn record_confirmation_request(
        &self,
        message_id: &str,
        sender_id: &str,
    ) -> Result<(), String> {
        if !self.enabled {
            return Ok(());
        }

        let entry = AuditLogEntry {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            event_type: AuditEventType::ConfirmationRequest,
            sender_id: Some(sender_id.to_string()),
            receiver_id: None,
            message_id: Some(message_id.to_string()),
            action: "confirmation_request".to_string(),
            result: AuditResult::Success,
            details: None,
        };

        self.add_entry(entry).await;
        Ok(())
    }

    /// 记录确认响应
    pub async fn record_confirmation_response(
        &self,
        message_id: &str,
        approved: bool,
    ) -> Result<(), String> {
        if !self.enabled {
            return Ok(());
        }

        let entry = AuditLogEntry {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            event_type: AuditEventType::ConfirmationResponse,
            sender_id: None,
            receiver_id: None,
            message_id: Some(message_id.to_string()),
            action: if approved {
                "confirmation_approved".to_string()
            } else {
                "confirmation_rejected".to_string()
            },
            result: if approved { AuditResult::Success } else { AuditResult::Blocked },
            details: None,
        };

        self.add_entry(entry).await;
        Ok(())
    }

    /// 记录内容审核
    pub async fn record_content_moderation(
        &self,
        message_id: &str,
        passed: bool,
        reason: Option<&str>,
    ) -> Result<(), String> {
        if !self.enabled {
            return Ok(());
        }

        let entry = AuditLogEntry {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            event_type: AuditEventType::ContentModeration,
            sender_id: None,
            receiver_id: None,
            message_id: Some(message_id.to_string()),
            action: "content_moderation".to_string(),
            result: if passed { AuditResult::Success } else { AuditResult::Blocked },
            details: reason.map(|s| s.to_string()),
        };

        self.add_entry(entry).await;
        Ok(())
    }

    /// 查询审计日志
    pub async fn query(&self, filter: AuditLogFilter) -> Vec<AuditLogEntry> {
        let logs = self.logs.read().await;
        
        logs.iter()
            .filter(|entry| {
                if let Some(since) = filter.since {
                    if entry.timestamp < since {
                        return false;
                    }
                }
                if let Some(until) = filter.until {
                    if entry.timestamp > until {
                        return false;
                    }
                }
                if let Some(sender_id) = &filter.sender_id {
                    if entry.sender_id.as_ref() != Some(sender_id) {
                        return false;
                    }
                }
                if let Some(receiver_id) = &filter.receiver_id {
                    if entry.receiver_id.as_ref() != Some(receiver_id) {
                        return false;
                    }
                }
                if let Some(event_type) = filter.event_type {
                    if entry.event_type != event_type {
                        return false;
                    }
                }
                if let Some(result) = filter.result {
                    if entry.result != result {
                        return false;
                    }
                }
                true
            })
            .cloned()
            .collect()
    }

    /// 添加日志条目
    async fn add_entry(&self, entry: AuditLogEntry) {
        let mut logs = self.logs.write().await;
        
        // 超过最大条数时移除最老的
        while logs.len() >= self.max_logs {
            logs.pop_front();
        }
        
        logs.push_back(entry);
    }

    /// 获取日志统计
    pub async fn get_stats(&self) -> AuditStats {
        let logs = self.logs.read().await;
        
        let total = logs.len();
        let send_count = logs.iter().filter(|l| l.event_type == AuditEventType::Send).count();
        let receive_count = logs.iter().filter(|l| l.event_type == AuditEventType::Receive).count();
        let blocked_count = logs.iter().filter(|l| l.result == AuditResult::Blocked).count();
        
        AuditStats {
            total,
            send_count,
            receive_count,
            blocked_count,
        }
    }

    /// 清空日志
    pub async fn clear(&self) {
        let mut logs = self.logs.write().await;
        logs.clear();
    }
}

impl Default for AuditLogger {
    fn default() -> Self {
        Self::new()
    }
}

/// 审计日志查询过滤器
#[derive(Debug, Clone, Default)]
pub struct AuditLogFilter {
    pub since: Option<DateTime<Utc>>,
    pub until: Option<DateTime<Utc>>,
    pub sender_id: Option<String>,
    pub receiver_id: Option<String>,
    pub event_type: Option<AuditEventType>,
    pub result: Option<AuditResult>,
}

/// 审计统计
#[derive(Debug, Clone)]
pub struct AuditStats {
    pub total: usize,
    pub send_count: usize,
    pub receive_count: usize,
    pub blocked_count: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_audit_log() {
        let logger = AuditLogger::new();
        
        // 创建一个模拟消息
        let message = super::super::types::AgentMessage::new(
            "agent-1".to_string(),
            "agent-2".to_string(),
            super::types::MessageContent::text("Test message"),
        );
        
        // 记录发送
        logger.record_send(&message).await.unwrap();
        
        // 检查统计
        let stats = logger.get_stats().await;
        assert_eq!(stats.total, 1);
        assert_eq!(stats.send_count, 1);
    }

    #[tokio::test]
    async fn test_query() {
        let logger = AuditLogger::new();
        
        // 创建两个不同发送者的消息
        let msg1 = super::super::types::AgentMessage::new(
            "agent-1".to_string(),
            "agent-2".to_string(),
            super::types::MessageContent::text("Test 1"),
        );
        let msg2 = super::super::types::AgentMessage::new(
            "agent-3".to_string(),
            "agent-2".to_string(),
            super::types::MessageContent::text("Test 2"),
        );
        
        logger.record_send(&msg1).await.unwrap();
        logger.record_send(&msg2).await.unwrap();
        
        // 按发送者查询
        let results = logger.query(AuditLogFilter {
            sender_id: Some("agent-1".to_string()),
            ..Default::default()
        }).await;
        
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].sender_id.as_ref().unwrap(), "agent-1");
    }
}
