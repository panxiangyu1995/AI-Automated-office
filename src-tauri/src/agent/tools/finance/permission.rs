//! Finance 权限配置
//!
//! 实现四级角色权限矩阵

use std::collections::HashMap;
use super::{FinanceRole, FinanceTool};

/// 财务角色权限配置
pub struct FinancePermissionConfig {
    /// 角色对应的工具权限
    pub tool_permissions: HashMap<FinanceRole, Vec<FinanceTool>>,
    /// 角色的数据范围
    pub data_scope: HashMap<FinanceRole, FinanceDataScope>,
    /// OCR 频率限制
    pub ocr_rate_limit: HashMap<FinanceRole, u32>,
    /// 单笔金额限制
    pub amount_limit: HashMap<FinanceRole, Option<f64>>,
    /// 允许的导出格式
    pub export_formats: HashMap<FinanceRole, Vec<&'static str>>,
}

/// 数据范围
#[derive(Debug, Clone, Copy)]
pub enum FinanceDataScope {
    /// 仅本人数据
    Personal,
    /// 本部门数据
    Department,
    /// 全部数据
    All,
    /// 高管数据范围
    Executive,
}

impl Default for FinancePermissionConfig {
    fn default() -> Self {
        Self::new()
    }
}

impl FinancePermissionConfig {
    /// 创建默认权限配置
    pub fn new() -> Self {
        let mut tool_permissions = HashMap::new();
        tool_permissions.insert(FinanceRole::Staff, vec![
            FinanceTool::Query,
            FinanceTool::Ocr,
            FinanceTool::Mutate,
        ]);
        tool_permissions.insert(FinanceRole::Specialist, vec![
            FinanceTool::Query,
            FinanceTool::Ocr,
            FinanceTool::Mutate,
            FinanceTool::Aggregate,
            FinanceTool::Export,
        ]);
        tool_permissions.insert(FinanceRole::Manager, vec![
            FinanceTool::Query,
            FinanceTool::Ocr,
            FinanceTool::Mutate,
            FinanceTool::Aggregate,
            FinanceTool::Export,
            FinanceTool::Report,
            FinanceTool::Dashboard,
        ]);
        tool_permissions.insert(FinanceRole::Executive, vec![
            FinanceTool::Query,
            FinanceTool::Ocr,
            FinanceTool::Mutate,
            FinanceTool::Aggregate,
            FinanceTool::Export,
            FinanceTool::Report,
            FinanceTool::Forecast,
            FinanceTool::Dashboard,
        ]);

        let mut data_scope = HashMap::new();
        data_scope.insert(FinanceRole::Staff, FinanceDataScope::Personal);
        data_scope.insert(FinanceRole::Specialist, FinanceDataScope::Department);
        data_scope.insert(FinanceRole::Manager, FinanceDataScope::All);
        data_scope.insert(FinanceRole::Executive, FinanceDataScope::Executive);

        let mut ocr_rate_limit = HashMap::new();
        ocr_rate_limit.insert(FinanceRole::Staff, 10);
        ocr_rate_limit.insert(FinanceRole::Specialist, 100);
        ocr_rate_limit.insert(FinanceRole::Manager, 500);
        ocr_rate_limit.insert(FinanceRole::Executive, 1000);

        let mut amount_limit = HashMap::new();
        amount_limit.insert(FinanceRole::Staff, Some(1000.0));
        amount_limit.insert(FinanceRole::Specialist, Some(10000.0));
        amount_limit.insert(FinanceRole::Manager, Some(100000.0));
        amount_limit.insert(FinanceRole::Executive, None);

        let mut export_formats = HashMap::new();
        export_formats.insert(FinanceRole::Staff, vec![]);
        export_formats.insert(FinanceRole::Specialist, vec!["excel", "pdf"]);
        export_formats.insert(FinanceRole::Manager, vec!["excel", "pdf", "csv"]);
        export_formats.insert(FinanceRole::Executive, vec!["excel", "pdf", "csv", "json"]);

        Self {
            tool_permissions,
            data_scope,
            ocr_rate_limit,
            amount_limit,
            export_formats,
        }
    }
}

/// 获取默认权限配置
pub fn get_default_permission_config() -> FinancePermissionConfig {
    FinancePermissionConfig::new()
}

/// 检查工具权限
pub fn check_tool_permission(role: FinanceRole, tool: FinanceTool) -> bool {
    let config = get_default_permission_config();
    config.tool_permissions
        .get(&role)
        .map(|tools| tools.contains(&tool))
        .unwrap_or(false)
}

/// 获取数据范围
pub fn get_data_scope(role: FinanceRole) -> FinanceDataScope {
    let config = get_default_permission_config();
    config.data_scope.get(&role).copied().unwrap_or(FinanceDataScope::Personal)
}

/// 获取 OCR 频率限制
pub fn get_ocr_rate_limit(role: FinanceRole) -> u32 {
    let config = get_default_permission_config();
    config.ocr_rate_limit.get(&role).copied().unwrap_or(0)
}

