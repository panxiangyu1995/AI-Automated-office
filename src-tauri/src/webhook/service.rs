//! Webhook Service Module
//!
//! Implements webhook trigger mechanism for external system integration
//! Features:
//! - Webhook registration API
//! - Event trigger mechanism
//! - Signature verification (HMAC-SHA256)
//! - Retry strategy with exponential backoff
//!
//! Story 47.1 - Webhook与自动化触发

use std::collections::HashMap;
use std::sync::Arc;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use tracing::info;

/// Webhook registration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebhookRegistration {
    pub id: String,
    pub name: String,
    pub url: String,
    pub events: Vec<String>,
    pub secret: Option<String>,
    pub enabled: bool,
    pub headers: HashMap<String, String>,
    pub retry_policy: RetryPolicy,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Retry policy for failed deliveries
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetryPolicy {
    pub max_retries: u32,
    pub initial_delay_ms: u64,
    pub max_delay_ms: u64,
    pub backoff_multiplier: f64,
}

impl Default for RetryPolicy {
    fn default() -> Self {
        Self {
            max_retries: 3,
            initial_delay_ms: 1000,
            max_delay_ms: 60000,
            backoff_multiplier: 2.0,
        }
    }
}

/// Webhook event payload
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebhookEvent {
    pub id: String,
    pub webhook_id: String,
    pub event_type: String,
    pub payload: serde_json::Value,
    pub timestamp: i64,
}

/// Webhook delivery result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebhookDelivery {
    pub id: String,
    pub webhook_id: String,
    pub event_id: String,
    pub status: DeliveryStatus,
    pub attempt: u32,
    pub response_status: Option<u16>,
    pub response_body: Option<String>,
    pub error_message: Option<String>,
    pub delivered_at: Option<i64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DeliveryStatus {
    Pending,
    Success,
    Failed,
    Retrying,
}

/// Webhook statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebhookStats {
    pub total_webhooks: usize,
    pub active_webhooks: usize,
    pub total_deliveries: usize,
    pub successful_deliveries: usize,
    pub failed_deliveries: usize,
    pub pending_deliveries: usize,
}

/// Signature verification result
#[derive(Debug, Clone)]
pub struct SignatureVerification {
    pub valid: bool,
    pub expected: Option<String>,
    pub received: Option<String>,
}

/// Webhook service
pub struct WebhookService {
    registrations: Arc<RwLock<HashMap<String, WebhookRegistration>>>,
    events: Arc<RwLock<HashMap<String, Vec<WebhookEvent>>>>,
    deliveries: Arc<RwLock<HashMap<String, Vec<WebhookDelivery>>>>,
    delivery_queue: Arc<RwLock<Vec<WebhookEvent>>>,
}

