use std::collections::HashMap;
use std::sync::Arc;

use serde_json::Value;

use super::descriptor::{
    ToolCapabilities, ToolCategory, ToolContextRequirements, ToolDescriptor, ToolExecutionMode,
    ToolMetadata, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolPermissionRequirement,
};
use super::pipeline::{ToolExecutionContext, ToolExecutionError, ToolErrorCode, ToolExecutor};

pub fn register_core_tools(
    registry: &mut super::registry::ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let (descriptor, executor) = system_get_app_version();
    registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);

    let (descriptor, executor) = system_get_platform();
    registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);

    let (descriptor, executor) = network_check_status();
    registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);

    let (descriptor, executor) = network_get_status();
    registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);

    let (descriptor, executor) = http_request();
    registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);
}

fn base_metadata(category: &str, tags: Vec<&str>) -> ToolMetadata {
    ToolMetadata {
        author: Some("core".to_string()),
        version: "1.0.0".to_string(),
        license: None,
        homepage: None,
        repository: None,
        tags: tags.into_iter().map(|tag| tag.to_string()).collect(),
        category: category.to_string(),
        subcategory: None,
    }
}

fn base_capabilities() -> ToolCapabilities {
    ToolCapabilities {
        supports_streaming: false,
        supports_cancellation: true,
        requires_permission: false,
        requires_confirmation: false,
        is_read_only: true,
        has_side_effects: false,
        supports_retry: true,
        estimated_duration: None,
    }
}

fn system_get_app_version() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let descriptor = ToolDescriptor {
        id: "system_get_app_version".to_string(),
        name: "Get App Version".to_string(),
        description: "Return the application version".to_string(),
        category: ToolCategory::Core,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Sync,
        capabilities: base_capabilities(),
        permissions: None,
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: false,
            requires_user_context: false,
            requires_workspace: false,
            requires_network_access: false,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("system", vec!["core", "system"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("core".to_string()),
        handler_function: Some("system_get_app_version".to_string()),
    };

    let executor = Arc::new(SystemGetAppVersionExecutor {});
    (descriptor, executor)
}

fn system_get_platform() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let descriptor = ToolDescriptor {
        id: "system_get_platform".to_string(),
        name: "Get Platform".to_string(),
        description: "Return the runtime platform identifier".to_string(),
        category: ToolCategory::Core,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Sync,
        capabilities: base_capabilities(),
        permissions: None,
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: false,
            requires_user_context: false,
            requires_workspace: false,
            requires_network_access: false,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("system", vec!["core", "system"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("core".to_string()),
        handler_function: Some("system_get_platform".to_string()),
    };

    let executor = Arc::new(SystemGetPlatformExecutor {});
    (descriptor, executor)
}

fn network_check_status() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let descriptor = ToolDescriptor {
        id: "network_check_status".to_string(),
        name: "Check Network Status".to_string(),
        description: "Check whether the network is reachable".to_string(),
        category: ToolCategory::Core,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities: base_capabilities(),
        permissions: None,
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: false,
            requires_user_context: false,
            requires_workspace: false,
            requires_network_access: true,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("network", vec!["core", "network"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("core".to_string()),
        handler_function: Some("network_check_status".to_string()),
    };

    let executor = Arc::new(NetworkCheckStatusExecutor {});
    (descriptor, executor)
}

fn network_get_status() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let descriptor = ToolDescriptor {
        id: "network_get_status".to_string(),
        name: "Get Network Status".to_string(),
        description: "Fetch current network status details".to_string(),
        category: ToolCategory::Core,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities: base_capabilities(),
        permissions: None,
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: false,
            requires_user_context: false,
            requires_workspace: false,
            requires_network_access: true,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("network", vec!["core", "network"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("core".to_string()),
        handler_function: Some("network_get_status".to_string()),
    };

    let executor = Arc::new(NetworkGetStatusExecutor {});
    (descriptor, executor)
}

fn http_request() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let mut capabilities = base_capabilities();
    capabilities.requires_permission = true;
    capabilities.has_side_effects = true;

    let permissions = vec![ToolPermissionRequirement {
        permission_type: "network".to_string(),
        resource: "external".to_string(),
        description: "Access external network requests".to_string(),
        optional: None,
    }];

    let parameters = vec![
        ToolParameter {
            name: "method".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "HTTP method (GET, POST, PUT, DELETE)".to_string(),
            required: true,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "url".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Request URL".to_string(),
            required: true,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "headers".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::Object),
            description: "HTTP headers".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "body".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Request body".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "timeout".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::Number),
            description: "Timeout in milliseconds".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
    ];

    let descriptor = ToolDescriptor {
        id: "http_request".to_string(),
        name: "HTTP Request".to_string(),
        description: "Send an HTTP request".to_string(),
        category: ToolCategory::Core,
        parameters,
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities,
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
        metadata: base_metadata("network", vec!["core", "http"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("core".to_string()),
        handler_function: Some("http_request".to_string()),
    };

    let executor = Arc::new(HttpRequestExecutor {});
    (descriptor, executor)
}

struct SystemGetAppVersionExecutor;

#[async_trait::async_trait]
impl ToolExecutor for SystemGetAppVersionExecutor {
    async fn execute(
        &self,
        _params: Value,
        _context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        Ok(Value::String(crate::commands::system::get_app_version()))
    }
}

struct SystemGetPlatformExecutor;

#[async_trait::async_trait]
impl ToolExecutor for SystemGetPlatformExecutor {
    async fn execute(
        &self,
        _params: Value,
        _context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        Ok(Value::String(crate::commands::system::get_platform()))
    }
}

struct NetworkCheckStatusExecutor;

#[async_trait::async_trait]
impl ToolExecutor for NetworkCheckStatusExecutor {
    async fn execute(
        &self,
        _params: Value,
        _context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let status = crate::network::status::check_network_status().await;
        Ok(Value::Bool(status))
    }
}

struct NetworkGetStatusExecutor;

#[async_trait::async_trait]
impl ToolExecutor for NetworkGetStatusExecutor {
    async fn execute(
        &self,
        _params: Value,
        _context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let status = crate::network::status::get_network_status().await;
        serde_json::to_value(status).map_err(|err| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: err.to_string(),
            details: None,
            recoverable: false,
            retryable: false,
        })
    }
}

struct HttpRequestExecutor;

#[async_trait::async_trait]
impl ToolExecutor for HttpRequestExecutor {
    async fn execute(
        &self,
        params: Value,
        _context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();
        let method = map
            .get("method")
            .and_then(|value| value.as_str())
            .unwrap_or("GET")
            .to_string();
        let url = map
            .get("url")
            .and_then(|value| value.as_str())
            .unwrap_or_default()
            .to_string();
        if url.is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Missing url".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        let headers = map
            .get("headers")
            .and_then(|value| value.as_object())
            .map(|value| {
                value
                    .iter()
                    .filter_map(|(key, val)| val.as_str().map(|s| (key.clone(), s.to_string())))
                    .collect::<HashMap<String, String>>()
            })
            .unwrap_or_default();

        let body = map
            .get("body")
            .and_then(|value| value.as_str())
            .map(|s| s.to_string());

        let timeout = map
            .get("timeout")
            .and_then(|value| value.as_u64());

        let request = crate::http::client::HttpRequest {
            method,
            url,
            headers,
            body,
            timeout,
        };

        let response = crate::http::client::send_request(request)
            .await
            .map_err(|err| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: err,
                details: None,
                recoverable: true,
                retryable: true,
            })?;

        serde_json::to_value(response).map_err(|err| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: err.to_string(),
            details: None,
            recoverable: false,
            retryable: false,
        })
    }
}
