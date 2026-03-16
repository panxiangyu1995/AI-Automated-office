use std::collections::HashMap;

use super::client::{send_request, HttpRequest, HttpResponse};

#[tauri::command]
pub async fn http_request(request: HttpRequest) -> Result<HttpResponse, String> {
    send_request(request).await
}

#[tauri::command]
pub async fn http_get(url: String, headers: HashMap<String, String>) -> Result<HttpResponse, String> {
    let request = HttpRequest {
        method: "GET".to_string(),
        url,
        headers,
        body: None,
        timeout: None,
    };
    send_request(request).await
}

#[tauri::command]
pub async fn http_post(
    url: String,
    body: String,
    headers: HashMap<String, String>,
) -> Result<HttpResponse, String> {
    let request = HttpRequest {
        method: "POST".to_string(),
        url,
        headers,
        body: Some(body),
        timeout: None,
    };
    send_request(request).await
}
