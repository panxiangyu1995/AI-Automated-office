# 任务清单 - Dashboard数据层重构

## 前置条件

- [ ] Rust/Tauri环境可用
- [ ] 前端pnpm环境可用

## 任务步骤

### 步骤1: 创建Dashboard Rust模块

- [ ] 创建 `src-tauri/src/dashboard/mod.rs`
- [ ] 实现 `get_dashboard_stats` 命令
- [ ] 在 `src-tauri/src/commands/mod.rs` 注册模块

### 步骤2: 创建前端类型定义

- [ ] 创建 `src/features/dashboard/types/dashboard.ts`
- [ ] 定义 `DashboardStats` 接口
- [ ] 定义 `useDashboard` hook

### 步骤3: 重构DashboardHome组件

- [ ] 移除模拟数据导入
- [ ] 使用 `useDashboard` hook 获取数据
- [ ] 实现加载状态UI
- [ ] 实现错误处理UI

### 步骤4: 重构StatCard组件

- [ ] 添加数据刷新功能
- [ ] 添加趋势指示器

### 步骤5: 验证

- [ ] `npm run lint` 通过
- [ ] `npm run build` 成功
- [ ] 浏览器验证Dashboard加载

## 验收标准

1. Dashboard显示真实数据（从后端获取）
2. 页面加载时显示骨架屏/loading状态
3. 数据获取失败时显示友好错误提示
4. 支持手动刷新数据
