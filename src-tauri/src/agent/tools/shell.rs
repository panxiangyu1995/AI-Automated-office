use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Arc;

use async_trait::async_trait;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::sync::RwLock;

use super::descriptor::{
    ToolCapabilities, ToolCategory, ToolContextRequirements, ToolDescriptor, ToolExecutionMode,
    ToolMetadata, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolPermissionRequirement,
};
use super::pipeline::{ToolExecutionContext, ToolExecutionError, ToolErrorCode, ToolExecutor};

// ============ Configuration ============

static SHELL_CONFIG: RwLock<Option<ShellConfig>> = RwLock::new(None);

#[derive(Debug, Clone)]
pub struct ShellConfig {
    allowed_commands: Vec<String>,
    max_output_size: usize,
}

impl Default for ShellConfig {
    fn default() -> Self {
        Self {
            // Predefined allowed commands - security baseline
            allowed_commands: vec![
                "echo".to_string(),
                "pwd".to_string(),
                "ls".to_string(),
                "dir".to_string(),
                "cat".to_string(),
                "type".to_string(),
                "find".to_string(),
                "grep".to_string(),
                "rg".to_string(),
                "head".to_string(),
                "tail".to_string(),
                "wc".to_string(),
                "mkdir".to_string(),
                "rmdir".to_string(),
                "copy".to_string(),
                "cp".to_string(),
                "move".to_string(),
                "mv".to_string(),
                "del".to_string(),
                "rm".to_string(),
                "date".to_string(),
                "time".to_string(),
                "hostname".to_string(),
                "whoami".to_string(),
                "git".to_string(),
                "npm".to_string(),
                "node".to_string(),
                "pnpm".to_string(),
                "cargo".to_string(),
                "rustc".to_string(),
                "python".to_string(),
                "pip".to_string(),
            ],
            max_output_size: 1024 * 1024, // 1MB
        }
    }
}

fn get_or_init_config() -> ShellConfig {
    let config = SHELL_CONFIG.read().unwrap();
    if let Some(ref cfg) = *config {
        return cfg.clone();
    }
    drop(config);
    let mut write = SHELL_CONFIG.write().unwrap();
    if write.is_none() {
        *write = Some(ShellConfig::default());
    }
    write.clone().unwrap()
}

/// Set shell configuration (for testing or custom configurations)
pub fn set_config(config: ShellConfig) {
    let mut write = SHELL_CONFIG.write().unwrap();
    *write = Some(config);
}

fn is_command_allowed(command: &str) -> bool {
    let config = get_or_init_config();
    config
        .allowed_commands
        .iter()
        .any(|cmd| cmd == command)
}

// ============ Tool Registration ============

pub fn register_shell_tools(
    registry: &mut super::registry::ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let (descriptor, executor) = sandbox_execute();
    registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);

    let (descriptor, executor) = pattern_search();
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
        is_read_only: false,
        has_side_effects: true,
        supports_retry: true,
        estimated_duration: None,
    }
}

// ============ sandbox_execute Tool ============

