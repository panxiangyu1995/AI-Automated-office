use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::http::client::{send_request, HttpRequest};
use crate::storage::sync_queue::SyncQueueItem;
use crate::storage::StorageManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueuedRequest {
    pub id: String,
    pub method: String,
    pub url: String,
    pub headers: std::collections::HashMap<String, String>,
    pub body: Option<String>,
    pub created_at: i64,
    pub retry_count: i64,
    pub max_retries: i64,
    pub status: String,
    pub last_error: Option<String>,
    pub idempotency_key: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub id: String,
    pub success: bool,
    pub status_code: Option<u16>,
    pub error: Option<String>,
}

fn now_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as i64)
        .unwrap_or(0)
}

async fn get_store() -> Result<crate::storage::sync_queue::SyncQueueStore, String> {
    let manager = StorageManager::init("default")
        .await
        .map_err(|e| e.to_string())?;
    Ok(manager.sync_queue_store())
}

#[tauri::command]
pub async fn enqueue_request(request: QueuedRequest) -> Result<String, String> {
    let store = get_store().await?;
    let item = SyncQueueItem {
        id: request.id.clone(),
        operation: request.method.clone(),
        entity_type: "http".to_string(),
        entity_id: request.url.clone(),
        payload: Some(serde_json::to_value(&request).map_err(|e| e.to_string())?),
        created_at: request.created_at,
        retry_count: request.retry_count,
        max_retries: request.max_retries,
        last_error: request.last_error.clone(),
        status: request.status.clone(),
        processed_at: None,
    };
    store.enqueue(&item).await.map_err(|e| e.to_string())?;
    Ok(item.id)
}

#[tauri::command]
pub async fn get_pending_requests() -> Result<Vec<QueuedRequest>, String> {
    let store = get_store().await?;
    let items = store.list_pending(200).await.map_err(|e| e.to_string())?;
    let mut output = Vec::new();
    for item in items {
        if let Some(payload) = item.payload {
            if let Ok(request) = serde_json::from_value::<QueuedRequest>(payload) {
                output.push(request);
            }
        }
    }
    Ok(output)
}

#[tauri::command]
pub async fn process_pending_requests() -> Result<Vec<SyncResult>, String> {
    let store = get_store().await?;
    let items = store.list_pending(200).await.map_err(|e| e.to_string())?;
    let mut results = Vec::new();
    for item in items {
        let payload = match item.payload.clone() {
            Some(value) => value,
            None => continue,
        };
        let mut request: QueuedRequest = match serde_json::from_value(payload) {
            Ok(value) => value,
            Err(_) => continue,
        };

        let http_request = HttpRequest {
            method: request.method.clone(),
            url: request.url.clone(),
            headers: request.headers.clone(),
            body: request.body.clone(),
            timeout: None,
        };

        let response = send_request(http_request).await;
        let processed_at = now_millis();
        match response {
            Ok(resp) => {
                store
                    .update_attempt(&item.id, "synced", request.retry_count, None, Some(processed_at))
                    .await
                    .map_err(|e| e.to_string())?;
                results.push(SyncResult {
                    id: item.id.clone(),
                    success: true,
                    status_code: Some(resp.status),
                    error: None,
                });
            }
            Err(error) => {
                request.retry_count += 1;
                let status = if request.retry_count >= request.max_retries {
                    "failed"
                } else {
                    "pending"
                };
                store
                    .update_attempt(
                        &item.id,
                        status,
                        request.retry_count,
                        Some(&error),
                        Some(processed_at),
                    )
                    .await
                    .map_err(|e| e.to_string())?;
                results.push(SyncResult {
                    id: item.id.clone(),
                    success: false,
                    status_code: None,
                    error: Some(error),
                });
            }
        }
    }
    Ok(results)
}
