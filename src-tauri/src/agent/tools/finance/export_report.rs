//! Finance Export & Report 工具
//!
//! 财务报表导出和生成工具


use serde::Deserialize;
use serde_json::json;

use super::FinanceRole;
use crate::agent::tools::descriptor::{Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType};

/// 导出请求参数
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinanceExportParams {
    /// 导出格式
    pub format: String,
    /// 日期范围
    pub date_range: Option<ExportDateRange>,
    /// 部门（可选）
    pub department: Option<String>,
    /// 是否包含汇总
    #[serde(default)]
    pub include_summary: bool,
}

/// 日期范围
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportDateRange {
    pub start: String,
    pub end: String,
}

/// 报表生成参数
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinanceReportParams {
    /// 报表类型
    pub report_type: String,
    /// 日期范围
    pub date_range: ExportDateRange,
    /// 是否包含图表
    #[serde(default)]
    pub include_charts: bool,
    /// 图表类型
    #[serde(default = "default_chart_type")]
    pub chart_type: String,
}

fn default_chart_type() -> String {
    "bar".to_string()
}

/// 财务导出工具
#[derive(Debug, Clone)]
pub struct FinanceExportTool;

impl Default for FinanceExportTool {
    fn default() -> Self {
        Self
    }
}

impl FinanceExportTool {
    /// 检查格式权限
    fn check_format_permission(role: FinanceRole, format: &str) -> Result<(), String> {
        let allowed_formats = match role {
            FinanceRole::Specialist => vec!["excel", "pdf"],
            FinanceRole::Manager | FinanceRole::Executive => vec!["excel", "pdf", "csv", "json"],
            _ => return Err("您的角色无权使用导出功能".to_string()),
        };

        if !allowed_formats.contains(&format.to_lowercase().as_str()) {
            return Err(format!(
                "您的角色无权导出 {} 格式，请使用 {}",
                format,
                allowed_formats.join("/")
            ));
        }
        Ok(())
    }

    /// 执行导出
    pub async fn execute(
        &self,
        params: FinanceExportParams,
        role: FinanceRole,
    ) -> Result<serde_json::Value, String> {
        // 1. 格式权限检查
        Self::check_format_permission(role, &params.format)?;

        // 2. 生成导出数据（模拟）
        let file_name = format!(
            "财务导出_{}_{}.{}",
            params.date_range.as_ref().map(|r| r.start.replace("-", "")).unwrap_or_else(|| "全部".to_string()),
            params.date_range.as_ref().map(|r| r.end.replace("-", "")).unwrap_or_default(),
            params.format.to_lowercase()
        );

        let file_size = (1000.0 + rand_f64() * 9000.0) as u64;

        Ok(json!({
            "success": true,
            "message": "导出任务已创建",
            "data": {
                "fileName": file_name,
                "format": params.format.to_lowercase(),
                "fileSize": file_size,
                "downloadUrl": format!("/downloads/{}", file_name),
                "expiresAt": "2026-04-10T12:00:00Z",
            }
        }))
    }
}

impl Tool for FinanceExportTool {
    fn name(&self) -> &str {
        "finance_export"
    }

    fn description(&self) -> &str {
        "导出财务报表"
    }

    fn capabilities(&self) -> ToolCapabilities {
        ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: true,
            requires_permission: true,
            requires_confirmation: false,
            is_read_only: false,
            has_side_effects: false,
            supports_retry: false,
            estimated_duration: None,
        }
    }

    fn parameters(&self) -> Vec<ToolParameter> {
        vec![
            ToolParameter {
                name: "format".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "导出格式".to_string(),
                required: true,
                default: None,
                r#enum: Some(vec![
                    "excel".to_string(),
                    "pdf".to_string(),
                    "csv".to_string(),
                    "json".to_string(),
                ]),
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "dateRange".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::Object),
                description: "日期范围".to_string(),
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
        ]
    }

    fn return_type(&self) -> ToolReturnType {
        ToolReturnType {
            return_type: crate::agent::tools::descriptor::ToolParameterType::Object,
            description: Some("导出结果".to_string()),
            items: None,
            properties: None,
        }
    }
}

/// 财务报表工具
#[derive(Debug, Clone)]
pub struct FinanceReportTool;

impl Default for FinanceReportTool {
    fn default() -> Self {
        Self
    }
}

