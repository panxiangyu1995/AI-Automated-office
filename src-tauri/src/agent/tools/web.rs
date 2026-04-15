use std::collections::HashMap;
use std::sync::Arc;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::RwLock;

use crate::http::client::HttpRequest;

use crate::agent::tools::common::{
    base_metadata, base_readonly_capabilities, base_writable_capabilities,
    bool_param, number_param, string_enum_param, string_param,
};
use crate::agent::tools::common::config::WebSearchConfig;
use crate::agent::tools::common::config::ToolConfigManager;
use super::descriptor::{
    ToolCategory, ToolContextRequirements, ToolDescriptor, ToolExecutionMode,
    ToolMetadata, ToolParameter, ToolPermissionRequirement,
};
use super::pipeline::{ToolExecutionContext, ToolExecutionError, ToolErrorCode, ToolExecutor};

// ============ Web Search Provider Abstraction ============

static WEB_SEARCH_CONFIG: RwLock<Option<WebSearchConfig>> = RwLock::new(None);

#[derive(Debug, Clone)]
pub struct SearchProviderConfig {
    pub provider_id: String,
    pub api_key: Option<String>,
    pub api_url: Option<String>,
}

fn get_or_init_config() -> WebSearchConfig {
    let config = WEB_SEARCH_CONFIG.read().unwrap();
    if let Some(ref cfg) = *config {
        return cfg.clone();
    }
    drop(config);
    let mut write = WEB_SEARCH_CONFIG.write().unwrap();
    if write.is_none() {
        *write = Some(WebSearchConfig::default());
    }
    write.clone().unwrap()
}

pub fn set_web_search_config(config: WebSearchConfig) {
    let mut write = WEB_SEARCH_CONFIG.write().unwrap();
    *write = Some(config);
}

// ============ Tool Registration ============

pub fn register_web_tools(
    registry: &mut super::registry::ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let (descriptor, executor) = web_search();
    registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);

    let (descriptor, executor) = web_fetch();
    registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);
}

// ============ web_search Tool ============

fn web_search() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let permissions = vec![ToolPermissionRequirement {
        permission_type: "network".to_string(),
        resource: "web_search".to_string(),
        description: "Perform web searches".to_string(),
        optional: None,
    }];

    let parameters = vec![
        string_param("query", "Search query string", true),
        string_enum_param("provider", "Search provider (brave, tavily, perplexity)", false, vec!["brave", "tavily", "perplexity"]),
        number_param("max_results", "Maximum number of results", false),
    ];

    let descriptor = ToolDescriptor {
        id: "web_search".to_string(),
        name: "Web Search".to_string(),
        description: "Perform web searches using configured provider".to_string(),
        category: ToolCategory::Core,
        parameters,
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities: base_readonly_capabilities(),
        permissions: Some(permissions),
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: false,
            requires_user_context: false,
            requires_workspace: false,
            requires_network_access: true,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("web", vec!["core", "web", "search"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("web".to_string()),
        handler_function: Some("web_search".to_string()),
    };

    let executor = Arc::new(WebSearchExecutor {});
    (descriptor, executor)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebSearchResult {
    pub provider: String,
    pub query: String,
    pub results: Vec<SearchResult>,
    pub total_results: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub title: String,
    pub url: String,
    pub snippet: String,
}

struct WebSearchExecutor;

#[async_trait::async_trait]
impl ToolExecutor for WebSearchExecutor {
    async fn execute(
        &self,
        params: serde_json::Value,
        _context: &ToolExecutionContext,
    ) -> Result<serde_json::Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let query = map
            .get("query")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();

        if query.is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Query is required".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        let provider = map
            .get("provider")
            .and_then(|v| v.as_str())
            .unwrap_or("brave")
            .to_string();

        let max_results = map
            .get("max_results")
            .and_then(|v| v.as_u64())
            .unwrap_or(10) as usize;

        let config = get_or_init_config();

        let provider_config: super::web::SearchProviderConfig = config
            .providers
            .get(&provider)
            .map(|c| super::web::SearchProviderConfig {
                provider_id: c.provider_id.clone(),
                api_key: c.api_key.clone(),
                api_url: c.api_url.clone(),
            })
            .unwrap_or_else(|| super::web::SearchProviderConfig {
                provider_id: provider.clone(),
                api_key: None,
                api_url: None,
            });

        let results = match provider.as_str() {
            "brave" => search_brave(&query, max_results, &provider_config).await,
            "tavily" => search_tavily(&query, max_results, &provider_config).await,
            "perplexity" => search_perplexity(&query, max_results, &provider_config).await,
            _ => Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: format!("Unknown search provider: {}", provider),
                details: None,
                recoverable: true,
                retryable: false,
            }),
        }?;

        let search_result = WebSearchResult {
            provider: provider.clone(),
            query,
            results: results.clone(),
            total_results: results.len(),
        };

        serde_json::to_value(search_result).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: e.to_string(),
            details: None,
            recoverable: false,
            retryable: false,
        })
    }
}

