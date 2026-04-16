//! Approval Template Commands
//!
//! Tauri commands for approval template management (Task 201 - FR132-FR136)

use crate::auth::{AuthService, verify_and_check, Permission};
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

/// Get all templates (Read)
#[tauri::command]
pub async fn get_approval_templates(
    service: State<'_, Arc<TemplateService>>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<crate::approval::template::ApprovalTemplate>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(service.get_all().await)
}

/// Get templates by category (Read)
#[tauri::command]
pub async fn get_approval_templates_by_category(
    service: State<'_, Arc<TemplateService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    category: TemplateCategory,
) -> Result<Vec<crate::approval::template::ApprovalTemplate>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(service.get_by_category(category).await)
}

/// Get active templates (Read)
#[tauri::command]
pub async fn get_active_approval_templates(
    service: State<'_, Arc<TemplateService>>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<crate::approval::template::ApprovalTemplate>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(service.get_active().await)
}

/// Get builtin templates (Read)
#[tauri::command]
pub async fn get_builtin_approval_templates(
    service: State<'_, Arc<TemplateService>>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<crate::approval::template::ApprovalTemplate>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(service.get_builtin().await)
}

/// Get template by ID (Read)
#[tauri::command]
pub async fn get_approval_template(
    service: State<'_, Arc<TemplateService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<Option<crate::approval::template::ApprovalTemplate>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(service.get(&id).await)
}

/// Search templates (Read)
#[tauri::command]
pub async fn search_approval_templates(
    service: State<'_, Arc<TemplateService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    query: String,
) -> Result<Vec<crate::approval::template::ApprovalTemplate>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(service.search(&query).await)
}

/// Create template (Write)
#[tauri::command]
pub async fn create_approval_template(
    service: State<'_, Arc<TemplateService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    template: crate::approval::template::ApprovalTemplate,
) -> Result<(), String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    service.create(template).await;
    Ok(())
}

/// Update template (Write)
#[tauri::command]
pub async fn update_approval_template(
    service: State<'_, Arc<TemplateService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
    template: crate::approval::template::ApprovalTemplate,
) -> Result<bool, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    Ok(service.update(&id, template).await.is_some())
}

/// Delete template (Admin)
#[tauri::command]
pub async fn delete_approval_template(
    service: State<'_, Arc<TemplateService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<bool, String> {
    verify_and_check(&token, &auth_service, Permission::Admin).await?;
    Ok(service.delete(&id).await.is_some())
}

/// Get template previews (Read)
#[tauri::command]
pub async fn get_approval_template_previews(
    service: State<'_, Arc<TemplateService>>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<TemplatePreview>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(service.get_previews().await)
}

/// Recommend templates based on form data (Read)
#[tauri::command]
pub async fn recommend_approval_templates(
    service: State<'_, Arc<TemplateService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    form_data: HashMap<String, serde_json::Value>,
) -> Result<Vec<TemplateRecommendation>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(service.recommend(&form_data).await)
}

/// Get template statistics (Read)
#[tauri::command]
pub async fn get_approval_template_stats(
    service: State<'_, Arc<TemplateService>>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<TemplateStats, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
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

/// Get all template categories (Read - no auth needed for enum values)
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
