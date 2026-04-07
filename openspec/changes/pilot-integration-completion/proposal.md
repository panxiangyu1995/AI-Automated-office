# Proposal: Pilot部门集成完善

## 变更类型
- [x] 增强功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

前端组件已存在：
- `src/features/agent/components/FinancePilotIntegration.tsx`
- `src/features/agent/components/ApprovalPilotIntegration.tsx`
- `src/features/agent/components/SalesPilotIntegration.tsx`
- `src-tauri/src/agent/tools/finance/` - 财务工具
- `src-tauri/src/approval/` - 审批后端

**缺失部分**：部门工具自动绑定、执行结果格式转换、Pilot 状态同步。

## 目标

完善 Pilot 集成 (Finance/Approval/Sales)：
1. 实现部门工具自动绑定
2. 实现执行结果格式转换
3. 实现 Pilot 状态同步
4. 实现错误处理和重试
5. 与前端 Pilot 组件集成

## 影响范围

### 前端
- `src/features/agent/components/FinancePilotIntegration.tsx` - 集成后端 API
- `src/features/agent/components/ApprovalPilotIntegration.tsx` - 集成后端 API
- `src/features/agent/components/SalesPilotIntegration.tsx` - 集成后端 API

### 后端
- `src-tauri/src/agent/tools/finance/` - 扩展现有模块
- `src-tauri/src/approval/` - 扩展现有模块

## 依赖

- **前置依赖**: Task 148 (审批中心), Task 150 (财务部门), Task 149 (销售部门)

## 验收标准

1. Pilot 能够自动绑定部门工具
2. 执行结果能够正确展示
3. 错误处理能够正常工作
