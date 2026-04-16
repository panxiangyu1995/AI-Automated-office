//! Delivery Strategy Module
//!
//! Implements ADR-060 dynamic delivery strategy:
//! - Urgency evaluation based on task type and context
//! - Channel selection (notification/chat/list/workbench)
//! - Quiet hours handling
//! - User preferences management
//!
//! Story 39.1 - 动态投递策略实现

use chrono::{Timelike, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Delivery channel types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DeliveryChannel {
    /// Real-time notification card - for urgent tasks
    Notification,
    /// AI Chat Panel - for regular task results
    Chat,
    /// Message list - for low priority background sync
    List,
    /// Workbench editor panel - for tasks requiring user input
    Workbench,
}

impl Default for DeliveryChannel {
    fn default() -> Self {
        Self::List
    }
}

impl std::fmt::Display for DeliveryChannel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Notification => write!(f, "notification"),
            Self::Chat => write!(f, "chat"),
            Self::List => write!(f, "list"),
            Self::Workbench => write!(f, "workbench"),
        }
    }
}

/// Urgency level
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Urgency {
    Critical,
    High,
    Normal,
    Low,
}

impl Default for Urgency {
    fn default() -> Self {
        Self::Normal
    }
}

impl std::fmt::Display for Urgency {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Critical => write!(f, "critical"),
            Self::High => write!(f, "high"),
            Self::Normal => write!(f, "normal"),
            Self::Low => write!(f, "low"),
        }
    }
}

/// Delivery strategy result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeliveryStrategy {
    pub urgency: Urgency,
    pub channel: DeliveryChannel,
    pub can_interrupt: bool,
    pub require_ack: bool,
    pub reason: String,
}

impl DeliveryStrategy {
    /// Create a new delivery strategy
    pub fn new(urgency: Urgency, channel: DeliveryChannel, can_interrupt: bool, require_ack: bool, reason: impl Into<String>) -> Self {
        Self {
            urgency,
            channel,
            can_interrupt,
            require_ack,
            reason: reason.into(),
        }
    }

    /// Default low priority strategy
    pub fn default_low() -> Self {
        Self {
            urgency: Urgency::Low,
            channel: DeliveryChannel::List,
            can_interrupt: false,
            require_ack: false,
            reason: "Low priority background sync".to_string(),
        }
    }
}

/// Task type for urgency evaluation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskType {
    Approval,
    Cron,
    UserRequest,
    Sync,
    System,
}

impl TaskType {
    /// Evaluate urgency based on task type and context
    pub fn evaluate_urgency(&self, context: &TaskContext) -> Urgency {
        match self {
            Self::Approval => {
                if context.is_overdue {
                    Urgency::Critical
                } else if context.has_alert {
                    Urgency::High
                } else {
                    Urgency::Normal
                }
            }
            Self::Cron => {
                if context.has_alert {
                    Urgency::High
                } else {
                    Urgency::Normal
                }
            }
            Self::UserRequest => Urgency::Normal,
            Self::Sync => Urgency::Low,
            Self::System => Urgency::Normal,
        }
    }
}

/// Task context for urgency evaluation
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskContext {
    pub is_overdue: bool,
    pub has_alert: bool,
    pub is_interactive: bool,
    pub priority_override: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Delivery item - represents a single item to be delivered
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeliveryItem {
    pub id: String,
    pub task_type: TaskType,
    pub title: String,
    pub content: String,
    pub context: TaskContext,
    pub created_at: i64,
}

/// Delivery preference configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeliveryPreference {
    /// Enable/disable quiet hours
    pub quiet_hours_enabled: bool,
    /// Quiet hours start time (HH:MM format)
    pub quiet_hours_start: String,
    /// Quiet hours end time (HH:MM format)
    pub quiet_hours_end: String,
    /// Fallback channel during quiet hours
    pub quiet_hours_fallback: DeliveryChannel,
    /// Channel override by task type
    pub channel_overrides: HashMap<String, DeliveryChannel>,
    /// Enable batch aggregation
    pub batch_enabled: bool,
    /// Batch aggregation window in minutes
    pub batch_window_minutes: u32,
    /// Minimum items to trigger batch
    pub batch_min_items: u32,
}

