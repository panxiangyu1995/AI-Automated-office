//! Approval Template Module
//!
//! Implements ADR-016: 审批模板系统
//! Supports 20+ preset templates for common approval scenarios

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
        let templates = get_builtin_templates();
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

/// Get 20+ builtin templates
pub fn get_builtin_templates() -> Vec<ApprovalTemplate> {
    let mut templates = Vec::new();

    // === Leave Templates ===
    templates.push(ApprovalTemplate::builtin(
        "tpl-leave-annual",
        "年假申请",
        "员工申请年假",
        TemplateCategory::Leave,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "EMP001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "请假原因", "required": true})),
        ]),
        vec!["请假", "年假", "假期"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-leave-sick",
        "病假申请",
        "员工申请病假",
        TemplateCategory::Leave,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "hr-001".to_string(), name: "HR".to_string(), employee_id: "HR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("diagnosis".to_string(), serde_json::json!({"type": "textarea", "label": "病情说明", "required": false})),
            ("attachment".to_string(), serde_json::json!({"type": "file", "label": "证明材料", "required": false})),
        ]),
        vec!["病假", "生病", "医疗"],
    ));

    // === Expense Templates ===
    templates.push(ApprovalTemplate::builtin(
        "tpl-expense-general",
        "一般报销",
        "员工提交日常费用报销",
        TemplateCategory::Expense,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "fin-001".to_string(), name: "财务".to_string(), employee_id: "FIN001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("amount".to_string(), serde_json::json!({"type": "number", "label": "报销金额", "required": true})),
            ("category".to_string(), serde_json::json!({"type": "select", "label": "费用类别", "options": ["交通", "餐饮", "办公", "通讯", "其他"], "required": true})),
            ("date".to_string(), serde_json::json!({"type": "date", "label": "发生日期", "required": true})),
            ("description".to_string(), serde_json::json!({"type": "textarea", "label": "费用说明", "required": true})),
            ("receipts".to_string(), serde_json::json!({"type": "file", "label": "发票收据", "required": true, "multiple": true})),
        ]),
        vec!["报销", "费用", "发票"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-expense-travel",
        "差旅报销",
        "员工提交出差费用报销",
        TemplateCategory::Expense,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "fin-001".to_string(), name: "财务".to_string(), employee_id: "FIN001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("travel_date".to_string(), serde_json::json!({"type": "date", "label": "出差日期", "required": true})),
            ("destination".to_string(), serde_json::json!({"type": "text", "label": "目的地", "required": true})),
            ("transportation".to_string(), serde_json::json!({"type": "select", "label": "交通方式", "options": ["飞机", "火车", "汽车", "其他"], "required": true})),
            ("accommodation".to_string(), serde_json::json!({"type": "number", "label": "住宿费", "required": true})),
            ("meals".to_string(), serde_json::json!({"type": "number", "label": "餐饮费", "required": true})),
            ("other".to_string(), serde_json::json!({"type": "number", "label": "其他费用", "required": false})),
            ("total".to_string(), serde_json::json!({"type": "number", "label": "总计", "required": true})),
        ]),
        vec!["差旅", "报销", "出差"],
    ));

    // === Purchase Templates ===
    templates.push(ApprovalTemplate::builtin(
        "tpl-purchase-office",
        "办公用品采购",
        "申请采购办公用品",
        TemplateCategory::Purchase,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "admin-001".to_string(), name: "行政".to_string(), employee_id: "ADM001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: Some(super::types::ApprovalCondition {
                    field: "amount".to_string(),
                    operator: "lte".to_string(),
                    value: serde_json::json!(1000),
                }),
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: Some(super::types::ApprovalCondition {
                    field: "amount".to_string(),
                    operator: "gt".to_string(),
                    value: serde_json::json!(1000),
                }),
            },
        ],
        HashMap::from([
            ("items".to_string(), serde_json::json!({"type": "textarea", "label": "采购物品清单", "required": true})),
            ("amount".to_string(), serde_json::json!({"type": "number", "label": "预算金额", "required": true})),
            ("supplier".to_string(), serde_json::json!({"type": "text", "label": "供应商", "required": false})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "采购原因", "required": true})),
        ]),
        vec!["采购", "办公", "用品"],
    ));

    // === Travel Templates ===
    templates.push(ApprovalTemplate::builtin(
        "tpl-travel-domestic",
        "国内出差",
        "员工申请国内出差",
        TemplateCategory::Travel,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("destination".to_string(), serde_json::json!({"type": "text", "label": "目的地", "required": true})),
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("purpose".to_string(), serde_json::json!({"type": "textarea", "label": "出差目的", "required": true})),
            ("budget".to_string(), serde_json::json!({"type": "number", "label": "预算", "required": true})),
        ]),
        vec!["出差", "国内", "差旅"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-travel-abroad",
        "国外出差",
        "员工申请国外出差",
        TemplateCategory::Travel,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "dir-001".to_string(), name: "总监".to_string(), employee_id: "DIR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("destination".to_string(), serde_json::json!({"type": "text", "label": "目的地", "required": true})),
            ("country".to_string(), serde_json::json!({"type": "text", "label": "国家", "required": true})),
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("purpose".to_string(), serde_json::json!({"type": "textarea", "label": "出差目的", "required": true})),
            ("budget".to_string(), serde_json::json!({"type": "number", "label": "预算", "required": true})),
            ("visa".to_string(), serde_json::json!({"type": "file", "label": "签证材料", "required": false})),
        ]),
        vec!["出差", "国外", "海外"],
    ));

    // === Overtime Templates ===
    templates.push(ApprovalTemplate::builtin(
        "tpl-overtime-weekday",
        "工作日加班",
        "员工申请工作日加班",
        TemplateCategory::Overtime,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("date".to_string(), serde_json::json!({"type": "date", "label": "加班日期", "required": true})),
            ("start_time".to_string(), serde_json::json!({"type": "time", "label": "开始时间", "required": true})),
            ("end_time".to_string(), serde_json::json!({"type": "time", "label": "结束时间", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "加班原因", "required": true})),
            ("meal_allowance".to_string(), serde_json::json!({"type": "checkbox", "label": "是否需要餐补", "required": false})),
        ]),
        vec!["加班", "延长", "工作日"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-overtime-weekend",
        "周末加班",
        "员工申请周末加班",
        TemplateCategory::Overtime,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("date".to_string(), serde_json::json!({"type": "date", "label": "加班日期", "required": true})),
            ("start_time".to_string(), serde_json::json!({"type": "time", "label": "开始时间", "required": true})),
            ("end_time".to_string(), serde_json::json!({"type": "time", "label": "结束时间", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "加班原因", "required": true})),
            ("meal_allowance".to_string(), serde_json::json!({"type": "checkbox", "label": "是否需要餐补", "required": false})),
        ]),
        vec!["加班", "周末", "休息日"],
    ));

    // === Equipment Templates ===
    templates.push(ApprovalTemplate::builtin(
        "tpl-equipment-laptop",
        "笔记本电脑申请",
        "申请公司配备笔记本电脑",
        TemplateCategory::Equipment,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "it-001".to_string(), name: "IT".to_string(), employee_id: "IT001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "fin-001".to_string(), name: "财务".to_string(), employee_id: "FIN001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("laptop_type".to_string(), serde_json::json!({"type": "select", "label": "电脑型号", "options": ["MacBook Pro", "ThinkPad X1", "Dell XPS", "其他"], "required": true})),
            ("specs".to_string(), serde_json::json!({"type": "textarea", "label": "配置要求", "required": false})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "申请原因", "required": true})),
        ]),
        vec!["电脑", "笔记本", "设备"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-equipment-monitor",
        "显示器申请",
        "申请外接显示器",
        TemplateCategory::Equipment,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "it-001".to_string(), name: "IT".to_string(), employee_id: "IT001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("monitor_type".to_string(), serde_json::json!({"type": "select", "label": "显示器类型", "options": ["24寸", "27寸", "32寸"], "required": true})),
            ("quantity".to_string(), serde_json::json!({"type": "number", "label": "数量", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "申请原因", "required": true})),
        ]),
        vec!["显示器", "屏幕", "设备"],
    ));

    // === General Templates ===
    templates.push(ApprovalTemplate::builtin(
        "tpl-general-remote",
        "远程办公申请",
        "申请远程办公",
        TemplateCategory::General,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "申请原因", "required": true})),
            ("work_location".to_string(), serde_json::json!({"type": "text", "label": "工作地点", "required": true})),
        ]),
        vec!["远程", "在家", "办公"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-general-certificate",
        "证明申请",
        "申请工作证明",
        TemplateCategory::General,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "hr-001".to_string(), name: "HR".to_string(), employee_id: "HR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("certificate_type".to_string(), serde_json::json!({"type": "select", "label": "证明类型", "options": ["在职证明", "收入证明", "离职证明"], "required": true})),
            ("purpose".to_string(), serde_json::json!({"type": "textarea", "label": "用途说明", "required": true})),
            ("delivery_method".to_string(), serde_json::json!({"type": "select", "label": "领取方式", "options": ["自取", "邮寄"], "required": true})),
        ]),
        vec!["证明", "在职", "收入"],
    ));

    // Add more templates to reach 20+
    templates.push(ApprovalTemplate::builtin(
        "tpl-leave-personal",
        "事假申请",
        "员工申请事假",
        TemplateCategory::Leave,
        vec![super::types::ApprovalStep {
            id: "step-1".to_string(),
            order: 1,
            approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
            step_type: super::types::StepType::Sequential,
            condition: None,
        }],
        HashMap::from([
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "请假原因", "required": true})),
        ]),
        vec!["事假", "请假", "私人"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-leave-maternity",
        "产假申请",
        "员工申请产假",
        TemplateCategory::Leave,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "hr-001".to_string(), name: "HR".to_string(), employee_id: "HR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("attachment".to_string(), serde_json::json!({"type": "file", "label": "证明材料", "required": true})),
        ]),
        vec!["产假", "生育", "请假"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-leave-funeral",
        "丧假申请",
        "员工申请丧假",
        TemplateCategory::Leave,
        vec![super::types::ApprovalStep {
            id: "step-1".to_string(),
            order: 1,
            approvers: vec![super::types::Approver { id: "hr-001".to_string(), name: "HR".to_string(), employee_id: "HR001".to_string() }],
            step_type: super::types::StepType::Sequential,
            condition: None,
        }],
        HashMap::from([
            ("relationship".to_string(), serde_json::json!({"type": "select", "label": "与逝者关系", "options": ["配偶", "父母", "子女", "兄弟姐妹", "祖父母", "其他"], "required": true})),
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("days".to_string(), serde_json::json!({"type": "number", "label": "天数", "required": true})),
        ]),
        vec!["丧假", "请假", "奔丧"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-expense-entertainment",
        "招待费报销",
        "业务招待费用报销",
        TemplateCategory::Expense,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "fin-001".to_string(), name: "财务".to_string(), employee_id: "FIN001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("amount".to_string(), serde_json::json!({"type": "number", "label": "金额", "required": true})),
            ("guest_name".to_string(), serde_json::json!({"type": "text", "label": "客人姓名", "required": true})),
            ("guest_company".to_string(), serde_json::json!({"type": "text", "label": "客人公司", "required": true})),
            ("date".to_string(), serde_json::json!({"type": "date", "label": "日期", "required": true})),
            ("purpose".to_string(), serde_json::json!({"type": "textarea", "label": "招待目的", "required": true})),
            ("receipts".to_string(), serde_json::json!({"type": "file", "label": "发票收据", "required": true})),
        ]),
        vec!["招待", "应酬", "报销"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-purchase-fixed",
        "固定资产采购",
        "申请采购固定资产",
        TemplateCategory::Purchase,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "fin-001".to_string(), name: "财务".to_string(), employee_id: "FIN001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-3".to_string(),
                order: 3,
                approvers: vec![super::types::Approver { id: "ceo-001".to_string(), name: "CEO".to_string(), employee_id: "CEO001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: Some(super::types::ApprovalCondition {
                    field: "amount".to_string(),
                    operator: "gte".to_string(),
                    value: serde_json::json!(50000),
                }),
            },
        ],
        HashMap::from([
            ("item_name".to_string(), serde_json::json!({"type": "text", "label": "资产名称", "required": true})),
            ("category".to_string(), serde_json::json!({"type": "select", "label": "资产类别", "options": ["电子设备", "家具", "车辆", "其他"], "required": true})),
            ("amount".to_string(), serde_json::json!({"type": "number", "label": "金额", "required": true})),
            ("supplier".to_string(), serde_json::json!({"type": "text", "label": "供应商", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "采购原因", "required": true})),
        ]),
        vec!["固定资产", "采购", "资产"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-travel-meeting",
        "会议出差",
        "参加外部会议出差",
        TemplateCategory::Travel,
        vec![super::types::ApprovalStep {
            id: "step-1".to_string(),
            order: 1,
            approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
            step_type: super::types::StepType::Sequential,
            condition: None,
        }],
        HashMap::from([
            ("meeting_name".to_string(), serde_json::json!({"type": "text", "label": "会议名称", "required": true})),
            ("organizer".to_string(), serde_json::json!({"type": "text", "label": "主办方", "required": true})),
            ("destination".to_string(), serde_json::json!({"type": "text", "label": "会议地点", "required": true})),
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("budget".to_string(), serde_json::json!({"type": "number", "label": "预算", "required": true})),
        ]),
        vec!["会议", "出差", "外部"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-general-resignation",
        "离职申请",
        "员工提交离职申请",
        TemplateCategory::General,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "hr-001".to_string(), name: "HR".to_string(), employee_id: "HR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("last_day".to_string(), serde_json::json!({"type": "date", "label": "最后工作日", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "离职原因", "required": true})),
            ("handover".to_string(), serde_json::json!({"type": "textarea", "label": "工作交接说明", "required": true})),
        ]),
        vec!["离职", "辞职", "离开"],
    ));

    templates
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