/// 获取金额限制
pub fn get_amount_limit(role: FinanceRole) -> Option<f64> {
    let config = get_default_permission_config();
    config.amount_limit.get(&role).copied().unwrap_or(None)
}

/// 获取允许的导出格式
pub fn get_allowed_export_formats(role: FinanceRole) -> Vec<&'static str> {
    let config = get_default_permission_config();
    config.export_formats.get(&role).cloned().unwrap_or_default()
}

/// 敏感字段列表
pub fn get_sensitive_fields(role: FinanceRole) -> Vec<&'static str> {
    match role {
        FinanceRole::Executive => vec!["bank_account", "tax_id", "salary", "bonus"],
        FinanceRole::Manager => vec![],
        FinanceRole::Specialist => vec![],
        FinanceRole::Staff => vec![],
    }
}

/// 隐藏字段（角色看不到的字段）
pub fn get_hidden_fields(role: FinanceRole) -> Vec<&'static str> {
    match role {
        FinanceRole::Staff => vec![
            "applicant_name",
            "department",
            "category",
            "tax_amount",
            "profit_margin",
            "cost_breakdown",
        ],
        FinanceRole::Specialist => vec![
            "tax_amount",
            "profit_margin",
            "cost_breakdown",
        ],
        FinanceRole::Manager => vec![],
        FinanceRole::Executive => vec![],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_staff_permissions() {
        assert!(check_tool_permission(FinanceRole::Staff, FinanceTool::Query));
        assert!(check_tool_permission(FinanceRole::Staff, FinanceTool::Ocr));
        assert!(check_tool_permission(FinanceRole::Staff, FinanceTool::Mutate));
        
        // Staff 不能使用高级功能
        assert!(!check_tool_permission(FinanceRole::Staff, FinanceTool::Aggregate));
        assert!(!check_tool_permission(FinanceRole::Staff, FinanceTool::Report));
        assert!(!check_tool_permission(FinanceRole::Staff, FinanceTool::Forecast));
        
        // Staff 数据范围是个人
        assert_eq!(get_data_scope(FinanceRole::Staff), FinanceDataScope::Personal);
        
        // Staff OCR 限制是 10 次/天
        assert_eq!(get_ocr_rate_limit(FinanceRole::Staff), 10);
        
        // Staff 金额限制是 1000
        assert_eq!(get_amount_limit(FinanceRole::Staff), Some(1000.0));
    }

    #[test]
    fn test_manager_permissions() {
        assert!(check_tool_permission(FinanceRole::Manager, FinanceTool::Query));
        assert!(check_tool_permission(FinanceRole::Manager, FinanceTool::Aggregate));
        assert!(check_tool_permission(FinanceRole::Manager, FinanceTool::Report));
        assert!(check_tool_permission(FinanceRole::Manager, FinanceTool::Dashboard));
        
        // Manager 不能使用预测分析
        assert!(!check_tool_permission(FinanceRole::Manager, FinanceTool::Forecast));
        
        // Manager 数据范围是全部
        assert_eq!(get_data_scope(FinanceRole::Manager), FinanceDataScope::All);
        
        // Manager OCR 限制是 500 次/天
        assert_eq!(get_ocr_rate_limit(FinanceRole::Manager), 500);
    }

    #[test]
    fn test_executive_permissions() {
        // Executive 拥有所有工具权限
        assert!(check_tool_permission(FinanceRole::Executive, FinanceTool::Query));
        assert!(check_tool_permission(FinanceRole::Executive, FinanceTool::Ocr));
        assert!(check_tool_permission(FinanceRole::Executive, FinanceTool::Mutate));
        assert!(check_tool_permission(FinanceRole::Executive, FinanceTool::Aggregate));
        assert!(check_tool_permission(FinanceRole::Executive, FinanceTool::Export));
        assert!(check_tool_permission(FinanceRole::Executive, FinanceTool::Report));
        assert!(check_tool_permission(FinanceRole::Executive, FinanceTool::Forecast));
        assert!(check_tool_permission(FinanceRole::Executive, FinanceTool::Dashboard));
        
        // Executive 没有金额限制
        assert_eq!(get_amount_limit(FinanceRole::Executive), None);
        
        // Executive 可以看到敏感字段
        let sensitive = get_sensitive_fields(FinanceRole::Executive);
        assert!(sensitive.contains(&"bank_account"));
        assert!(sensitive.contains(&"tax_id"));
    }

    #[test]
    fn test_export_formats() {
        let staff_formats = get_allowed_export_formats(FinanceRole::Staff);
        assert!(staff_formats.is_empty());

        let specialist_formats = get_allowed_export_formats(FinanceRole::Specialist);
        assert!(specialist_formats.contains(&"excel"));
        assert!(specialist_formats.contains(&"pdf"));
        assert!(!specialist_formats.contains(&"csv"));

        let executive_formats = get_allowed_export_formats(FinanceRole::Executive);
        assert!(executive_formats.contains(&"excel"));
        assert!(executive_formats.contains(&"csv"));
        assert!(executive_formats.contains(&"json"));
    }
}