impl FinanceReportTool {
    /// 检查角色权限
    fn check_permission(role: FinanceRole) -> Result<(), String> {
        match role {
            FinanceRole::Staff | FinanceRole::Specialist => {
                Err("您的角色无权生成财务报告".to_string())
            }
            FinanceRole::Manager | FinanceRole::Executive => Ok(()),
        }
    }

    /// 执行报表生成
    pub async fn execute(
        &self,
        params: FinanceReportParams,
        role: FinanceRole,
    ) -> Result<serde_json::Value, String> {
        // 1. 权限检查
        Self::check_permission(role)?;

        // 2. 生成报表
        let report_id = format!("RPT{:08}", (rand_f64() * 100000000.0) as u64);
        let report_name = match params.report_type.as_str() {
            "monthly" => "月度财务报表",
            "quarterly" => "季度财务报表",
            "annual" => "年度财务报表",
            "expense" => "费用分析报告",
            "budget" => "预算执行报告",
            _ => "自定义财务报告",
        };

        Ok(json!({
            "success": true,
            "message": "报表生成任务已创建",
            "data": {
                "reportId": report_id,
                "reportName": report_name,
                "reportType": params.report_type,
                "periodStart": params.date_range.start,
                "periodEnd": params.date_range.end,
                "includeCharts": params.include_charts,
                "chartType": if params.include_charts { Some(params.chart_type) } else { None },
                "status": "generating",
                "estimatedTime": 30, // 秒
                "notifyWhenComplete": true,
            }
        }))
    }
}

impl Tool for FinanceReportTool {
    fn name(&self) -> &str {
        "finance_report"
    }

    fn description(&self) -> &str {
        "生成财务分析报告"
    }

    fn capabilities(&self) -> ToolCapabilities {
        ToolCapabilities {
            supports_streaming: true,
            supports_cancellation: true,
            requires_permission: true,
            requires_confirmation: true,
            is_read_only: false,
            has_side_effects: false,
            supports_retry: false,
            estimated_duration: None,
        }
    }

    fn parameters(&self) -> Vec<ToolParameter> {
        vec![
            ToolParameter {
                name: "reportType".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "报表类型".to_string(),
                required: true,
                default: None,
                r#enum: Some(vec![
                    "monthly".to_string(),
                    "quarterly".to_string(),
                    "annual".to_string(),
                    "expense".to_string(),
                    "budget".to_string(),
                ]),
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
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
                properties: None,
            },
            ToolParameter {
                name: "includeCharts".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::Boolean),
                description: "是否包含图表".to_string(),
                required: false,
                default: Some(serde_json::json!(true)),
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
            description: Some("报表生成结果".to_string()),
            items: None,
            properties: None,
        }
    }
}

/// 生成随机 f64
fn rand_f64() -> f64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos() as f64;
    (nanos as f64) / (u32::MAX as f64)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_export_permission() {
        let tool = FinanceExportTool::default();
        
        // Specialist 可以导出 excel/pdf
        let result = tool.execute(
            FinanceExportParams {
                format: "excel".to_string(),
                date_range: None,
                department: None,
                include_summary: true,
            },
            FinanceRole::Specialist,
        ).await;
        assert!(result.is_ok());

        // Specialist 不能导出 csv/json
        let result = tool.execute(
            FinanceExportParams {
                format: "csv".to_string(),
                date_range: None,
                department: None,
                include_summary: false,
            },
            FinanceRole::Specialist,
        ).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_report_permission() {
        let tool = FinanceReportTool::default();
        
        // Staff 不能生成报表
        let result = tool.execute(
            FinanceReportParams {
                report_type: "monthly".to_string(),
                date_range: ExportDateRange {
                    start: "2026-01-01".to_string(),
                    end: "2026-01-31".to_string(),
                },
                include_charts: true,
                chart_type: "bar".to_string(),
            },
            FinanceRole::Staff,
        ).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_manager_can_generate_report() {
        let tool = FinanceReportTool::default();
        
        let result = tool.execute(
            FinanceReportParams {
                report_type: "monthly".to_string(),
                date_range: ExportDateRange {
                    start: "2026-01-01".to_string(),
                    end: "2026-01-31".to_string(),
                },
                include_charts: true,
                chart_type: "line".to_string(),
            },
            FinanceRole::Manager,
        ).await;
        assert!(result.is_ok());
    }
}