fn sandbox_execute() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let mut capabilities = base_capabilities();
    capabilities.requires_permission = true;
    capabilities.has_side_effects = true;
    capabilities.is_read_only = false;

    let permissions = vec![ToolPermissionRequirement {
        permission_type: "shell".to_string(),
        resource: "execute".to_string(),
        description: "Execute predefined shell commands".to_string(),
        optional: None,
    }];

    let parameters = vec![
        ToolParameter {
            name: "command".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Command to execute (must be in whitelist)".to_string(),
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
            name: "args".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::Array),
            description: "Command arguments".to_string(),
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
            name: "cwd".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Working directory for command execution".to_string(),
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
        id: "sandbox_execute".to_string(),
        name: "Sandbox Execute".to_string(),
        description: "Execute predefined commands in a sandboxed environment".to_string(),
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
            requires_workspace: true,
            requires_network_access: false,
            requires_file_system_access: true,
            required_env_vars: None,
        }),
        metadata: base_metadata("shell", vec!["core", "shell", "execute"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("shell".to_string()),
        handler_function: Some("sandbox_execute".to_string()),
    };

    let executor = Arc::new(SandboxExecuteExecutor {});
    (descriptor, executor)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SandboxExecuteResult {
    pub command: String,
    pub args: Vec<String>,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub success: bool,
}

struct SandboxExecuteExecutor;

#[async_trait::async_trait]
impl ToolExecutor for SandboxExecuteExecutor {
    async fn execute(
        &self,
        params: serde_json::Value,
        _context: &ToolExecutionContext,
    ) -> Result<serde_json::Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let command = map
            .get("command")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();

        if command.is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Command is required".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Security: Check command whitelist
        if !is_command_allowed(&command) {
            return Err(ToolExecutionError {
                code: ToolErrorCode::PermissionDenied,
                message: format!(
                    "Command '{}' is not in the allowed list. Only predefined commands are permitted.",
                    command
                ),
                details: Some(serde_json::json!({
                    "command": command,
                    "allowed_commands": get_or_init_config().allowed_commands,
                })),
                recoverable: false,
                retryable: false,
            });
        }

        let args: Vec<String> = map
            .get("args")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();

        let cwd: Option<PathBuf> = map
            .get("cwd")
            .and_then(|v| v.as_str())
            .map(PathBuf::from);

        // Validate args to prevent command injection
        for arg in &args {
            if contains_shell_injection(arg) {
                return Err(ToolExecutionError {
                    code: ToolErrorCode::ValidationError,
                    message: "Argument contains potentially dangerous characters".to_string(),
                    details: Some(serde_json::json!({
                        "argument": arg,
                        "dangerous_chars": [";", "|", "&", "$", "`", "<", ">"]
                    })),
                    recoverable: true,
                    retryable: false,
                });
            }
        }

        let config = get_or_init_config();

        // Clone for result since command/args are moved into closure
        let command_for_result = command.clone();
        let args_for_result = args.clone();

        // Execute command
        let output = match tokio::task::spawn_blocking(move || {
            execute_command(&command, &args, cwd.clone())
        }).await {
            Ok(Ok(output)) => output,
            Ok(Err(e)) => {
                return Err(e);
            }
            Err(e) => {
                return Err(ToolExecutionError {
                    code: ToolErrorCode::ExecutionError,
                    message: format!("Task join error: {}", e),
                    details: None,
                    recoverable: true,
                    retryable: true,
                });
            }
        };

        // Truncate output if too large
        let stdout = truncate_output(output.stdout, config.max_output_size);
        let stderr = truncate_output(output.stderr, config.max_output_size);

        let result = SandboxExecuteResult {
            command: command_for_result,
            args: args_for_result,
            exit_code: output.exit_code,
            stdout: stdout.clone(),
            stderr: stderr.clone(),
            success: output.exit_code == 0,
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

fn execute_command(
    command: &str,
    args: &[String],
    cwd: Option<PathBuf>,
) -> Result<CommandOutput, ToolExecutionError> {
    let mut cmd = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/C", command]);
        c.args(args);
        c
    } else {
        let mut c = Command::new("sh");
        c.args(["-c", &format!("{} {}", command, args.join(" "))]);
        c
    };

    if let Some(ref dir) = cwd {
        cmd.current_dir(dir);
    }

    let output = cmd
        .output()
        .map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: format!("Failed to execute command: {}", e),
            details: None,
            recoverable: true,
            retryable: true,
        })?;

    Ok(CommandOutput {
        exit_code: output.status.code().unwrap_or(-1),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

fn contains_shell_injection(s: &str) -> bool {
    let dangerous = [';', '|', '&', '$', '`', '<', '>', '\n', '\r'];
    s.chars().any(|c| dangerous.contains(&c))
}

fn truncate_output(output: String, max_size: usize) -> String {
    if output.len() > max_size {
        format!(
            "{}... [truncated {} bytes]",
            &output[..max_size / 2],
            output.len() - max_size
        )
    } else {
        output
    }
}

struct CommandOutput {
    exit_code: i32,
    stdout: String,
    stderr: String,
}

// ============ pattern_search Tool ============

fn pattern_search() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let mut capabilities = base_capabilities();
    capabilities.is_read_only = true;
    capabilities.has_side_effects = false;

    let parameters = vec![
        ToolParameter {
            name: "pattern".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Regex pattern to search for".to_string(),
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
            name: "path".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "File or directory path to search in".to_string(),
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
            name: "file_pattern".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "File glob pattern to filter files (e.g., *.rs, *.ts)".to_string(),
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
            name: "case_sensitive".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::Boolean),
            description: "Whether search is case sensitive".to_string(),
            required: false,
            default: Some(serde_json::Value::Bool(true)),
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "max_results".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::Number),
            description: "Maximum number of results to return".to_string(),
            required: false,
            default: Some(serde_json::Value::Number(1000.into())),
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
    ];

    let descriptor = ToolDescriptor {
        id: "pattern_search".to_string(),
        name: "Pattern Search".to_string(),
        description: "Search for patterns in files using regex".to_string(),
        category: ToolCategory::Core,
        parameters,
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities,
        permissions: None,
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: false,
            requires_user_context: false,
            requires_workspace: true,
            requires_network_access: false,
            requires_file_system_access: true,
            required_env_vars: None,
        }),
        metadata: base_metadata("shell", vec!["core", "shell", "search", "regex"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("shell".to_string()),
        handler_function: Some("pattern_search".to_string()),
    };

    let executor = Arc::new(PatternSearchExecutor {});
    (descriptor, executor)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatternSearchResult {
    pub pattern: String,
    pub path: String,
    pub matches: Vec<PatternMatch>,
    pub files_searched: usize,
    pub total_matches: usize,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatternMatch {
    pub line_number: usize,
    pub line_content: String,
    pub match_start: usize,
    pub match_end: usize,
}

struct PatternSearchExecutor;

#[async_trait::async_trait]
impl ToolExecutor for PatternSearchExecutor {
    async fn execute(
        &self,
        params: serde_json::Value,
        _context: &ToolExecutionContext,
    ) -> Result<serde_json::Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let pattern_str = map
            .get("pattern")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();

        if pattern_str.is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Pattern is required".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Validate regex pattern
        let regex_pattern = if map
            .get("case_sensitive")
            .and_then(|v| v.as_bool())
            .unwrap_or(true)
        {
            Regex::new(&pattern_str).map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: format!("Invalid regex pattern: {}", e),
                details: None,
                recoverable: true,
                retryable: false,
            })?
        } else {
            Regex::new(&format!("(?i){}", pattern_str)).map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: format!("Invalid regex pattern: {}", e),
                details: None,
                recoverable: true,
                retryable: false,
            })?
        };

        let path_str = map
            .get("path")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();

        if path_str.is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Path is required".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        let file_pattern = map
            .get("file_pattern")
            .and_then(|v| v.as_str())
            .map(|s| glob::Pattern::new(s))
            .transpose()
            .map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: format!("Invalid file pattern: {}", e),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        let max_results = map
            .get("max_results")
            .and_then(|v| v.as_u64())
            .unwrap_or(1000) as usize;

        let config = get_or_init_config();

        let result = tokio::task::spawn_blocking(move || {
            let path = PathBuf::from(&path_str);
            search_files(&path, &regex_pattern, file_pattern.as_ref(), max_results, config.max_output_size)
        })
        .await
        .map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: format!("Task join error: {}", e),
            details: None,
            recoverable: true,
            retryable: true,
        })?;

        serde_json::to_value(result).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: e.to_string(),
            details: None,
            recoverable: false,
            retryable: false,
        })
    }
}

