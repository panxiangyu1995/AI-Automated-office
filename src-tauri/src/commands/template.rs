//! Template Commands
//!
//! Tauri commands for template schema, binding engine, and designer operations
//! J10: 模板命令层暴露

use std::collections::HashMap;
use tauri::State;
use tracing::info;

use crate::storage::{
    StorageManager,
    template_schema::TemplateSchema,
    template_binding::{TemplateBindEngine, BindResult, BindPreview},
    template_designer::{
        TemplateDesigner, ElementOperation, LayerOperation, Alignment,
    },
};

// ============ Template CRUD Commands ============

/// Create a new template
#[tauri::command]
pub async fn template_create(
    manager: State<'_, StorageManager>,
    id: String,
    name: String,
) -> Result<crate::storage::template_store::Template, String> {
    info!("Creating template: {} ({})", id, name);
    manager.template_store()
        .create_template(&id, &name)
        .await
        .map_err(|e| e.to_string())
}

/// Create a template with schema
#[tauri::command]
pub async fn template_create_with_schema(
    manager: State<'_, StorageManager>,
    id: String,
    name: String,
    schema_json: String,
) -> Result<crate::storage::template_store::Template, String> {
    info!("Creating template with schema: {} ({})", id, name);
    manager.template_store()
        .create_template_with_schema(&id, &name, &schema_json)
        .await
        .map_err(|e| e.to_string())
}

/// Get template by ID
#[tauri::command]
pub async fn template_get(
    manager: State<'_, StorageManager>,
    id: String,
) -> Result<Option<crate::storage::template_store::Template>, String> {
    manager.template_store()
        .get_template(&id)
        .await
        .map_err(|e| e.to_string())
}

/// List all templates
#[tauri::command]
pub async fn template_list(
    manager: State<'_, StorageManager>,
) -> Result<Vec<crate::storage::template_store::Template>, String> {
    manager.template_store()
        .list_templates()
        .await
        .map_err(|e| e.to_string())
}

// ============ Template Schema Commands ============

/// Save template schema
#[tauri::command]
pub async fn template_save_schema(
    manager: State<'_, StorageManager>,
    template_id: String,
    schema_json: String,
) -> Result<bool, String> {
    info!("Saving schema for template: {}", template_id);
    manager.template_store()
        .save_schema(&template_id, &schema_json)
        .await
        .map_err(|e| e.to_string())
}

/// Get template schema
#[tauri::command]
pub async fn template_get_schema(
    manager: State<'_, StorageManager>,
    template_id: String,
) -> Result<Option<String>, String> {
    manager.template_store()
        .get_schema(&template_id)
        .await
        .map_err(|e| e.to_string())
}

/// Validate a template schema JSON
#[tauri::command]
pub fn template_validate_schema(
    schema_json: String,
) -> Result<(), String> {
    let schema: TemplateSchema = serde_json::from_str(&schema_json)
        .map_err(|e| format!("Invalid schema JSON: {}", e))?;
    schema.validate().map_err(|e| e.to_string())
}

// ============ Template Version Commands ============

/// Create a draft version
#[tauri::command]
pub async fn template_create_draft(
    manager: State<'_, StorageManager>,
    template_id: String,
    content: String,
) -> Result<crate::storage::template_store::TemplateVersion, String> {
    manager.template_store()
        .create_draft(&template_id, &content)
        .await
        .map_err(|e| e.to_string())
}

