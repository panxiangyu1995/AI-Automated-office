# 规格: Dashboard真实数据连接

## 类型定义

### DashboardStats
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_employees: u32,
    pub total_customers: u32,
    pub total_sales: f64,
    pub total_contracts: u32,
    pub pending_approvals: u32,
    pub total_receivable: f64,
    pub total_payable: f64,
    pub service_tickets: ServiceTicketStats,
    pub last_updated: String,
}
```

### ServiceTicketStats
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceTicketStats {
    pub total: u32,
    pub pending: u32,
    pub completed: u32,
}
```

## API 规格

### get_dashboard_stats 命令
- **输入**: `tenant_id: String`
- **输出**: `Result<DashboardStats, String>`
- **错误码**:
  - `"DATABASE_ERROR"`: 数据库查询失败
  - `"TENANT_NOT_FOUND"`: 租户不存在

## 数据库查询规格

### 表结构依赖

| 表名 | 必需字段 | 查询方式 |
|------|---------|---------|
| hr_employees | id, tenant_id | COUNT |
| sales_customers | id, tenant_id | COUNT |
| sales_orders | id, tenant_id, amount | SUM(amount) |
| sales_contracts | id, tenant_id | COUNT |
| finance_receivable | id, tenant_id, amount | SUM(amount) |
| finance_payable | id, tenant_id, amount | SUM(amount) |
| approvals | id, tenant_id, status | COUNT WHERE status='pending' |
| service_tickets | id, tenant_id, status | COUNT |

## 性能要求

- 响应时间 < 500ms
- 使用并行查询优化
- 结果缓存可选（5分钟TTL）
