# 设计: Dashboard真实数据连接

## 1. 技术方案

### 1.1 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    get_dashboard_stats                        │
│                         │                                     │
│          ┌──────────────┼──────────────┐                     │
│          ▼              ▼              ▼                     │
│   ┌──────────┐  ┌──────────────┐  ┌──────────┐            │
│   │HR模块查询│  │销售模块查询  │  │审批模块查询│            │
│   └─────┬────┘  └──────┬───────┘  └─────┬────┘            │
│         │              │                │                   │
│         └──────────────┼────────────────┘                   │
│                        ▼                                     │
│              ┌──────────────────┐                            │
│              │  DataAggregator  │                            │
│              └────────┬─────────┘                            │
│                       ▼                                      │
│              ┌──────────────────┐                            │
│              │  DashboardStats  │                            │
│              └──────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 涉及的表

| 表名 | 查询字段 | 来源模块 |
|------|---------|---------|
| hr_employees | COUNT(*) | HR模块 |
| sales_customers | COUNT(*) | 销售模块 |
| sales_orders | SUM(amount) | 销售模块 |
| sales_contracts | COUNT(*) | 销售模块 |
| finance_receivable | SUM(amount) | 财务模块 |
| finance_payable | SUM(amount) | 财务模块 |
| approvals | COUNT(*) WHERE status='pending' | 审批模块 |
| service_tickets | COUNT(*), COUNT(*) WHERE status | 售后模块 |

### 1.3 涉及文件

- `src-tauri/src/commands/dashboard.rs` - 主命令入口，修改数据聚合逻辑
- `src-tauri/src/storage/mod.rs` - 添加数据聚合辅助函数

## 2. 数据聚合实现

### 2.1 修改 get_dashboard_stats 函数

```rust
#[tauri::command]
pub async fn get_dashboard_stats(
    tenant_id: String,
) -> Result<DashboardStats, String> {
    let pool = get_sqlite_pool().await?;
    
    // 并行查询各部门数据
    let (employees, customers, sales, contracts, approvals, receivable, payable, tickets) = tokio::join!(
        query_employee_count(&pool, &tenant_id),
        query_customer_count(&pool, &tenant_id),
        query_sales_total(&pool, &tenant_id),
        query_contract_count(&pool, &tenant_id),
        query_pending_approvals(&pool, &tenant_id),
        query_receivable(&pool, &tenant_id),
        query_payable(&pool, &tenant_id),
        query_service_tickets(&pool, &tenant_id),
    );
    
    Ok(DashboardStats {
        total_employees: employees?,
        total_customers: customers?,
        total_sales: sales?,
        total_contracts: contracts?,
        pending_approvals: approvals?,
        total_receivable: receivable?,
        total_payable: payable?,
        service_tickets: tickets?,
        last_updated: Utc::now().to_rfc3339(),
    })
}
```

## 3. 验收标准

- [ ] get_dashboard_stats 命令从 SQLite 查询实际数据
- [ ] 员工总数从 hr_employees 表查询，按 tenant_id 过滤
- [ ] 客户总数从 sales_customers 表查询
- [ ] 待审批数从 approvals 表查询，仅统计 pending 状态
- [ ] 响应时间 < 500ms
- [ ] 查询失败时返回友好的错误信息