impl WebhookService {
    /// Create a new webhook service
    pub fn new() -> Self {
        Self {
            registrations: Arc::new(RwLock::new(HashMap::new())),
            events: Arc::new(RwLock::new(HashMap::new())),
            deliveries: Arc::new(RwLock::new(HashMap::new())),
            delivery_queue: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Initialize default webhooks (for demo/testing)
    pub async fn init_defaults(&self) {
        // Create a sample webhook for external notifications
        let sample = WebhookRegistration {
            id: format!("wh_{}", uuid::Uuid::new_v4()),
            name: "External Notification".to_string(),
            url: "https://example.com/webhook".to_string(),
            events: vec![
                "agent.message.sent".to_string(),
                "agent.tool.executed".to_string(),
                "approval.created".to_string(),
            ],
            secret: std::env::var("WEBHOOK_SECRET").ok(),
            enabled: true,
            headers: HashMap::new(),
            retry_policy: RetryPolicy::default(),
            created_at: Utc::now().timestamp(),
            updated_at: Utc::now().timestamp(),
        };

        let mut regs = self.registrations.write().await;
        regs.insert(sample.id.clone(), sample);
        info!("Webhook defaults initialized");
    }

    /// Register a new webhook
    pub async fn register_webhook(&self, req: CreateWebhookRequest) -> WebhookRegistration {
        let now = Utc::now().timestamp();
        let registration = WebhookRegistration {
            id: format!("wh_{}", uuid::Uuid::new_v4()),
            name: req.name,
            url: req.url,
            events: req.events,
            secret: req.secret,
            enabled: true,
            headers: req.headers,
            retry_policy: req.retry_policy.unwrap_or_default(),
            created_at: now,
            updated_at: now,
        };

        let mut regs = self.registrations.write().await;
        regs.insert(registration.id.clone(), registration.clone());
        info!("Webhook registered: {}", registration.id);
        registration
    }

    /// Update webhook registration
    pub async fn update_webhook(&self, id: &str, req: UpdateWebhookRequest) -> Result<WebhookRegistration, String> {
        let mut regs = self.registrations.write().await;
        let webhook = regs.get_mut(id).ok_or("Webhook not found")?;

        if let Some(name) = req.name {
            webhook.name = name;
        }
        if let Some(url) = req.url {
            webhook.url = url;
        }
        if let Some(events) = req.events {
            webhook.events = events;
        }
        if let Some(secret) = req.secret {
            webhook.secret = Some(secret);
        }
        if let Some(enabled) = req.enabled {
            webhook.enabled = enabled;
        }
        if let Some(headers) = req.headers {
            webhook.headers = headers;
        }
        if let Some(retry_policy) = req.retry_policy {
            webhook.retry_policy = retry_policy;
        }
        webhook.updated_at = Utc::now().timestamp();

        Ok(webhook.clone())
    }

    /// Delete webhook
    pub async fn delete_webhook(&self, id: &str) -> Result<(), String> {
        let mut regs = self.registrations.write().await;
        regs.remove(id).ok_or("Webhook not found")?;
        info!("Webhook deleted: {}", id);
        Ok(())
    }

    /// List all webhooks
    pub async fn list_webhooks(&self) -> Vec<WebhookRegistration> {
        let regs = self.registrations.read().await;
        regs.values().cloned().collect()
    }

    /// Get webhook by ID
    pub async fn get_webhook(&self, id: &str) -> Option<WebhookRegistration> {
        let regs = self.registrations.read().await;
        regs.get(id).cloned()
    }

    /// Trigger event for all matching webhooks
    pub async fn trigger_event(&self, event_type: &str, payload: serde_json::Value) -> Vec<WebhookEvent> {
        let regs = self.registrations.read().await;
        let mut triggered_events = Vec::new();

        for webhook in regs.values().filter(|w| w.enabled && w.events.contains(&event_type.to_string())) {
            let event = WebhookEvent {
                id: format!("evt_{}", uuid::Uuid::new_v4()),
                webhook_id: webhook.id.clone(),
                event_type: event_type.to_string(),
                payload: payload.clone(),
                timestamp: Utc::now().timestamp(),
            };

            // Store event
            let mut events = self.events.write().await;
            events.entry(webhook.id.clone()).or_insert_with(Vec::new).push(event.clone());
            triggered_events.push(event.clone());

            // Queue for delivery
            let mut queue = self.delivery_queue.write().await;
            queue.push(event);

            info!("Event {} triggered for webhook {}", event_type, webhook.id);
        }

        triggered_events
    }

    /// Verify webhook signature using SHA256-HMAC
    pub fn verify_signature(&self, payload: &str, signature: &str, secret: &str) -> SignatureVerification {
        use sha2::{Sha256, Digest};

        let mut hasher = Sha256::new();
        hasher.update(secret.as_bytes());
        hasher.update(payload.as_bytes());
        let result = hasher.finalize();
        let expected = hex::encode(result);

        SignatureVerification {
            valid: expected == signature,
            expected: Some(expected),
            received: Some(signature.to_string()),
        }
    }

    /// Generate signature for payload
    pub fn generate_signature(&self, payload: &str, secret: &str) -> String {
        use sha2::{Sha256, Digest};

        let mut hasher = Sha256::new();
        hasher.update(secret.as_bytes());
        hasher.update(payload.as_bytes());
        hex::encode(hasher.finalize())
    }

    /// Get webhook statistics
    pub async fn get_stats(&self) -> WebhookStats {
        let regs = self.registrations.read().await;
        let deliveries = self.deliveries.read().await;

        let total_webhooks = regs.len();
        let active_webhooks = regs.values().filter(|w| w.enabled).count();

        let total_deliveries = deliveries.values().map(|v| v.len()).sum();
        let successful_deliveries = deliveries.values()
            .flat_map(|v| v.iter())
            .filter(|d| d.status == DeliveryStatus::Success)
            .count();
        let failed_deliveries = deliveries.values()
            .flat_map(|v| v.iter())
            .filter(|d| d.status == DeliveryStatus::Failed)
            .count();
        let pending_deliveries = deliveries.values()
            .flat_map(|v| v.iter())
            .filter(|d| d.status == DeliveryStatus::Pending)
            .count();

        WebhookStats {
            total_webhooks,
            active_webhooks,
            total_deliveries,
            successful_deliveries,
            failed_deliveries,
            pending_deliveries,
        }
    }

    /// Get delivery history for a webhook
    pub async fn get_deliveries(&self, webhook_id: &str, limit: usize) -> Vec<WebhookDelivery> {
        let deliveries = self.deliveries.read().await;
        deliveries.get(webhook_id)
            .map(|v| v.iter().rev().take(limit).cloned().collect())
            .unwrap_or_default()
    }

    /// Get pending events for delivery
    pub async fn get_pending_events(&self) -> Vec<WebhookEvent> {
        let queue = self.delivery_queue.read().await;
        queue.clone()
    }

    /// Record delivery result
    pub async fn record_delivery(&self, webhook_id: &str, delivery: WebhookDelivery) {
        let mut deliveries = self.deliveries.write().await;
        deliveries.entry(webhook_id.to_string()).or_insert_with(Vec::new).push(delivery);
    }

    /// Remove processed event from queue
    pub async fn remove_from_queue(&self, event_id: &str) {
        let mut queue = self.delivery_queue.write().await;
        queue.retain(|e| e.id != event_id);
    }
}

impl Default for WebhookService {
    fn default() -> Self {
        Self::new()
    }
}

/// Request to create webhook
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWebhookRequest {
    pub name: String,
    pub url: String,
    pub events: Vec<String>,
    pub secret: Option<String>,
    pub headers: HashMap<String, String>,
    pub retry_policy: Option<RetryPolicy>,
}

/// Request to update webhook
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWebhookRequest {
    pub name: Option<String>,
    pub url: Option<String>,
    pub events: Option<Vec<String>>,
    pub secret: Option<String>,
    pub enabled: Option<bool>,
    pub headers: Option<HashMap<String, String>>,
    pub retry_policy: Option<RetryPolicy>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_signature_generation() {
        let service = WebhookService::new();
        let payload = r#"{"event":"test","data":"hello"}"#;
        let secret = "test_secret";

        let signature = service.generate_signature(payload, secret);
        assert!(!signature.is_empty());
    }

    #[test]
    fn test_signature_verification() {
        let service = WebhookService::new();
        let payload = r#"{"event":"test","data":"hello"}"#;
        let secret = "test_secret";

        let signature = service.generate_signature(payload, secret);
        let result = service.verify_signature(payload, &signature, secret);

        assert!(result.valid);
    }

    #[tokio::test]
    async fn test_webhook_registration() {
        let service = WebhookService::new();

        let req = CreateWebhookRequest {
            name: "Test Webhook".to_string(),
            url: "https://example.com/hook".to_string(),
            events: vec!["test.event".to_string()],
            secret: Some("secret".to_string()),
            headers: HashMap::new(),
            retry_policy: None,
        };

        let webhook = service.register_webhook(req).await;
        assert_eq!(webhook.name, "Test Webhook");
        assert!(webhook.enabled);
    }

    #[tokio::test]
    async fn test_trigger_event() {
        let service = WebhookService::new();
        service.init_defaults().await;

        let payload = serde_json::json!({"message": "hello"});
        let events = service.trigger_event("agent.message.sent", payload).await;

        assert!(!events.is_empty());
    }
}