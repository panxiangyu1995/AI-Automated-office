//! Approval Template Commands
//!
//! Tauri commands for approval template management (Task 201 - FR132-FR136)

use crate::approval::template::{TemplateCategory, TemplateRecommendation, TemplateService, TemplatePreview};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;
use std::sync::Arc;

/// Template statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateStats {
    pub total: usize,
    pub builtin: usize,
    pub custom: usize,
    pub by_category: HashMap<String, usize>,
}

/// Get all templates
#[tauri::command]
pub async fn get_approval_templates(
    service: State<'_, Arc<TemplateService>>,
) -> Result<Vec<crate::approval::template::ApprovalTemplate>, String> {
    Ok(service.get_all().await)
}

/// Get templates by category
#[tauri::command]
pub async fn get_approval_templates_by_category(
    service: State<'_, Arc<TemplateService>>,
    category: TemplateCategory,
) -> Result<Vec<crate::approval::template::ApprovalTemplate>, String> {
    Ok(service.get_by_category(category).await)
}

/// Get active templates
#[tauri::command]
pub async fn get_active_approval_templates(
    service: State<'_, Arc<TemplateService>>,
) -> Result<Vec<crate::approval::template::ApprovalTemplate>, String> {
    Ok(service.get_active().await)
}

/// Get builtin templates
#[tauri::command]
pub async fn get_builtin_approval_templates(
    service: State<'_, Arc<TemplateService>>,
) -> Result<Vec<crate::approval::template::ApprovalTemplate>, String> {
    Ok(service.get_builtin().await)
}

/// Get template by ID
#[tauri::command]
pub async fn get_approval_template(
    service: State<'_, Arc<TemplateService>>,
    id: String,
) -> Result<Option<crate::approval::template::ApprovalTemplate>, String> {
    Ok(service.get(&id).await)
}

/// Search templates
#[tauri::command]
pub async fn search_approval_templates(
    service: State<'_, Arc<TemplateService>>,
    query: String,
) -> Result<Vec<crate::approval::template::ApprovalTemplate>, String> {
    Ok(service.search(&query).await)
}

/// Create template
#[tauri::command]
pub async fn create_approval_template(
    service: State<'_, Arc<TemplateService>>,
    template: crate::approval::template::ApprovalTemplate,
) -> Result<(), String> {
    service.create(template).await;
    Ok(())
}

/// Update template
#[tauri::command]
pub async fn update_approval_template(
    service: State<'_, Arc<TemplateService>>,
    id: String,
    template: crate::approval::template::ApprovalTemplate,
) -> Result<bool, String> {
    Ok(service.update(&id, template).await.is_some())
}

/// Delete template
#[tauri::command]
pub async fn delete_approval_template(
    service: State<'_, Arc<TemplateService>>,
    id: String,
) -> Result<bool, String> {
    Ok(service.delete(&id).await.is_some())
}

/// Get template previews
#[tauri::command]
pub async fn get_approval_template_previews(
    service: State<'_, Arc<TemplateService>>,
) -> Result<Vec<TemplatePreview>, String> {
    Ok(service.get_previews().await)
}

/// Recommend templates based on form data
#[tauri::command]
pub async fn recommend_approval_templates(
    service: State<'_, Arc<TemplateService>>,
    form_data: HashMap<String, serde_json::Value>,
) -> Result<Vec<TemplateRecommendation>, String> {
    Ok(service.recommend(&form_data).await)
}

/// Get template statistics
#[tauri::command]
pub async fn get_approval_template_stats(
    service: State<'_, Arc<TemplateService>>,
) -> Result<TemplateStats, String> {
    let templates = service.get_all().await;
    let mut by_category: HashMap<String, usize> = HashMap::new();
    let mut builtin = 0;
    let mut custom = 0;

    for t in &templates {
        *by_category.entry(format!("{:?}", t.category).to_lowercase()).or_insert(0) += 1;
        if t.is_builtin {
            builtin += 1;
        } else {
            custom += 1;
        }
    }

    Ok(TemplateStats {
        total: templates.len(),
        builtin,
        custom,
        by_category,
    })
}

/// Get all template categories
#[tauri::command]
pub fn get_template_categories() -> Vec<TemplateCategory> {
    vec![
        TemplateCategory::Leave,
        TemplateCategory::Expense,
        TemplateCategory::Purchase,
        TemplateCategory::Travel,
        TemplateCategory::Overtime,
        TemplateCategory::Equipment,
        TemplateCategory::General,
    ]
}
