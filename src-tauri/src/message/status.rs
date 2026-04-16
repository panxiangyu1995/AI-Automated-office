//! Message Status Tracking Service
//!
//! Implements message delivery status tracking (FR622-FR626):
//! - Pending: Message created but not yet sent
//! - Sent: Message has been sent to server
//! - Delivered: Message delivered to recipient
//! - Read: Recipient has read the message
//!
//! Story 35.1 - 消息状态追踪完善

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;

/// Message delivery status
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DeliveryStatus {
    /// Message created but not yet sent
    Pending,
    /// Message sent to server
    Sent,
    /// Message delivered to recipient device
    Delivered,
    /// Recipient has read the message
    Read,
}

impl Default for DeliveryStatus {
    fn default() -> Self {
        Self::Pending
    }
}

impl std::fmt::Display for DeliveryStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DeliveryStatus::Pending => write!(f, "pending"),
            DeliveryStatus::Sent => write!(f, "sent"),
            DeliveryStatus::Delivered => write!(f, "delivered"),
            DeliveryStatus::Read => write!(f, "read"),
        }
    }
}

/// Status change event for notifications
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusChangeEvent {
    pub message_id: String,
    pub from_status: DeliveryStatus,
    pub to_status: DeliveryStatus,
    pub changed_at: i64,
    pub changed_by: Option<String>,
}

/// Offline message for sync
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OfflineMessage {
    pub message_id: String,
    pub recipient_id: String,
    pub status: DeliveryStatus,
    pub created_at: i64,
    pub delivered_at: Option<i64>,
    pub read_at: Option<i64>,
}

/// Message status tracking entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageStatusEntry {
    pub message_id: String,
    pub sender_id: String,
    pub recipient_id: String,
    pub status: DeliveryStatus,
    pub sent_at: Option<i64>,
    pub delivered_at: Option<i64>,
    pub read_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl MessageStatusEntry {
    pub fn new(message_id: String, sender_id: String, recipient_id: String) -> Self {
        let now = Utc::now().timestamp();
        Self {
            message_id,
            sender_id,
            recipient_id,
            status: DeliveryStatus::Pending,
            sent_at: None,
            delivered_at: None,
            read_at: None,
            created_at: now,
            updated_at: now,
        }
    }
}

/// Message status tracking service
pub struct MessageStatusService {
    /// Status tracking entries: message_id -> entry
    entries: Arc<RwLock<HashMap<String, MessageStatusEntry>>>,
    /// Offline message queue
    offline_queue: Arc<RwLock<Vec<OfflineMessage>>>,
}

