//! Finance Query 工具
//!
//! 发票和报销记录查询工具

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use serde::Deserialize;
use serde_json::json;

use super::{Invoice, InvoiceType, ExpenseStatus, DateRange, AmountRange, FinanceRole};
use crate::agent::tools::descriptor::{Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType};

/// 发票查询参数
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinanceQueryParams {
    /// 发票ID
    pub id: Option<String>,
    /// 申请人ID
    pub applicant_id: Option<String>,
    /// 部门
    pub department: Option<String>,
    /// 发票类型
    pub invoice_type: Option<String>,
    /// 报销状态
    pub status: Option<String>,
    /// 日期范围
    pub date_range: Option<DateRange>,
    /// 金额范围
    pub amount_range: Option<AmountRange>,
    /// 关键词搜索
    pub keyword: Option<String>,
    /// 页码
    #[serde(default = "default_page")]
    pub page: usize,
    /// 每页数量
    #[serde(default = "default_page_size")]
    pub page_size: usize,
}

fn default_page() -> usize { 1 }
fn default_page_size() -> usize { 20 }

/// 发票查询工具
#[derive(Debug, Clone)]
pub struct FinanceQueryTool {
    /// 模拟数据存储（实际应该从数据库读取）
    pub invoices: Arc<RwLock<Vec<Invoice>>>,
}

impl Default for FinanceQueryTool {
    fn default() -> Self {
        Self {
            invoices: Arc::new(RwLock::new(Self::create_mock_data())),
        }
    }
}

impl FinanceQueryTool {
    /// 创建模拟数据
    fn create_mock_data() -> Vec<Invoice> {
        vec![
            Invoice {
                id: "inv-001".to_string(),
                invoice_number: "FP12345678".to_string(),
                invoice_type: InvoiceType::Vat,
                amount: 1500.00,
                tax_amount: Some(195.00),
                date: "2026-03-15".to_string(),
                description: "办公用品采购".to_string(),
                applicant_id: "user-001".to_string(),
                applicant_name: Some("张三".to_string()),
                department: Some("技术部".to_string()),
                category: Some("办公费用".to_string()),
                status: ExpenseStatus::Approved,
                attachments: vec![],
                bank_account: Some("6217***1234".to_string()),
                tax_id: Some("9111***".to_string()),
                created_at: "2026-03-15T10:00:00Z".to_string(),
                updated_at: "2026-03-16T14:30:00Z".to_string(),
            },
            Invoice {
                id: "inv-002".to_string(),
                invoice_number: "FP87654321".to_string(),
                invoice_type: InvoiceType::Normal,
                amount: 350.00,
                tax_amount: None,
                date: "2026-03-20".to_string(),
                description: "出差交通费".to_string(),
                applicant_id: "user-002".to_string(),
                applicant_name: Some("李四".to_string()),
                department: Some("销售部".to_string()),
                category: Some("差旅费".to_string()),
                status: ExpenseStatus::Submitted,
                attachments: vec![],
                bank_account: None,
                tax_id: None,
                created_at: "2026-03-20T09:00:00Z".to_string(),
                updated_at: "2026-03-20T09:00:00Z".to_string(),
            },
            Invoice {
                id: "inv-003".to_string(),
                invoice_number: "FP11223344".to_string(),
                invoice_type: InvoiceType::Hotel,
                amount: 680.00,
                tax_amount: Some(88.00),
                date: "2026-03-25".to_string(),
                description: "客户拜访住宿费".to_string(),
                applicant_id: "user-003".to_string(),
                applicant_name: Some("王五".to_string()),
                department: Some("市场部".to_string()),
                category: Some("差旅费".to_string()),
                status: ExpenseStatus::Draft,
                attachments: vec![],
                bank_account: Some("6217***5678".to_string()),
                tax_id: None,
                created_at: "2026-03-25T18:00:00Z".to_string(),
                updated_at: "2026-03-25T18:00:00Z".to_string(),
            },
        ]
    }

