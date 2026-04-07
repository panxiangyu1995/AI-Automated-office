# Proposal: 审批AI辅助能力

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

审批中心基础CRUD和委托催办已完成（Task 148, Task 168）。

**缺失部分**：AI辅助审批能力。

## 目标

实现AI辅助审批（FR175-FR179）：
1. 审批风险检测
2. AI审批摘要生成
3. 智能表单填充
4. 历史数据预测
5. AI风险提示UI

## 范围

### 包含
- 风险检测工具
- 摘要生成
- 智能填充
- 预测分析
- 前端UI集成

### 不包含
- 审批基础功能（已完成）

## 影响范围

### 后端
- `src-tauri/src/approval/ai_assist.rs` - AI辅助模块

### 前端
- `src/features/approval/components/ApprovalRiskAlert.tsx`
- `src/features/approval/components/ApprovalSummary.tsx`

## 依赖

- **前置依赖**: Task 148, Task 168
- **后置依赖**: Task 209 (MVP最终集成测试)

## 验收标准

1. AI显示审批风险提示（FR175）
2. AI生成审批摘要日报（FR176）
3. AI支持对话式查询历史（FR177）
4. AI智能填充表单（FR178）