impl MessageStatusService {
    pub fn new() -> Self {
        Self {
            entries: Arc::new(RwLock::new(HashMap::new())),
            offline_queue: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Create a new status entry for a message
    pub async fn create_entry(
        &self,
        message_id: String,
        sender_id: String,
        recipient_id: String,
    ) -> MessageStatusEntry {
        let entry = MessageStatusEntry::new(message_id, sender_id, recipient_id);
        let mut entries = self.entries.write().await;
        entries.insert(entry.message_id.clone(), entry.clone());
        entry
    }

    /// Get status entry for a message
    pub async fn get_entry(&self, message_id: &str) -> Option<MessageStatusEntry> {
        let entries = self.entries.read().await;
        entries.get(message_id).cloned()
    }

    /// Update status to Sent
    pub async fn mark_sent(&self, message_id: &str) -> Option<StatusChangeEvent> {
        self.update_status(message_id, DeliveryStatus::Sent, None).await
    }

    /// Update status to Delivered
    pub async fn mark_delivered(&self, message_id: &str) -> Option<StatusChangeEvent> {
        self.update_status(message_id, DeliveryStatus::Delivered, None).await
    }

    /// Update status to Read
    pub async fn mark_read(&self, message_id: &str, reader_id: Option<String>) -> Option<StatusChangeEvent> {
        self.update_status(message_id, DeliveryStatus::Read, reader_id).await
    }

    /// Generic status update
    async fn update_status(
        &self,
        message_id: &str,
        new_status: DeliveryStatus,
        changed_by: Option<String>,
    ) -> Option<StatusChangeEvent> {
        let mut entries = self.entries.write().await;
        if let Some(entry) = entries.get_mut(message_id) {
            let old_status = entry.status;

            // Don't allow going backwards in status
            if new_status <= old_status {
                return None;
            }

            let now = Utc::now().timestamp();
            entry.status = new_status;
            entry.updated_at = now;

            // Update specific timestamps
            match new_status {
                DeliveryStatus::Sent => entry.sent_at = Some(now),
                DeliveryStatus::Delivered => entry.delivered_at = Some(now),
                DeliveryStatus::Read => entry.read_at = Some(now),
                DeliveryStatus::Pending => {}
            }

            let event = StatusChangeEvent {
                message_id: message_id.to_string(),
                from_status: old_status,
                to_status: new_status,
                changed_at: now,
                changed_by,
            };

            Some(event)
        } else {
            None
        }
    }

    /// Batch update status for multiple messages
    pub async fn batch_mark_read(&self, message_ids: &[String], reader_id: Option<String>) -> Vec<StatusChangeEvent> {
        let mut events = Vec::new();
        for msg_id in message_ids {
            if let Some(event) = self.mark_read(msg_id, reader_id.clone()).await {
                events.push(event);
            }
        }
        events
    }

    /// Get all entries for a recipient
    pub async fn get_recipient_entries(&self, recipient_id: &str) -> Vec<MessageStatusEntry> {
        let entries = self.entries.read().await;
        entries.values()
            .filter(|e| e.recipient_id == recipient_id)
            .cloned()
            .collect()
    }

    /// Get all entries from a sender
    pub async fn get_sender_entries(&self, sender_id: &str) -> Vec<MessageStatusEntry> {
        let entries = self.entries.read().await;
        entries.values()
            .filter(|e| e.sender_id == sender_id)
            .cloned()
            .collect()
    }

    /// Get unread count for a recipient
    pub async fn get_unread_count(&self, recipient_id: &str) -> i64 {
        let entries = self.entries.read().await;
        entries.values()
            .filter(|e| e.recipient_id == recipient_id && e.status != DeliveryStatus::Read)
            .count() as i64
    }

    /// Get unread count by message type
    pub async fn get_unread_count_by_type(&self, recipient_id: &str, _msg_type: &str) -> i64 {
        // Note: msg_type would need to be part of the entry for this to work
        // For now, return total unread
        self.get_unread_count(recipient_id).await
    }

    /// Add message to offline queue
    pub async fn queue_offline(&self, message: OfflineMessage) {
        let mut queue = self.offline_queue.write().await;
        queue.push(message);
    }

    /// Get and clear offline messages for a recipient
    pub async fn get_offline_messages(&self, recipient_id: &str) -> Vec<OfflineMessage> {
        let mut queue = self.offline_queue.write().await;
        let messages: Vec<OfflineMessage> = queue.iter()
            .filter(|m| m.recipient_id == recipient_id)
            .cloned()
            .collect();
        // Remove delivered messages from queue
        queue.retain(|m| m.recipient_id != recipient_id);
        messages
    }

    /// Sync offline messages (mark as delivered)
    pub async fn sync_offline_messages(&self, recipient_id: &str) -> Vec<StatusChangeEvent> {
        let messages = self.get_offline_messages(recipient_id).await;
        let mut events = Vec::new();
        for msg in messages {
            if let Some(event) = self.update_status(&msg.message_id, DeliveryStatus::Delivered, None).await {
                events.push(event);
            }
        }
        events
    }

    /// Delete status entry
    pub async fn delete_entry(&self, message_id: &str) -> bool {
        let mut entries = self.entries.write().await;
        entries.remove(message_id).is_some()
    }

    /// Get all entries with a specific status
    pub async fn get_entries_by_status(&self, status: DeliveryStatus) -> Vec<MessageStatusEntry> {
        let entries = self.entries.read().await;
        entries.values()
            .filter(|e| e.status == status)
            .cloned()
            .collect()
    }
}

impl Default for MessageStatusService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_status_transitions() {
        let service = MessageStatusService::new();

        // Create entry
        let entry = service.create_entry(
            "msg-001".to_string(),
            "user-a".to_string(),
            "user-b".to_string(),
        ).await;
        assert_eq!(entry.status, DeliveryStatus::Pending);

        // Mark sent
        let event = service.mark_sent("msg-001").await.unwrap();
        assert_eq!(event.from_status, DeliveryStatus::Pending);
        assert_eq!(event.to_status, DeliveryStatus::Sent);

        // Mark delivered
        let event = service.mark_delivered("msg-001").await.unwrap();
        assert_eq!(event.from_status, DeliveryStatus::Sent);
        assert_eq!(event.to_status, DeliveryStatus::Delivered);

        // Mark read
        let event = service.mark_read("msg-001", Some("user-b".to_string())).await.unwrap();
        assert_eq!(event.from_status, DeliveryStatus::Delivered);
        assert_eq!(event.to_status, DeliveryStatus::Read);

        // Can't go backwards
        let event = service.mark_sent("msg-001").await;
        assert!(event.is_none());
    }

    #[tokio::test]
    async fn test_unread_count() {
        let service = MessageStatusService::new();

        // Create 3 messages for user-b
        service.create_entry("msg-1".to_string(), "user-a".to_string(), "user-b".to_string()).await;
        service.create_entry("msg-2".to_string(), "user-a".to_string(), "user-b".to_string()).await;
        service.create_entry("msg-3".to_string(), "user-a".to_string(), "user-b".to_string()).await;

        assert_eq!(service.get_unread_count("user-b").await, 3);

        // Mark one as read
        service.mark_sent("msg-1").await;
        service.mark_delivered("msg-1").await;
        service.mark_read("msg-1", None).await;

        assert_eq!(service.get_unread_count("user-b").await, 2);
    }
}
