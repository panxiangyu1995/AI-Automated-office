//! Finance Aggregate 工具
//!
//! 财务统计聚合工具

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use serde::{Deserialize, Serialize};
use serde_json::json;

use super::{DateRange, FinanceRole, FinanceStatistics};
use crate::agent::tools::descriptor::{Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType};

/// 统计查询参数
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinanceAggregateParams {
    /// 日期范围
    pub date_range: DateRange,
    /// 部门（可选）
    pub department: Option<String>,
    /// 类别（可选）
    pub category: Option<String>,
    /// 是否包含敏感数据
    #[serde(default)]
    pub include_sensitive: bool,
}

/// 财务统计聚合工具
#[derive(Debug, Clone)]
pub struct FinanceAggregateTool {
    /// 模拟数据
    mock_data: Arc<RwLock<Vec<FinanceMockRecord>>>,
}

#[derive(Debug, Clone)]
struct FinanceMockRecord {
    department: String,
    category: String,
    amount: f64,
    status: String,
}

/// 默认实现
impl Default for FinanceAggregateTool {
    fn default() -> Self {
        Self {
            mock_data: Arc::new(RwLock::new(Self::create_mock_data())),
        }
    }
}

impl FinanceAggregateTool {
    /// 创建模拟数据
    fn create_mock_data() -> Vec<FinanceMockRecord> {
        vec![
            FinanceMockRecord { department: "技术部".to_string(), category: "办公费用".to_string(), amount: 1500.0, status: "approved".to_string() },
            FinanceMockRecord { department: "技术部".to_string(), category: "设备采购".to_string(), amount: 8000.0, status: "approved".to_string() },
            FinanceMockRecord { department: "销售部".to_string(), category: "差旅费".to_string(), amount: 3500.0, status: "approved".to_string() },
            FinanceMockRecord { department: "销售部".to_string(), category: "客户招待".to_string(), amount: 2000.0, status: "pending".to_string() },
            FinanceMockRecord { department: "市场部".to_string(), category: "广告投放".to_string(), amount: 12000.0, status: "approved".to_string() },
            FinanceMockRecord { department: "市场部".to_string(), category: "展会费用".to_string(), amount: 5000.0, status: "approved".to_string() },
            FinanceMockRecord { department: "人事部".to_string(), category: "培训费".to_string(), amount: 3000.0, status: "approved".to_string() },
            FinanceMockRecord { department: "财务部".to_string(), category: "审计费".to_string(), amount: 15000.0, status: "approved".to_string() },
        ]
    }

    /// 检查角色权限
    fn check_permission(role: FinanceRole) -> Result<(), String> {
        match role {
            FinanceRole::Staff => Err("您的角色无权使用此功能".to_string()),
            FinanceRole::Specialist | FinanceRole::Manager | FinanceRole::Executive => Ok(()),
        }
    }

    /// 执行统计
    pub async fn execute(
        &self,
        params: FinanceAggregateParams,
        role: FinanceRole,
    ) -> Result<serde_json::Value, String> {
        // 1. 权限检查
        Self::check_permission(role)?;

        let data = self.mock_data.read().await;

        // 2. 过滤数据
        let filtered: Vec<&FinanceMockRecord> = data.iter()
            .filter(|r| {
                if let Some(ref dept) = params.department {
                    if &r.department != dept {
                        return false;
                    }
                }
                if let Some(ref cat) = params.category {
                    if &r.category != cat {
                        return false;
                    }
                }
                true
            })
            .collect();

        // 3. 聚合计算
        let total_amount: f64 = filtered.iter().map(|r| r.amount).sum();
        let total_count = filtered.len();

        // 按类别统计
        let mut by_category: HashMap<String, f64> = HashMap::new();
        for record in &filtered {
            *by_category.entry(record.category.clone()).or_insert(0.0) += record.amount;
        }

        // 按部门统计
        let mut by_department: HashMap<String, f64> = HashMap::new();
        for record in &filtered {
            *by_department.entry(record.department.clone()).or_insert(0.0) += record.amount;
        }

        // 按状态统计
        let mut by_status: HashMap<String, usize> = HashMap::new();
        for record in &filtered {
            *by_status.entry(record.status.clone()).or_insert(0) += 1;
        }

        // 4. 构建响应
        let mut response = json!({
            "success": true,
            "data": {
                "totalAmount": total_amount,
                "totalCount": total_count,
                "byCategory": by_category,
                "byDepartment": by_department,
                "byStatus": by_status,
                "periodStart": params.date_range.start,
                "periodEnd": params.date_range.end,
            }
        });

        // 5. 敏感数据过滤（只有 Manager 和 Executive 可以看到）
        if role == FinanceRole::Executive && params.include_sensitive {
            response["data"]["sensitive"] = json!({
                "profitMargin": 0.25,
                "costBreakdown": {
                    "人力成本": 0.4,
                    "运营成本": 0.35,
                    "其他": 0.25
                }
            });
        }

        Ok(response)
    }
}

