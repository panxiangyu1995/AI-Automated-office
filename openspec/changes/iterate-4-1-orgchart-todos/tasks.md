# Tasks: OrgChartPage三个TODO功能实现

## Task 1: 添加Dialog状态管理

- 在OrgChartPage中添加DialogMode类型和dialogMode状态
- 引入useDepartmentMutations和usePositionMutations

## Task 2: 实现编辑部门对话框

- handleEditDepartment改为setDialogMode('editDepartment')
- 添加Dialog组件包裹DepartmentForm

## Task 3: 实现删除确认对话框

- handleDeleteDepartment改为setDialogMode('deleteDepartment')
- 添加确认Dialog，确认后调用deleteDepartment

## Task 4: 实现创建岗位对话框

- handleCreatePosition改为setDialogMode('createPosition')
- 添加Dialog组件包裹PositionForm

## Task 5: 添加ErrorBoundary包裹

- 用ErrorBoundary包裹整个页面

## Task 6: 验证构建
