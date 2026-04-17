# 任务: Dashboard真实数据连接

## 步骤清单

### Task 1: 修改 DashboardStats 数据结构
- [ ] 在 `commands/dashboard.rs` 中确认 `DashboardStats` 结构体字段完整
- [ ] 确保 `ServiceTicketStats` 包含 total/pending/completed 字段

### Task 2: 实现数据聚合辅助函数
- [ ] 在 `storage/mod.rs` 中添加 `query_employee_count` 函数
- [ ] 在 `storage/mod.rs` 中添加 `query_customer_count` 函数
- [ ] 在 `storage/mod.rs` 中添加 `query_sales_total` 函数
- [ ] 在 `storage/mod.rs` 中添加 `query_contract_count` 函数
- [ ] 在 `storage/mod.rs` 中添加 `query_pending_approvals` 函数
- [ ] 在 `storage/mod.rs` 中添加 `query_receivable` 函数
- [ ] 在 `storage/mod.rs` 中添加 `query_payable` 函数
- [ ] 在 `storage/mod.rs` 中添加 `query_service_tickets` 函数

### Task 3: 修改 get_dashboard_stats 命令
- [ ] 获取 SQLite 连接池
- [ ] 使用 tokio::join! 并行查询各部门数据
- [ ] 组装 DashboardStats 返回
- [ ] 添加错误处理

### Task 4: 测试验证
- [ ] 验证模拟数据命令 `get_dashboard_stats_simple` 仍然工作
- [ ] 验证真实数据命令 `get_dashboard_stats` 返回正确数据
- [ ] 验证 tenant_id 过滤正常工作