impl Tool for FinanceAggregateTool {
    fn name(&self) -> &str {
        "finance_aggregate"
    }

    fn description(&self) -> &str {
        "财务数据统计分析"
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
                name: "dateRange".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::Object),
                description: "日期范围".to_string(),
                required: true,
                default: None,
                r#enum: None,
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: Some({
                    let mut props = HashMap::new();
                    props.insert("start".to_string(), ToolParameter {
                        name: "start".to_string(),
                        param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                        description: "开始日期".to_string(),
                        required: true,
                        default: None,
                        r#enum: None,
                        minimum: None,
                        maximum: None,
                        pattern: Some(r"^\d{4}-\d{2}-\d{2}$".to_string()),
                        items: None,
                        properties: None,
                    });
                    props.insert("end".to_string(), ToolParameter {
                        name: "end".to_string(),
                        param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                        description: "结束日期".to_string(),
                        required: true,
                        default: None,
                        r#enum: None,
                        minimum: None,
                        maximum: None,
                        pattern: Some(r"^\d{4}-\d{2}-\d{2}$".to_string()),
                        items: None,
                        properties: None,
                    });
                    props
                }),
            },
            ToolParameter {
                name: "department".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "部门（可选）".to_string(),
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
                name: "category".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "费用类别（可选）".to_string(),
                required: false,
                default: None,
                r#enum: None,
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
        ]
    }

    fn return_type(&self) -> ToolReturnType {
        ToolReturnType {
            return_type: crate::agent::tools::descriptor::ToolParameterType::Object,
            description: Some("统计数据".to_string()),
            items: None,
            properties: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_staff_denied() {
        let tool = FinanceAggregateTool::default();
        let result = tool.execute(
            FinanceAggregateParams {
                date_range: DateRange {
                    start: "2026-01-01".to_string(),
                    end: "2026-03-31".to_string(),
                },
                department: None,
                category: None,
                include_sensitive: false,
            },
            FinanceRole::Staff,
        ).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("无权使用"));
    }

    #[tokio::test]
    async fn test_manager_allowed() {
        let tool = FinanceAggregateTool::default();
        let result = tool.execute(
            FinanceAggregateParams {
                date_range: DateRange {
                    start: "2026-01-01".to_string(),
                    end: "2026-03-31".to_string(),
                },
                department: None,
                category: None,
                include_sensitive: false,
            },
            FinanceRole::Manager,
        ).await;

        assert!(result.is_ok());
        let data = result.unwrap();
        assert!(data["data"]["totalAmount"].is_number());
    }

    #[tokio::test]
    async fn test_department_filter() {
        let tool = FinanceAggregateTool::default();
        let result = tool.execute(
            FinanceAggregateParams {
                date_range: DateRange {
                    start: "2026-01-01".to_string(),
                    end: "2026-03-31".to_string(),
                },
                department: Some("技术部".to_string()),
                category: None,
                include_sensitive: false,
            },
            FinanceRole::Manager,
        ).await.unwrap();

        let total = result["data"]["totalAmount"].as_f64().unwrap();
        assert!(total > 0.0);
    }
}
