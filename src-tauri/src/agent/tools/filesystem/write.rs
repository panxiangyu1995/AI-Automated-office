//! Filesystem write tool.

use std::path::PathBuf;
use std::sync::Arc;
use std::fs;

use serde_json::Value;

use crate::agent::tools::common::{base_metadata, base_writable_capabilities, string_param};
use crate::agent::tools::descriptor::{
    ToolCategory, ToolContextRequirements, ToolDescriptor, ToolExecutionMode,
    ToolPermissionRequirement,
};
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolErrorCode, ToolExecutor};
use std::io::Write;

pub fn create_file_write_descriptor() -> ToolDescriptor {
    ToolDescriptor {
        id: "file_write".to_string(),
        name: "File Write".to_string(),
        description: "Write content to a file".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("path", "File path to write", true),
            string_param("content", "Content to write", true),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Sync,
        capabilities: base_writable_capabilities(),
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "filesystem".to_string(),
            resource: "write".to_string(),
            description: "Write files in allowed paths".to_string(),
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
        metadata: base_metadata("filesystem", vec!["core", "file", "write"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("filesystem".to_string()),
        handler_function: Some("file_write".to_string()),
    }
}

#[derive(Default)]
pub struct FileWriteExecutor;

#[async_trait::async_trait]
impl ToolExecutor for FileWriteExecutor {
    async fn execute(&self, params: Value, _context: &ToolExecutionContext) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let path_str = map.get("path").and_then(|v| v.as_str()).ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ValidationError,
            message: "Missing required parameter: path".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?;

        let content = map.get("content").and_then(|v| v.as_str()).ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ValidationError,
            message: "Missing required parameter: content".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?;

        let append = map.get("append").and_then(|v| v.as_bool()).unwrap_or(false);

        let path = PathBuf::from(path_str);

        use crate::agent::tools::filesystem::get_config;
        let config = get_config();

        if !config.is_allowed(&path) {
            return Err(ToolExecutionError {
                code: ToolErrorCode::PermissionDenied,
                message: format!("Path is not in allowed directories: {}", path_str),
                details: None,
                recoverable: false,
                retryable: false,
            });
        }

        if let Some(parent) = path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent).map_err(|e| ToolExecutionError {
                    code: ToolErrorCode::ExecutionError,
                    message: format!("Failed to create directory: {}", e),
                    details: None,
                    recoverable: false,
                    retryable: false,
                })?;
            }
        }

        let result = if append {
            let mut file = fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(&path)
                .map_err(|e| ToolExecutionError {
                    code: ToolErrorCode::ExecutionError,
                    message: format!("Failed to open file: {}", e),
                    details: None,
                    recoverable: false,
                    retryable: false,
                })?;

            file.write_all(content.as_bytes()).map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!("Failed to write to file: {}", e),
                details: None,
                recoverable: false,
                retryable: false,
            })?;

            "appended"
        } else {
            fs::write(&path, content).map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!("Failed to write file: {}", e),
                details: None,
                recoverable: false,
                retryable: false,
            })?;

            "written"
        };

        let metadata = fs::metadata(&path).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: format!("Failed to read metadata: {}", e),
            details: None,
            recoverable: false,
            retryable: false,
        })?;

        Ok(serde_json::json!({
            "path": path_str,
            "result": result,
            "bytes_written": content.len(),
            "total_size": metadata.len()
        }))
    }
}
