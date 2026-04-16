use std::collections::HashMap;
use std::sync::Arc;

use serde_json::Value;

use crate::agent::tools::common::{
    base_metadata, base_readonly_capabilities, base_writable_capabilities,
    string_param, ToolDescriptorBuilder,
};
use super::descriptor::{
    ToolCategory, ToolContextRequirements, ToolDescriptor, ToolExecutionMode,
    ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolPermissionRequirement,
};
use super::pipeline::{ToolExecutionContext, ToolExecutionError, ToolErrorCode, ToolExecutor};

pub fn register_core_tools(
    registry: &mut super::registry::ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let (descriptor, executor) = system_get_app_version();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);

    let (descriptor, executor) = system_get_platform();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);

    let (descriptor, executor) = network_check_status();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);

    let (descriptor, executor) = network_get_status();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);

    let (descriptor, executor) = http_request();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);
}

// Tool definitions using Builder pattern

fn system_get_app_version() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let descriptor = ToolDescriptorBuilder::new(
        "system_get_app_version",
        "Get App Version",
        "Return the application version",
    )
    .category(ToolCategory::Core)
    .parameters(vec![])
    .execution_mode(ToolExecutionMode::Sync)
    .capabilities(base_readonly_capabilities())
    .context_requirements(ToolContextRequirements {
        requires_session: false,
        requires_user_context: false,
        requires_workspace: false,
        requires_network_access: false,
        requires_file_system_access: false,
        required_env_vars: None,
    })
    .metadata(base_metadata("system", vec!["core", "system"]))
    .handler("core", "system_get_app_version")
    .build();

    let executor = Arc::new(SystemGetAppVersionExecutor {});
    (descriptor, executor)
}

fn system_get_platform() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let descriptor = ToolDescriptorBuilder::new(
        "system_get_platform",
        "Get Platform",
        "Return the runtime platform identifier",
    )
    .category(ToolCategory::Core)
    .parameters(vec![])
    .execution_mode(ToolExecutionMode::Sync)
    .capabilities(base_readonly_capabilities())
    .context_requirements(ToolContextRequirements {
        requires_session: false,
        requires_user_context: false,
        requires_workspace: false,
        requires_network_access: false,
        requires_file_system_access: false,
        required_env_vars: None,
    })
    .metadata(base_metadata("system", vec!["core", "system"]))
    .handler("core", "system_get_platform")
    .build();

    let executor = Arc::new(SystemGetPlatformExecutor {});
    (descriptor, executor)
}

fn network_check_status() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let descriptor = ToolDescriptorBuilder::new(
        "network_check_status",
        "Check Network Status",
        "Check whether the network is reachable",
    )
    .category(ToolCategory::Core)
    .parameters(vec![])
    .execution_mode(ToolExecutionMode::Async)
    .capabilities(base_readonly_capabilities())
    .context_requirements(ToolContextRequirements {
        requires_session: false,
        requires_user_context: false,
        requires_workspace: false,
        requires_network_access: true,
        requires_file_system_access: false,
        required_env_vars: None,
    })
    .metadata(base_metadata("network", vec!["core", "network"]))
    .handler("core", "network_check_status")
    .build();

    let executor = Arc::new(NetworkCheckStatusExecutor {});
    (descriptor, executor)
}

fn network_get_status() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let descriptor = ToolDescriptorBuilder::new(
        "network_get_status",
        "Get Network Status",
        "Fetch current network status details",
    )
    .category(ToolCategory::Core)
    .parameters(vec![])
    .execution_mode(ToolExecutionMode::Async)
    .capabilities(base_readonly_capabilities())
    .context_requirements(ToolContextRequirements {
        requires_session: false,
        requires_user_context: false,
        requires_workspace: false,
        requires_network_access: true,
        requires_file_system_access: false,
        required_env_vars: None,
    })
    .metadata(base_metadata("network", vec!["core", "network"]))
    .handler("core", "network_get_status")
    .build();

    let executor = Arc::new(NetworkGetStatusExecutor {});
    (descriptor, executor)
}

fn http_request() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let permissions = vec![ToolPermissionRequirement {
        permission_type: "network".to_string(),
        resource: "external".to_string(),
        description: "Access external network requests".to_string(),
        optional: None,
    }];

    let parameters = vec![
        string_param("method", "HTTP method (GET, POST, PUT, DELETE)", true),
        string_param("url", "Request URL", true),
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
        string_param("body", "Request body", false),
        crate::agent::tools::common::number_param("timeout", "Timeout in milliseconds", false),
    ];

    let descriptor = ToolDescriptorBuilder::new(
        "http_request",
        "HTTP Request",
        "Send an HTTP request",
    )
    .category(ToolCategory::Core)
    .parameters(parameters)
    .execution_mode(ToolExecutionMode::Async)
    .capabilities(base_writable_capabilities())
    .permissions(permissions)
    .context_requirements(ToolContextRequirements {
        requires_session: false,
        requires_user_context: false,
        requires_workspace: false,
        requires_network_access: true,
        requires_file_system_access: false,
        required_env_vars: None,
    })
    .metadata(base_metadata("network", vec!["core", "http"]))
    .handler("core", "http_request")
    .build();

    let executor = Arc::new(HttpRequestExecutor {});
    (descriptor, executor)
}

// Executor implementations

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