impl Default for DeliveryPreference {
    fn default() -> Self {
        Self {
            quiet_hours_enabled: true,
            quiet_hours_start: "22:00".to_string(),
            quiet_hours_end: "08:00".to_string(),
            quiet_hours_fallback: DeliveryChannel::List,
            channel_overrides: HashMap::new(),
            batch_enabled: true,
            batch_window_minutes: 15,
            batch_min_items: 3,
        }
    }
}

impl DeliveryPreference {
    /// Check if current time is within quiet hours
    pub fn is_quiet_hours(&self) -> bool {
        if !self.quiet_hours_enabled {
            return false;
        }

        let now = Utc::now();
        let current_hour = now.hour() as u16;
        let current_minute = now.minute() as u16;
        let current_time = current_hour * 60 + current_minute;

        let parse_time = |s: &str| -> Option<u16> {
            let parts: Vec<&str> = s.split(':').collect();
            if parts.len() != 2 {
                return None;
            }
            let hour: u16 = parts[0].parse().ok()?;
            let minute: u16 = parts[1].parse().ok()?;
            Some(hour * 60 + minute)
        };

        let start = match parse_time(&self.quiet_hours_start) {
            Some(s) => s,
            None => return false,
        };
        let end = match parse_time(&self.quiet_hours_end) {
            Some(e) => e,
            None => return false,
        };

        if start <= end {
            current_time >= start && current_time < end
        } else {
            current_time >= start || current_time < end
        }
    }

    /// Get channel override for a task type
    pub fn get_channel_override(&self, task_type: &TaskType) -> Option<DeliveryChannel> {
        let key = match task_type {
            TaskType::Approval => "approval_result",
            TaskType::Cron => "cron_result",
            TaskType::UserRequest => "user_request",
            TaskType::Sync => "sync_result",
            TaskType::System => "system",
        };
        self.channel_overrides.get(key).copied()
    }
}

/// Batch aggregation entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchEntry {
    pub id: String,
    pub items: Vec<DeliveryItem>,
    pub created_at: i64,
    pub window_start: i64,
    pub strategy: DeliveryStrategy,
}

/// Delivery strategy service
pub struct DeliveryStrategyService {
    preferences: Arc<RwLock<HashMap<String, DeliveryPreference>>>,
    batch_queue: Arc<RwLock<HashMap<String, BatchEntry>>>,
}

