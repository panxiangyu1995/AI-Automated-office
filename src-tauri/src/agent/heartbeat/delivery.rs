//! Heartbeat notification delivery mechanism.

use serde::{Deserialize, Serialize};

use super::config::DeliveryTarget;

/// Heartbeat notification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatNotification {
    /// Notification title
    pub title: String,
    /// Notification content
    pub content: String,
    /// Notification level
    pub level: NotificationLevel,
    /// Delivery channel
    pub channel: String,
}

/// Notification level
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NotificationLevel {
    Info,
    Warning,
    Error,
}

impl std::fmt::Display for NotificationLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            NotificationLevel::Info => write!(f, "info"),
            NotificationLevel::Warning => write!(f, "warning"),
            NotificationLevel::Error => write!(f, "error"),
        }
    }
}

/// Delivery result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryResult {
    /// Whether delivery was successful
    pub success: bool,
    /// Delivery channel
    pub channel: String,
    /// Error message if failed
    pub error: Option<String>,
    /// Timestamp of delivery attempt
    pub timestamp: i64,
}

/// Delivery service for sending heartbeat notifications
pub struct DeliveryService {
    // TODO: Add HTTP client for webhook delivery
}

impl DeliveryService {
    /// Create a new delivery service
    pub fn new() -> Self {
        Self {}
    }

    /// Send a notification to the specified delivery target
    pub async fn send(
        &self,
        notification: &HeartbeatNotification,
        target: &DeliveryTarget,
    ) -> DeliveryResult {
        let result = match target.channel.as_str() {
            "system" => self.deliver_system(notification).await,
            "webhook" => {
                if let Some(ref url) = target.target {
                    self.deliver_webhook(notification, url).await
                } else {
                    DeliveryResult {
                        success: false,
                        channel: target.channel.clone(),
                        error: Some("No webhook URL specified".to_string()),
                        timestamp: chrono::Utc::now().timestamp_millis(),
                    }
                }
            }
            "email" => {
                if let Some(ref addr) = target.target {
                    self.deliver_email(notification, addr).await
                } else {
                    DeliveryResult {
                        success: false,
                        channel: target.channel.clone(),
                        error: Some("No email address specified".to_string()),
                        timestamp: chrono::Utc::now().timestamp_millis(),
                    }
                }
            }
            _ => DeliveryResult {
                success: false,
                channel: target.channel.clone(),
                error: Some(format!("Unknown delivery channel: {}", target.channel)),
                timestamp: chrono::Utc::now().timestamp_millis(),
            },
        };

        tracing::info!(
            "Heartbeat notification delivery: channel={}, success={}, error={:?}",
            target.channel,
            result.success,
            result.error
        );

        result
    }

    /// Deliver notification to system
    async fn deliver_system(&self, notification: &HeartbeatNotification) -> DeliveryResult {
        tracing::info!(
            "System notification: [{}] {} - {}",
            notification.level,
            notification.title,
            notification.content
        );

        DeliveryResult {
            success: true,
            channel: "system".to_string(),
            error: None,
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    /// Deliver notification to webhook
    async fn deliver_webhook(
        &self,
        notification: &HeartbeatNotification,
        url: &str,
    ) -> DeliveryResult {
        tracing::info!("Webhook notification to {}: {}", url, notification.title);

        DeliveryResult {
            success: true,
            channel: "webhook".to_string(),
            error: None,
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    /// Deliver notification via email
    async fn deliver_email(
        &self,
        notification: &HeartbeatNotification,
        email: &str,
    ) -> DeliveryResult {
        tracing::info!("Email notification to {}: {}", email, notification.title);

        DeliveryResult {
            success: true,
            channel: "email".to_string(),
            error: None,
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }
}

impl Default for DeliveryService {
    fn default() -> Self {
        Self::new()
    }
}

/// Notification policy configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationPolicy {
    /// Whether to send on success
    pub on_success: bool,
    /// Whether to send on failure
    pub on_failure: bool,
    /// Whether to send on skip
    pub on_skip: bool,
    /// Minimum interval between notifications (milliseconds)
    pub min_interval_ms: Option<u64>,
}

impl Default for NotificationPolicy {
    fn default() -> Self {
        Self {
            on_success: true,
            on_failure: true,
            on_skip: false,
            min_interval_ms: Some(60_000),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_deliver_system() {
        let service = DeliveryService::new();
        let notification = HeartbeatNotification {
            title: "Test".to_string(),
            content: "Test content".to_string(),
            level: NotificationLevel::Info,
            channel: "system".to_string(),
        };
        let target = DeliveryTarget::system();

        let result = service.send(&notification, &target).await;
        assert!(result.success);
        assert_eq!(result.channel, "system");
    }

    #[tokio::test]
    async fn test_deliver_webhook_no_url() {
        let service = DeliveryService::new();
        let notification = HeartbeatNotification {
            title: "Test".to_string(),
            content: "Test content".to_string(),
            level: NotificationLevel::Info,
            channel: "webhook".to_string(),
        };
        let target = DeliveryTarget {
            channel: "webhook".to_string(),
            target: None,
            account_id: None,
        };

        let result = service.send(&notification, &target).await;
        assert!(!result.success);
        assert!(result.error.is_some());
    }
}
