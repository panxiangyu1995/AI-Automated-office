use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::RwLock;

use super::descriptor::{
    ToolCapabilities, ToolCategory, ToolContextRequirements, ToolDescriptor, ToolExecutionMode,
    ToolMetadata, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolPermissionRequirement,
};
use super::pipeline::{ToolExecutionContext, ToolExecutionError, ToolErrorCode, ToolExecutor};

// ============ Document Config ============

static DOCUMENT_CONFIG: RwLock<Option<DocumentConfig>> = RwLock::new(None);

#[derive(Debug, Clone)]
pub struct DocumentConfig {
    pub max_file_size: u64,
    pub allowed_extensions: Vec<String>,
}

impl Default for DocumentConfig {
    fn default() -> Self {
        Self {
            max_file_size: 10 * 1024 * 1024, // 10MB
            allowed_extensions: vec![
                "txt".to_string(),
                "md".to_string(),
                "rst".to_string(),
                "json".to_string(),
                "yaml".to_string(),
                "yml".to_string(),
                "toml".to_string(),
            ],
        }
    }
}

fn get_or_init_config() -> DocumentConfig {
    let config = DOCUMENT_CONFIG.read().unwrap();
    if let Some(ref cfg) = *config {
        return cfg.clone();
    }
    drop(config);
    let mut write = DOCUMENT_CONFIG.write().unwrap();
    if write.is_none() {
        *write = Some(DocumentConfig::default());
    }
    write.clone().unwrap()
}

pub fn set_document_config(config: DocumentConfig) {
    let mut write = DOCUMENT_CONFIG.write().unwrap();
    *write = Some(config);
}

// ============ Tool Registration ============

pub fn register_document_tools(
    registry: &mut super::registry::ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let (descriptor, executor) = document_parse();
    registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);

    let (descriptor, executor) = document_convert();
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

// ============ document_parse Tool ============

fn document_parse() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let capabilities = base_capabilities();

    let parameters = vec![
        ToolParameter {
            name: "path".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Path to document file".to_string(),
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
            name: "structure_hint".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Hint for structure extraction (section, paragraph, line)".to_string(),
            required: false,
            default: None,
            r#enum: Some(vec![
                "section".to_string(),
                "paragraph".to_string(),
                "line".to_string(),
            ]),
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
    ];

    let descriptor = ToolDescriptor {
        id: "document_parse".to_string(),
        name: "Document Parse".to_string(),
        description: "Extract content from documents".to_string(),
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
        metadata: base_metadata("document", vec!["core", "document", "parse"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("document".to_string()),
        handler_function: Some("document_parse".to_string()),
    };

    let executor = Arc::new(DocumentParseExecutor {});
    (descriptor, executor)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentParseResult {
    pub path: String,
    pub format: String,
    pub content: String,
    pub structure_markers: Option<Vec<StructureMarker>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StructureMarker {
    pub marker_type: String,
    pub content: String,
    pub position: usize,
}

struct DocumentParseExecutor;

#[async_trait::async_trait]
impl ToolExecutor for DocumentParseExecutor {
    async fn execute(
        &self,
        params: serde_json::Value,
        _context: &ToolExecutionContext,
    ) -> Result<serde_json::Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let path = map
            .get("path")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();

        if path.is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Path is required".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        let structure_hint = map
            .get("structure_hint")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        let config = get_or_init_config();

        // Check file size
        let metadata = std::fs::metadata(&path).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: format!("Failed to read file metadata: {}", e),
            details: None,
            recoverable: true,
            retryable: false,
        })?;

        if metadata.len() > config.max_file_size {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!(
                    "File size ({}) exceeds maximum allowed ({})",
                    metadata.len(),
                    config.max_file_size
                ),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Get file extension
        let extension = Path::new(&path)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        // Check if extension is allowed
        if !config.allowed_extensions.contains(&extension) {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: format!(
                    "File format '{}' is not supported. Allowed formats: {:?}",
                    extension,
                    config.allowed_extensions
                ),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Parse based on format
        let result = parse_document(&path, &extension, structure_hint.as_deref())?;

        serde_json::to_value(result).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: e.to_string(),
            details: None,
            recoverable: false,
            retryable: false,
        })
    }
}