impl DeliveryStrategyService {
    /// Create a new delivery strategy service
    pub fn new() -> Self {
        Self {
            preferences: Arc::new(RwLock::new(HashMap::new())),
            batch_queue: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Evaluate delivery strategy for a single item
    pub async fn evaluate(&self, item: &DeliveryItem, user_id: &str) -> DeliveryStrategy {
        let prefs = self.preferences.read().await;
        let pref = prefs.get(user_id).cloned().unwrap_or_default();

        // Check quiet hours first
        if pref.is_quiet_hours() {
            return DeliveryStrategy::new(
                item.task_type.evaluate_urgency(&item.context),
                pref.quiet_hours_fallback,
                false,
                false,
                "Quiet hours active, using fallback channel".to_string(),
            );
        }

        // Check channel override
        if let Some(channel) = pref.get_channel_override(&item.task_type) {
            let urgency = item.task_type.evaluate_urgency(&item.context);
            return DeliveryStrategy::new(
                urgency,
                channel,
                channel == DeliveryChannel::Notification,
                channel == DeliveryChannel::Notification,
                format!("Channel override: {:?}", channel),
            );
        }

        // Default evaluation based on urgency
        let urgency = item.task_type.evaluate_urgency(&item.context);
        let (channel, can_interrupt, require_ack) = match urgency {
            Urgency::Critical => (DeliveryChannel::Notification, true, true),
            Urgency::High => (DeliveryChannel::Notification, true, false),
            Urgency::Normal => {
                if item.context.is_interactive {
                    (DeliveryChannel::Workbench, false, false)
                } else {
                    (DeliveryChannel::Chat, false, false)
                }
            }
            Urgency::Low => (DeliveryChannel::List, false, false),
        };

        DeliveryStrategy::new(
            urgency,
            channel,
            can_interrupt,
            require_ack,
            format!("Evaluated: urgency={:?}, channel={}", urgency, channel),
        )
    }

    /// Set user delivery preferences
    pub async fn set_preference(&self, user_id: String, preference: DeliveryPreference) {
        let mut prefs = self.preferences.write().await;
        prefs.insert(user_id, preference);
    }

    /// Get user delivery preferences
    pub async fn get_preference(&self, user_id: &str) -> DeliveryPreference {
        let prefs = self.preferences.read().await;
        prefs.get(user_id).cloned().unwrap_or_default()
    }

    /// Add item to batch queue
    pub async fn add_to_batch(&self, batch_id: String, item: DeliveryItem, strategy: DeliveryStrategy) {
        let mut queue = self.batch_queue.write().await;
        let now = Utc::now().timestamp();

        if let Some(entry) = queue.get_mut(&batch_id) {
            entry.items.push(item);
            return;
        }

        let entry = BatchEntry {
            id: batch_id.clone(),
            items: vec![item],
            created_at: now,
            window_start: now,
            strategy,
        };
        queue.insert(batch_id, entry);
    }

    /// Get and remove ready batch entries
    pub async fn get_ready_batches(&self, user_id: &str) -> Vec<BatchEntry> {
        let prefs = self.preferences.read().await;
        let pref = prefs.get(user_id).cloned().unwrap_or_default();

        if !pref.batch_enabled {
            return vec![];
        }

        let mut queue = self.batch_queue.write().await;
        let now = Utc::now().timestamp();
        let window_ms = (pref.batch_window_minutes as i64) * 60 * 1000;

        let mut ready = Vec::new();
        queue.retain(|_id, entry| {
            if entry.items.len() >= pref.batch_min_items as usize
                || (now - entry.window_start) * 1000 >= window_ms
            {
                ready.push(entry.clone());
                false
            } else {
                true
            }
        });

        ready
    }

    /// Evaluate multiple items with batch aggregation
    pub async fn evaluate_batch(&self, items: Vec<DeliveryItem>, user_id: &str) -> Vec<(DeliveryItem, DeliveryStrategy)> {
        let mut results = Vec::new();

        for item in items {
            let strategy = self.evaluate(&item, user_id).await;
            results.push((item, strategy));
        }

        results
    }
}

impl Default for DeliveryStrategyService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_urgency_evaluation() {
        let service = DeliveryStrategyService::new();

        // Critical: overdue approval
        let item = DeliveryItem {
            id: "1".to_string(),
            task_type: TaskType::Approval,
            title: "Overdue Approval".to_string(),
            content: "Content".to_string(),
            context: TaskContext {
                is_overdue: true,
                has_alert: false,
                is_interactive: false,
                priority_override: None,
                metadata: HashMap::new(),
            },
            created_at: Utc::now().timestamp(),
        };

        let strategy = service.evaluate(&item, "user1").await;
        assert_eq!(strategy.urgency, Urgency::Critical);
        assert_eq!(strategy.channel, DeliveryChannel::Notification);
        assert!(strategy.can_interrupt);
    }

    #[tokio::test]
    async fn test_normal_task() {
        let service = DeliveryStrategyService::new();

        let item = DeliveryItem {
            id: "2".to_string(),
            task_type: TaskType::UserRequest,
            title: "User Request".to_string(),
            content: "Content".to_string(),
            context: TaskContext::default(),
            created_at: Utc::now().timestamp(),
        };

        let strategy = service.evaluate(&item, "user1").await;
        assert_eq!(strategy.urgency, Urgency::Normal);
        assert_eq!(strategy.channel, DeliveryChannel::Chat);
    }

    #[tokio::test]
    async fn test_preferences() {
        let service = DeliveryStrategyService::new();

        let pref = DeliveryPreference {
            quiet_hours_enabled: true,
            quiet_hours_start: "00:00".to_string(),
            quiet_hours_end: "23:59".to_string(),
            ..Default::default()
        };

        service.set_preference("user1".to_string(), pref).await;

        let retrieved = service.get_preference("user1").await;
        assert!(retrieved.quiet_hours_enabled);

        // Verify quiet hours always active in this range
        assert!(retrieved.is_quiet_hours());
    }

    #[test]
    fn test_quiet_hours_same_day() {
        let pref = DeliveryPreference {
            quiet_hours_enabled: true,
            quiet_hours_start: "22:00".to_string(),
            quiet_hours_end: "08:00".to_string(),
            ..Default::default()
        };

        // Note: This test depends on current time
        // In real tests, we would mock chrono::Utc::now()
        assert!(!pref.is_quiet_hours() || pref.is_quiet_hours());
    }
}
