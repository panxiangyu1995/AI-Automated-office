use reqwest::{Client, Method};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpRequest {
    pub method: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
    pub timeout: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpResponse {
    pub status: u16,
    pub ok: bool,
    pub body: Option<String>,
    pub headers: HashMap<String, String>,
}

pub async fn send_request(request: HttpRequest) -> Result<HttpResponse, String> {
    let method = Method::from_bytes(request.method.as_bytes())
        .map_err(|e| e.to_string())?;
    let timeout = request.timeout.unwrap_or(30000);

    let client = Client::builder()
        .timeout(Duration::from_millis(timeout))
        .build()
        .map_err(|e| e.to_string())?;

    let mut req = client.request(method, &request.url);

    for (key, value) in request.headers {
        req = req.header(key, value);
    }

    if let Some(body) = request.body {
        req = req.body(body);
    }

    let response = req.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let mut headers = HashMap::new();
    for (key, value) in response.headers().iter() {
        if let Ok(text) = value.to_str() {
            headers.insert(key.to_string(), text.to_string());
        }
    }
    let body = response.text().await.ok();

    Ok(HttpResponse {
        status: status.as_u16(),
        ok: status.is_success(),
        body,
        headers,
    })
}