async fn search_brave(
    query: &str,
    _max_results: usize,
    _config: &SearchProviderConfig,
) -> Result<Vec<SearchResult>, ToolExecutionError> {
    Err(ToolExecutionError {
        code: ToolErrorCode::ExecutionError,
        message: "Brave Search API requires configuration. Please set API key.".to_string(),
        details: Some(serde_json::json!({
            "provider": "brave",
            "required_env": "BRAVE_API_KEY"
        })),
        recoverable: true,
        retryable: false,
    })
}

async fn search_tavily(
    query: &str,
    max_results: usize,
    config: &SearchProviderConfig,
) -> Result<Vec<SearchResult>, ToolExecutionError> {
    let api_key = config.api_key.as_ref()
        .ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: "Tavily API key not configured".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?;

    let request = HttpRequest {
        method: "POST".to_string(),
        url: "https://api.tavily.com/search".to_string(),
        headers: HashMap::from([
            ("Authorization".to_string(), format!("Bearer {}", api_key)),
            ("Content-Type".to_string(), "application/json".to_string()),
        ]),
        body: Some(serde_json::json!({
            "query": query,
            "max_results": max_results
        }).to_string()),
        timeout: Some(30000),
    };

    let response = crate::http::client::send_request(request)
        .await
        .map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: format!("Tavily search failed: {}", e),
            details: None,
            recoverable: true,
            retryable: true,
        })?;

    let body = response.body.ok_or_else(|| ToolExecutionError {
        code: ToolErrorCode::ExecutionError,
        message: "Empty response body from Tavily".to_string(),
        details: None,
        recoverable: false,
        retryable: false,
    })?;

    let response_json: serde_json::Value = serde_json::from_str(&body)
        .map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: format!("Failed to parse Tavily response: {}", e),
            details: None,
            recoverable: false,
            retryable: false,
        })?;

    let results = response_json
        .get("results")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .take(max_results)
                .filter_map(|item| {
                    Some(SearchResult {
                        title: item.get("title")?.as_str()?.to_string(),
                        url: item.get("url")?.as_str()?.to_string(),
                        snippet: item.get("content")?.as_str()?.to_string(),
                    })
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(results)
}

async fn search_perplexity(
    query: &str,
    max_results: usize,
    config: &SearchProviderConfig,
) -> Result<Vec<SearchResult>, ToolExecutionError> {
    let api_key = config.api_key.as_ref()
        .ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: "Perplexity API key not configured".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?;

    let request = HttpRequest {
        method: "POST".to_string(),
        url: "https://api.perplexity.ai/search".to_string(),
        headers: HashMap::from([
            ("Authorization".to_string(), format!("Bearer {}", api_key)),
            ("Content-Type".to_string(), "application/json".to_string()),
        ]),
        body: Some(serde_json::json!({
            "query": query,
            "max_results": max_results
        }).to_string()),
        timeout: Some(30000),
    };

    let response = crate::http::client::send_request(request)
        .await
        .map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: format!("Perplexity search failed: {}", e),
            details: None,
            recoverable: true,
            retryable: true,
        })?;

    let body = response.body.ok_or_else(|| ToolExecutionError {
        code: ToolErrorCode::ExecutionError,
        message: "Empty response body from Perplexity".to_string(),
        details: None,
        recoverable: false,
        retryable: false,
    })?;

    let response_json: serde_json::Value = serde_json::from_str(&body)
        .map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: format!("Failed to parse Perplexity response: {}", e),
            details: None,
            recoverable: false,
            retryable: false,
        })?;

    let results = response_json
        .get("results")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .take(max_results)
                .filter_map(|item| {
                    Some(SearchResult {
                        title: item.get("title")?.as_str()?.to_string(),
                        url: item.get("url")?.as_str()?.to_string(),
                        snippet: item.get("snippet")?.as_str()?.to_string(),
                    })
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(results)
}

// ============ web_fetch Tool ============

fn web_fetch() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let permissions = vec![ToolPermissionRequirement {
        permission_type: "network".to_string(),
        resource: "web_fetch".to_string(),
        description: "Fetch web page content".to_string(),
        optional: None,
    }];

    let parameters = vec![
        string_param("url", "URL to fetch", true),
        ToolParameter {
            name: "extract_rules".to_string(),
            param_type: super::descriptor::ToolParameterTypeSpec::Single(super::descriptor::ToolParameterType::Object),
            description: "Extraction rules for filtering content".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        number_param("timeout", "Timeout in milliseconds", false),
    ];

    let descriptor = ToolDescriptor {
        id: "web_fetch".to_string(),
        name: "Web Fetch".to_string(),
        description: "Fetch web page content".to_string(),
        category: ToolCategory::Core,
        parameters,
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities: base_writable_capabilities(),
        permissions: Some(permissions),
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: false,
            requires_user_context: false,
            requires_workspace: false,
            requires_network_access: true,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("web", vec!["core", "web", "fetch"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("web".to_string()),
        handler_function: Some("web_fetch".to_string()),
    };

    let executor = Arc::new(WebFetchExecutor {});
    (descriptor, executor)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebFetchResult {
    pub url: String,
    pub status: u16,
    pub content_type: String,
    pub content: String,
    pub title: Option<String>,
}

struct WebFetchExecutor;

#[async_trait::async_trait]
impl ToolExecutor for WebFetchExecutor {
    async fn execute(
        &self,
        params: serde_json::Value,
        _context: &ToolExecutionContext,
    ) -> Result<serde_json::Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let url = map
            .get("url")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();

        if url.is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "URL is required".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        if !url.starts_with("http://") && !url.starts_with("https://") {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "URL must start with http:// or https://".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        let timeout = map
            .get("timeout")
            .and_then(|v| v.as_u64())
            .unwrap_or(30000);

        let config = get_or_init_config();

        let domain = extract_domain(&url);
        let domain_allowed = config.allowed_domains.iter().any(|d| domain.ends_with(d));
        if !domain_allowed && !config.allowed_domains.is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::PermissionDenied,
                message: format!("Domain '{}' is not in the allowed list", domain),
                details: Some(serde_json::json!({
                    "domain": domain,
                    "allowed_domains": config.allowed_domains
                })),
                recoverable: false,
                retryable: false,
            });
        }

        let request = HttpRequest {
            method: "GET".to_string(),
            url: url.clone(),
            headers: HashMap::new(),
            body: None,
            timeout: Some(timeout),
        };

        let response = crate::http::client::send_request(request)
            .await
            .map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!("Failed to fetch URL: {}", e),
                details: None,
                recoverable: true,
                retryable: true,
            })?;

        let content_type = response
            .headers
            .get("content-type")
            .cloned()
            .unwrap_or_else(|| "text/plain".to_string());

        let body = response.body.unwrap_or_default();

        let result = WebFetchResult {
            url: url.clone(),
            status: response.status,
            content_type: content_type.clone(),
            content: body.clone(),
            title: extract_title_from_html(&body),
        };

        serde_json::to_value(result).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: e.to_string(),
            details: None,
            recoverable: false,
            retryable: false,
        })
    }
}

fn extract_domain(url: &str) -> String {
    url::Url::parse(url)
        .ok()
        .and_then(|u| u.host_str().map(|s| s.to_string()))
        .unwrap_or_else(|| url.to_string())
}

fn extract_title_from_html(html: &str) -> Option<String> {
    let start_tag = "<title";
    let end_tag = "</title>";

    let start_idx = html.to_lowercase().find(start_tag)?;
    let after_start = &html[start_idx..];
    let content_start = after_start.find('>')? + 1;
    let end_idx = after_start[content_start..].find(end_tag)?;

    Some(after_start[content_start..content_start + end_idx].trim().to_string())
}
