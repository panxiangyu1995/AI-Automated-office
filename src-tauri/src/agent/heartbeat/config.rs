//! Heartbeat configuration structures.

use serde::{Deserialize, Serialize};

/// Heartbeat configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatConfig {
    /// Heartbeat interval in milliseconds, default 30 minutes
    #[serde(default = "default_interval_ms")]
    pub interval_ms: Option<u64>,
    /// Active hours configuration
    pub active_hours: Option<ActiveHours>,
    /// Timezone setting (e.g., "Asia/Shanghai", "UTC")
    pub timezone: Option<String>,
    /// Whether to use isolated session mode
    #[serde(default)]
    pub isolated_session: bool,
    /// Whether to use light context mode
    #[serde(default)]
    pub light_context: bool,
    /// Delivery target for notifications
    pub delivery_target: Option<DeliveryTarget>,
    /// Maximum retry attempts
    #[serde(default = "default_max_retries")]
    pub max_retries: u32,
    /// Whether heartbeat is enabled
    #[serde(default = "default_enabled")]
    pub enabled: bool,
}

fn default_interval_ms() -> Option<u64> {
    Some(30 * 60 * 1000) // 30 minutes
}

fn default_max_retries() -> u32 {
    3
}

fn default_enabled() -> bool {
    true
}

impl Default for HeartbeatConfig {
    fn default() -> Self {
        Self {
            interval_ms: default_interval_ms(),
            active_hours: None,
            timezone: None,
            isolated_session: false,
            light_context: false,
            delivery_target: None,
            max_retries: default_max_retries(),
            enabled: true,
        }
    }
}

impl HeartbeatConfig {
    /// Validate the configuration
    pub fn validate(&self) -> Result<(), String> {
        if let Some(ref hours) = self.active_hours {
            if hours.start > 23 || hours.end > 23 {
                return Err("Active hours must be between 0 and 23".to_string());
            }
            if hours.start == hours.end {
                return Err("Active hours start and end cannot be the same".to_string());
            }
        }

        if let Some(interval) = self.interval_ms {
            if interval < 60_000 {
                return Err("Heartbeat interval must be at least 1 minute".to_string());
            }
        }

        Ok(())
    }

    /// Get the effective interval in milliseconds
    pub fn get_interval_ms(&self) -> u64 {
        self.interval_ms.unwrap_or(30 * 60 * 1000)
    }
}

/// Active hours configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveHours {
    /// Start hour (0-23)
    pub start: u8,
    /// End hour (0-23)
    pub end: u8,
}

impl ActiveHours {
    /// Create a new ActiveHours instance
    pub fn new(start: u8, end: u8) -> Self {
        Self { start, end }
    }

    /// Check if current hour is within active hours
    pub fn is_active(&self, hour: u8) -> bool {
        if self.start <= self.end {
            hour >= self.start && hour < self.end
        } else {
            hour >= self.start || hour < self.end
        }
    }
}

/// Delivery target for notifications
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryTarget {
    /// Delivery channel (e.g., "system", "email", "webhook")
    pub channel: String,
    /// Delivery target (e.g., email address, webhook URL)
    pub target: Option<String>,
    /// Account ID for the delivery
    pub account_id: Option<String>,
}

impl DeliveryTarget {
    /// Create a new DeliveryTarget for system notifications
    pub fn system() -> Self {
        Self {
            channel: "system".to_string(),
            target: None,
            account_id: None,
        }
    }

    /// Create a new DeliveryTarget for webhook notifications
    pub fn webhook(url: &str) -> Self {
        Self {
            channel: "webhook".to_string(),
            target: Some(url.to_string()),
            account_id: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_active_hours_same_day() {
        let hours = ActiveHours::new(9, 18);
        assert!(hours.is_active(9));
        assert!(hours.is_active(12));
        assert!(hours.is_active(17));
        assert!(!hours.is_active(8));
        assert!(!hours.is_active(18));
    }

    #[test]
    fn test_config_default() {
        let config = HeartbeatConfig::default();
        assert!(config.enabled);
        assert_eq!(config.get_interval_ms(), 30 * 60 * 1000);
        assert_eq!(config.max_retries, 3);
    }
}
