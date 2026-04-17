//! Dashboard Dashboard模块
//! 
//! 提供Dashboard统计数据的Tauri命令

use serde::{Deserialize, Serialize};
use chrono::Utc;
use sqlx::{Row, SqlitePool};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Dashboard统计数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    /// 员工总数
    pub total_employees: u32,
    /// 客户总数
    pub total_customers: u32,
    /// 销售总额
    pub total_sales: f64,
    /// 合同总数
    pub total_contracts: u32,
    /// 待审批数
    pub pending_approvals: u32,
    /// 应收总额
    pub total_receivable: f64,
    /// 应付总额
    pub total_payable: f64,
    /// 售后工单
    pub service_tickets: ServiceTicketStats,
    /// 最后更新时间
    pub last_updated: String,
}

/// 售后工单统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceTicketStats {
    /// 总数
    pub total: u32,
    /// 待处理
    pub pending: u32,
    /// 已完成
    pub completed: u32,
}

impl Default for DashboardStats {
    fn default() -> Self {
        Self {
            total_employees: 0,
            total_customers: 0,
            total_sales: 0.0,
            total_contracts: 0,
            pending_approvals: 0,
            total_receivable: 0.0,
            total_payable: 0.0,
            service_tickets: ServiceTicketStats::default(),
            last_updated: Utc::now().to_rfc3339(),
        }
    }
}

impl Default for ServiceTicketStats {
    fn default() -> Self {
        Self {
            total: 0,
            pending: 0,
            completed: 0,
        }
    }
}

/// 查询员工总数
async fn query_employee_count(pool: &SqlitePool, tenant_id: &str) -> Result<u32, String> {
    let row = sqlx::query(
        "SELECT COUNT(*) as count FROM hr_employees WHERE tenant_id = ? AND status = 'active';"
    )
    .bind(tenant_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("查询员工失败: {}", e))?;
    
    let count: i64 = row.try_get("count").unwrap_or(0);
    Ok(count as u32)
}

/// 查询客户总数
async fn query_customer_count(pool: &SqlitePool, tenant_id: &str) -> Result<u32, String> {
    let row = sqlx::query(
        "SELECT COUNT(*) as count FROM sales_customers WHERE tenant_id = ? AND status = 'active';"
    )
    .bind(tenant_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("查询客户失败: {}", e))?;
    
    let count: i64 = row.try_get("count").unwrap_or(0);
    Ok(count as u32)
}

/// 查询销售总额
async fn query_sales_total(pool: &SqlitePool, tenant_id: &str) -> Result<f64, String> {
    let row = sqlx::query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM sales_orders WHERE tenant_id = ? AND status = 'completed';"
    )
    .bind(tenant_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("查询销售额失败: {}", e))?;
    
    let total: f64 = row.try_get("total").unwrap_or(0.0);
    Ok(total)
}

/// 查询合同总数
async fn query_contract_count(pool: &SqlitePool, tenant_id: &str) -> Result<u32, String> {
    let row = sqlx::query(
        "SELECT COUNT(*) as count FROM sales_contracts WHERE tenant_id = ?;"
    )
    .bind(tenant_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("查询合同失败: {}", e))?;
    
    let count: i64 = row.try_get("count").unwrap_or(0);
    Ok(count as u32)
}

/// 查询待审批数
async fn query_pending_approvals(pool: &SqlitePool, tenant_id: &str) -> Result<u32, String> {
    let row = sqlx::query(
        "SELECT COUNT(*) as count FROM approvals WHERE tenant_id = ? AND status = 'pending';"
    )
    .bind(tenant_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("查询待审批失败: {}", e))?;
    
    let count: i64 = row.try_get("count").unwrap_or(0);
    Ok(count as u32)
}

/// 查询应收总额
async fn query_receivable(pool: &SqlitePool, tenant_id: &str) -> Result<f64, String> {
    let row = sqlx::query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM finance_receivable WHERE tenant_id = ? AND status = 'unpaid';"
    )
    .bind(tenant_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("查询应收款失败: {}", e))?;
    
    let total: f64 = row.try_get("total").unwrap_or(0.0);
    Ok(total)
}

