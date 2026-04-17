//! Management 模块 Tauri 命令

use crate::commands::dashboard::{DashboardStats, get_dashboard_stats_simple};
use crate::management::types::*;
use tauri::State;
use std::sync::Mutex;
use tracing::info;

pub struct ManagementState {
    pub warnings: Mutex<Vec<WarningItem>>,
    pub rules: Mutex<Vec<WarningRule>>,
}

impl ManagementState {
    pub fn new() -> Self {
        Self {
            warnings: Mutex::new(vec![
                WarningItem {
                    id: "warn-001".to_string(),
                    warning_type: "inventory".to_string(),
                    title: "库存不足".to_string(),
                    description: "企业版套餐库存低于安全库存".to_string(),
                    level: "warning".to_string(),
                    source: "warehouse".to_string(),
                    created_at: chrono::Utc::now().timestamp(),
                }
            ]),
            rules: Mutex::new(Vec::new()),
        }
    }
}

impl Default for ManagementState { fn default() -> Self { Self::new() } }

/// 转换 DashboardStats 到 DashboardData
fn convert_dashboard_stats(stats: DashboardStats) -> DashboardData {
    DashboardData {
        total_employees: stats.total_employees as i64,
        total_customers: stats.total_customers as i64,
        total_sales: stats.total_sales,
        total_contracts: stats.total_contracts as i64,
        pending_approvals: stats.pending_approvals as i64,
        pending_inventory: 0, // DashboardStats 暂无此字段
        total_receivable: stats.total_receivable,
        total_payable: stats.total_payable,
    }
}

#[tauri::command]
pub async fn management_get_dashboard(
    tenant_id: Option<String>,
) -> Result<DashboardData, String> {
    // 如果提供了 tenant_id，尝试获取真实数据
    // 否则返回模拟数据（用于未登录状态）
    match tenant_id {
        Some(tid) if !tid.is_empty() => {
            // 调用真实数据获取命令
            // 注意：这里需要获取 app state 中的数据库连接
            // 暂时使用模拟数据，待后续完善状态管理
            tracing::info!("[Management] Getting dashboard for tenant: {}", tid);
            let simple_stats = get_dashboard_stats_simple();
            Ok(convert_dashboard_stats(simple_stats))
        }
        _ => {
            // 返回模拟数据
            Ok(DashboardData {
                total_employees: 3,
                total_customers: 1,
                total_sales: 50000.0,
                total_contracts: 0,
                pending_approvals: 1,
                pending_inventory: 0,
                total_receivable: 50000.0,
                total_payable: 0.0,
            })
        }
    }
}

#[tauri::command]
pub async fn management_list_warnings(state: State<'_, ManagementState>) -> Result<Vec<WarningItem>, String> {
    Ok(state.warnings.lock().unwrap().clone())
}

#[tauri::command]
pub async fn management_create_warning_rule(state: State<'_, ManagementState>, request: CreateWarningRuleRequest) -> Result<WarningRule, String> {
    info!("创建预警规则: {}", request.title);
    let rule = WarningRule {
        id: uuid::Uuid::new_v4().to_string(),
        warning_type: request.warning_type,
        title: request.title,
        condition: request.condition,
        level: request.level,
        created_at: chrono::Utc::now().timestamp(),
    };
    state.rules.lock().unwrap().push(rule.clone());
    Ok(rule)
}

#[tauri::command]
pub async fn management_list_rules(state: State<'_, ManagementState>) -> Result<Vec<WarningRule>, String> {
    Ok(state.rules.lock().unwrap().clone())
}

#[tauri::command]
pub async fn management_get_stats(state: State<'_, ManagementState>) -> Result<ManagementStats, String> {
    let warnings = state.warnings.lock().unwrap();
    let rules = state.rules.lock().unwrap();
    Ok(ManagementStats {
        warnings_count: warnings.len() as i64,
        rules_count: rules.len() as i64,
    })
}