    /// 获取允许的字段（基于角色）
    fn get_allowed_fields(role: FinanceRole) -> Vec<&'static str> {
        match role {
            FinanceRole::Staff => vec![
                "id", "invoice_number", "amount", "date", "description", "status"
            ],
            FinanceRole::Specialist => vec![
                "id", "invoice_number", "amount", "date", "description", "status",
                "applicant_name", "department", "category"
            ],
            FinanceRole::Manager | FinanceRole::Executive => vec![
                "id", "invoice_number", "invoice_type", "amount", "tax_amount",
                "date", "description", "status", "applicant_id", "applicant_name",
                "department", "category", "attachments", "created_at", "updated_at"
            ],
        }
    }

    /// 获取敏感字段
    fn get_sensitive_fields(role: FinanceRole) -> Vec<&'static str> {
        if role == FinanceRole::Executive {
            vec!["bank_account", "tax_id"]
        } else {
            vec![]
        }
    }

    /// 过滤发票字段
    fn filter_invoice(invoice: &Invoice, allowed_fields: &[&str], sensitive_fields: &[&str]) -> serde_json::Value {
        let mut result = serde_json::Map::new();
        
        let all_fields = serde_json::to_value(invoice).unwrap();
        if let serde_json::Value::Object(map) = all_fields {
            for (key, value) in map {
                let should_include = allowed_fields.iter().any(|f| *f == "*") 
                    || allowed_fields.contains(&key.as_str());
                let is_sensitive = sensitive_fields.contains(&key.as_str());
                
                if should_include && !is_sensitive {
                    result.insert(key, value);
                }
            }
        }
        
        serde_json::Value::Object(result)
    }

    /// 执行查询
    pub async fn execute(
        &self, 
        params: FinanceQueryParams, 
        role: FinanceRole,
        user_id: &str,
    ) -> Result<serde_json::Value, String> {
        let invoices = self.invoices.read().await;
        
        // 数据范围过滤
        let filtered: Vec<&Invoice> = invoices.iter()
            .filter(|inv| {
                // 数据范围过滤
                match role {
                    FinanceRole::Staff => {
                        inv.applicant_id == user_id
                    },
                    FinanceRole::Specialist | FinanceRole::Manager | FinanceRole::Executive => {
                        true // 可以看到所有数据
                    }
                }
            })
            .filter(|inv| {
                // ID 过滤
                if let Some(ref id) = params.id {
                    if &inv.id != id {
                        return false;
                    }
                }
                true
            })
            .filter(|inv| {
                // 申请人过滤
                if let Some(ref applicant) = params.applicant_id {
                    if &inv.applicant_id != applicant {
                        return false;
                    }
                }
                true
            })
            .filter(|inv| {
                // 部门过滤
                if let Some(ref dept) = params.department {
                    if inv.department.as_ref() != Some(dept) {
                        return false;
                    }
                }
                true
            })
            .filter(|inv| {
                // 状态过滤
                if let Some(ref status) = params.status {
                    let inv_status = match inv.status {
                        ExpenseStatus::Draft => "draft",
                        ExpenseStatus::Submitted => "submitted",
                        ExpenseStatus::Approved => "approved",
                        ExpenseStatus::Rejected => "rejected",
                        ExpenseStatus::Paid => "paid",
                        ExpenseStatus::Cancelled => "cancelled",
                    };
                    if inv_status != status {
                        return false;
                    }
                }
                true
            })
            .filter(|inv| {
                // 日期范围过滤
                if let Some(ref range) = params.date_range {
                    if inv.date < range.start || inv.date > range.end {
                        return false;
                    }
                }
                true
            })
            .filter(|inv| {
                // 金额范围过滤
                if let Some(ref range) = params.amount_range {
                    if inv.amount < range.min || inv.amount > range.max {
                        return false;
                    }
                }
                true
            })
            .filter(|inv| {
                // 关键词过滤
                if let Some(ref kw) = params.keyword {
                    let kw_lower = kw.to_lowercase();
                    let desc_lower = inv.description.to_lowercase();
                    let num_lower = inv.invoice_number.to_lowercase();
                    if !desc_lower.contains(&kw_lower) && !num_lower.contains(&kw_lower) {
                        return false;
                    }
                }
                true
            })
            .collect();

        let total = filtered.len();
        
        // 分页
        let start = (params.page.saturating_sub(1)) * params.page_size;
        let _end = (start + params.page_size).min(filtered.len());
        let paged: Vec<&Invoice> = filtered.into_iter().skip(start).take(params.page_size).collect();
        
        // 字段过滤
        let allowed_fields = Self::get_allowed_fields(role);
        let sensitive_fields = Self::get_sensitive_fields(role);
        
        let results: Vec<serde_json::Value> = paged
            .into_iter()
            .map(|inv| Self::filter_invoice(inv, &allowed_fields, &sensitive_fields))
            .collect();

        Ok(json!({
            "success": true,
            "data": {
                "total": total,
                "page": params.page,
                "pageSize": params.page_size,
                "invoices": results
            }
        }))
    }
}

