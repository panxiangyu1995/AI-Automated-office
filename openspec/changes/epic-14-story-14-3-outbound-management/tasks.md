# Tasks: Story 14.3 出库操作记录

## 实现类型
- **类型**: new
- **优先级**: high
- **阶段**: Phase 5 - 核心部门模块

## 任务列表

### Task 1: 创建出库单类型定义
- [x] **描述**: 定义出库单、出库明细、销售出库关联类型
- **文件**: `src/features/warehouse/types/inventory.ts`
- **验收**: 类型定义包含所有字段

### Task 2: 实现出库前库存检查命令
- [x] **描述**: 实现库存检查命令，返回可用数量
- **文件**: `src-tauri/src/warehouse/commands.rs`
- **验收**: 正确返回库存检查结果

### Task 3: 实现创建出库单命令
- [x] **描述**: 实现 Tauri 命令创建出库单
- **文件**: `src-tauri/src/warehouse/commands.rs`
- **验收**: 可创建出库单草稿

### Task 4: 实现确认出库命令
- [x] **描述**: 实现确认出库，包含库存扣减和流水记录
- **文件**: `src-tauri/src/warehouse/commands.rs`
- **验收**: 确认后库存扣减

### Task 5: 实现销售出库关联
- [x] **描述**: 实现销售订单与出库单的关联逻辑
- **文件**: `src-tauri/src/warehouse/commands.rs`
- **验收**: 可关联销售订单

### Task 6: 创建出库单页面
- [x] **描述**: 实现出库单列表页面
- **文件**: `src/features/warehouse/pages/OutboundListPage.tsx`
- **验收**: 页面正常显示出库单列表

### Task 7: 创建出库表单对话框
- [x] **描述**: 实现创建出库单表单，含库存检查
- **文件**: `src/features/warehouse/components/OutboundFormDialog.tsx`
- **验收**: 可创建出库单，库存不足时提示

### Task 8: 实现事件总线集成
- [x] **描述**: 实现销售出库联动事件
- **文件**: `src/lib/salesWarehouseEvents.ts`
- **验收**: 销售下单可触发出库

### Task 9: 集成 AI 出库能力
- [x] **描述**: 注册 AI 出库工具
- **文件**: `src/lib/pluginCapabilities.ts`
- **验收**: AI 可解析出库意图

### Task 10: 测试验证
- [x] **描述**: 测试出库全流程
- **验收**: 出库成功，库存正确扣减

## 测试要点

- [ ] 单元测试: 库存检查逻辑
- [ ] 集成测试: 出库→库存扣减
- [ ] E2E 测试: 完整出库流程
- [ ] 浏览器测试: UI 交互
- [ ] 联动测试: 销售→出库联动

## 依赖追踪

| 前置依赖 | 说明 |
|----------|------|
| Story 14.1 | 依赖库存基础数据 |
| Story 14.2 | 依赖入库后有库存可出 |

| 后置依赖 | 说明 |
|----------|------|
| Story 14.7 | 销售发货通知触发出库 |
