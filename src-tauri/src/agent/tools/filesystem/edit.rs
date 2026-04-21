//! Filesystem edit tool.

use std::path::PathBuf;
use std::sync::Arc;
use std::fs;
use std::io::{BufRead, BufReader, Write as IoWrite};

use serde_json::Value;

use crate::agent::tools::common::{base_metadata, base_writable_capabilities, string_param};
use crate::agent::tools::descriptor::{
    ToolCategory, ToolContextRequirements, ToolDescriptor, ToolExecutionMode,
    ToolPermissionRequirement,
};
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolErrorCode, ToolExecutor};

pub fn create_file_edit_descriptor() -> ToolDescriptor {
    ToolDescriptor {
        id: "file_edit".to_string(),
        name: "File Edit".to_string(),
        description: "Edit specific lines in a file".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("path", "File path to edit", true),
            string_param("start_line", "Start line number (1-based)", true),
            string_param("end_line", "End line number (1-based, inclusive)", true),
            string_param("new_content", "New content to replace the lines with", true),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Sync,
        capabilities: base_writable_capabilities(),
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "filesystem".to_string(),
            resource: "write".to_string(),
            description: "Edit files in allowed paths".to_string(),
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
        metadata: base_metadata("filesystem", vec!["core", "file", "edit"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("filesystem".to_string()),
        handler_function: Some("file_edit".to_string()),
    }
}

#[derive(Default)]
pub struct FileEditExecutor;

#[async_trait::async_trait]
impl ToolExecutor for FileEditExecutor {
    async fn execute(&self, params: Value, _context: &ToolExecutionContext) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let path_str = map.get("path").and_then(|v| v.as_str()).ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ValidationError,
            message: "Missing required parameter: path".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?;

        let start_line = map.get("start_line").and_then(|v| v.as_u64()).ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ValidationError,
            message: "Missing required parameter: start_line".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })? as usize;

        let end_line = map.get("end_line").and_then(|v| v.as_u64()).ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ValidationError,
            message: "Missing required parameter: end_line".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })? as usize;

        let new_content = map.get("new_content").and_then(|v| v.as_str()).ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ValidationError,
            message: "Missing required parameter: new_content".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?;

        if start_line == 0 {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "start_line must be 1 or greater".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        if end_line < start_line {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "end_line must be >= start_line".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

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

        let mut file = fs::File::open(&path).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: format!("Failed to open file: {}", e),
            details: None,
            recoverable: false,
            retryable: false,
        })?;

        let reader = BufReader::new(&mut file);
        let mut lines: Vec<String> = reader.lines().map(|l| l.map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: format!("Failed to read line: {}", e),
            details: None,
            recoverable: false,
            retryable: false,
        })).collect::<Result<Vec<_>, _>>()?;

        let start_idx = start_line - 1;
        let end_idx = end_line;

        if start_idx >= lines.len() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: format!("start_line {} exceeds file length {}", start_line, lines.len()),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        let removed_lines = lines[start_idx..end_idx.min(lines.len())].join("\n");
        lines.splice(start_idx..end_idx.min(lines.len()), vec![new_content.to_string()]);

        let new_content_str = lines.join("\n");
        fs::write(&path, new_content_str).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: format!("Failed to write file: {}", e),
            details: None,
            recoverable: false,
            retryable: false,
        })?;

        Ok(serde_json::json!({
            "path": path_str,
            "start_line": start_line,
            "end_line": end_line,
            "removed_content": removed_lines,
            "new_content": new_content,
            "lines_modified": end_line - start_line + 1
        }))
    }
}
