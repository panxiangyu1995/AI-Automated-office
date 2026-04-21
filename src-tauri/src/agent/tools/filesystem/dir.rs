//! Filesystem directory listing tool.

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::fs;

use serde_json::Value;

use crate::agent::tools::common::{base_metadata, base_readonly_capabilities, string_param, bool_param};
use crate::agent::tools::descriptor::{
    ToolCategory, ToolContextRequirements, ToolDescriptor, ToolExecutionMode,
    ToolPermissionRequirement,
};
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolErrorCode, ToolExecutor};
use crate::agent::tools::filesystem::FilesystemConfig;

pub fn create_dir_list_descriptor() -> ToolDescriptor {
    ToolDescriptor {
        id: "dir_list".to_string(),
        name: "Directory List".to_string(),
        description: "List contents of a directory".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("path", "Directory path to list", true),
            bool_param("recursive", "List recursively (default false)", false),
            bool_param("include_hidden", "Include hidden files/directories (default false)", false),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Sync,
        capabilities: base_readonly_capabilities(),
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "filesystem".to_string(),
            resource: "read".to_string(),
            description: "List directories in allowed paths".to_string(),
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
        metadata: base_metadata("filesystem", vec!["core", "directory", "list"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("filesystem".to_string()),
        handler_function: Some("dir_list".to_string()),
    }
}

#[derive(Default)]
pub struct DirListExecutor;

#[async_trait::async_trait]
impl ToolExecutor for DirListExecutor {
    async fn execute(&self, params: Value, _context: &ToolExecutionContext) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let path_str = map.get("path").and_then(|v| v.as_str()).ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ValidationError,
            message: "Missing required parameter: path".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?;

        let recursive = map.get("recursive").and_then(|v| v.as_bool()).unwrap_or(false);
        let include_hidden = map.get("include_hidden").and_then(|v| v.as_bool()).unwrap_or(false);

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

        if !path.exists() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::NotFound,
                message: format!("Directory not found: {}", path_str),
                details: None,
                recoverable: false,
                retryable: false,
            });
        }

        if !path.is_dir() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: format!("Path is not a directory: {}", path_str),
                details: None,
                recoverable: false,
                retryable: false,
            });
        }

        fn list_dir(dir: &Path, recursive: bool, include_hidden: bool, config: &FilesystemConfig) -> Result<Vec<serde_json::Value>, ToolExecutionError> {
            let mut entries = Vec::new();

            let read_dir = fs::read_dir(dir).map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!("Failed to read directory: {}", e),
                details: None,
                recoverable: false,
                retryable: false,
            })?;

            for entry_result in read_dir {
                let entry = entry_result.map_err(|e| ToolExecutionError {
                    code: ToolErrorCode::ExecutionError,
                    message: format!("Failed to read directory entry: {}", e),
                    details: None,
                    recoverable: false,
                    retryable: false,
                })?;

                let entry_path = entry.path();
                let file_name = entry.file_name();
                let file_name_str = file_name.to_string_lossy().to_string();

                if !include_hidden && file_name_str.starts_with('.') {
                    continue;
                }

                let metadata = entry.metadata().map_err(|e| ToolExecutionError {
                    code: ToolErrorCode::ExecutionError,
                    message: format!("Failed to read entry metadata: {}", e),
                    details: None,
                    recoverable: false,
                    retryable: false,
                })?;

                let entry_json = serde_json::json!({
                    "name": file_name_str,
                    "path": entry_path.to_string_lossy().to_string(),
                    "is_directory": metadata.is_dir(),
                    "is_file": metadata.is_file(),
                    "size": metadata.len(),
                    "modified": metadata.modified().ok().map(|t| {
                        t.duration_since(std::time::UNIX_EPOCH)
                            .map(|d| d.as_secs() as i64)
                            .unwrap_or(0)
                    }),
                });

                entries.push(entry_json);

                if recursive && entry_path.is_dir() && config.is_allowed(&entry_path) {
                    let sub_entries = list_dir(&entry_path, recursive, include_hidden, config)?;
                    entries.extend(sub_entries);
                }
            }

            Ok(entries)
        }

        let entries = list_dir(&path, recursive, include_hidden, &config)?;

        Ok(serde_json::json!({
            "path": path_str,
            "entries": entries,
            "count": entries.len(),
            "recursive": recursive
        }))
    }
}
