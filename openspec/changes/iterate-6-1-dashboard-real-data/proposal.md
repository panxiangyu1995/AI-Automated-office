# 提案: Dashboard真实数据连接

## 1. 背景与问题

当前Dashboard模块使用模拟数据展示统计信息，用户无法看到真实的业务数据。

### 现状问题
- `get_dashboard_stats` 命令返回 `DashboardStats::default()` 空数据
- `get_dashboard_stats_simple` 返回硬编码的模拟数据
- 缺少实际的数据聚合逻辑

## 2. 目标

将Dashboard从模拟数据迁移到真实数据源，从各部门模块聚合真实统计数据。

## 3. 预期效果

- 员工总数从 `hr_employees` 表查询
- 客户总数从 `sales_customers` 表查询
- 销售总额从 `sales_orders` 表聚合
- 待审批数从 `approvals` 表查询
- 售后工单数从 `service_tickets` 表查询

## 4. 覆盖需求

- FR1054: 提供按工具/Agent/项目的成本归因报表
- FR502: 管理员可以查看部门级的Agent使用统计和趋势
- FR504: 系统可以统计Agent任务的成功率、平均完成时间等指标
