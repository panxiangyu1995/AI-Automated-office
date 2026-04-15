# Design: OrgChartPage三个TODO功能实现

## 涉及文件

- `src/features/admin/pages/OrgChartPage.tsx` (修改)

## 技术设计

### 状态管理

在OrgChartPage中添加3个dialog状态：

```typescript
type DialogMode = 'none' | 'editDepartment' | 'deleteDepartment' | 'createPosition'
const [dialogMode, setDialogMode] = useState<DialogMode>('none')
```

### 编辑部门对话框

- 复用 `DepartmentForm` 组件，mode="edit"
- 使用 `useDepartmentMutations` hook 的 `updateDepartment`
- 使用已有的 `useDepartmentTree` 获取部门数据

### 删除确认对话框

- 使用 shadcn/ui Dialog 组件
- 确认后调用 `useDepartmentMutations` 的 `deleteDepartment`
- 删除成功后刷新部门树并关闭详情面板

### 创建岗位对话框

- 复用 `PositionForm` 组件
- 使用 `usePositionMutations` hook 的 `createPosition`

## 不修改的文件

- DepartmentForm、PositionForm：已有完整功能，直接复用
- API层：departmentApi、positionApi已存在
