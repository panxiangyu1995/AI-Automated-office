# Tasks: Story 14.1 库存信息管理

## 实现类型
- **类型**: new
- **优先级**: high
- **阶段**: Phase 5 - 核心部门模块

## 任务列表

### Task 1: 创建仓库模块目录结构
- [x] **描述**: 创建 `src/features/warehouse/` 目录结构，包含 pages、components、hooks、types 子目录
- **文件**: `src/features/warehouse/`
- **验收**: 目录结构创建完成

### Task 2: 定义 TypeScript 类型
- [x] **描述**: 定义库存、商品、库位、盘点相关类型
- **文件**: `src/features/warehouse/types/inventory.ts`
- **验收**: 类型定义完整，包含所有字段和接口

### Task 3: 实现 Tauri 后端命令
- [x] **描述**: 实现库存查询、盘点相关命令
- **文件**: `src-tauri/src/warehouse/commands.rs`
- **验收**: 命令可调用，数据正确返回

### Task 4: 创建库存列表页面
- [x] **描述**: 实现库存列表页面，支持分页、搜索、筛选
- **文件**: `src/features/warehouse/pages/InventoryListPage.tsx`
- **验收**: 页面可正常加载，显示库存数据

### Task 5: 创建库存详情面板
- [x] **描述**: 实现库存详情 BottomPanel 组件
- **文件**: `src/features/warehouse/components/InventoryDetail.tsx`
- **验收**: 点击商品可查看详情

### Task 6: 实现库存盘点功能
- [x] **描述**: 实现库存盘点对话框和逻辑
- **文件**: `src/features/warehouse/components/StocktakingDialog.tsx`
- **验收**: 可进行库存盘点并更新数量

### Task 7: 注册 Command Palette 命令
- [x] **描述**: 注册仓库相关命令到 Command Palette
- **文件**: `src/lib/systemCommands.ts`
- **验收**: Ctrl+K 可搜索仓库命令

### Task 8: 注册 AI 插件能力
- [x] **描述**: 注册仓库插件能力到推荐系统
- **文件**: `src/lib/pluginCapabilities.ts`
- **验收**: AI 可推荐仓库相关功能

### Task 9: 集成 Sidebar 动态入口
- [x] **描述**: 注册仓库 Sidebar 入口
- **文件**: `src/lib/pluginSidebarRegistry.ts`
- **验收**: 仓库模块显示在 Sidebar 中

## 测试要点

- [ ] 单元测试: 类型定义、工具函数
- [ ] 集成测试: Tauri 命令调用
- [ ] E2E 测试: 库存查询流程
- [x] 浏览器测试: UI 组件渲染

## 依赖追踪

| 前置依赖 | 说明 |
|----------|------|
| 无 | 基础模块，无前置依赖 |

| 后置依赖 | 说明 |
|----------|------|
| Story 14.2 | 入库操作依赖库存基础数据 |
| Story 14.3 | 出库操作依赖库存基础数据 |
