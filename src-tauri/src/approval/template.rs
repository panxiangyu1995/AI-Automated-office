//! Approval Template Module
//!
//! Implements ADR-016: 审批模板系统
//! Supports 20+ preset templates for common approval scenarios

use crate::approval::template_builtins;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::Utc;
use std::hash::Hash;

/// Template category
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum TemplateCategory {
    /// Leave request
    Leave,
    /// Expense reimbursement
    Expense,
    /// Purchase request
    Purchase,
    /// Travel request
    Travel,
    /// Overtime
    Overtime,
    /// Equipment
    Equipment,
    /// General
    General,
}

impl TemplateCategory {
    pub fn display_name(&self) -> &'static str {
        match self {
            Self::Leave => "请假",
            Self::Expense => "报销",
            Self::Purchase => "采购",
            Self::Travel => "差旅",
            Self::Overtime => "加班",
            Self::Equipment => "设备",
            Self::General => "通用",
        }
    }
}

/// Template version
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateVersion {
    pub version: i32,
    pub created_at: i64,
    pub created_by: String,
    pub changes: String,
}

/// Approval template
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: TemplateCategory,
    pub steps: Vec<super::types::ApprovalStep>,
    pub form_schema: HashMap<String, serde_json::Value>,
    pub version: i32,
    pub version_history: Vec<TemplateVersion>,
    pub is_builtin: bool,
    pub is_active: bool,
    pub tags: Vec<String>,
    pub usage_count: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

impl ApprovalTemplate {
    /// Create a new template
    pub fn new(
        name: String,
        description: String,
        category: TemplateCategory,
        steps: Vec<super::types::ApprovalStep>,
        form_schema: HashMap<String, serde_json::Value>,
    ) -> Self {
        let now = Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            description,
            category,
            steps,
            form_schema,
            version: 1,
            version_history: Vec::new(),
            is_builtin: false,
            is_active: true,
            tags: Vec::new(),
            usage_count: 0,
            created_at: now,
            updated_at: now,
        }
    }

    /// Create a builtin template
    pub fn builtin(
        id: &str,
        name: &str,
        description: &str,
        category: TemplateCategory,
        steps: Vec<super::types::ApprovalStep>,
        form_schema: HashMap<String, serde_json::Value>,
        tags: Vec<&str>,
    ) -> Self {
        let now = Utc::now().timestamp();
        Self {
            id: id.to_string(),
            name: name.to_string(),
            description: description.to_string(),
            category,
            steps,
            form_schema,
            version: 1,
            version_history: Vec::new(),
            is_builtin: true,
            is_active: true,
            tags: tags.iter().map(|s| s.to_string()).collect(),
            usage_count: 0,
            created_at: now,
            updated_at: now,
        }
    }

    /// Increment version and add history entry
    pub fn increment_version(&mut self, changes: String, updated_by: String) {
        self.version_history.push(TemplateVersion {
            version: self.version,
            created_at: Utc::now().timestamp(),
            created_by: updated_by,
            changes,
        });
        self.version += 1;
        self.updated_at = Utc::now().timestamp();
    }

    /// Increment usage count
    pub fn increment_usage(&mut self) {
        self.usage_count += 1;
    }
}

/// Template preview
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplatePreview {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: TemplateCategory,
    pub step_count: usize,
    pub is_builtin: bool,
    pub tags: Vec<String>,
    pub usage_count: i64,
}

/// AI recommendation result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateRecommendation {
    pub template_id: String,
    pub template_name: String,
    pub confidence: f32,
    pub reason: String,
}

/// Template service for managing templates
pub struct TemplateService {
    templates: std::sync::Arc<tokio::sync::RwLock<Vec<ApprovalTemplate>>>,
}

impl TemplateService {
    pub fn new() -> Self {
        let service = Self {
            templates: std::sync::Arc::new(tokio::sync::RwLock::new(Vec::new())),
        };
        service.init_builtin_templates();
        service
    }

    /// Initialize with 20+ builtin templates
    fn init_builtin_templates(&self) {
        let templates = template_builtins::get_builtin_templates();
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        rt.block_on(async {
            let mut list = self.templates.write().await;
            *list = templates;
        });
    }

    /// Get all templates
    pub async fn get_all(&self) -> Vec<ApprovalTemplate> {
        self.templates.read().await.clone()
    }

    /// Get templates by category
    pub async fn get_by_category(&self, category: TemplateCategory) -> Vec<ApprovalTemplate> {
        self.templates.read().await
            .iter()
            .filter(|t| t.category == category && t.is_active)
            .cloned()
            .collect()
    }

    /// Get active templates
    pub async fn get_active(&self) -> Vec<ApprovalTemplate> {
        self.templates.read().await
            .iter()
            .filter(|t| t.is_active)
            .cloned()
            .collect()
    }

    /// Get builtin templates
    pub async fn get_builtin(&self) -> Vec<ApprovalTemplate> {
        self.templates.read().await
            .iter()
            .filter(|t| t.is_builtin)
            .cloned()
            .collect()
    }