/// Publish a version
#[tauri::command]
pub async fn template_publish_version(
    manager: State<'_, StorageManager>,
    template_id: String,
    version_id: String,
) -> Result<Option<crate::storage::template_store::TemplateVersion>, String> {
    manager.template_store()
        .publish_version(&template_id, &version_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get active version
#[tauri::command]
pub async fn template_get_active_version(
    manager: State<'_, StorageManager>,
    template_id: String,
) -> Result<Option<crate::storage::template_store::TemplateVersion>, String> {
    manager.template_store()
        .get_active_version(&template_id)
        .await
        .map_err(|e| e.to_string())
}

/// List versions
#[tauri::command]
pub async fn template_list_versions(
    manager: State<'_, StorageManager>,
    template_id: String,
) -> Result<Vec<crate::storage::template_store::TemplateVersion>, String> {
    manager.template_store()
        .list_versions(&template_id)
        .await
        .map_err(|e| e.to_string())
}

/// Set default version
#[tauri::command]
pub async fn template_set_default_version(
    manager: State<'_, StorageManager>,
    template_id: String,
    version_id: String,
) -> Result<bool, String> {
    manager.template_store()
        .set_default_version(&template_id, &version_id)
        .await
        .map_err(|e| e.to_string())
}

// ============ Data Binding Commands ============

/// Analyze template schema to extract placeholders (FR1267)
#[tauri::command]
pub fn template_analyze_schema(
    schema_json: String,
) -> Result<Vec<crate::storage::template_binding::PlaceholderInfo>, String> {
    let schema: TemplateSchema = serde_json::from_str(&schema_json)
        .map_err(|e| format!("Invalid schema JSON: {}", e))?;
    Ok(TemplateBindEngine::analyze_schema(&schema))
}

/// Preview data binding before fill (FR1270)
#[tauri::command]
pub fn template_preview_binding(
    schema_json: String,
    existing_data: HashMap<String, serde_json::Value>,
) -> Result<BindPreview, String> {
    let schema: TemplateSchema = serde_json::from_str(&schema_json)
        .map_err(|e| format!("Invalid schema JSON: {}", e))?;
    Ok(TemplateBindEngine::preview_before_fill(&schema, &existing_data))
}

/// Fill template bindings with data (FR1268)
#[tauri::command]
pub fn template_fill_bindings(
    schema_json: String,
    data_source: HashMap<String, serde_json::Value>,
    existing_data: HashMap<String, serde_json::Value>,
) -> Result<BindResult, String> {
    let schema: TemplateSchema = serde_json::from_str(&schema_json)
        .map_err(|e| format!("Invalid schema JSON: {}", e))?;
    Ok(TemplateBindEngine::fill_bindings(&schema, &data_source, &existing_data))
}

// ============ Designer Commands ============

/// Apply element operation on schema (FR1280)
#[tauri::command]
pub fn template_apply_element_operation(
    schema_json: String,
    operation_json: String,
) -> Result<String, String> {
    let schema: TemplateSchema = serde_json::from_str(&schema_json)
        .map_err(|e| format!("Invalid schema JSON: {}", e))?;
    let operation: ElementOperation = serde_json::from_str(&operation_json)
        .map_err(|e| format!("Invalid operation JSON: {}", e))?;

    let mut designer = TemplateDesigner::new();
    let result = designer.apply_element_operation(&schema, &operation)
        .map_err(|e| e.to_string())?;

    result.to_json().map_err(|e| e.to_string())
}

/// Apply layer operation on schema (FR1281)
#[tauri::command]
pub fn template_apply_layer_operation(
    schema_json: String,
    operation_json: String,
) -> Result<String, String> {
    let schema: TemplateSchema = serde_json::from_str(&schema_json)
        .map_err(|e| format!("Invalid schema JSON: {}", e))?;
    let operation: LayerOperation = serde_json::from_str(&operation_json)
        .map_err(|e| format!("Invalid operation JSON: {}", e))?;

    let mut designer = TemplateDesigner::new();
    let result = designer.apply_layer_operation(&schema, &operation)
        .map_err(|e| e.to_string())?;

    result.to_json().map_err(|e| e.to_string())
}

/// Align elements (FR1283)
#[tauri::command]
pub fn template_align_elements(
    schema_json: String,
    layer_id: String,
    element_ids: Vec<String>,
    alignment: String,
) -> Result<String, String> {
    let schema: TemplateSchema = serde_json::from_str(&schema_json)
        .map_err(|e| format!("Invalid schema JSON: {}", e))?;
    let alignment: Alignment = serde_json::from_str(&format!("\"{}\"", alignment))
        .map_err(|e| format!("Invalid alignment: {}", e))?;

    let mut designer = TemplateDesigner::new();
    let result = designer.align_elements(&schema, &layer_id, &element_ids, alignment)
        .map_err(|e| e.to_string())?;

    result.to_json().map_err(|e| e.to_string())
}