fn parse_document(
    path: &str,
    extension: &str,
    structure_hint: Option<&str>,
) -> Result<DocumentParseResult, ToolExecutionError> {
    let content = std::fs::read_to_string(path).map_err(|e| ToolExecutionError {
        code: ToolErrorCode::ExecutionError,
        message: format!("Failed to read file: {}", e),
        details: None,
        recoverable: true,
        retryable: false,
    })?;

    let structure_markers = structure_hint.map(|hint| {
        extract_structure_markers(&content, hint)
    });

    Ok(DocumentParseResult {
        path: path.to_string(),
        format: extension.to_string(),
        content,
        structure_markers,
    })
}

fn extract_structure_markers(content: &str, hint: &str) -> Vec<StructureMarker> {
    let mut markers = Vec::new();

    match hint {
        "section" => {
            // Extract markdown headers or similar sections
            for (i, line) in content.lines().enumerate() {
                let trimmed = line.trim();
                if trimmed.starts_with("# ") || trimmed.starts_with("## ") || trimmed.starts_with("### ") {
                    markers.push(StructureMarker {
                        marker_type: "heading".to_string(),
                        content: trimmed.to_string(),
                        position: i,
                    });
                }
            }
        }
        "paragraph" => {
            // Group lines into paragraphs
            let mut current_para = String::new();
            let mut position = 0;

            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    if !current_para.is_empty() {
                        markers.push(StructureMarker {
                            marker_type: "paragraph".to_string(),
                            content: current_para.clone(),
                            position,
                        });
                        current_para.clear();
                    }
                } else {
                    if current_para.is_empty() {
                        position = markers.len();
                    }
                    if !current_para.is_empty() {
                        current_para.push(' ');
                    }
                    current_para.push_str(trimmed);
                }
            }

            if !current_para.is_empty() {
                markers.push(StructureMarker {
                    marker_type: "paragraph".to_string(),
                    content: current_para,
                    position,
                });
            }
        }
        "line" => {
            // Return each non-empty line
            for (i, line) in content.lines().enumerate() {
                let trimmed = line.trim();
                if !trimmed.is_empty() {
                    markers.push(StructureMarker {
                        marker_type: "line".to_string(),
                        content: trimmed.to_string(),
                        position: i,
                    });
                }
            }
        }
        _ => {}
    }

    markers
}

// ============ document_convert Tool ============

