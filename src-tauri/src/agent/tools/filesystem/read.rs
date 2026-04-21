//! Filesystem read tool.

use std::path::PathBuf;
use std::sync::Arc;
use std::fs;
use std::io::{BufRead, BufReader};

use serde_json::Value;
use base64::{Engine as _, engine::general_purpose::STANDARD};

use crate::agent::tools::common::{
    base_metadata, base_readonly_capabilities, string_param, bool_param,
};
use crate::agent::tools::descriptor::{
    ToolCategory, ToolContextRequirements, ToolDescriptor, ToolExecutionMode,
    ToolPermissionRequirement,
};
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolErrorCode, ToolExecutor};

pub fn create_file_read_descriptor() -> ToolDescriptor {
    ToolDescriptor {
        id: "file_read".to_string(),
        name: "File Read".to_string(),
        description: "Read contents of a file".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("path", "File path to read", true),
            bool_param("as_text", "Read as text (default true)", false),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Sync,
        capabilities: base_readonly_capabilities(),
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "filesystem".to_string(),
            resource: "read".to_string(),
            description: "Read files in allowed paths".to_string(),
            optional: None,
        }]),
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: false,
            requires_user_context: false,
            requires_workspace: false,
            requires_network_access: false,
            requires_file_system_access: true,
            required_env_vars: None,
        }),
        metadata: base_metadata("filesystem", vec!["core", "file", "read"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("filesystem".to_string()),
        handler_function: Some("file_read".to_string()),
    }
}

#[derive(Default)]
pub struct FileReadExecutor;

#[async_trait::async_trait]
impl ToolExecutor for FileReadExecutor {
    async fn execute(&self, params: Value, _context: &ToolExecutionContext) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let path_str = map.get("path").and_then(|v| v.as_str()).ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ValidationError,
            message: "Missing required parameter: path".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?;

        let path = PathBuf::from(path_str);

        use crate::agent::tools::filesystem::get_config;
        let config = get_config();

        if !config.is_allowed(&path) {
            return Err(ToolExecutionError {
                code: ToolErrorCode::PermissionDenied,
                message: format!("Path is not in allowed directories: {}", path_str),
                details: Some(serde_json::json!({
                    "path": path_str,
                    "allowed_dirs": config.allowed_dirs.iter().map(|p| p.to_string_lossy().to_string()).collect::<Vec<_>>()
                })),
                recoverable: false,
                retryable: false,
            });
        }

        if !path.exists() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::NotFound,
                message: format!("File not found: {}", path_str),
                details: None,
                recoverable: false,
                retryable: false,
            });
        }

        if !path.is_file() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: format!("Path is not a file: {}", path_str),
                details: None,
                recoverable: false,
                retryable: false,
            });
        }

        let metadata = fs::metadata(&path).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: format!("Failed to read file metadata: {}", e),
            details: None,
            recoverable: false,
            retryable: false,
        })?;

        if metadata.len() > config.max_file_size() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: format!("File too large: {} bytes (max: {} bytes)", metadata.len(), config.max_file_size()),
                details: Some(serde_json::json!({
                    "file_size": metadata.len(),
                    "max_size": config.max_file_size()
                })),
                recoverable: false,
                retryable: false,
            });
        }

        let offset = map.get("offset").and_then(|v| v.as_u64()).unwrap_or(0);
        let limit = map.get("limit").and_then(|v| v.as_u64());
        let as_text = map.get("as_text").and_then(|v| v.as_bool()).unwrap_or(true);

        if as_text {
            let content = if offset > 0 || limit.is_some() {
                let file = fs::File::open(&path).map_err(|e| ToolExecutionError {
                    code: ToolErrorCode::ExecutionError,
                    message: format!("Failed to open file: {}", e),
                    details: None,
                    recoverable: false,
                    retryable: false,
                })?;

                let file_size = metadata.len();
                let start = offset as usize;
                let end = limit.map(|l| (start + l as usize).min(file_size as usize)).unwrap_or(file_size as usize);

                if start >= file_size as usize {
                    String::new()
                } else {
                    let reader = BufReader::new(file);
                    let mut lines = Vec::new();
                    let mut current_line = 0usize;

                    for line in reader.lines() {
                        if current_line >= end { break; }
                        if current_line >= start {
                            lines.push(line.map_err(|e| ToolExecutionError {
                                code: ToolErrorCode::ExecutionError,
                                message: format!("Failed to read line: {}", e),
                                details: None,
                                recoverable: false,
                                retryable: false,
                            })?);
                        }
                        current_line += 1;
                    }

                    lines.join("\n")
                }
            } else {
                fs::read_to_string(&path).map_err(|e| ToolExecutionError {
                    code: ToolErrorCode::ExecutionError,
                    message: format!("Failed to read file: {}", e),
                    details: None,
                    recoverable: false,
                    retryable: false,
                })?
            };

            Ok(serde_json::json!({
                "path": path_str,
                "content": content,
                "size": content.len(),
                "encoding": "utf-8"
            }))
        } else {
            let bytes = fs::read(&path).map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!("Failed to read file: {}", e),
                details: None,
                recoverable: false,
                retryable: false,
            })?;

            let encoded = STANDARD.encode(&bytes);

            Ok(serde_json::json!({
                "path": path_str,
                "content": encoded,
                "size": bytes.len(),
                "encoding": "base64"
            }))
        }
    }
}