fn search_files(
    path: &Path,
    pattern: &Regex,
    file_pattern: Option<&glob::Pattern>,
    max_results: usize,
    max_line_length: usize,
) -> Result<PatternSearchResult, ToolExecutionError> {
    let mut matches = Vec::new();
    let mut files_searched = 0;

    if path.is_file() {
        if let Some(fp) = file_pattern {
            if !fp.matches_path(path) {
                return Ok(PatternSearchResult {
                    pattern: pattern.to_string(),
                    path: path.display().to_string(),
                    matches: vec![],
                    files_searched: 0,
                    total_matches: 0,
                });
            }
        }
        files_searched = 1;
        matches = search_file(path, pattern, max_results, max_line_length)?;
    } else if path.is_dir() {
        let mut stack = vec![path.to_path_buf()];
        while let Some(dir) = stack.pop() {
            if matches.len() >= max_results {
                break;
            }
            let entries = std::fs::read_dir(&dir).map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!("Failed to read directory: {}", e),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

            for entry in entries.flatten() {
                let entry_path = entry.path();
                if entry_path.is_dir() {
                    stack.push(entry_path);
                } else if entry_path.is_file() {
                    if let Some(fp) = file_pattern {
                        if !fp.matches_path(&entry_path) {
                            continue;
                        }
                    }
                    files_searched += 1;
                    if matches.len() >= max_results {
                        break;
                    }
                    let file_matches = search_file(&entry_path, pattern, max_results - matches.len(), max_line_length)?;
                    matches.extend(file_matches);
                }
            }
        }
    }

    let total_matches = matches.len();
    Ok(PatternSearchResult {
        pattern: pattern.to_string(),
        path: path.display().to_string(),
        matches,
        files_searched,
        total_matches,
    })
}

fn search_file(
    path: &Path,
    pattern: &Regex,
    max_results: usize,
    max_line_length: usize,
) -> Result<Vec<PatternMatch>, ToolExecutionError> {
    let content = std::fs::read_to_string(path).map_err(|e| ToolExecutionError {
        code: ToolErrorCode::ExecutionError,
        message: format!("Failed to read file: {}", e),
        details: None,
        recoverable: true,
        retryable: false,
    })?;

    let mut matches = Vec::new();
    for (line_number, line) in content.lines().enumerate() {
        if matches.len() >= max_results {
            break;
        }
        let line_to_check = if line.len() > max_line_length {
            &line[..max_line_length]
        } else {
            line
        };
        for mat in pattern.find_iter(line_to_check) {
            matches.push(PatternMatch {
                line_number: line_number + 1,
                line_content: line.to_string(),
                match_start: mat.start(),
                match_end: mat.end(),
            });
            if matches.len() >= max_results {
                break;
            }
        }
    }

    Ok(matches)
}