fn document_convert() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let mut capabilities = base_capabilities();
    capabilities.has_side_effects = true;

    let parameters = vec![
        ToolParameter {
            name: "input".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Input file path".to_string(),
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
            name: "output_format".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Output format (html, json, yaml, toml)".to_string(),
            required: true,
            default: None,
            r#enum: Some(vec![
                "html".to_string(),
                "json".to_string(),
                "yaml".to_string(),
                "toml".to_string(),
            ]),
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "output".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Output file path".to_string(),
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
            name: "template".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Template file path for HTML conversion".to_string(),
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
        id: "document_convert".to_string(),
        name: "Document Convert".to_string(),
        description: "Convert documents between formats".to_string(),
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
        metadata: base_metadata("document", vec!["core", "document", "convert"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("document".to_string()),
        handler_function: Some("document_convert".to_string()),
    };

    let executor = Arc::new(DocumentConvertExecutor {});
    (descriptor, executor)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentConvertResult {
    pub input: String,
    pub output: String,
    pub output_format: String,
    pub success: bool,
    pub message: Option<String>,
}

struct DocumentConvertExecutor;

#[async_trait::async_trait]
impl ToolExecutor for DocumentConvertExecutor {
    async fn execute(
        &self,
        params: serde_json::Value,
        _context: &ToolExecutionContext,
    ) -> Result<serde_json::Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let input = map
            .get("input")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();

        if input.is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Input is required".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        let output_format = map
            .get("output_format")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();

        if output_format.is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Output format is required".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        let output = map
            .get("output")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();

        if output.is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Output path is required".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        let template = map
            .get("template")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        // Read input file
        let content = tokio::fs::read_to_string(&input)
            .await
            .map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!("Failed to read input file: {}", e),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        // Convert content
        let converted = match output_format.as_str() {
            "html" => convert_to_html(&content, template.as_deref())?,
            "json" => convert_to_json(&content)?,
            "yaml" => convert_to_yaml(&content)?,
            "toml" => convert_to_toml(&content)?,
            _ => {
                return Err(ToolExecutionError {
                    code: ToolErrorCode::ValidationError,
                    message: format!("Unsupported output format: {}", output_format),
                    details: None,
                    recoverable: true,
                    retryable: false,
                });
            }
        };

        // Write output file
        tokio::fs::write(&output, &converted)
            .await
            .map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!("Failed to write output file: {}", e),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        let result = DocumentConvertResult {
            input,
            output,
            output_format,
            success: true,
            message: Some("Conversion completed successfully".to_string()),
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

fn convert_to_html(content: &str, template: Option<&str>) -> Result<String, ToolExecutionError> {
    let html_content = markdown_to_html(content);

    if let Some(template_path) = template {
        // Read template and replace {{content}} placeholder
        let template_content = std::fs::read_to_string(template_path)
            .map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!("Failed to read template: {}", e),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        let html = template_content.replace("{{content}}", &html_content);
        Ok(html)
    } else {
        // Use default template
        Ok(format!(
            r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Converted Document</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }}
        pre {{ background-color: #f4f4f4; padding: 10px; overflow-x: auto; }}
        code {{ background-color: #f4f4f4; padding: 2px 5px; }}
        h1, h2, h3 {{ color: #333; }}
    </style>
</head>
<body>
{content}
</body>
</html>"#,
            content = html_content
        ))
    }
}

fn markdown_to_html(markdown: &str) -> String {
    let mut html = String::new();
    let mut in_code_block = false;

    for line in markdown.lines() {
        let trimmed = line.trim();

        if trimmed.starts_with("```") {
            if in_code_block {
                html.push_str("</code></pre>\n");
                in_code_block = false;
            } else {
                html.push_str("<pre><code>");
                in_code_block = true;
            }
        } else if in_code_block {
            html.push_str(&html_escape(line));
            html.push('\n');
        } else if trimmed.starts_with("# ") {
            html.push_str(&format!("<h1>{}</h1>\n", &html_escape(&trimmed[2..])));
        } else if trimmed.starts_with("## ") {
            html.push_str(&format!("<h2>{}</h2>\n", &html_escape(&trimmed[3..])));
        } else if trimmed.starts_with("### ") {
            html.push_str(&format!("<h3>{}</h3>\n", &html_escape(&trimmed[4..])));
        } else if trimmed.starts_with("- ") || trimmed.starts_with("* ") {
            html.push_str(&format!("<li>{}</li>\n", &html_escape(&trimmed[2..])));
        } else if trimmed.is_empty() {
            html.push_str("<br>\n");
        } else {
            // Regular paragraph
            let processed = process_inline_markdown(trimmed);
            html.push_str(&format!("<p>{}</p>\n", processed));
        }
    }

    html
}

fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

fn process_inline_markdown(s: &str) -> String {
    let mut result = html_escape(s);

    // Bold: **text** or __text__
    while let Some(start) = result.find("**") {
        if let Some(end) = result[start + 2..].find("**") {
            let before = &result[..start];
            let middle = &result[start + 2..start + 2 + end];
            let after = &result[start + 2 + end + 2..];
            result = format!("{}<strong>{}</strong>{}", before, middle, after);
        } else {
            break;
        }
    }

    // Italic: *text* or _text_
    while let Some(start) = result.find('*') {
        if let Some(end) = result[start + 1..].find('*') {
            let before = &result[..start];
            let middle = &result[start + 1..start + 1 + end];
            let after = &result[start + 1 + end + 1..];
            result = format!("{}<em>{}</em>{}", before, middle, after);
        } else {
            break;
        }
    }

    // Inline code: `code`
    while let Some(start) = result.find('`') {
        if let Some(end) = result[start + 1..].find('`') {
            let before = &result[..start];
            let middle = &result[start + 1..start + 1 + end];
            let after = &result[start + 1 + end + 1..];
            result = format!("{}<code>{}</code>{}", before, middle, after);
        } else {
            break;
        }
    }

    // Links: [text](url)
    while let Some(start) = result.find('[') {
        if let Some(link_end) = result[start..].find("](") {
            let link_start = start + 1;
            let url_start = start + link_end + 2;
            if let Some(url_end) = result[url_start..].find(')') {
                let text = &result[link_start..start + link_end];
                let url = &result[url_start..url_start + url_end];
                let before = &result[..start];
                let after = &result[url_start + url_end + 1..];
                result = format!("{}<a href=\"{}\">{}</a>{}", before, url, text, after);
            } else {
                break;
            }
        } else {
            break;
        }
    }

    result
}

fn convert_to_json(content: &str) -> Result<String, ToolExecutionError> {
    // Try to parse as JSON first, then re-serialize with pretty printing
    match serde_json::from_str::<serde_json::Value>(content) {
        Ok(value) => {
            serde_json::to_string_pretty(&value).map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!("JSON serialization failed: {}", e),
                details: None,
                recoverable: false,
                retryable: false,
            })
        }
        Err(_) => {
            // Not valid JSON, treat as plain text and wrap in JSON
            let json = serde_json::json!({
                "content": content
            });
            serde_json::to_string_pretty(&json).map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!("JSON serialization failed: {}", e),
                details: None,
                recoverable: false,
                retryable: false,
            })
        }
    }
}

fn convert_to_yaml(content: &str) -> Result<String, ToolExecutionError> {
    // Try to parse as JSON first, then convert to YAML
    match serde_json::from_str::<serde_json::Value>(content) {
        Ok(value) => {
            serde_yaml::to_string(&value).map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!("YAML serialization failed: {}", e),
                details: None,
                recoverable: false,
                retryable: false,
            })
        }
        Err(_) => {
            // Not valid JSON, wrap in YAML as content field
            let json = serde_json::json!({
                "content": content
            });
            serde_yaml::to_string(&json).map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!("YAML serialization failed: {}", e),
                details: None,
                recoverable: false,
                retryable: false,
            })
        }
    }
}

fn convert_to_toml(content: &str) -> Result<String, ToolExecutionError> {
    // Try to parse as JSON first, then convert to TOML
    // Note: toml crate requires a specific structure, so we create a [document] section
    match serde_json::from_str::<serde_json::Value>(content) {
        Ok(value) => {
            let toml_value = toml::Value::Table(serde_json::from_value(value).map_err(|e| {
                ToolExecutionError {
                    code: ToolErrorCode::ExecutionError,
                    message: format!("JSON to TOML conversion failed: {}", e),
                    details: None,
                    recoverable: false,
                    retryable: false,
                }
            })?);

            toml::to_string_pretty(&toml_value).map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: format!("TOML serialization failed: {}", e),
                details: None,
                recoverable: false,
                retryable: false,
            })
        }
        Err(_) => {
            Err(ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: "Cannot convert plain text to TOML - input must be valid JSON".to_string(),
                details: None,
                recoverable: false,
                retryable: false,
            })
        }
    }
}
