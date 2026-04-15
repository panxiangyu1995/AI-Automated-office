//! Filesystem Tools Module
//!
//! Provides file system operations with security controls:
//! - allowed_dirs whitelist restricts accessible directories
//! - file size limits prevent reading/writing large files
//!
//! Tools:
//! - file_read: Read file contents
//! - file_write: Write content to file
//! - file_edit: Edit specific lines in file
//! - dir_list: List directory contents

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::fs;
use std::io::{BufRead, BufReader, Write as IoWrite};
use std::sync::RwLock;

use serde_json::Value;
use async_trait::async_trait;

use crate::agent::tools::common::{
    base_metadata, base_readonly_capabilities, base_writable_capabilities,
    bool_param, number_param, string_param,
};
use crate::agent::tools::descriptor::{
    ToolCategory, ToolContextRequirements, ToolDescriptor, ToolExecutionMode,
    ToolPermissionRequirement,
};
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolErrorCode, ToolExecutor};
use crate::agent::tools::registry::ToolRegistry;

/// Configuration for filesystem tools
#[derive(Clone)]
pub struct FilesystemConfig {
    allowed_dirs: Vec<PathBuf>,
    max_file_size: u64,
    read_only_by_default: bool,
}

impl Default for FilesystemConfig {
    fn default() -> Self {
        Self {
            allowed_dirs: vec![
                dirs::home_dir().unwrap_or_else(|| PathBuf::from(".")),
                std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
            ],
            max_file_size: 10 * 1024 * 1024,
            read_only_by_default: false,
        }
    }
}

impl FilesystemConfig {
    pub fn new(allowed_dirs: Vec<PathBuf>) -> Self {
        Self {
            allowed_dirs,
            ..Default::default()
        }
    }

    pub fn is_allowed(&self, path: &Path) -> bool {
        let canonical_path = match path.canonicalize() {
            Ok(p) => p,
            Err(_) => {
                if let Some(parent) = path.parent() {
                    return self.is_allowed(parent);
                }
                return false;
            }
        };
        self.allowed_dirs.iter().any(|allowed| canonical_path.starts_with(allowed))
    }

    pub fn max_file_size(&self) -> u64 {
        self.max_file_size
    }
}

static FS_CONFIG: RwLock<Option<FilesystemConfig>> = RwLock::new(None);

fn get_or_init_config() -> FilesystemConfig {
    let config = FS_CONFIG.read().unwrap();
    if let Some(ref cfg) = *config {
        return cfg.clone();
    }
    drop(config);
    let mut write = FS_CONFIG.write().unwrap();
    if write.is_none() {
        *write = Some(FilesystemConfig::default());
    }
    write.clone().unwrap()
}

pub fn set_config(config: FilesystemConfig) {
    let mut cfg = FS_CONFIG.write().unwrap();
    *cfg = Some(config);
}

pub fn get_config() -> FilesystemConfig {
    get_or_init_config()
}

/// Register all filesystem tools
pub fn register_filesystem_tools(
    registry: &mut ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let descriptor = create_file_read_descriptor();
    registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(FileReadExecutor::default()));

    let descriptor = create_file_write_descriptor();
    registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(FileWriteExecutor::default()));

    let descriptor = create_file_edit_descriptor();
    registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(FileEditExecutor::default()));

    let descriptor = create_dir_list_descriptor();
    registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(DirListExecutor::default()));
}

// Tool descriptors

fn create_file_read_descriptor() -> ToolDescriptor {
    let mut capabilities = base_readonly_capabilities();

    ToolDescriptor {
        id: "file_read".to_string(),
        name: "File Read".to_string(),
        description: "Read the contents of a file".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("path", "File path to read", true),
            number_param("offset", "Byte offset to start reading from", false),
            number_param("limit", "Maximum number of bytes to read", false),
            bool_param("as_text", "Read as text (default true). If false, returns base64 encoded content", false),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Sync,
        capabilities,
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "filesystem".to_string(),
            resource: "read".to_string(),
            description: "Read files from allowed directories".to_string(),
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

fn create_file_write_descriptor() -> ToolDescriptor {
    let capabilities = base_writable_capabilities();

    ToolDescriptor {
        id: "file_write".to_string(),
        name: "File Write".to_string(),
        description: "Write content to a file (creates or overwrites)".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("path", "File path to write", true),
            string_param("content", "Content to write to the file", true),
            bool_param("append", "Append to file instead of overwriting (default false)", false),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Sync,
        capabilities,
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "filesystem".to_string(),
            resource: "write".to_string(),
            description: "Write files to allowed directories".to_string(),
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

fn create_file_edit_descriptor() -> ToolDescriptor {
    let capabilities = base_writable_capabilities();

    ToolDescriptor {
        id: "file_edit".to_string(),
        name: "File Edit".to_string(),
        description: "Edit specific lines in a file using line number range".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("path", "File path to edit", true),
            number_param("start_line", "Starting line number (1-indexed)", true),
            number_param("end_line", "Ending line number (1-indexed, inclusive)", true),
            string_param("new_content", "New content to replace the specified lines", true),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Sync,
        capabilities,
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "filesystem".to_string(),
            resource: "write".to_string(),
            description: "Edit files in allowed directories".to_string(),
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

fn create_dir_list_descriptor() -> ToolDescriptor {
    let mut capabilities = base_readonly_capabilities();

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
        capabilities,
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

// Tool Executors

#[derive(Default)]
struct FileReadExecutor;

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

            use base64::{Engine as _, engine::general_purpose::STANDARD};
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

#[derive(Default)]
struct FileWriteExecutor;

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

#[derive(Default)]
struct FileEditExecutor;

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

        let file = fs::File::open(&path).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: format!("Failed to open file: {}", e),
            details: None,
            recoverable: false,
            retryable: false,
        })?;

        let reader = BufReader::new(file);
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

#[derive(Default)]
struct DirListExecutor;

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

            for entry in read_dir {
                let entry = entry.map_err(|e| ToolExecutionError {
                    code: ToolErrorCode::ExecutionError,
                    message: format!("Failed to read directory entry: {}", e),
                    details: None,
                    recoverable: false,
                    retryable: false,
                })?;

                let file_name = entry.file_name();
                let file_name_str = file_name.to_string_lossy().to_string();

                if !include_hidden && file_name_str.starts_with('.') {
                    continue;
                }

                let entry_path = entry.path();
                let metadata = entry.metadata().map_err(|e| ToolExecutionError {
                    code: ToolErrorCode::ExecutionError,
                    message: format!("Failed to read metadata: {}", e),
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