/// 查询应付总额
async fn query_payable(pool: &SqlitePool, tenant_id: &str) -> Result<f64, String> {
    let row = sqlx::query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM finance_payable WHERE tenant_id = ? AND status = 'unpaid';"
    )
    .bind(tenant_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("查询应付款失败: {}", e))?;
    
    let total: f64 = row.try_get("total").unwrap_or(0.0);
    Ok(total)
}

/// 查询售后工单统计
async fn query_service_tickets(pool: &SqlitePool, tenant_id: &str) -> Result<ServiceTicketStats, String> {
    // 查询总数
    let total_row = sqlx::query(
        "SELECT COUNT(*) as count FROM service_tickets WHERE tenant_id = ?;"
    )
    .bind(tenant_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("查询工单总数失败: {}", e))?;
    let total: i64 = total_row.try_get("count").unwrap_or(0);

    // 查询待处理数
    let pending_row = sqlx::query(
        "SELECT COUNT(*) as count FROM service_tickets WHERE tenant_id = ? AND status = 'pending';"
    )
    .bind(tenant_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("查询待处理工单失败: {}", e))?;
    let pending: i64 = pending_row.try_get("count").unwrap_or(0);

    // 查询已完成数
    let completed_row = sqlx::query(
        "SELECT COUNT(*) as count FROM service_tickets WHERE tenant_id = ? AND status = 'completed';"
    )
    .bind(tenant_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("查询已完成工单失败: {}", e))?;
    let completed: i64 = completed_row.try_get("count").unwrap_or(0);

    Ok(ServiceTicketStats {
        total: total as u32,
        pending: pending as u32,
        completed: completed as u32,
    })
}

/// 获取Dashboard统计数据
/// 
/// 从各个业务模块聚合统计数据
#[tauri::command]
pub async fn get_dashboard_stats(
    state: tauri::State<'_, Arc<RwLock<Option<SqlitePool>>>>,
    tenant_id: String,
) -> Result<DashboardStats, String> {
    tracing::info!("[Dashboard] Getting stats for tenant: {}", tenant_id);
    
    let pool_guard = state.read().await;
    let pool = pool_guard.as_ref().ok_or_else(|| {
        "数据库连接未初始化，请先登录".to_string()
    })?;
    
    // 并行查询各部门数据
    let (
        employees_result,
        customers_result,
        sales_result,
        contracts_result,
        approvals_result,
        receivable_result,
        payable_result,
        tickets_result,
    ) = tokio::join!(
        query_employee_count(pool, &tenant_id),
        query_customer_count(pool, &tenant_id),
        query_sales_total(pool, &tenant_id),
        query_contract_count(pool, &tenant_id),
        query_pending_approvals(pool, &tenant_id),
        query_receivable(pool, &tenant_id),
        query_payable(pool, &tenant_id),
        query_service_tickets(pool, &tenant_id),
    );
    
    let stats = DashboardStats {
        total_employees: employees_result.unwrap_or(0),
        total_customers: customers_result.unwrap_or(0),
        total_sales: sales_result.unwrap_or(0.0),
        total_contracts: contracts_result.unwrap_or(0),
        pending_approvals: approvals_result.unwrap_or(0),
        total_receivable: receivable_result.unwrap_or(0.0),
        total_payable: payable_result.unwrap_or(0.0),
        service_tickets: tickets_result.unwrap_or_default(),
        last_updated: Utc::now().to_rfc3339(),
    };
    
    tracing::info!("[Dashboard] Stats retrieved successfully: {:?}", stats);
    Ok(stats)
}

/// 获取Dashboard统计数据（简化版，仅返回模拟数据用于测试）
#[tauri::command]
pub fn get_dashboard_stats_simple() -> DashboardStats {
    DashboardStats {
        total_employees: 156,
        total_customers: 89,
        total_sales: 2560000.0,
        total_contracts: 42,
        pending_approvals: 8,
        total_receivable: 890000.0,
        total_payable: 450000.0,
        service_tickets: ServiceTicketStats {
            total: 23,
            pending: 5,
            completed: 18,
        },
        last_updated: Utc::now().to_rfc3339(),
    }
}
