//! Agent消息状态追踪
//!
//! 实现FR622, FR623: 消息状态追踪
//! - 已发送/已送达/已读状态
//! - 状态变更时间记录

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use uuid::Uuid;

use super::types::MessageStatus;

/// 消息状态追踪器
pub struct MessageStatusTracker {
    /// 消息状态映射
    statuses: Arc<RwLock<HashMap<String, MessageStatusInfo>>>,
}

/// 消息状态信息
#[derive(Debug, Clone)]
pub struct MessageStatusInfo {
    pub message_id: String,
    pub current_status: MessageStatus,
    pub created_at: DateTime<Utc>,
    pub sent_at: Option<DateTime<Utc>>,
    pub delivered_at: Option<DateTime<Utc>>,
    pub read_at: Option<DateTime<Utc>>,
    pub failed_at: Option<DateTime<Utc>>,
    pub failure_reason: Option<String>,
}

impl MessageStatusTracker {
    pub fn new() -> Self {
        Self {
            statuses: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 注册新消息
    pub async fn register_message(&self, message_id: String) {
        let mut statuses = self.statuses.write().await;
        statuses.insert(message_id.clone(), MessageStatusInfo {
            message_id,
            current_status: MessageStatus::Sending,
            created_at: Utc::now(),
            sent_at: None,
            delivered_at: None,
            read_at: None,
            failed_at: None,
            failure_reason: None,
        });
    }

    /// 更新消息状态
    pub async fn update_status(
        &self,
        message_id: &str,
        new_status: MessageStatus,
    ) -> Result<MessageStatusInfo, String> {
        let mut statuses = self.statuses.write().await;
        
        let info = statuses.get_mut(message_id)
            .ok_or_else(|| format!("消息不存在: {}", message_id))?;
        
        // 更新状态和时间戳
        info.current_status = new_status;
        
        match new_status {
            MessageStatus::Sent => {
                info.sent_at = Some(Utc::now());
            }
            MessageStatus::Delivered => {
                info.delivered_at = Some(Utc::now());
            }
            MessageStatus::Read => {
                info.read_at = Some(Utc::now());
            }
            MessageStatus::Failed => {
                info.failed_at = Some(Utc::now());
            }
            MessageStatus::Sending => {
                // 不更新任何时间戳
            }
        }
        
        Ok(info.clone())
    }

    /// 标记消息失败
    pub async fn mark_failed(
        &self,
        message_id: &str,
        reason: String,
    ) -> Result<MessageStatusInfo, String> {
        let mut statuses = self.statuses.write().await;
        
        let info = statuses.get_mut(message_id)
            .ok_or_else(|| format!("消息不存在: {}", message_id))?;
        
        info.current_status = MessageStatus::Failed;
        info.failed_at = Some(Utc::now());
        info.failure_reason = Some(reason);
        
        Ok(info.clone())
    }

    /// 获取消息状态
    pub async fn get_status(&self, message_id: &str) -> Option<MessageStatusInfo> {
        let statuses = self.statuses.read().await;
        statuses.get(message_id).cloned()
    }

    /// 获取Agent的所有消息状态
    pub async fn get_agent_statuses(
        &self,
        agent_id: &str,
        message_ids: &[String],
    ) -> Vec<MessageStatusInfo> {
        let statuses = self.statuses.read().await;
        
        message_ids.iter()
            .filter_map(|id| statuses.get(id).cloned())
            .collect()
    }

    /// 获取待发送状态的消息
    pub async fn get_pending_messages(&self) -> Vec<String> {
        let statuses = self.statuses.read().await;
        
        statuses.iter()
            .filter(|(_, info)| info.current_status == MessageStatus::Sending)
            .map(|(id, _)| id.clone())
            .collect()
    }

    /// 获取未送达的消息
    pub async fn get_undelivered_messages(&self) -> Vec<String> {
        let statuses = self.statuses.read().await;
        
        statuses.iter()
            .filter(|(_, info)| {
                matches!(info.current_status, MessageStatus::Sent | MessageStatus::Sending)
            })
            .map(|(id, _)| id.clone())
            .collect()
    }

    /// 清理过期状态记录 (保留最近24小时的记录)
    pub async fn cleanup_expired(&self, ttl_hours: i64) -> usize {
        let cutoff = Utc::now() - chrono::Duration::hours(ttl_hours);
        let mut count = 0;
        
        let mut statuses = self.statuses.write().await;
        statuses.retain(|_, info| {
            // 保留已读或仍在进行中的消息
            let should_keep = matches!(
                info.current_status,
                MessageStatus::Delivered | MessageStatus::Read
            ) || info.created_at > cutoff;
            
            if !should_keep {
                count += 1;
            }
            
            should_keep
        });
        
        count
    }
}

impl Default for MessageStatusTracker {
    fn default() -> Self {
        Self::new()
    }
}

/// 消息投递追踪器 (用于实现FR64通知)
pub struct DeliveryTracker {
    /// 待通知的消息
    pending_notifications: Arc<RwLock<Vec<Notification>>>
}

#[derive(Debug, Clone)]
pub struct Notification {
    pub notification_id: String,
    pub message_id: String,
    pub receiver_id: String,
    pub created_at: DateTime<Utc>,
    pub notified_at: Option<DateTime<Utc>>,
}

impl DeliveryTracker {
    pub fn new() -> Self {
        Self {
            pending_notifications: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// 创建通知
    pub async fn create_notification(
        &self,
        message_id: String,
        receiver_id: String,
    ) -> String {
        let notification_id = Uuid::new_v4().to_string();
        
        let notification = Notification {
            notification_id: notification_id.clone(),
            message_id,
            receiver_id,
            created_at: Utc::now(),
            notified_at: None,
        };
        
        let mut pending = self.pending_notifications.write().await;
        pending.push(notification);
        
        notification_id
    }

    /// 标记已通知
    pub async fn mark_notified(&self, notification_id: &str) -> Result<(), String> {
        let mut pending = self.pending_notifications.write().await;
        
        let notification = pending.iter_mut()
            .find(|n| n.notification_id == notification_id)
            .ok_or_else(|| format!("通知不存在: {}", notification_id))?;
        
        notification.notified_at = Some(Utc::now());
        
        Ok(())
    }

    /// 获取待通知列表
    pub async fn get_pending(&self) -> Vec<Notification> {
        let pending = self.pending_notifications.read().await;
        pending.iter()
            .filter(|n| n.notified_at.is_none())
            .cloned()
            .collect()
    }

    /// 获取接收者的待通知消息
    pub async fn get_receiver_pending(&self, receiver_id: &str) -> Vec<Notification> {
        let pending = self.pending_notifications.read().await;
        pending.iter()
            .filter(|n| n.receiver_id == receiver_id && n.notified_at.is_none())
            .cloned()
            .collect()
    }
}

impl Default for DeliveryTracker {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_status_tracking() {
        let tracker = MessageStatusTracker::new();
        
        let message_id = "msg-001";
        tracker.register_message(message_id.to_string()).await;
        
        // 初始状态
        let status = tracker.get_status(message_id).await;
        assert!(status.is_some());
        assert_eq!(status.unwrap().current_status, MessageStatus::Sending);
        
        // 更新为已发送
        tracker.update_status(message_id, MessageStatus::Sent).await.unwrap();
        let status = tracker.get_status(message_id).await;
        assert_eq!(status.unwrap().current_status, MessageStatus::Sent);
        
        // 更新为已送达
        tracker.update_status(message_id, MessageStatus::Delivered).await.unwrap();
        let status = tracker.get_status(message_id).await;
        assert_eq!(status.unwrap().current_status, MessageStatus::Delivered);
        assert!(status.unwrap().delivered_at.is_some());
    }

    #[tokio::test]
    async fn test_delivery_tracker() {
        let tracker = DeliveryTracker::new();
        
        // 创建通知
        let id = tracker.create_notification(
            "msg-001".to_string(),
            "agent-1".to_string(),
        ).await;
        
        // 检查待通知列表
        let pending = tracker.get_pending().await;
        assert_eq!(pending.len(), 1);
        
        // 标记已通知
        tracker.mark_notified(&id).await.unwrap();
        
        let pending = tracker.get_pending().await;
        assert_eq!(pending.len(), 0);
    }
}