    /// Get template by ID
    pub async fn get(&self, id: &str) -> Option<ApprovalTemplate> {
        self.templates.read().await
            .iter()
            .find(|t| t.id == id)
            .cloned()
    }

    /// Search templates
    pub async fn search(&self, query: &str) -> Vec<ApprovalTemplate> {
        let query_lower = query.to_lowercase();
        self.templates.read().await
            .iter()
            .filter(|t| {
                t.is_active && (
                    t.name.to_lowercase().contains(&query_lower) ||
                    t.description.to_lowercase().contains(&query_lower) ||
                    t.tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
                )
            })
            .cloned()
            .collect()
    }

    /// Create a new template
    pub async fn create(&self, template: ApprovalTemplate) {
        self.templates.write().await.push(template);
    }

    /// Update a template
    pub async fn update(&self, id: &str, mut template: ApprovalTemplate) -> Option<()> {
        let mut list = self.templates.write().await;
        if let Some(existing) = list.iter_mut().find(|t| t.id == id) {
            template.version = existing.version;
            template.version_history = existing.version_history.clone();
            *existing = template;
            Some(())
        } else {
            None
        }
    }

    /// Delete a template (only non-builtin)
    pub async fn delete(&self, id: &str) -> Option<()> {
        let mut list = self.templates.write().await;
        if let Some(pos) = list.iter().position(|t| t.id == id && !t.is_builtin) {
            list.remove(pos);
            Some(())
        } else {
            None
        }
    }

    /// Get template previews
    pub async fn get_previews(&self) -> Vec<TemplatePreview> {
        self.templates.read().await
            .iter()
            .filter(|t| t.is_active)
            .map(|t| TemplatePreview {
                id: t.id.clone(),
                name: t.name.clone(),
                description: t.description.clone(),
                category: t.category,
                step_count: t.steps.len(),
                is_builtin: t.is_builtin,
                tags: t.tags.clone(),
                usage_count: t.usage_count,
            })
            .collect()
    }

    /// Recommend templates based on form data
    pub async fn recommend(&self, form_data: &HashMap<String, serde_json::Value>) -> Vec<TemplateRecommendation> {
        let mut recommendations = Vec::new();
        let templates = self.templates.read().await;

        // Simple keyword-based recommendation
        let keywords = form_data.values()
            .filter_map(|v| v.as_str())
            .flat_map(|s| s.split(|c: char| c.is_whitespace() || c == ','))
            .map(|s| s.to_lowercase())
            .collect::<Vec<_>>();

        for template in templates.iter().filter(|t| t.is_active) {
            let mut score: f32 = 0.0;

            // Check category keywords
            let category_keywords: HashMap<TemplateCategory, Vec<&str>> = HashMap::from([
                (TemplateCategory::Leave, vec!["请假", "假期", "休息", "离开"]),
                (TemplateCategory::Expense, vec!["报销", "费用", "支出", "发票"]),
                (TemplateCategory::Purchase, vec!["采购", "购买", "订购"]),
                (TemplateCategory::Travel, vec!["出差", "差旅", "旅行", "交通"]),
                (TemplateCategory::Overtime, vec!["加班", "延长", "额外"]),
                (TemplateCategory::Equipment, vec!["设备", "电脑", "办公"]),
            ]);

            if let Some(cat_keywords) = category_keywords.get(&template.category) {
                for kw in cat_keywords {
                    if template.name.contains(*kw) || template.description.contains(*kw) {
                        score += 0.3;
                    }
                }
            }

            // Check form schema match
            for field_key in template.form_schema.keys() {
                for kw in &keywords {
                    if field_key.to_lowercase().contains(kw) {
                        score += 0.1;
                    }
                }
            }

            if score > 0.0 {
                recommendations.push(TemplateRecommendation {
                    template_id: template.id.clone(),
                    template_name: template.name.clone(),
                    confidence: score.min(1.0),
                    reason: format!("匹配度 {:.0}%", score * 100.0),
                });
            }
        }

        recommendations.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
        recommendations.truncate(5);
        recommendations
    }
}

impl Default for TemplateService {
    fn default() -> Self {
        Self::new()
    }
}

/// Get builtin templates (delegates to template_builtins module)
pub fn get_builtin_templates() -> Vec<ApprovalTemplate> {
    template_builtins::get_builtin_templates()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_builtin_templates() {
        let templates = get_builtin_templates();
        assert!(templates.len() >= 20, "Should have at least 20 templates");
    }

    #[tokio::test]
    async fn test_template_service() {
        let service = TemplateService::new();
        let templates = service.get_all().await;
        assert!(!templates.is_empty());
    }

    #[tokio::test]
    async fn test_template_recommend() {
        let service = TemplateService::new();
        let mut form_data = HashMap::new();
        form_data.insert("reason".to_string(), serde_json::json!("我要请假回家"));
        let recommendations = service.recommend(&form_data).await;
        assert!(!recommendations.is_empty());
    }
}
