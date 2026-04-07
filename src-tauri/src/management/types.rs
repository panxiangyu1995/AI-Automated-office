//! Management 模块数据类型

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardData {
    pub total_employees: i64,
    pub total_customers: i64,
    pub total_sales: f64,
    pub total_contracts: i64,
    pub pending_approvals: i64,
    pub pending_inventory: i64,
    pub total_receivable: f64,
    pub total_payable: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WarningItem {
    pub id: String,
    pub warning_type: String,
    pub title: String,
    pub description: String,
    pub level: String,
    pub source: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWarningRuleRequest {
    pub warning_type: String,
    pub title: String,
    pub condition: String,
    pub level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WarningRule {
    pub id: String,
    pub warning_type: String,
    pub title: String,
    pub condition: String,
    pub level: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManagementStats {
    pub warnings_count: i64,
    pub rules_count: i64,
}