impl Tool for FinanceQueryTool {
    fn name(&self) -> &str {
        "finance_query"
    }

    fn description(&self) -> &str {
        "查询发票和报销记录"
    }

    fn capabilities(&self) -> ToolCapabilities {
        ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: false,
            requires_permission: true,
            requires_confirmation: false,
            is_read_only: true,
            has_side_effects: false,
            supports_retry: false,
            estimated_duration: None,
        }
    }

    fn parameters(&self) -> Vec<ToolParameter> {
        vec![
            ToolParameter {
                name: "id".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "发票ID".to_string(),
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
                name: "applicantId".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "申请人ID".to_string(),
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
                name: "department".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "部门".to_string(),
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
                name: "status".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "报销状态".to_string(),
                required: false,
                default: None,
                r#enum: Some(vec![
                    "draft".to_string(),
                    "submitted".to_string(),
                    "approved".to_string(),
                    "rejected".to_string(),
                    "paid".to_string(),
                    "cancelled".to_string(),
                ]),
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "keyword".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "关键词搜索".to_string(),
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
                name: "page".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::Number),
                description: "页码".to_string(),
                required: false,
                default: Some(serde_json::json!(1)),
                r#enum: None,
                minimum: Some(1.0),
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "pageSize".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::Number),
                description: "每页数量".to_string(),
                required: false,
                default: Some(serde_json::json!(20)),
                r#enum: None,
                minimum: Some(1.0),
                maximum: Some(100.0),
                pattern: None,
                items: None,
                properties: None,
            },
        ]
    }

    fn return_type(&self) -> ToolReturnType {
        ToolReturnType {
            return_type: crate::agent::tools::descriptor::ToolParameterType::Object,
            description: Some("发票查询结果".to_string()),
            items: None,
            properties: Some({
                let mut props = HashMap::new();
                props.insert("success".to_string(), ToolReturnType {
                    return_type: crate::agent::tools::descriptor::ToolParameterType::Boolean,
                    description: Some("是否成功".to_string()),
                    items: None,
                    properties: None,
                });
                props.insert("data".to_string(), ToolReturnType {
                    return_type: crate::agent::tools::descriptor::ToolParameterType::Object,
                    description: Some("查询数据".to_string()),
                    items: None,
                    properties: None,
                });
                props
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_query_all() {
        let tool = FinanceQueryTool::default();
        let result = tool.execute(
            FinanceQueryParams {
                id: None,
                applicant_id: None,
                department: None,
                invoice_type: None,
                status: None,
                date_range: None,
                amount_range: None,
                keyword: None,
                page: 1,
                page_size: 20,
            },
            FinanceRole::Executive,
            "user-001",
        ).await.unwrap();

        assert!(result["success"].as_bool().unwrap());
        assert!(result["data"]["invoices"].is_array());
    }

    #[tokio::test]
    async fn test_query_by_status() {
        let tool = FinanceQueryTool::default();
        let result = tool.execute(
            FinanceQueryParams {
                status: Some("approved".to_string()),
                ..Default::default()
            },
            FinanceRole::Executive,
            "user-001",
        ).await.unwrap();

        assert!(result["success"].as_bool().unwrap());
        let invoices = result["data"]["invoices"].as_array().unwrap();
        assert!(!invoices.is_empty());
    }

    #[tokio::test]
    async fn test_staff_field_filtering() {
        let tool = FinanceQueryTool::default();
        let result = tool.execute(
            FinanceQueryParams::default(),
            FinanceRole::Staff,
            "user-001",
        ).await.unwrap();

        // Staff 不应该看到敏感字段
        let invoice = &result["data"]["invoices"][0];
        assert!(invoice.get("bank_account").is_none());
        assert!(invoice.get("tax_id").is_none());
        assert!(invoice.get("applicant_name").is_none()); // Staff 也不应该看到这个字段
    }
}
