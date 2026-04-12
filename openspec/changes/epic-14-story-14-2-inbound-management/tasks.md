# Tasks: Story 14.2 入库操作记录

## 实现类型
- **类型**: new
- **优先级**: high
- **阶段**: Phase 5 - 核心部门模块

## 任务列表

### Task 1: 创建入库单类型定义
- [x] **描述**: 定义入库单、入库明细类型
- **文件**: `src/features/warehouse/types/inventory.ts`
- **验收**: 类型定义包含所有字段

### Task 2: 实现创建入库单命令
- [x] **描述**: 实现 Tauri 命令创建入库单
- **文件**: `src-tauri/src/warehouse/commands.rs`
- **验收**: 可创建入库单草稿

### Task 3: 实现入库单列表查询
- [x] **描述**: 实现入库单列表查询和筛选
- **文件**: `src-tauri/src/warehouse/commands.rs`
- **验收**: 可查询入库单列表

### Task 4: 实现确认入库命令
- [x] **描述**: 实现确认入库，包含库存更新和流水记录
- **文件**: `src-tauri/src/warehouse/commands.rs`
- **验收**: 确认后库存增加

### Task 5: 创建入库单页面
- [x] **描述**: 实现入库单列表页面
- **文件**: `src/features/warehouse/pages/InboundListPage.tsx`
- **验收**: 页面正常显示入库单列表

### Task 6: 创建入库表单对话框
- [x] **描述**: 实现创建入库单表单
- **文件**: `src/features/warehouse/components/InboundFormDialog.tsx`
- **验收**: 可创建和编辑入库单

### Task 7: 集成 AI 入库能力
- [x] **描述**: 注册 AI 入库工具，支持自然语言入库
- **文件**: `src/lib/pluginCapabilities.ts`
- **验收**: AI 可解析入库意图

### Task 8: 测试验证
- [x] **描述**: 测试入库全流程
- **验收**: 入库成功，库存正确更新

## 测试要点

- [ ] 单元测试: 库存计算逻辑
- [ ] 集成测试: 入库→库存更新
- [ ] E2E 测试: 完整入库流程
- [ ] 浏览器测试: UI 交互

## 依赖追踪

| 前置依赖 | 说明 |
|----------|------|
| Story 14.1 | 依赖库存基础数据 |

| 后置依赖 | 说明 |
|----------|------|
| Story 14.3 | 出库可关联入库单 |
