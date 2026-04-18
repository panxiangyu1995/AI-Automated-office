//! Management 模块 Tauri 命令

use crate::commands::dashboard::{DashboardStats, get_dashboard_stats};
use crate::management::types::*;
use tauri::State;
use std::sync::Mutex;
use tracing::info;
use std::sync::Arc;
use tokio::sync::RwLock;
use sqlx::SqlitePool;

pub struct ManagementState {
    pub warnings: Mutex<Vec<WarningItem>>,
    pub rules: Mutex<Vec<WarningRule>>,
    pub db_pool: Arc<RwLock<Option<SqlitePool>>>,
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
            db_pool: Arc::new(RwLock::new(None)),
        }
    }
    
    pub async fn with_pool(pool: SqlitePool) -> Self {
        let mut state = Self::new();
        *state.db_pool.write().await = Some(pool);
        state
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
    state: tauri::State<'_, Arc<RwLock<Option<SqlitePool>>>>,
    tenant_id: Option<String>,
) -> Result<DashboardData, String> {
    // 如果提供了 tenant_id，尝试获取真实数据
    // 否则返回模拟数据（用于未登录状态）
    match tenant_id {
        Some(tid) if !tid.is_empty() => {
            tracing::info!("[Management] Getting dashboard for tenant: {}", tid);
            
            // 从 app state 获取数据库连接
            let pool_guard = state.read().await;
            let pool = pool_guard.as_ref().ok_or_else(|| {
                "数据库连接未初始化，请先登录".to_string()
            })?;
            
            // 调用真实数据获取命令
            let stats = get_dashboard_stats_internal(pool, &tid).await;
            Ok(convert_dashboard_stats_from_dashboard_stats(&stats))
        }
        _ => {
            // 返回模拟数据
            Ok(DashboardData {
                total_employees: 0,
                total_customers: 0,
                total_sales: 0.0,
                total_contracts: 0,
                pending_approvals: 0,
                pending_inventory: 0,
                total_receivable: 0.0,
                total_payable: 0.0,
            })
        }
    }
}

/// 内部函数：从数据库获取真实 Dashboard 统计
async fn get_dashboard_stats_internal(pool: &SqlitePool, tenant_id: &str) -> DashboardStats {
    use sqlx::Row;
    
    // 并行查询各部门数据
    let (employees, customers, sales, contracts, approvals, receivable, payable) = tokio::join!(
        async {
            sqlx::query("SELECT COUNT(*) as count FROM hr_employees WHERE tenant_id = ? AND status = 'active';")
                .bind(tenant_id)
                .fetch_one(pool)
                .await
                .map(|r| r.try_get::<i64, _>("count").unwrap_or(0) as u32)
                .unwrap_or(0)
        },
        async {
            sqlx::query("SELECT COUNT(*) as count FROM sales_customers WHERE tenant_id = ? AND status = 'active';")
                .bind(tenant_id)
                .fetch_one(pool)
                .await
                .map(|r| r.try_get::<i64, _>("count").unwrap_or(0) as u32)
                .unwrap_or(0)
        },
        async {
            sqlx::query("SELECT COALESCE(SUM(amount), 0) as total FROM sales_orders WHERE tenant_id = ? AND status = 'completed';")
                .bind(tenant_id)
                .fetch_one(pool)
                .await
                .map(|r| r.try_get::<f64, _>("total").unwrap_or(0.0))
                .unwrap_or(0.0)
        },
        async {
            sqlx::query("SELECT COUNT(*) as count FROM sales_contracts WHERE tenant_id = ?;")
                .bind(tenant_id)
                .fetch_one(pool)
                .await
                .map(|r| r.try_get::<i64, _>("count").unwrap_or(0) as u32)
                .unwrap_or(0)
        },
        async {
            sqlx::query("SELECT COUNT(*) as count FROM approvals WHERE tenant_id = ? AND status = 'pending';")
                .bind(tenant_id)
                .fetch_one(pool)
                .await
                .map(|r| r.try_get::<i64, _>("count").unwrap_or(0) as u32)
                .unwrap_or(0)
        },
        async {
            sqlx::query("SELECT COALESCE(SUM(amount), 0) as total FROM finance_receivable WHERE tenant_id = ? AND status = 'unpaid';")
                .bind(tenant_id)
                .fetch_one(pool)
                .await
                .map(|r| r.try_get::<f64, _>("total").unwrap_or(0.0))
                .unwrap_or(0.0)
        },
        async {
            sqlx::query("SELECT COALESCE(SUM(amount), 0) as total FROM finance_payable WHERE tenant_id = ? AND status = 'unpaid';")
                .bind(tenant_id)
                .fetch_one(pool)
                .await
                .map(|r| r.try_get::<f64, _>("total").unwrap_or(0.0))
                .unwrap_or(0.0)
        },
    );

    DashboardStats {
        total_employees: employees,
        total_customers: customers,
        total_sales: sales,
        total_contracts: contracts,
        pending_approvals: approvals,
        total_receivable: receivable,
        total_payable: payable,
        service_tickets: crate::commands::dashboard::ServiceTicketStats {
            total: 0,
            pending: 0,
            completed: 0,
        },
        last_updated: chrono::Utc::now().to_rfc3339(),
    }
}

/// 转换 DashboardStats 到 DashboardData
fn convert_dashboard_stats_from_dashboard_stats(stats: &DashboardStats) -> DashboardData {
    DashboardData {
        total_employees: stats.total_employees as i64,
        total_customers: stats.total_customers as i64,
        total_sales: stats.total_sales,
        total_contracts: stats.total_contracts as i64,
        pending_approvals: stats.pending_approvals as i64,
        pending_inventory: 0,
        total_receivable: stats.total_receivable,
        total_payable: stats.total_payable,
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
