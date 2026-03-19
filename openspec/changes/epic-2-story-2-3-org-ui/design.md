# Design: Department and Position UI

## Context (上下文)

- **Change**: `epic-2-story-2-3-org-ui`
- **Story**: Story 2.3 - 组织管理
- **Capability**: `ui`
- **相关约束**: FR(FR100, FR102)、NFR(NFR16)、UX(UX-02, UX-03)

本变更构建部门和岗位管理的前端界面。

## Goals / Non-Goals (目标与非目标)

### Goals (目标)
- 构建部门树视图，支持层级展示
- 实现部门创建、编辑、删除流程
- 构建岗位列表管理界面
- 提供良好的用户体验和操作反馈

### Non-Goals (非目标)
- 不实现后端 API（由 E2-S2.3-01 负责）
- 不实现组织架构图可视化（由 E2-S2.8-01 负责）
- MVP 不实现拖拽排序（Post-MVP 功能）

## Architecture Decisions (架构决策)

### 1. 树组件选择
**决策**: 使用 Shadcn/ui Tree 组件或自定义实现
**理由**:
- Shadcn/ui 基础组件可扩展
- 需要自定义节点渲染和操作
- 支持异步加载子节点

### 2. 布局结构
**决策**: 左右分栏布局
**理由**:
- 左侧树导航，右侧详情展示
- 符合常见组织管理 UI 模式
- 支持快速切换部门

### 3. 状态管理
**决策**: 使用 Zustand 管理部门树状态
**理由**:
- 缓存部门树数据
- 支持乐观更新
- 共享选中状态

## Component Design (组件设计)

### 文件结构
```
src/features/organization/
├── components/
│   ├── DepartmentTree.tsx       # 部门树组件
│   ├── DepartmentNode.tsx       # 部门节点组件
│   ├── DepartmentForm.tsx       # 部门表单
│   ├── DepartmentDetail.tsx     # 部门详情面板
│   ├── PositionTable.tsx        # 岗位表格
│   └── PositionForm.tsx         # 岗位表单
├── pages/
│   ├── OrganizationPage.tsx     # 组织管理入口页
│   ├── DepartmentTreePage.tsx   # 部门树管理页
│   └── PositionListPage.tsx     # 岗位列表页
├── hooks/
│   ├── useDepartmentTree.ts     # 部门树数据 Hook
│   └── usePositions.ts          # 岗位数据 Hook
├── types/
│   └── organization.types.ts    # 类型定义
└── api/
    └── organizationApi.ts       # API 调用封装
```

### OrganizationPage 布局设计

```tsx
// 主布局结构
<div className="flex h-full">
  {/* 左侧部门树 */}
  <aside className="w-64 border-r">
    <DepartmentTree 
      selectedId={selectedDeptId}
      onSelect={handleSelectDepartment}
      onAdd={handleAddDepartment}
    />
  </aside>
  
  {/* 右侧内容区 */}
  <main className="flex-1 p-6">
    {selectedDeptId ? (
      <DepartmentDetail 
        department={selectedDepartment}
        onEdit={handleEditDepartment}
      />
    ) : (
      <PositionTable 
        departmentId={selectedDeptId}
      />
    )}
  </main>
</div>
```

### DepartmentTree 组件设计

功能特性：
- 展示部门层级结构
- 支持展开/折叠节点
- 点击节点显示详情
- 右键菜单：新增子部门、编辑、删除
- 视觉反馈：选中高亮、悬停效果

```tsx
interface DepartmentTreeProps {
  selectedId?: string;
  onSelect: (id: string) => void;
  onAdd: (parentId?: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
```

### DepartmentNode 组件设计

```tsx
interface DepartmentNodeProps {
  department: Department;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}
```

### PositionTable 组件设计

| 列名 | 字段 | 说明 |
|------|------|------|
| 岗位名称 | name | 岗位名称 |
| 岗位编码 | code | 岗位编码 |
| 所属部门 | department.name | 关联部门 |
| 级别 | level | 岗位级别 |
| 状态 | status | 启用/停用 |
| 操作 | - | 编辑、删除 |

## UI Specifications (UI 规格)

### 颜色使用

| 元素 | 颜色 | 说明 |
|------|------|------|
| 选中节点背景 | #EFF6FF | 浅蓝 |
| 悬停节点背景 | #F3F4F6 | 浅灰 |
| 树节点缩进线 | #E5E7EB | 边框灰 |
| 展开图标 | #1E3A5F | 品牌色 |
| 操作按钮 | #1E3A5F | 品牌色 |

### 图标使用

| 场景 | 图标 (Lucide) |
|------|---------------|
| 部门节点 | Building2 |
| 展开节点 | ChevronDown |
| 折叠节点 | ChevronRight |
| 新增部门 | Plus |
| 编辑部门 | Pencil |
| 删除部门 | Trash2 |
| 岗位 | Briefcase |

### 交互设计

**部门节点右键菜单:**
```
┌─────────────────────┐
│ 新增子部门          │
│ 编辑部门            │
│ ─────────────────── │
│ 删除部门            │
└─────────────────────┘
```

**部门删除确认:**
```
┌─────────────────────────────────────┐
│ ⚠️ 确认删除                          │
│                                     │
│ 确定要删除部门"技术部"吗？           │
│ 该操作不可恢复。                     │
│                                     │
│ [取消]  [确认删除]                   │
└─────────────────────────────────────┘
```

**删除失败提示:**
```
┌─────────────────────────────────────┐
│ ❌ 删除失败                          │
│                                     │
│ 该部门下存在 5 个子部门，请先处理    │
│ 子部门后再删除。                     │
│                                     │
│ [确定]                               │
└─────────────────────────────────────┘
```

## Error Handling (错误处理)

### 约束错误处理
- `DEPARTMENT_HAS_CHILDREN`: 显示子部门列表，引导用户处理
- `DEPARTMENT_HAS_USERS`: 显示关联员工数量，引导用户迁移
- `POSITION_HAS_USERS`: 显示关联员工数量

### 网络错误处理
- 加载失败显示重试按钮
- 操作失败显示 Toast 提示
- 自动重试机制（可选）

## Testing Strategy (测试策略)

### 单元测试
- 树组件渲染测试
- 节点展开/折叠测试
- 表单校验测试

### 集成测试
- 部门 CRUD 流程测试
- 岗位管理流程测试

### E2E 测试
- 组织管理完整流程
- 约束处理场景

## Open Questions (待解决问题)

1. 是否需要支持部门拖拽排序？
2. 岗位是否需要批量操作功能？
3. 部门详情面板是否展示员工列表？