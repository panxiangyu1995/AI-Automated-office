# 设计文档 - Dashboard数据层重构

## 涉及文件

### 前端
- `src/features/dashboard/components/DashboardHome.tsx` - 主组件
- `src/features/dashboard/components/StatCard.tsx` - 统计卡片
- `src/features/dashboard/components/ApprovalOverview.tsx` - 审批概览
- `src/features/dashboard/components/FinanceOverview.tsx` - 财务概览
- `src/features/dashboard/components/SalesOverview.tsx` - 销售概览
- `src/features/dashboard/components/ServiceOverview.tsx` - 服务概览
- `src/features/dashboard/components/WarningOverview.tsx` - 预警概览

### 后端 (Tauri Commands)
- `src-tauri/src/commands/mod.rs` - 命令注册
- 新增: `src-tauri/src/dashboard/mod.rs` - Dashboard命令模块

## 修改方案

### 1. 创建Dashboard Tauri命令

```rust
// src-tauri/src/dashboard/mod.rs
#[tauri::command]
pub async fn get_dashboard_stats(
    tenant_id: String,
) -> Result<DashboardStats, String>
```

### 2. 重构前端数据获取

使用Tauri IPC调用后端命令，移除模拟数据依赖。

### 3. 数据类型定义

```typescript
interface DashboardStats {
  totalEmployees: number;
  totalCustomers: number;
  totalSales: number;
  totalContracts: number;
  pendingApprovals: number;
  totalReceivable: number;
  totalPayable: number;
  serviceTickets: number;
}
```

## 数据流

```
DashboardHome (React)
    ↓ useDashboard()
    ↓ invoke('get_dashboard_stats')
    ↓ Tauri IPC
    ↓ DashboardCommand (Rust)
    ↓ SQLite Query
    ↓ DashboardStats
    ↓ useDashboard() 返回
    ↓ StatCard 渲染
```
