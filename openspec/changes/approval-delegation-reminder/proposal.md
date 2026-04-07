# Proposal: 审批增强功能-委托与催办

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

审批中心基础CRUD已完成：
- `src-tauri/src/approval/` - 审批模块
- `src/features/approval/` - 审批前端组件

**缺失部分**：审批委托、催办机制。

## 目标

实现审批委托（FR143-FR148）和催办机制（FR154-FR163）：
1. 审批委托（全权/分类/金额）
2. 委托有效期管理
3. 催办机制和频率限制
4. 紧急催办分级
5. 自动抄送上级的逻辑

## 范围

### 包含
- 审批委托数据模型
- 委托类型管理
- 催办频率限制
- 紧急催办分级
- 自动抄送逻辑

### 不包含
- 审批AI辅助能力（Task 169）

## 影响范围

### 后端
- `src-tauri/src/approval/delegation.rs` - 委托模块
- `src-tauri/src/approval/reminder.rs` - 催办模块

### 前端
- `src/features/approval/components/DelegationSettings.tsx`
- `src/features/approval/components/ReminderPanel.tsx`

## 依赖

- **前置依赖**: Task 148 (Approval审批中心模块)
- **后置依赖**: Task 169 (审批AI辅助能力)

## 验收标准

1. 审批人可设置委托人（FR143）
2. 支持三种委托类型（FR144）
3. 催办每天最多3次，间隔2小时（FR155-FR159）
4. 紧急催办自动抄送上级（FR160-FR161）
5. 免打扰时段不催办（FR162-FR163）
