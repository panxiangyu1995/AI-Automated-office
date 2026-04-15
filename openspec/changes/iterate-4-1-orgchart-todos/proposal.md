# Proposal: OrgChartPage三个TODO功能实现

## 背景

OrgChartPage有3个TODO未实现：编辑部门对话框、删除确认对话框、创建岗位对话框。
第4轮完成这些TODO，同时添加ErrorBoundary包裹和Loading状态。

## 目标

1. 实现编辑部门对话框（复用DepartmentForm）
2. 实现删除确认对话框（确认对话框+调用deleteDepartment API）
3. 实现创建岗位对话框（复用PositionForm）

## 变更内容

- `OrgChartPage.tsx` - 实现三个TODO，添加Dialog状态管理，ErrorBoundary包裹
- 不修改DepartmentForm/PositionForm（已存在）
- 不修改API层（已存在）

## 验收

- 编辑部门按钮打开对话框，表单可提交
- 删除部门按钮弹出确认对话框
- 创建岗位按钮打开表单对话框
- build通过
