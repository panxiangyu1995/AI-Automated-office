//! Webhook Commands
//!
//! Tauri commands for webhook management and event triggering

use std::sync::Arc;
use tauri::State;
use tracing::info;

use crate::webhook::{
    CreateWebhookRequest, UpdateWebhookRequest, WebhookDelivery, WebhookEvent,
    WebhookRegistration, WebhookService, WebhookStats,
};

/// Create a new webhook registration
#[tauri::command]
pub async fn webhook_register(
    service: State<'_, Arc<WebhookService>>,
    request: CreateWebhookRequest,
) -> Result<WebhookRegistration, String> {
    info!("Registering webhook: {}", request.name);
    Ok(service.register_webhook(request).await)
}

/// Update webhook registration
#[tauri::command]
pub async fn webhook_update(
    service: State<'_, Arc<WebhookService>>,
    id: String,
    request: UpdateWebhookRequest,
) -> Result<WebhookRegistration, String> {
    info!("Updating webhook: {}", id);
    service.update_webhook(&id, request).await
}

/// Delete webhook registration
#[tauri::command]
pub async fn webhook_delete(
    service: State<'_, Arc<WebhookService>>,
    id: String,
) -> Result<(), String> {
    info!("Deleting webhook: {}", id);
    service.delete_webhook(&id).await
}

/// List all webhook registrations
#[tauri::command]
pub async fn webhook_list(
    service: State<'_, Arc<WebhookService>>,
) -> Result<Vec<WebhookRegistration>, String> {
    Ok(service.list_webhooks().await)
}

/// Get webhook by ID
#[tauri::command]
pub async fn webhook_get(
    service: State<'_, Arc<WebhookService>>,
    id: String,
) -> Result<Option<WebhookRegistration>, String> {
    Ok(service.get_webhook(&id).await)
}

/// Trigger event for all matching webhooks
#[tauri::command]
pub async fn webhook_trigger(
    service: State<'_, Arc<WebhookService>>,
    event_type: String,
    payload: serde_json::Value,
) -> Result<Vec<WebhookEvent>, String> {
    info!("Triggering event: {}", event_type);
    Ok(service.trigger_event(&event_type, payload).await)
}

/// Get webhook statistics
#[tauri::command]
pub async fn webhook_get_stats(
    service: State<'_, Arc<WebhookService>>,
) -> Result<WebhookStats, String> {
    Ok(service.get_stats().await)
}

/// Get delivery history for a webhook
#[tauri::command]
pub async fn webhook_get_deliveries(
    service: State<'_, Arc<WebhookService>>,
    webhook_id: String,
    limit: Option<usize>,
) -> Result<Vec<WebhookDelivery>, String> {
    Ok(service.get_deliveries(&webhook_id, limit.unwrap_or(50)).await)
}

/// Verify webhook signature
#[tauri::command]
pub async fn webhook_verify_signature(
    service: State<'_, Arc<WebhookService>>,
    payload: String,
    signature: String,
    secret: String,
) -> Result<bool, String> {
    let result = service.verify_signature(&payload, &signature, &secret);
    Ok(result.valid)
}

/// Generate webhook signature
#[tauri::command]
pub async fn webhook_generate_signature(
    service: State<'_, Arc<WebhookService>>,
    payload: String,
    secret: String,
) -> Result<String, String> {
    Ok(service.generate_signature(&payload, &secret))
}