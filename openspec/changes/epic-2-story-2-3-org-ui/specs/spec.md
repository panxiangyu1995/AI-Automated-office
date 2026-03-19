# Specification: Department and Position UI

## Overview

本文档定义 Story 2.3 Department and Position UI 的功能规格说明。

## ADDED Requirements

### Requirement: FR100 部门管理前端界面基线

系统 SHALL 提供部门树管理界面，支持层级展示和操作。

#### Scenario: 部门树展示
- **GIVEN** 管理员已登录且有组织管理权限
- **WHEN** 管理员访问 `/admin/organization`
- **THEN** 系统 MUST 展示部门树结构
- **AND** 支持展开/折叠节点

#### Scenario: 部门节点选择
- **GIVEN** 管理员在部门树页面
- **WHEN** 管理员点击某部门节点
- **THEN** 系统 MUST 高亮选中节点
- **AND** 在右侧面板展示部门详情

#### Scenario: 创建部门
- **GIVEN** 管理员有部门创建权限
- **WHEN** 管理员点击"新增子部门"按钮或菜单
- **THEN** 系统 MUST 显示部门创建表单
- **AND** 表单 MUST 包含名称、编码、负责人字段

#### Scenario: 编辑部门
- **GIVEN** 管理员选中某部门
- **WHEN** 管理员点击"编辑"按钮
- **THEN** 系统 MUST 显示部门编辑表单
- **AND** 表单 MUST 回填当前部门信息

#### Scenario: 删除部门约束提示
- **GIVEN** 管理员要删除有子部门的部门
- **WHEN** 管理员点击"删除"按钮
- **THEN** 系统 MUST 显示错误提示
- **AND** 说明无法删除的原因

### Requirement: FR102 岗位管理前端界面基线

系统 SHALL 提供岗位列表管理界面。

#### Scenario: 岗位列表展示
- **GIVEN** 管理员已登录
- **WHEN** 管理员访问岗位管理页面
- **THEN** 系统 MUST 展示岗位数据表格
- **AND** 表格 MUST 包含名称、编码、部门、级别、状态列

#### Scenario: 岗位筛选
- **GIVEN** 管理员在岗位列表页面
- **WHEN** 管理员选择部门筛选条件
- **THEN** 系统 MUST 筛选显示该部门的岗位

#### Scenario: 创建岗位
- **GIVEN** 管理员有岗位创建权限
- **WHEN** 管理员点击"创建岗位"按钮
- **THEN** 系统 MUST 显示岗位创建表单
- **AND** 表单 MUST 包含名称、编码、部门、级别字段

#### Scenario: 删除岗位约束提示
- **GIVEN** 管理员要删除有员工的岗位
- **WHEN** 管理员点击"删除"按钮
- **THEN** 系统 MUST 显示错误提示
- **AND** 说明关联员工数量

### Requirement: 树组件交互规范

部门树组件 MUST 符合标准交互规范。

#### Scenario: 节点展开/折叠
- **GIVEN** 部门节点有子节点
- **WHEN** 管理员点击展开图标
- **THEN** 系统 MUST 展开显示子节点
- **AND** 图标 MUST 旋转指示展开状态

#### Scenario: 右键菜单
- **GIVEN** 管理员在部门节点上右键点击
- **WHEN** 显示上下文菜单
- **THEN** 菜单 MUST 包含：新增子部门、编辑、删除选项

#### Scenario: 视觉反馈
- **WHEN** 管理员悬停在节点上
- **THEN** 系统 MUST 显示悬停背景色
- **WHEN** 节点被选中
- **THEN** 系统 MUST 显示选中高亮

### Requirement: UX 规范合规

界面 MUST 符合 UX 设计规范。

#### Scenario: 组件库使用
- **WHEN** 构建界面组件
- **THEN** 系统 MUST 使用 Shadcn/ui 组件库
- **AND** MUST 使用 Lucide React 图标库

#### Scenario: 颜色系统
- **WHEN** 应用样式
- **THEN** 系统 MUST 遵循品牌色 #1E3A5F
- **AND** 选中背景使用 #EFF6FF

#### Scenario: 表单校验
- **WHEN** 用户提交无效数据
- **THEN** 系统 MUST 显示字段级错误提示
- **AND** 禁止提交 API 请求

### Requirement: 错误处理

界面 MUST 提供清晰的错误反馈。

#### Scenario: 约束错误处理
- **WHEN** API 返回约束错误（如 DEPARTMENT_HAS_CHILDREN）
- **THEN** 系统 MUST 显示详细的错误对话框
- **AND** 提供解决建议

#### Scenario: 网络错误处理
- **WHEN** API 请求失败
- **THEN** 系统 MUST 显示 Toast 错误提示
- **AND** 提供重试选项

## Component Contracts

### DepartmentTree Props

```typescript
interface DepartmentTreeProps {
  selectedId?: string;
  onSelect: (id: string) => void;
  onAdd: (parentId?: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}
```

### DepartmentNode Props

```typescript
interface DepartmentNodeProps {
  department: Department;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  hasChildren: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}
```

### PositionTable Props

```typescript
interface PositionTableProps {
  positions: Position[];
  loading?: boolean;
  departmentId?: string;
  onEdit: (position: Position) => void;
  onDelete: (position: Position) => void;
}
```

## Acceptance Criteria Summary

1. [ ] 部门树正确展示层级结构
2. [ ] 节点展开/折叠功能正常
3. [ ] 节点选中高亮显示
4. [ ] 右键菜单显示正确选项
5. [ ] 创建部门表单提交成功
6. [ ] 编辑部门表单提交成功
7. [ ] 删除约束错误提示清晰
8. [ ] 岗位列表正确展示
9. [ ] 岗位 CRUD 功能正常
10. [ ] 使用 Shadcn/ui 组件和 Lucide React 图标