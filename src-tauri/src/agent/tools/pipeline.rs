use std::collections::HashMap;
use std::sync::Arc;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::time::{timeout, Duration};

use super::browser;
use super::core::register_core_tools;
use super::document;
use super::enterprise;
use super::filesystem;
use super::shell;
use super::web;
use super::descriptor::ToolDescriptor;
use super::permission::{check_permissions, PermissionCheckResult};
use super::registry::ToolRegistry;
use super::sensitivity::{assess_sensitivity, SensitiveActionAssessment};
use crate::agent::events::RuntimeEventEmitter;
use crate::agent::llm_provider::config::AgentMode;
use crate::agent::routing::{RoutingMode, YoloTtl};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolExecutionContext {
    pub session_id: String,
    pub user_id: String,
    pub tenant_id: String,
    pub department_id: Option<String>,
    pub page_id: Option<String>,
    pub resource_id: Option<String>,
    pub permissions: Vec<String>,
    pub metadata: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolExecutionRequest {
    pub tool_id: String,
    pub parameters: Value,
    pub context: ToolExecutionContext,
    pub execution_id: Option<String>,
    pub parent_execution_id: Option<String>,
    pub timeout_ms: Option<u64>,
    pub metadata: Option<Value>,
    pub message_id: Option<String>,
    /// Agent execution mode for Plan mode tool filtering
    #[serde(default)]
    pub agent_mode: Option<AgentMode>,
    /// Routing mode for confirmation handling
    #[serde(default)]
    pub routing_mode: Option<RoutingMode>,
    /// YOLO mode TTL for auto-expiration
    #[serde(default)]
    pub yolo_ttl: Option<YoloTtl>,
    /// YOLO mode activation timestamp (for TTL tracking)
    #[serde(default)]
    pub yolo_activated_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ToolExecutionStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
    Timeout,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ToolErrorCode {
    ValidationError,
    PermissionDenied,
    NotFound,
    Timeout,
    ExecutionError,
    ContextError,
    Cancelled,
    InternalError,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolExecutionError {
    pub code: ToolErrorCode,
    pub message: String,
    pub details: Option<Value>,
    pub recoverable: bool,
    pub retryable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolExecutionResult {
    pub execution_id: String,
    pub tool_id: String,
    pub status: ToolExecutionStatus,
    pub output: Option<Value>,
    pub error: Option<ToolExecutionError>,
    pub duration: u64,
    pub started_at: i64,
    pub completed_at: i64,
    pub metadata: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolConfirmationRequest {
    pub message: String,
    pub options: Vec<String>,
    pub risk_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolExecutionResponse {
    pub result: ToolExecutionResult,
    pub confirmation: Option<ToolConfirmationRequest>,
    pub permission: Option<PermissionCheckResult>,
    pub sensitivity: Option<SensitiveActionAssessment>,
}

#[async_trait]
pub trait ToolExecutor: Send + Sync {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError>;
}

#[derive(Clone)]
pub struct ToolExecutionPipeline {
    registry: Arc<ToolRegistry>,
    executors: Arc<HashMap<String, Arc<dyn ToolExecutor>>>,
    default_timeout_ms: u64,
    max_timeout_ms: u64,
}

impl ToolExecutionPipeline {
    pub fn new() -> Self {
        let mut registry = ToolRegistry::new();
        let mut executors: HashMap<String, Arc<dyn ToolExecutor>> = HashMap::new();
        register_core_tools(&mut registry, &mut executors);
        filesystem::register_filesystem_tools(&mut registry, &mut executors);
        shell::register_shell_tools(&mut registry, &mut executors);
        web::register_web_tools(&mut registry, &mut executors);
        browser::register_browser_tools(&mut registry, &mut executors);
        document::register_document_tools(&mut registry, &mut executors);
        enterprise::register_enterprise_tools(&mut registry, &mut executors);

        Self {
            registry: Arc::new(registry),
            executors: Arc::new(executors),
            default_timeout_ms: 30000,
            max_timeout_ms: 300000,
        }
    }

    pub fn list_tools(&self) -> Vec<ToolDescriptor> {
        self.registry.list()
    }

    pub async fn execute(
        &self,
        request: ToolExecutionRequest,
        mut emitter: Option<&mut RuntimeEventEmitter>,
    ) -> Result<ToolExecutionResponse, String> {
        let started_at = chrono::Utc::now().timestamp_millis();
        let execution_id = request
            .execution_id
            .clone()
            .unwrap_or_else(|| format!("exec_{}", uuid::Uuid::new_v4()));

        let params = request
            .parameters
            .as_object()
            .cloned()
            .unwrap_or_default();

        let descriptor = match self.registry.get(&request.tool_id) {
            Some(desc) => desc.clone(),
            None => {
                return Ok(ToolExecutionResponse {
                    result: self.error_result(
                        &execution_id,
                        &request.tool_id,
                        started_at,
                        ToolExecutionError {
                            code: ToolErrorCode::NotFound,
                            message: format!("Tool not found: {}", request.tool_id),
                            details: None,
                            recoverable: false,
                            retryable: false,
                        },
                    ),
                    confirmation: None,
                    permission: None,
                    sensitivity: None,
                });
            }
        };

        if let Err(errors) = self.registry.validate(&request.tool_id, &params) {
            return Ok(ToolExecutionResponse {
                result: self.error_result(
                    &execution_id,
                    &request.tool_id,
                    started_at,
                    ToolExecutionError {
                        code: ToolErrorCode::ValidationError,
                        message: errors.join(", "),
                        details: None,
                        recoverable: true,
                        retryable: false,
                    },
                ),
                confirmation: None,
                permission: None,
                sensitivity: None,
            });
        }

        let permission = check_permissions(&descriptor, &request.context.permissions);
        if !permission.allowed {
            return Ok(ToolExecutionResponse {
                result: self.error_result(
                    &execution_id,
                    &request.tool_id,
                    started_at,
                    ToolExecutionError {
                        code: ToolErrorCode::PermissionDenied,
                        message: permission
                            .reason
                            .clone()
                            .unwrap_or_else(|| "Permission denied".to_string()),
                        details: Some(serde_json::json!({
                            "missing": permission.missing,
                            "required": permission.required,
                        })),
                        recoverable: false,
                        retryable: false,
                    },
                ),
                confirmation: None,
                permission: Some(permission),
                sensitivity: None,
            });
        }

        // Plan mode: only allow read-only tools
        if let Some(agent_mode) = &request.agent_mode {
            if *agent_mode == AgentMode::Plan && !descriptor.capabilities.is_read_only {
                return Ok(ToolExecutionResponse {
                    result: self.error_result(
                        &execution_id,
                        &request.tool_id,
                        started_at,
                        ToolExecutionError {
                            code: ToolErrorCode::PermissionDenied,
                            message: "Tool not allowed in Plan mode: not read-only".to_string(),
                            details: Some(serde_json::json!({
                                "tool_id": request.tool_id,
                                "is_read_only": descriptor.capabilities.is_read_only,
                            })),
                            recoverable: false,
                            retryable: false,
                        },
                    ),
                    confirmation: None,
                    permission: Some(permission),
                    sensitivity: None,
                });
            }
        }

        let sensitivity = assess_sensitivity(&descriptor, &params);
        if sensitivity.blocked {
            return Ok(ToolExecutionResponse {
                result: self.error_result(
                    &execution_id,
                    &request.tool_id,
                    started_at,
                    ToolExecutionError {
                        code: ToolErrorCode::ExecutionError,
                        message: sensitivity
                            .reason
                            .clone()
                            .unwrap_or_else(|| "Sensitive action blocked".to_string()),
                        details: None,
                        recoverable: false,
                        retryable: false,
                    },
                ),
                confirmation: None,
                permission: Some(permission),
                sensitivity: Some(sensitivity),
            });
        }

        if sensitivity.requires_confirmation {
            let confirmation = ToolConfirmationRequest {
                message: "Confirmation required before executing tool".to_string(),
                options: vec!["approve".to_string(), "reject".to_string()],
                risk_level: format!("{:?}", sensitivity.risk_level).to_lowercase(),
            };

            return Ok(ToolExecutionResponse {
                result: ToolExecutionResult {
                    execution_id,
                    tool_id: request.tool_id,
                    status: ToolExecutionStatus::Pending,
                    output: None,
                    error: None,
                    duration: 0,
                    started_at,
                    completed_at: chrono::Utc::now().timestamp_millis(),
                    metadata: serde_json::json!({
                        "requiresConfirmation": true,
                    }),
                },
                confirmation: Some(confirmation),
                permission: Some(permission),
                sensitivity: Some(sensitivity),
            });
        }

        if let Some(event_emitter) = emitter.as_deref_mut() {
            event_emitter.tool_call(request.message_id.clone(), serde_json::json!({
                "toolId": request.tool_id,
                "toolName": descriptor.name,
                "parameters": params,
            }));
        }

        let executor = match self.executors.get(&request.tool_id) {
            Some(executor) => executor,
            None => {
                return Ok(ToolExecutionResponse {
                    result: self.error_result(
                        &execution_id,
                        &request.tool_id,
                        started_at,
                        ToolExecutionError {
                            code: ToolErrorCode::NotFound,
                            message: format!("No executor registered for tool: {}", request.tool_id),
                            details: None,
                            recoverable: false,
                            retryable: false,
                        },
                    ),
                    confirmation: None,
                    permission: Some(permission),
                    sensitivity: Some(sensitivity),
                });
            }
        };

        let timeout_ms = request
            .timeout_ms
            .unwrap_or(self.default_timeout_ms)
            .min(self.max_timeout_ms);

        let execution = timeout(Duration::from_millis(timeout_ms), executor.execute(request.parameters.clone(), &request.context)).await;

        let completed_at = chrono::Utc::now().timestamp_millis();
        let duration = (completed_at - started_at).max(0) as u64;

        let result = match execution {
            Ok(Ok(output)) => ToolExecutionResult {
                execution_id: execution_id.clone(),
                tool_id: request.tool_id.clone(),
                status: ToolExecutionStatus::Completed,
                output: Some(output),
                error: None,
                duration,
                started_at,
                completed_at,
                metadata: request.metadata.unwrap_or_else(|| serde_json::json!({})),
            },
            Ok(Err(error)) => self.error_result(&execution_id, &request.tool_id, started_at, error),
            Err(_) => self.error_result(
                &execution_id,
                &request.tool_id,
                started_at,
                ToolExecutionError {
                    code: ToolErrorCode::Timeout,
                    message: "Tool execution timeout".to_string(),
                    details: None,
                    recoverable: true,
                    retryable: true,
                },
            ),
        };

        if let Some(event_emitter) = emitter.as_deref_mut() {
            event_emitter.tool_result(request.message_id.clone(), serde_json::json!({
                "toolId": request.tool_id,
                "result": result.output,
                "success": matches!(result.status, ToolExecutionStatus::Completed),
                "duration": result.duration,
            }));
        }

        Ok(ToolExecutionResponse {
            result,
            confirmation: None,
            permission: Some(permission),
            sensitivity: Some(sensitivity),
        })
    }

    fn error_result(
        &self,
        execution_id: &str,
        tool_id: &str,
        started_at: i64,
        error: ToolExecutionError,
    ) -> ToolExecutionResult {
        let completed_at = chrono::Utc::now().timestamp_millis();
        ToolExecutionResult {
            execution_id: execution_id.to_string(),
            tool_id: tool_id.to_string(),
            status: ToolExecutionStatus::Failed,
            output: None,
            error: Some(error),
            duration: (completed_at - started_at).max(0) as u64,
            started_at,
            completed_at,
            metadata: serde_json::json!({}),
        }
    }

    /// Determine if confirmation should be requested based on routing mode
    /// - Manual: Always request confirmation
    /// - Hybrid: Request for sensitive tools
    /// - Auto: Skip confirmation for non-sensitive tools
    /// - Yolo: Never request confirmation (auto-approve all)
    pub fn should_request_confirmation(
        &self,
        routing_mode: Option<RoutingMode>,
        sensitivity: &SensitiveActionAssessment,
    ) -> bool {
        use crate::agent::tools::sensitivity::RiskLevel;

        match routing_mode {
            Some(RoutingMode::Manual) => true,
            Some(RoutingMode::Hybrid) => {
                sensitivity.requires_confirmation || matches!(sensitivity.risk_level, RiskLevel::High | RiskLevel::Critical)
            }
            Some(RoutingMode::Auto) => sensitivity.requires_confirmation,
            Some(RoutingMode::Yolo) => false, // YOLO mode never requests confirmation
            None => sensitivity.requires_confirmation, // Default behavior
        }
    }

    /// Check if YOLO mode TTL has expired
    pub fn check_yolo_ttl_expired(
        &self,
        yolo_ttl: Option<YoloTtl>,
        yolo_activated_at: Option<i64>,
    ) -> bool {
        match (yolo_ttl, yolo_activated_at) {
            (Some(YoloTtl::Once), _) => false, // Once TTL means single task, not time-based
            (Some(ttl), Some(activated_at)) => {
                if let Some(ttl_seconds) = ttl.to_seconds() {
                    let now = chrono::Utc::now().timestamp();
                    let elapsed = now - activated_at;
                    elapsed >= ttl_seconds as i64
                } else {
                    false // Once doesn't expire based on time
                }
            }
            _ => false, // No TTL set or not activated
        }
    }

    /// Check if YOLO mode is currently active (not expired)
    pub fn is_yolo_active(
        &self,
        routing_mode: Option<RoutingMode>,
        yolo_ttl: Option<YoloTtl>,
        yolo_activated_at: Option<i64>,
    ) -> bool {
        routing_mode == Some(RoutingMode::Yolo) && !self.check_yolo_ttl_expired(yolo_ttl, yolo_activated_at)
    }
}
